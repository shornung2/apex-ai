import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, Palette, BarChart3, Sun, Moon, Monitor, Activity, BookOpen, Sparkles, CalendarClock, CheckCircle } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTenant } from "@/contexts/TenantContext";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

const themeOptions = [
  { value: "light", label: "Light", icon: Sun, preview: "bg-white border-border" },
  { value: "dark", label: "Dark", icon: Moon, preview: "bg-[hsl(240,15%,4%)] border-border" },
  { value: "system", label: "System", icon: Monitor, preview: "bg-gradient-to-br from-white to-[hsl(240,15%,4%)] border-border" },
] as const;

interface UsageStats {
  totalJobs: number;
  completeJobs: number;
  tokensUsed: number;
  knowledgeDocs: number;
  activeSkills: number;
  scheduledTasks: number;
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const { tenantId, isAdmin } = useTenant();
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [tokenBudget, setTokenBudget] = useState(0);
  const [workspaceName, setWorkspaceName] = useState("");
  const [industry, setIndustry] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const [jobsRes, docsRes, skillsRes, tasksRes, settingsRes, tenantRes] = await Promise.all([
        supabase.from("agent_jobs").select("status, tokens_used"),
        supabase.from("knowledge_documents").select("id", { count: "exact", head: true }),
        supabase.from("skills").select("id", { count: "exact", head: true }),
        supabase.from("scheduled_tasks").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("workspace_settings").select("key, value").in("key", ["workspace_name", "workspace_industry"]),
        supabase.from("tenants").select("token_budget_monthly").single(),
      ]);
      const jobs = jobsRes.data || [];
      setTokenBudget(tenantRes.data?.token_budget_monthly || 50_000);
      setUsage({
        totalJobs: jobs.length,
        completeJobs: jobs.filter((j) => j.status === "complete").length,
        tokensUsed: jobs.reduce((sum, j) => sum + (j.tokens_used || 0), 0),
        knowledgeDocs: docsRes.count || 0,
        activeSkills: skillsRes.count || 0,
        scheduledTasks: tasksRes.count || 0,
      });
      const settings = settingsRes.data || [];
      const nameRow = settings.find((s) => s.key === "workspace_name");
      const industryRow = settings.find((s) => s.key === "workspace_industry");
      setWorkspaceName(nameRow ? String(nameRow.value) : "");
      setIndustry(industryRow ? String(industryRow.value) : "");
    }
    fetchData();
  }, []);

  const handleSave = useCallback(async () => {
    if (!tenantId) return;
    setSaving(true);
    await Promise.all([
      supabase.from("workspace_settings").upsert({ key: "workspace_name", value: workspaceName as any, tenant_id: tenantId, updated_at: new Date().toISOString() }, { onConflict: "tenant_id,key" }),
      supabase.from("workspace_settings").upsert({ key: "workspace_industry", value: industry as any, tenant_id: tenantId, updated_at: new Date().toISOString() }, { onConflict: "tenant_id,key" }),
    ]);
    setSaving(false);
    toast({ title: "Settings saved", description: "Workspace settings updated successfully." });
  }, [tenantId, workspaceName, industry, toast]);

  const tokenPercent = usage && tokenBudget > 0 ? Math.round((usage.tokensUsed / tokenBudget) * 100) : 0;
  const tokenColor = tokenPercent > 80 ? "bg-destructive" : tokenPercent > 60 ? "bg-amber-500" : "bg-emerald-500";
  const successRate = usage && usage.totalJobs > 0 ? Math.round((usage.completeJobs / usage.totalJobs) * 100) : 0;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-4xl">
      <motion.div variants={item}>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Personal preferences and system overview</p>
      </motion.div>

      <motion.div variants={item}>
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="general" className="gap-1.5"><Building2 className="h-3.5 w-3.5" /> General</TabsTrigger>
            <TabsTrigger value="appearance" className="gap-1.5"><Palette className="h-3.5 w-3.5" /> Appearance</TabsTrigger>
            <TabsTrigger value="usage" className="gap-1.5"><BarChart3 className="h-3.5 w-3.5" /> System</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card className="glass-card">
              <CardHeader><CardTitle className="text-lg">Workspace</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Workspace Name</Label>
                  <Input value={workspaceName} onChange={(e) => setWorkspaceName(e.target.value)} className="bg-muted/50 border-border/50 max-w-sm" disabled={!isAdmin} />
                </div>
                <div className="space-y-2">
                  <Label>Industry</Label>
                  <Input value={industry} onChange={(e) => setIndustry(e.target.value)} className="bg-muted/50 border-border/50 max-w-sm" disabled={!isAdmin} />
                </div>
                {isAdmin ? (
                  <Button size="sm" onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
                ) : (
                  <p className="text-xs text-muted-foreground">Only workspace admins can edit these settings.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance">
            <Card className="glass-card">
              <CardHeader><CardTitle className="text-lg">Appearance</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">Choose your preferred color scheme.</p>
                <div className="grid grid-cols-3 gap-4 max-w-md">
                  {themeOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setTheme(opt.value)}
                      className={cn(
                        "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all cursor-pointer",
                        theme === opt.value ? "border-primary bg-primary/10" : "border-border hover:border-muted-foreground/30"
                      )}
                    >
                      <div className={cn("h-10 w-10 rounded-lg border", opt.preview)} />
                      <div className="flex items-center gap-1.5 text-sm font-medium">
                        <opt.icon className="h-3.5 w-3.5" />
                        {opt.label}
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="usage">
            <div className="space-y-4">
              <Card className="glass-card">
                <CardHeader><CardTitle className="text-lg">Token Usage</CardTitle></CardHeader>
                <CardContent>
                  {!usage ? (
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-full max-w-md" />
                    </div>
                  ) : (
                    <div className="space-y-2 max-w-md">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Used</span>
                        <span className="font-medium">{usage.tokensUsed.toLocaleString()} / {TOKEN_BUDGET.toLocaleString()}</span>
                      </div>
                      <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${tokenColor}`} style={{ width: `${Math.min(tokenPercent, 100)}%` }} />
                      </div>
                      <p className="text-xs text-muted-foreground">{tokenPercent}% of budget consumed</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Total Runs", value: usage?.totalJobs, icon: Activity },
                  { label: "Success Rate", value: usage ? `${successRate}%` : undefined, icon: CheckCircle },
                  { label: "Knowledge Docs", value: usage?.knowledgeDocs, icon: BookOpen },
                  { label: "Active Skills", value: usage?.activeSkills, icon: Sparkles },
                ].map((stat) => (
                  <Card key={stat.label} className="glass-card">
                    <CardContent className="pt-5 pb-4 px-4">
                      {stat.value === undefined ? (
                        <Skeleton className="h-8 w-16" />
                      ) : (
                        <>
                          <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <stat.icon className="h-3.5 w-3.5" />
                            <span className="text-[11px]">{stat.label}</span>
                          </div>
                          <p className="text-2xl font-bold">{typeof stat.value === "number" ? stat.value.toLocaleString() : stat.value}</p>
                        </>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="glass-card">
                <CardContent className="pt-5 pb-4 px-4">
                  {usage === null ? (
                    <Skeleton className="h-8 w-32" />
                  ) : (
                    <div className="flex items-center gap-3">
                      <CalendarClock className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{usage.scheduledTasks} Active Scheduled Tasks</p>
                        <p className="text-xs text-muted-foreground">Automated skills running on schedule</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}
