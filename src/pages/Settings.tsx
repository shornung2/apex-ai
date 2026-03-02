import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, Key, Bot, BarChart3, Users, Palette, Sun, Moon, Monitor, Activity, BookOpen, Sparkles, CalendarClock, CheckCircle } from "lucide-react";
import { agentDefinitions } from "@/data/mock-data";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

const TOKEN_BUDGET = 50_000;

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
  const [usage, setUsage] = useState<UsageStats | null>(null);

  useEffect(() => {
    async function fetchUsage() {
      const [jobsRes, docsRes, skillsRes, tasksRes] = await Promise.all([
        supabase.from("agent_jobs").select("status, tokens_used"),
        supabase.from("knowledge_documents").select("id", { count: "exact", head: true }),
        supabase.from("skills").select("id", { count: "exact", head: true }),
        supabase.from("scheduled_tasks").select("id", { count: "exact", head: true }).eq("status", "active"),
      ]);

      const jobs = jobsRes.data || [];
      const totalJobs = jobs.length;
      const completeJobs = jobs.filter((j) => j.status === "complete").length;
      const tokensUsed = jobs.reduce((sum, j) => sum + (j.tokens_used || 0), 0);

      setUsage({
        totalJobs,
        completeJobs,
        tokensUsed,
        knowledgeDocs: docsRes.count || 0,
        activeSkills: skillsRes.count || 0,
        scheduledTasks: tasksRes.count || 0,
      });
    }
    fetchUsage();
  }, []);

  const tokenPercent = usage ? Math.round((usage.tokensUsed / TOKEN_BUDGET) * 100) : 0;
  const tokenColor =
    tokenPercent > 80 ? "bg-destructive" : tokenPercent > 60 ? "bg-amber-500" : "bg-emerald-500";
  const successRate = usage && usage.totalJobs > 0 ? Math.round((usage.completeJobs / usage.totalJobs) * 100) : 0;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-4xl">
      <motion.div variants={item}>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Workspace configuration and administration</p>
      </motion.div>

      <motion.div variants={item}>
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="general" className="gap-1.5"><Building2 className="h-3.5 w-3.5" /> General</TabsTrigger>
            <TabsTrigger value="appearance" className="gap-1.5"><Palette className="h-3.5 w-3.5" /> Appearance</TabsTrigger>
            <TabsTrigger value="api" className="gap-1.5"><Key className="h-3.5 w-3.5" /> API Keys</TabsTrigger>
            <TabsTrigger value="agents" className="gap-1.5"><Bot className="h-3.5 w-3.5" /> Agents</TabsTrigger>
            <TabsTrigger value="usage" className="gap-1.5"><BarChart3 className="h-3.5 w-3.5" /> Usage</TabsTrigger>
            <TabsTrigger value="members" className="gap-1.5"><Users className="h-3.5 w-3.5" /> Members</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card className="glass-card">
              <CardHeader><CardTitle className="text-lg">Workspace</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Workspace Name</Label>
                  <Input defaultValue="Solutionment" className="bg-muted/50 border-border/50 max-w-sm" />
                </div>
                <div className="space-y-2">
                  <Label>Industry</Label>
                  <Input defaultValue="Technology Consulting" className="bg-muted/50 border-border/50 max-w-sm" />
                </div>
                <Button size="sm">Save</Button>
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
                        theme === opt.value
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-muted-foreground/30"
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

          <TabsContent value="api">
            <Card className="glass-card">
              <CardHeader><CardTitle className="text-lg">API Keys & Integrations</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">API keys are securely stored and never exposed in the client.</p>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div>
                    <p className="text-sm font-medium">AI Gateway</p>
                    <p className="text-xs text-muted-foreground">Connected via Lovable AI</p>
                  </div>
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Active</Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="agents">
            <Card className="glass-card">
              <CardHeader><CardTitle className="text-lg">Agent Configuration</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {agentDefinitions.map((agent) => (
                  <div key={agent.type} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{agent.emoji}</span>
                      <div>
                        <p className="text-sm font-medium">{agent.name}</p>
                        <p className="text-xs text-muted-foreground">{agent.type}</p>
                      </div>
                    </div>
                    <Switch defaultChecked />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="usage">
            <div className="space-y-4">
              {/* Token Usage */}
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
                        <div
                          className={`h-full rounded-full transition-all ${tokenColor}`}
                          style={{ width: `${Math.min(tokenPercent, 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">{tokenPercent}% of budget consumed</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Total Runs", value: usage?.totalJobs, icon: Activity },
                  { label: "Success Rate", value: usage ? `${successRate}%` : undefined, icon: CheckCircle },
                  { label: "Knowledge Docs", value: usage?.knowledgeDocs, icon: BookOpen },
                  { label: "Active Skills", value: usage?.activeSkills, icon: Sparkles },
                ].map((stat) => (
                  <Card key={stat.label} className="glass-card">
                    <CardContent className="pt-5 pb-4 px-4">
                      {!usage ? (
                        <Skeleton className="h-8 w-16" />
                      ) : (
                        <>
                          <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <stat.icon className="h-3.5 w-3.5" />
                            <span className="text-xs">{stat.label}</span>
                          </div>
                          <p className="text-2xl font-bold">{stat.value?.toLocaleString?.() ?? stat.value}</p>
                        </>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Scheduled Tasks */}
              <Card className="glass-card">
                <CardContent className="pt-5 pb-4 px-4">
                  {!usage ? (
                    <Skeleton className="h-6 w-40" />
                  ) : (
                    <div className="flex items-center gap-2">
                      <CalendarClock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Active Scheduled Tasks:</span>
                      <span className="text-sm font-semibold">{usage.scheduledTasks}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="members">
            <Card className="glass-card">
              <CardHeader><CardTitle className="text-lg">Workspace Members</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">Member management will be available after authentication is configured.</p>
                <Button variant="outline" size="sm" disabled>Invite Member</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}
