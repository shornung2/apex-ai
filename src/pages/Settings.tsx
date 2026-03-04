import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Building2, Key, Bot, BarChart3, Users, Palette, Sun, Moon, Monitor, Activity, BookOpen, Sparkles, CalendarClock, CheckCircle, Loader2, Search, DollarSign, Zap, FileText, AlertTriangle, TrendingUp, MessageCircle } from "lucide-react";
import { agentDefinitions } from "@/data/mock-data";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTenant } from "@/contexts/TenantContext";
import TeamWorkspaceSection from "@/components/TeamWorkspaceSection";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

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

interface OpenRouterModel {
  id: string;
  name: string;
  description?: string;
  promptPrice?: string | null;
  completionPrice?: string | null;
  contextLength?: number | null;
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  agent_job: "Agent Job",
  deck_generation: "Deck Generation",
  knowledge_ingest: "Knowledge Ingest",
  api_call: "API Call",
};

function UsageBillingSection({ tenantId }: { tenantId: string | null }) {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<any[]>([]);
  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const [dailyData, setDailyData] = useState<{ date: string; tokens: number }[]>([]);
  const [costPer1k, setCostPer1k] = useState(0.015);
  const [tokenBudget, setTokenBudget] = useState(0);

  useEffect(() => {
    if (!tenantId) return;
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    async function fetchBilling() {
      const [eventsRes, recentRes, settingsRes, tenantRes] = await Promise.all([
        supabase
          .from("usage_events")
          .select("event_type, tokens_used, created_at")
          .gte("created_at", startOfMonth.toISOString()),
        supabase
          .from("usage_events")
          .select("id, event_type, tokens_used, model_used, skill_id, created_at, skills(display_name, name)")
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("workspace_settings")
          .select("value")
          .eq("key", "cost_per_1k_tokens")
          .maybeSingle(),
        supabase
          .from("tenants")
          .select("token_budget_monthly")
          .eq("id", tenantId)
          .maybeSingle(),
      ]);

      setEvents(eventsRes.data || []);
      setRecentEvents(recentRes.data || []);
      if (settingsRes.data?.value) {
        const v = typeof settingsRes.data.value === 'number' ? settingsRes.data.value : parseFloat(String(settingsRes.data.value));
        if (!isNaN(v)) setCostPer1k(v);
      }
      if (tenantRes.data?.token_budget_monthly) setTokenBudget(tenantRes.data.token_budget_monthly);

      // Build daily chart data for last 30 days
      const dailyMap: Record<string, number> = {};
      const allDailyRes = await supabase
        .from("usage_events")
        .select("tokens_used, created_at")
        .gte("created_at", thirtyDaysAgo.toISOString());

      for (const e of allDailyRes.data || []) {
        const day = new Date(e.created_at).toISOString().split("T")[0];
        dailyMap[day] = (dailyMap[day] || 0) + (e.tokens_used || 0);
      }

      const chart: { date: string; tokens: number }[] = [];
      for (let d = new Date(thirtyDaysAgo); d <= new Date(); d.setDate(d.getDate() + 1)) {
        const key = d.toISOString().split("T")[0];
        chart.push({ date: key, tokens: dailyMap[key] || 0 });
      }
      setDailyData(chart);
      setLoading(false);
    }
    fetchBilling();
  }, [tenantId]);

  const monthAgentJobs = events.filter((e) => e.event_type === "agent_job").length;
  const monthDecks = events.filter((e) => e.event_type === "deck_generation").length;
  const monthTokens = events.reduce((sum, e) => sum + (e.tokens_used || 0), 0);
  const estimatedCost = (monthTokens / 1000) * costPer1k;
  const budgetPercent = tokenBudget > 0 ? Math.round((monthTokens / tokenBudget) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Token Budget Warnings */}
      {tokenBudget > 0 && budgetPercent >= 100 && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <p className="text-sm">You've reached your monthly token budget. New jobs may be limited. Contact Solutionment immediately.</p>
        </div>
      )}
      {tokenBudget > 0 && budgetPercent >= 80 && budgetPercent < 100 && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <p className="text-sm">You've used {budgetPercent}% of your {tokenBudget.toLocaleString()} monthly token budget. Contact Solutionment to increase your limit.</p>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Agent Jobs Run", value: monthAgentJobs, icon: Zap },
          { label: "Decks Generated", value: monthDecks, icon: FileText },
          { label: "Total Tokens", value: monthTokens.toLocaleString(), icon: TrendingUp },
          { label: "Estimated Cost", value: `$${estimatedCost.toFixed(2)} est.`, icon: DollarSign },
        ].map((stat) => (
          <Card key={stat.label} className="glass-card">
            <CardContent className="pt-5 pb-4 px-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <stat.icon className="h-3.5 w-3.5" />
                <span className="text-[11px]">{stat.label}</span>
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Usage Trend Chart */}
      <Card className="glass-card">
        <CardHeader><CardTitle className="text-lg">Daily Token Usage (Last 30 Days)</CardTitle></CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData}>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v) => new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  interval={4}
                />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  labelFormatter={(v) => new Date(v as string).toLocaleDateString()}
                  formatter={(v: number) => [v.toLocaleString(), "Tokens"]}
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                />
                <Bar dataKey="tokens" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity Table */}
      <Card className="glass-card">
        <CardHeader><CardTitle className="text-lg">Recent Activity</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date/Time</TableHead>
                <TableHead>Event Type</TableHead>
                <TableHead>Skill</TableHead>
                <TableHead className="text-right">Tokens</TableHead>
                <TableHead>Model</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentEvents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No usage events yet. Run a skill to see activity here.
                  </TableCell>
                </TableRow>
              ) : (
                recentEvents.map((e: any) => (
                  <TableRow key={e.id}>
                    <TableCell className="text-xs">{new Date(e.created_at).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{EVENT_TYPE_LABELS[e.event_type] || e.event_type}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{e.skills?.display_name || e.skills?.name || "—"}</TableCell>
                    <TableCell className="text-right text-sm">{(e.tokens_used || 0).toLocaleString()}</TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">{e.model_used || "—"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const { tenantId, isAdmin } = useTenant();
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [workspaceName, setWorkspaceName] = useState("Solutionment");
  const [industry, setIndustry] = useState("Technology Consulting");
  const [agentStates, setAgentStates] = useState<Record<string, boolean>>(
    () => Object.fromEntries(agentDefinitions.map((a) => [a.type, true]))
  );

  // OpenRouter state
  const [openrouterEnabled, setOpenrouterEnabled] = useState(false);
  const [selectedModels, setSelectedModels] = useState<OpenRouterModel[]>([]);
  const [catalogModels, setCatalogModels] = useState<OpenRouterModel[]>([]);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [keyValid, setKeyValid] = useState<boolean | null>(null);
  const [savingModels, setSavingModels] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);

  // Telegram integration state
  const [telegramEnabled, setTelegramEnabled] = useState(false);

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

  // Fetch workspace settings (OpenRouter + agent toggles + telegram)
  useEffect(() => {
    async function fetchSettings() {
      setLoadingSettings(true);
      const { data } = await supabase
        .from("workspace_settings")
        .select("key, value")
        .in("key", ["openrouter_enabled", "openrouter_models", "agent_toggles", "telegram_enabled"]);

      if (data) {
        for (const row of data) {
          if (row.key === "openrouter_enabled") {
            setOpenrouterEnabled(row.value === true);
          }
          if (row.key === "openrouter_models" && Array.isArray(row.value)) {
            setSelectedModels(row.value as unknown as OpenRouterModel[]);
          }
          if (row.key === "agent_toggles" && typeof row.value === "object" && row.value !== null) {
            setAgentStates((prev) => ({ ...prev, ...(row.value as Record<string, boolean>) }));
          }
          if (row.key === "telegram_enabled") {
            setTelegramEnabled(row.value === true);
          }
        }
      }
      setLoadingSettings(false);
    }
    fetchSettings();
  }, []);

  // Fetch catalog when OpenRouter is enabled
  const fetchCatalog = async () => {
    setLoadingCatalog(true);
    setKeyValid(null);
    try {
      const { data, error } = await supabase.functions.invoke("openrouter-models");
      if (error) throw error;
      if (data?.valid) {
        setCatalogModels(data.models || []);
        setKeyValid(true);
      } else {
        setKeyValid(false);
        setCatalogModels([]);
      }
    } catch {
      setKeyValid(false);
      setCatalogModels([]);
    }
    setLoadingCatalog(false);
  };

  useEffect(() => {
    if (openrouterEnabled) {
      fetchCatalog();
    }
  }, [openrouterEnabled]);

  const toggleOpenRouter = async (enabled: boolean) => {
    setOpenrouterEnabled(enabled);
    await supabase
      .from("workspace_settings")
      .upsert({ key: "openrouter_enabled", value: enabled, updated_at: new Date().toISOString(), tenant_id: tenantId! }, { onConflict: "key" });
    toast({ title: `OpenRouter ${enabled ? "enabled" : "disabled"}` });
  };

  const toggleModelSelection = async (model: OpenRouterModel) => {
    const isSelected = selectedModels.some((m) => m.id === model.id);
    let updated: OpenRouterModel[];
    if (isSelected) {
      updated = selectedModels.filter((m) => m.id !== model.id);
    } else {
      if (selectedModels.length >= 5) {
        toast({ title: "Maximum 5 models", description: "Remove a model before adding another.", variant: "destructive" });
        return;
      }
      updated = [...selectedModels, model];
    }
    setSavingModels(true);
    await supabase
      .from("workspace_settings")
      .upsert({ key: "openrouter_models", value: updated as any, updated_at: new Date().toISOString(), tenant_id: tenantId! }, { onConflict: "key" });
    setSelectedModels(updated);
    setSavingModels(false);
  };

  const toggleAgent = async (agentType: string, checked: boolean) => {
    const newStates = { ...agentStates, [agentType]: checked };
    setAgentStates(newStates);
    await supabase
      .from("workspace_settings")
      .upsert(
        { key: "agent_toggles", value: newStates as any, updated_at: new Date().toISOString(), tenant_id: tenantId! },
        { onConflict: "key" }
      );
    const agentName = agentDefinitions.find((a) => a.type === agentType)?.name || agentType;
    toast({ title: `${agentName} ${checked ? "enabled" : "disabled"}` });
  };

  const toggleTelegram = async (enabled: boolean) => {
    setTelegramEnabled(enabled);
    await supabase
      .from("workspace_settings")
      .upsert(
        { key: "telegram_enabled", value: enabled, updated_at: new Date().toISOString(), tenant_id: tenantId! },
        { onConflict: "key" }
      );
    toast({ title: `Telegram integration ${enabled ? "enabled" : "disabled"}` });
  };

  const filteredCatalog = catalogModels.filter(
    (m) =>
      m.id.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      m.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      (m.description || "").toLowerCase().includes(catalogSearch.toLowerCase())
  );

  const formatCost = (perToken: string | null | undefined) => {
    if (!perToken) return "–";
    const num = parseFloat(perToken) * 1_000_000;
    if (num === 0) return "Free";
    if (num < 0.01) return "<$0.01";
    return `$${num.toFixed(2)}`;
  };

  const formatContext = (ctx: number | null | undefined) => {
    if (!ctx) return null;
    if (ctx >= 1_000_000) return `${(ctx / 1_000_000).toFixed(1)}M`;
    if (ctx >= 1_000) return `${Math.round(ctx / 1_000)}K`;
    return `${ctx}`;
  };

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

      {isAdmin && (
        <motion.div variants={item}>
          <TeamWorkspaceSection />
        </motion.div>
      )}

      <motion.div variants={item}>
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="general" className="gap-1.5"><Building2 className="h-3.5 w-3.5" /> General</TabsTrigger>
            <TabsTrigger value="appearance" className="gap-1.5"><Palette className="h-3.5 w-3.5" /> Appearance</TabsTrigger>
            {isAdmin && (
              <>
                <TabsTrigger value="api" className="gap-1.5"><Key className="h-3.5 w-3.5" /> API Keys</TabsTrigger>
                <TabsTrigger value="agents" className="gap-1.5"><Bot className="h-3.5 w-3.5" /> Agents</TabsTrigger>
                <TabsTrigger value="integrations" className="gap-1.5"><MessageCircle className="h-3.5 w-3.5" /> Integrations</TabsTrigger>
                <TabsTrigger value="billing" className="gap-1.5"><DollarSign className="h-3.5 w-3.5" /> Usage & Billing</TabsTrigger>
              </>
            )}
            <TabsTrigger value="usage" className="gap-1.5"><BarChart3 className="h-3.5 w-3.5" /> System</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card className="glass-card">
              <CardHeader><CardTitle className="text-lg">Workspace</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Workspace Name</Label>
                  <Input value={workspaceName} onChange={(e) => setWorkspaceName(e.target.value)} className="bg-muted/50 border-border/50 max-w-sm" />
                </div>
                <div className="space-y-2">
                  <Label>Industry</Label>
                  <Input value={industry} onChange={(e) => setIndustry(e.target.value)} className="bg-muted/50 border-border/50 max-w-sm" />
                </div>
                <Button size="sm" onClick={() => toast({ title: "Settings saved", description: "Workspace settings updated successfully." })}>Save</Button>
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

          {isAdmin && (
            <>
              <TabsContent value="api">
                <div className="space-y-4">
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

                  {/* OpenRouter Integration */}
                  <Card className="glass-card">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">OpenRouter</CardTitle>
                        {loadingSettings ? (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        ) : (
                          <Switch checked={openrouterEnabled} onCheckedChange={toggleOpenRouter} />
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Connect your OpenRouter account to access additional AI models like Claude, Llama, Mistral, and more.
                      </p>

                      {openrouterEnabled && (
                        <>
                          {/* API Key Status */}
                          <div className="space-y-2 p-3 rounded-lg bg-muted/30">
                            <Label className="text-sm">API Key</Label>
                            <div className="flex items-center gap-2">
                              {keyValid === null && loadingCatalog ? (
                                <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                              ) : keyValid ? (
                                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Key configured</Badge>
                              ) : (
                                <Badge className="bg-destructive/20 text-destructive border-destructive/30">Key not configured</Badge>
                              )}
                            </div>
                            <p className="text-[10px] text-muted-foreground">
                              Your OpenRouter API key is securely stored as a backend secret. Get your key from{" "}
                              <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="underline">openrouter.ai/keys</a>.
                            </p>
                          </div>

                          {/* Selected Models */}
                          {selectedModels.length > 0 && (
                            <div className="space-y-2">
                              <Label className="text-sm">Selected Models ({selectedModels.length}/5)</Label>
                              <div className="space-y-1.5">
                                {selectedModels.map((m) => (
                                  <div key={m.id} className="flex items-center gap-2 text-sm bg-primary/10 border border-primary/20 rounded-md px-3 py-2">
                                    <CheckCircle className="h-3 w-3 text-primary shrink-0" />
                                    <span className="font-mono text-xs flex-1 truncate">{m.id}</span>
                                    <span className="text-xs text-muted-foreground shrink-0">{m.name}</span>
                                    <button
                                      onClick={() => toggleModelSelection(m)}
                                      className="text-muted-foreground hover:text-foreground shrink-0 text-xs"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Model Catalog Browser */}
                          {keyValid && (
                            <div className="space-y-2">
                              <Label className="text-sm">Browse Models</Label>
                              <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                <Input
                                  value={catalogSearch}
                                  onChange={(e) => setCatalogSearch(e.target.value)}
                                  placeholder="Search models..."
                                  className="pl-9 bg-muted/50 border-border/50 h-8 text-xs"
                                />
                              </div>
                              {loadingCatalog ? (
                                <div className="flex items-center justify-center py-8">
                                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                </div>
                              ) : (
                                <ScrollArea className="h-[300px] rounded-md border border-border/50 bg-muted/20">
                                  <div className="p-1">
                                    {filteredCatalog.map((model) => {
                                      const isSelected = selectedModels.some((m) => m.id === model.id);
                                      return (
                                        <button
                                          key={model.id}
                                          onClick={() => toggleModelSelection(model)}
                                          className={cn(
                                            "w-full flex items-start gap-3 px-3 py-2.5 rounded-md text-left transition-colors text-xs",
                                            isSelected
                                              ? "bg-primary/10 border border-primary/20"
                                              : "hover:bg-muted/50"
                                          )}
                                        >
                                          <Checkbox checked={isSelected} className="pointer-events-none mt-0.5" />
                                          <div className="flex-1 min-w-0 space-y-1">
                                            <div className="flex items-center gap-2">
                                              <p className="font-mono truncate flex-1">{model.id}</p>
                                              {model.contextLength && (
                                                <Badge variant="outline" className="text-[9px] px-1.5 py-0 shrink-0">
                                                  {formatContext(model.contextLength)} ctx
                                                </Badge>
                                              )}
                                            </div>
                                            {model.description && (
                                              <p className="text-[10px] text-muted-foreground line-clamp-1">{model.description}</p>
                                            )}
                                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                              <span>In: {formatCost(model.promptPrice)}/1M</span>
                                              <span>Out: {formatCost(model.completionPrice)}/1M</span>
                                            </div>
                                          </div>
                                        </button>
                                      );
                                    })}
                                    {filteredCatalog.length === 0 && (
                                      <p className="text-xs text-muted-foreground text-center py-8">
                                        {catalogSearch ? "No models match your search" : "No models available"}
                                      </p>
                                    )}
                                  </div>
                                </ScrollArea>
                              )}
                              <p className="text-[10px] text-muted-foreground">
                                {catalogModels.length} models available · Select up to 5
                              </p>
                            </div>
                          )}
                        </>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="agents">
                <Card className="glass-card">
                  <CardHeader><CardTitle className="text-lg">Agent Configuration</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground mb-2">
                      Enable or disable agent types. Disabled agents cannot execute any skills — existing skills using a disabled agent will be blocked until re-enabled.
                    </p>
                    {agentDefinitions.map((agent) => (
                      <div key={agent.type} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{agent.emoji}</span>
                          <div>
                            <p className="text-sm font-medium">{agent.name}</p>
                            <p className="text-xs text-muted-foreground">{agent.type}</p>
                          </div>
                        </div>
                        <Switch
                          checked={agentStates[agent.type] ?? true}
                          onCheckedChange={(checked) => toggleAgent(agent.type, checked)}
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="integrations">
                <Card className="glass-card">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <MessageCircle className="h-4 w-4" />
                        Telegram Bot
                      </CardTitle>
                      {loadingSettings ? (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      ) : (
                        <Switch checked={telegramEnabled} onCheckedChange={toggleTelegram} />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Run Apex AI skills and chat with Alex directly from Telegram. When enabled, your team can interact with the platform via a Telegram bot.
                    </p>

                    {telegramEnabled ? (
                      <div className="space-y-4">
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Enabled</Badge>

                        <div className="p-4 rounded-lg bg-muted/30 space-y-3">
                          <h4 className="text-sm font-semibold">Setup Instructions</h4>
                          <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                            <li>Open <strong>Telegram</strong> and search for <strong>@BotFather</strong>.</li>
                            <li>Send <code className="px-1 py-0.5 rounded bg-muted text-foreground text-xs">/newbot</code> to BotFather.</li>
                            <li>Choose a <strong>name</strong> for your bot (e.g. "My Apex AI Bot").</li>
                            <li>Choose a <strong>username</strong> ending in "bot" (e.g. <code className="px-1 py-0.5 rounded bg-muted text-foreground text-xs">my_apex_ai_bot</code>).</li>
                            <li>BotFather will give you a <strong>Bot Token</strong> like <code className="px-1 py-0.5 rounded bg-muted text-foreground text-xs">123456789:ABCdefGHI...</code>.</li>
                            <li>Contact your <strong>Solutionment administrator</strong> to add the token to your workspace configuration.</li>
                            <li>Once configured, the webhook registers automatically — no manual setup needed.</li>
                            <li><strong>Test it</strong> — open your bot in Telegram and send <code className="px-1 py-0.5 rounded bg-muted text-foreground text-xs">/start</code>.</li>
                          </ol>
                        </div>

                        <div className="p-4 rounded-lg bg-muted/30 space-y-2">
                          <h4 className="text-sm font-semibold">Available Commands</h4>
                          <div className="grid grid-cols-2 gap-1.5 text-xs text-muted-foreground">
                            <span><code className="text-foreground">/start</code> — Welcome message</span>
                            <span><code className="text-foreground">/skills</code> — Browse all skills</span>
                            <span><code className="text-foreground">/run &lt;name&gt;</code> — Run a skill</span>
                            <span><code className="text-foreground">/tasks</code> — View scheduled tasks</span>
                            <span><code className="text-foreground">/usage</code> — Monthly usage summary</span>
                            <span><code className="text-foreground">/cancel</code> — Cancel current input</span>
                            <span><code className="text-foreground">/clear</code> — Reset Alex history</span>
                            <span><code className="text-foreground">/help</code> — Show help</span>
                          </div>
                        </div>

                        <p className="text-xs text-muted-foreground">
                          Free-text messages are routed to Alex. Skills with PowerPoint output generate .pptx decks automatically.
                        </p>
                      </div>
                    ) : (
                      <div className="p-4 rounded-lg bg-muted/20 border border-border/50">
                        <p className="text-sm text-muted-foreground">
                          Telegram integration is disabled. Enable it to allow your team to run skills and chat with Alex via Telegram.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="billing">
                <UsageBillingSection tenantId={tenantId} />
              </TabsContent>
            </>
          )}

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

              {/* Scheduled Tasks Stat */}
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
