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
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Building2, Key, Bot, BarChart3, Users, Palette, Sun, Moon, Monitor, Activity, BookOpen, Sparkles, CalendarClock, CheckCircle, Loader2, Search } from "lucide-react";
import { agentDefinitions } from "@/data/mock-data";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTenant } from "@/hooks/use-tenant";

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

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const { tenantId } = useTenant();
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

  // Fetch OpenRouter settings
  useEffect(() => {
    async function fetchOpenRouterSettings() {
      setLoadingSettings(true);
      const { data } = await supabase
        .from("workspace_settings")
        .select("key, value")
        .in("key", ["openrouter_enabled", "openrouter_models"]);

      if (data) {
        for (const row of data) {
          if (row.key === "openrouter_enabled") {
            setOpenrouterEnabled(row.value === true);
          }
          if (row.key === "openrouter_models" && Array.isArray(row.value)) {
            setSelectedModels(row.value as unknown as OpenRouterModel[]);
          }
        }
      }
      setLoadingSettings(false);
    }
    fetchOpenRouterSettings();
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
                      onCheckedChange={(checked) => {
                        setAgentStates((prev) => ({ ...prev, [agent.type]: checked }));
                        toast({ title: `${agent.name} ${checked ? "enabled" : "disabled"}` });
                      }}
                    />
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

          <TabsContent value="members">
            <Card className="glass-card">
              <CardHeader><CardTitle className="text-lg">Team Members</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Member management coming soon. Currently single-user workspace.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}
