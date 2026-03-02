import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Plus, Trash2, GripVertical, BookOpen, Wrench, Loader2, ChevronLeft, ChevronRight, Check, Pencil, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { agentDefinitions, departmentDefinitions, dbRowToSkill, type Department, type AgentType, type SkillInput, type Skill } from "@/data/mock-data";
import { useToast } from "@/hooks/use-toast";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

const inputTypes = [
  { value: "text", label: "Text" },
  { value: "textarea", label: "Text Area" },
  { value: "url", label: "URL" },
  { value: "select", label: "Dropdown" },
  { value: "radio", label: "Radio Group" },
  { value: "multi-select", label: "Multi-Select" },
];

const STEP_LABELS = ["Identity", "Routing", "Inputs", "System Prompt", "Behavior", "Output"];

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1 mb-6">
      {Array.from({ length: total }, (_, i) => {
        const step = i + 1;
        const isActive = step === current;
        const isDone = step < current;
        return (
          <div key={step} className="flex items-center gap-1 flex-1">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium shrink-0 transition-colors ${
              isActive ? "bg-primary text-primary-foreground" :
              isDone ? "bg-primary/20 text-primary" :
              "bg-muted text-muted-foreground"
            }`}>
              {isDone ? <Check className="h-3.5 w-3.5" /> : step}
            </div>
            {i < total - 1 && <div className={`h-px flex-1 ${isDone ? "bg-primary/30" : "bg-border"}`} />}
          </div>
        );
      })}
    </div>
  );
}

export default function Capabilities() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("library");
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState<string>("all");
  const [agentFilter, setAgentFilter] = useState<string>("all");
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingSkillId, setEditingSkillId] = useState<string | null>(null);

  // Six-step builder state
  const [builderStep, setBuilderStep] = useState(1);
  // Step 1: Identity
  const [builderName, setBuilderName] = useState("");
  const [builderDisplayName, setBuilderDisplayName] = useState("");
  const [builderDesc, setBuilderDesc] = useState("");
  const [builderEmoji, setBuilderEmoji] = useState("⚡");
  const [builderVersion, setBuilderVersion] = useState("1.0.0");
  // Step 2: Routing
  const [builderDept, setBuilderDept] = useState<Department | "">("");
  const [builderAgent, setBuilderAgent] = useState<AgentType | "">("");
  const [builderTags, setBuilderTags] = useState("");
  const [builderTriggerKeywords, setBuilderTriggerKeywords] = useState("");
  const [builderPreferredModel, setBuilderPreferredModel] = useState("haiku");
  const [builderPreferredLane, setBuilderPreferredLane] = useState("simple_haiku");
  // Step 3: Inputs
  const [builderInputs, setBuilderInputs] = useState<Partial<SkillInput>[]>([]);
  // Step 4: System Prompt
  const [builderSystemPrompt, setBuilderSystemPrompt] = useState("");
  // Step 5: Behavior
  const [builderTokenBudget, setBuilderTokenBudget] = useState(10000);
  const [builderEstimatedCost, setBuilderEstimatedCost] = useState("");
  const [builderTimeout, setBuilderTimeout] = useState(120);
  const [builderWebSearch, setBuilderWebSearch] = useState(false);
  const [builderApprovalRequired, setBuilderApprovalRequired] = useState(false);
  const [builderCapabilities, setBuilderCapabilities] = useState<string[]>([]);
  const [builderSchedulable, setBuilderSchedulable] = useState(false);
  // Step 6: Output
  const [builderOutputFormat, setBuilderOutputFormat] = useState("markdown");
  const [builderExportFormats, setBuilderExportFormats] = useState("");
  const [builderOutputTitle, setBuilderOutputTitle] = useState("");
  const [builderOutputSections, setBuilderOutputSections] = useState("");

  const fetchSkills = async () => {
    setLoading(true);
    const { data } = await supabase.from("skills").select("*").order("department").order("agent_type").order("name");
    if (data) {
      setAllSkills(data.map(dbRowToSkill));
    }
    setLoading(false);
  };

  useEffect(() => { fetchSkills(); }, []);

  const filtered = allSkills.filter((s) => {
    if (deptFilter !== "all" && s.department !== deptFilter) return false;
    if (agentFilter !== "all" && s.agentType !== agentFilter) return false;
    if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !(s.description || "").toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const resetBuilder = () => {
    setEditingSkillId(null);
    setBuilderStep(1);
    setBuilderName(""); setBuilderDisplayName(""); setBuilderDesc(""); setBuilderEmoji("⚡"); setBuilderVersion("1.0.0");
    setBuilderDept(""); setBuilderAgent(""); setBuilderTags(""); setBuilderTriggerKeywords(""); setBuilderPreferredModel("haiku"); setBuilderPreferredLane("simple_haiku");
    setBuilderInputs([]);
    setBuilderSystemPrompt("");
    setBuilderTokenBudget(10000); setBuilderEstimatedCost(""); setBuilderTimeout(120); setBuilderWebSearch(false); setBuilderApprovalRequired(false); setBuilderCapabilities([]); setBuilderSchedulable(false);
    setBuilderOutputFormat("markdown"); setBuilderExportFormats(""); setBuilderOutputTitle(""); setBuilderOutputSections("");
  };

  const loadSkillIntoBuilder = (skill: Skill) => {
    setEditingSkillId(skill.id);
    setBuilderStep(1);
    setBuilderName(skill.name);
    setBuilderDisplayName(skill.displayName || skill.name);
    setBuilderDesc(skill.description);
    setBuilderEmoji(skill.emoji);
    setBuilderVersion(skill.version || "1.0.0");
    setBuilderDept(skill.department);
    setBuilderAgent(skill.agentType);
    setBuilderTags((skill.tags || []).join(", "));
    setBuilderTriggerKeywords((skill.triggerKeywords || []).join(", "));
    setBuilderPreferredModel(skill.preferredModel || "haiku");
    setBuilderPreferredLane(skill.preferredLane || "simple_haiku");
    setBuilderInputs(skill.inputs.map(inp => ({ ...inp })));
    setBuilderSystemPrompt(skill.systemPrompt || "");
    setBuilderTokenBudget(skill.tokenBudget || 10000);
    setBuilderEstimatedCost(skill.estimatedCost ? String(skill.estimatedCost) : "");
    setBuilderTimeout(skill.timeoutSeconds || 120);
    setBuilderWebSearch(skill.webSearchEnabled || false);
    setBuilderApprovalRequired(skill.approvalRequired || false);
    setBuilderCapabilities(skill.requiredCapabilities || []);
    setBuilderSchedulable((skill as any).schedulable || false);
    setBuilderOutputFormat(skill.outputFormat || "markdown");
    setBuilderExportFormats((skill.exportFormats || []).join(", "));
    setBuilderOutputTitle(skill.outputSchema?.title || "");
    setBuilderOutputSections((skill.outputSchema?.sections || []).join(", "));
    setActiveTab("builder");
  };

  const addInput = () => {
    setBuilderInputs([...builderInputs, { name: "", label: "", type: "text", required: false }]);
  };

  const removeInput = (idx: number) => {
    setBuilderInputs(builderInputs.filter((_, i) => i !== idx));
  };

  const updateInput = (idx: number, field: string, value: any) => {
    const next = [...builderInputs];
    (next[idx] as any)[field] = value;
    setBuilderInputs(next);
  };

  const canNext = () => {
    switch (builderStep) {
      case 1: return !!builderName;
      case 2: return !!builderDept && !!builderAgent;
      case 3: return builderInputs.length > 0;
      case 4: return !!builderSystemPrompt;
      default: return true;
    }
  };

  const saveSkill = async () => {
    if (!builderName || !builderDept || !builderAgent) return;
    setSaving(true);

    const inputs = builderInputs.map((inp) => ({
      field: (inp.name || inp.label || "").toLowerCase().replace(/\s+/g, "_"),
      label: inp.label || "",
      type: inp.type || "text",
      required: inp.required || false,
      placeholder: inp.placeholder || "",
      hint: inp.hint || "",
      options: inp.options || [],
      default: inp.default || undefined,
    }));

    const tags = builderTags.split(",").map(s => s.trim()).filter(Boolean);
    const triggerKeywords = builderTriggerKeywords.split(",").map(s => s.trim()).filter(Boolean);
    const exportFormats = builderExportFormats.split(",").map(s => s.trim()).filter(Boolean);
    const sections = builderOutputSections.split(",").map(s => s.trim()).filter(Boolean);

    const skillData = {
      name: builderName,
      display_name: builderDisplayName || builderName,
      description: builderDesc,
      department: builderDept,
      agent_type: builderAgent,
      emoji: builderEmoji,
      version: builderVersion,
      system_prompt: builderSystemPrompt,
      prompt_template: builderSystemPrompt ? "" : "",
      inputs,
      tags,
      trigger_keywords: triggerKeywords,
      preferred_model: builderPreferredModel,
      preferred_lane: builderPreferredLane,
      token_budget: builderTokenBudget,
      estimated_cost_usd: builderEstimatedCost ? parseFloat(builderEstimatedCost) : null,
      required_capabilities: builderCapabilities,
      web_search_enabled: builderWebSearch,
      approval_required: builderApprovalRequired,
      timeout_seconds: builderTimeout,
      output_format: builderOutputFormat,
      output_schema: { title: builderOutputTitle, sections },
      export_formats: exportFormats,
      is_system: false,
      schedulable: builderSchedulable,
    };

    let error;
    if (editingSkillId) {
      ({ error } = await supabase.from("skills").update(skillData).eq("id", editingSkillId));
    } else {
      ({ error } = await supabase.from("skills").insert(skillData));
    }

    setSaving(false);
    if (error) {
      toast({ title: "Error saving skill", description: error.message, variant: "destructive" });
    } else {
      toast({ title: editingSkillId ? "Skill updated!" : "Skill saved!" });
      resetBuilder();
      fetchSkills();
      setActiveTab("library");
    }
  };

  const deleteSkill = async (id: string) => {
    await supabase.from("skills").delete().eq("id", id);
    fetchSkills();
    toast({ title: "Skill deleted" });
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-7xl">
      <motion.div variants={item}>
        <h1 className="text-3xl font-bold tracking-tight">Capabilities</h1>
        <p className="text-muted-foreground mt-1">Browse, search, and create skills that power your agents</p>
      </motion.div>

      <motion.div variants={item}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="library" className="gap-1.5"><BookOpen className="h-3.5 w-3.5" /> Skill Library</TabsTrigger>
            <TabsTrigger value="builder" className="gap-1.5"><Wrench className="h-3.5 w-3.5" /> Skill Builder</TabsTrigger>
          </TabsList>

          {/* ── Skill Library ── */}
          <TabsContent value="library" className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search skills..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-muted/50 border-border/50" />
              </div>
              <Select value={deptFilter} onValueChange={setDeptFilter}>
                <SelectTrigger className="w-[150px] bg-muted/50 border-border/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {Object.entries(departmentDefinitions).map(([key, d]) => (
                    <SelectItem key={key} value={key}>{d.emoji} {d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={agentFilter} onValueChange={setAgentFilter}>
                <SelectTrigger className="w-[150px] bg-muted/50 border-border/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Agents</SelectItem>
                  {agentDefinitions.map((a) => (
                    <SelectItem key={a.type} value={a.type}>{a.emoji} {a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" className="gap-1.5 ml-auto" onClick={() => { resetBuilder(); setActiveTab("builder"); }}>
                <Plus className="h-3.5 w-3.5" /> New Skill
              </Button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filtered.map((skill) => {
                  const agent = agentDefinitions.find((a) => a.type === skill.agentType);
                  const dept = departmentDefinitions[skill.department];
                  return (
                    <Card
                      key={skill.id}
                      className="glass-card hover:border-primary/30 transition-all cursor-pointer group"
                      onClick={() => loadSkillIntoBuilder(skill)}
                    >
                      <CardContent className="p-5 space-y-3">
                        <div className="flex items-start justify-between">
                          <span className="text-2xl">{skill.emoji}</span>
                          <div className="flex gap-1.5 items-center">
                            <Badge variant="outline" className="text-[10px]">{dept?.name}</Badge>
                            <Badge variant="outline" className="text-[10px]">{agent?.name}</Badge>
                            <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold">{skill.displayName || skill.name}</h3>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{skill.description}</p>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          <span>{skill.inputs.length} inputs</span>
                          <span>·</span>
                          <span>{skill.inputs.filter((i) => i.required).length} required</span>
                          {skill.estimatedCost && (
                            <>
                              <span>·</span>
                              <span>~${skill.estimatedCost.toFixed(2)}</span>
                            </>
                          )}
                          {skill.isSystem && <Badge variant="outline" className="text-[10px] ml-auto">System</Badge>}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                {filtered.length === 0 && (
                  <div className="col-span-full text-center text-muted-foreground py-12">
                    No skills match your filters
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* ── Skill Builder (6-Step Wizard) ── */}
          <TabsContent value="builder" className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">{editingSkillId ? "Edit Skill" : "Create a New Skill"}</h2>
                <span className="text-xs text-muted-foreground">Step {builderStep} of 6 — {STEP_LABELS[builderStep - 1]}</span>
              </div>
              {editingSkillId && (
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={resetBuilder}>
                    <X className="h-3 w-3" /> Cancel
                  </Button>
                  <Button variant="ghost" size="sm" className="gap-1 text-xs text-destructive" onClick={() => { deleteSkill(editingSkillId); resetBuilder(); }}>
                    <Trash2 className="h-3 w-3" /> Delete
                  </Button>
                </div>
              )}
            </div>

            <StepIndicator current={builderStep} total={6} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Builder form */}
              <Card className="glass-card">
                <CardContent className="p-6 space-y-4">

                  {/* Step 1: Identity */}
                  {builderStep === 1 && (
                    <>
                      <div className="grid grid-cols-[60px_1fr] gap-3">
                        <div className="space-y-2">
                          <Label>Emoji</Label>
                          <Input value={builderEmoji} onChange={(e) => setBuilderEmoji(e.target.value)} className="bg-muted/50 border-border/50 text-center text-lg" maxLength={2} />
                        </div>
                        <div className="space-y-2">
                          <Label>Skill Name (ID)</Label>
                          <Input value={builderName} onChange={(e) => setBuilderName(e.target.value)} placeholder="e.g. company_research" className="bg-muted/50 border-border/50" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Display Name</Label>
                        <Input value={builderDisplayName} onChange={(e) => setBuilderDisplayName(e.target.value)} placeholder="e.g. Company Research" className="bg-muted/50 border-border/50" />
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea value={builderDesc} onChange={(e) => setBuilderDesc(e.target.value)} placeholder="What does this skill do?" rows={3} className="bg-muted/50 border-border/50 resize-none" />
                      </div>
                      <div className="space-y-2">
                        <Label>Version</Label>
                        <Input value={builderVersion} onChange={(e) => setBuilderVersion(e.target.value)} placeholder="1.0.0" className="bg-muted/50 border-border/50 w-32" />
                      </div>
                    </>
                  )}

                  {/* Step 2: Routing */}
                  {builderStep === 2 && (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>Department</Label>
                          <Select value={builderDept} onValueChange={(v) => setBuilderDept(v as Department)}>
                            <SelectTrigger className="bg-muted/50 border-border/50"><SelectValue placeholder="Select..." /></SelectTrigger>
                            <SelectContent>
                              {Object.entries(departmentDefinitions).map(([key, d]) => (
                                <SelectItem key={key} value={key}>{d.emoji} {d.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Agent</Label>
                          <Select value={builderAgent} onValueChange={(v) => setBuilderAgent(v as AgentType)}>
                            <SelectTrigger className="bg-muted/50 border-border/50"><SelectValue placeholder="Select..." /></SelectTrigger>
                            <SelectContent>
                              {agentDefinitions.map((a) => (
                                <SelectItem key={a.type} value={a.type}>{a.emoji} {a.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Tags (comma-separated)</Label>
                        <Input value={builderTags} onChange={(e) => setBuilderTags(e.target.value)} placeholder="e.g. research, company, firmographics" className="bg-muted/50 border-border/50" />
                      </div>
                      <div className="space-y-2">
                        <Label>Trigger Keywords (comma-separated)</Label>
                        <Input value={builderTriggerKeywords} onChange={(e) => setBuilderTriggerKeywords(e.target.value)} placeholder="e.g. research company, company profile" className="bg-muted/50 border-border/50" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>Preferred Model</Label>
                          <Select value={builderPreferredModel} onValueChange={setBuilderPreferredModel}>
                            <SelectTrigger className="bg-muted/50 border-border/50"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="haiku">Haiku (Fast)</SelectItem>
                              <SelectItem value="sonnet">Sonnet (Balanced)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Lane</Label>
                          <Select value={builderPreferredLane} onValueChange={setBuilderPreferredLane}>
                            <SelectTrigger className="bg-muted/50 border-border/50"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="simple_haiku">Simple Haiku</SelectItem>
                              <SelectItem value="research_sonnet">Research Sonnet</SelectItem>
                              <SelectItem value="agentic_sonnet">Agentic Sonnet</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Step 3: Inputs */}
                  {builderStep === 3 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Input Fields ({builderInputs.length})</Label>
                        <Button variant="outline" size="sm" onClick={addInput} className="h-7 text-xs gap-1">
                          <Plus className="h-3 w-3" /> Add Field
                        </Button>
                      </div>
                      {builderInputs.map((inp, idx) => (
                        <div key={idx} className="flex items-start gap-2 p-3 rounded-lg bg-muted/30">
                          <GripVertical className="h-4 w-4 text-muted-foreground mt-2 shrink-0" />
                          <div className="flex-1 space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <Input placeholder="Field label" value={inp.label || ""} onChange={(e) => updateInput(idx, "label", e.target.value)} className="bg-muted/50 border-border/50 h-8 text-xs" />
                              <Select value={inp.type || "text"} onValueChange={(v) => updateInput(idx, "type", v)}>
                                <SelectTrigger className="bg-muted/50 border-border/50 h-8 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {inputTypes.map((t) => (
                                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <Input placeholder="Placeholder text" value={inp.placeholder || ""} onChange={(e) => updateInput(idx, "placeholder", e.target.value)} className="bg-muted/50 border-border/50 h-8 text-xs" />
                            <Input placeholder="Hint text" value={inp.hint || ""} onChange={(e) => updateInput(idx, "hint", e.target.value)} className="bg-muted/50 border-border/50 h-8 text-xs" />
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1.5">
                                <Switch checked={inp.required || false} onCheckedChange={(v) => updateInput(idx, "required", v)} />
                                <span className="text-[10px] text-muted-foreground">Required</span>
                              </div>
                            </div>
                            {(inp.type === "select" || inp.type === "radio" || inp.type === "multi-select" || inp.type === "multiselect") && (
                              <Input placeholder="Options (comma-separated)" value={(inp.options || []).join(", ")} onChange={(e) => updateInput(idx, "options", e.target.value.split(",").map((s) => s.trim()))} className="bg-muted/50 border-border/50 h-8 text-xs" />
                            )}
                          </div>
                          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeInput(idx)}>
                            <Trash2 className="h-3 w-3 text-muted-foreground" />
                          </Button>
                        </div>
                      ))}
                      {builderInputs.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-4">No input fields yet. Click "Add Field" to define what data this skill needs.</p>
                      )}
                    </div>
                  )}

                  {/* Step 4: System Prompt */}
                  {builderStep === 4 && (
                    <div className="space-y-2">
                      <Label>System Prompt</Label>
                      <p className="text-xs text-muted-foreground">The core instructions that power this skill's AI behavior. Use markdown formatting.</p>
                      <Textarea
                        value={builderSystemPrompt}
                        onChange={(e) => setBuilderSystemPrompt(e.target.value)}
                        placeholder="You are an expert..."
                        rows={20}
                        className="bg-muted/50 border-border/50 resize-none font-mono text-xs"
                      />
                      {builderInputs.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-2">
                          <span className="text-[10px] text-muted-foreground mr-1">Insert variable:</span>
                          {builderInputs.map((inp, idx) => {
                            const fieldName = (inp.name || inp.label || "").toLowerCase().replace(/\s+/g, "_");
                            if (!fieldName) return null;
                            return (
                              <Button
                                key={idx}
                                variant="outline"
                                size="sm"
                                className="h-5 text-[10px] px-1.5"
                                onClick={() => setBuilderSystemPrompt(prev => prev + `{{${fieldName}}}`)}
                              >
                                {`{{${fieldName}}}`}
                              </Button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Step 5: Behavior */}
                  {builderStep === 5 && (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>Token Budget</Label>
                          <Input type="number" value={builderTokenBudget} onChange={(e) => setBuilderTokenBudget(Number(e.target.value))} className="bg-muted/50 border-border/50" />
                        </div>
                        <div className="space-y-2">
                          <Label>Est. Cost (USD)</Label>
                          <Input value={builderEstimatedCost} onChange={(e) => setBuilderEstimatedCost(e.target.value)} placeholder="e.g. 0.25" className="bg-muted/50 border-border/50" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Timeout (seconds)</Label>
                        <Input type="number" value={builderTimeout} onChange={(e) => setBuilderTimeout(Number(e.target.value))} className="bg-muted/50 border-border/50 w-32" />
                      </div>
                      <div className="space-y-3 pt-2">
                        <Label>Capabilities</Label>
                        <div className="flex items-center gap-6">
                          <div className="flex items-center gap-1.5">
                            <Switch checked={builderWebSearch} onCheckedChange={setBuilderWebSearch} />
                            <span className="text-xs text-muted-foreground">Web Search</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Switch checked={builderCapabilities.includes("knowledge_search")} onCheckedChange={(v) => setBuilderCapabilities(prev => v ? [...prev, "knowledge_search"] : prev.filter(c => c !== "knowledge_search"))} />
                            <span className="text-xs text-muted-foreground">Knowledge Base</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 pt-2">
                          <Switch checked={builderApprovalRequired} onCheckedChange={setBuilderApprovalRequired} />
                          <span className="text-xs text-muted-foreground">Require Approval Before Delivery</span>
                        </div>
                        <div className="flex items-center gap-1.5 pt-2">
                          <Switch checked={builderSchedulable} onCheckedChange={setBuilderSchedulable} />
                          <span className="text-xs text-muted-foreground">Schedulable (can be automated via Tasks)</span>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Step 6: Output */}
                  {builderStep === 6 && (
                    <>
                      <div className="space-y-2">
                        <Label>Output Format</Label>
                        <Select value={builderOutputFormat} onValueChange={setBuilderOutputFormat}>
                          <SelectTrigger className="bg-muted/50 border-border/50"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="markdown">Markdown</SelectItem>
                            <SelectItem value="json">JSON</SelectItem>
                            <SelectItem value="html">HTML</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Output Title Template</Label>
                        <Input value={builderOutputTitle} onChange={(e) => setBuilderOutputTitle(e.target.value)} placeholder="e.g. Company Research: {company_name}" className="bg-muted/50 border-border/50" />
                      </div>
                      <div className="space-y-2">
                        <Label>Output Sections (comma-separated)</Label>
                        <Input value={builderOutputSections} onChange={(e) => setBuilderOutputSections(e.target.value)} placeholder="e.g. overview, financials, products" className="bg-muted/50 border-border/50" />
                      </div>
                      <div className="space-y-2">
                        <Label>Export Formats (comma-separated)</Label>
                        <Input value={builderExportFormats} onChange={(e) => setBuilderExportFormats(e.target.value)} placeholder="e.g. markdown, pdf, docx" className="bg-muted/50 border-border/50" />
                      </div>

                      {/* Summary */}
                      <div className="pt-4 border-t border-border/50 space-y-2">
                        <h3 className="text-sm font-semibold">Summary</h3>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <p><span className="font-medium text-foreground">{builderEmoji} {builderDisplayName || builderName}</span> — {builderDesc || "No description"}</p>
                          <p>Dept: {builderDept || "—"} · Agent: {builderAgent || "—"} · Model: {builderPreferredModel}</p>
                          <p>{builderInputs.length} inputs · Token budget: {builderTokenBudget.toLocaleString()} · Timeout: {builderTimeout}s</p>
                          <p>Web search: {builderWebSearch ? "Yes" : "No"} · Approval: {builderApprovalRequired ? "Required" : "No"}</p>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Navigation */}
                  <div className="flex items-center justify-between pt-4 border-t border-border/50">
                    <Button variant="ghost" size="sm" disabled={builderStep === 1} onClick={() => setBuilderStep(s => s - 1)} className="gap-1">
                      <ChevronLeft className="h-3 w-3" /> Back
                    </Button>
                    {builderStep < 6 ? (
                      <Button size="sm" disabled={!canNext()} onClick={() => setBuilderStep(s => s + 1)} className="gap-1">
                        Next <ChevronRight className="h-3 w-3" />
                      </Button>
                    ) : (
                      <Button size="sm" disabled={saving || !builderName || !builderDept || !builderAgent} onClick={saveSkill} className="gap-1">
                        {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                        {editingSkillId ? "Update Skill" : "Save Skill"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Preview */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-lg">Preview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {builderName ? (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{builderEmoji}</span>
                        <div>
                          <h3 className="font-semibold">{builderDisplayName || builderName}</h3>
                          {builderDesc && <p className="text-sm text-muted-foreground mt-0.5">{builderDesc}</p>}
                        </div>
                      </div>
                      <div className="flex gap-1.5 flex-wrap">
                        {builderDept && <Badge variant="outline" className="text-[10px]">{departmentDefinitions[builderDept as Department]?.name}</Badge>}
                        {builderAgent && <Badge variant="outline" className="text-[10px]">{agentDefinitions.find((a) => a.type === builderAgent)?.name}</Badge>}
                        {builderTags && builderTags.split(",").filter(t => t.trim()).slice(0, 4).map(t => (
                          <Badge key={t.trim()} variant="secondary" className="text-[10px]">{t.trim()}</Badge>
                        ))}
                      </div>
                      {builderInputs.length > 0 && (
                        <div className="space-y-3 pt-2 border-t border-border/50">
                          <p className="text-xs text-muted-foreground font-medium">Form Preview ({builderInputs.length} fields)</p>
                          {builderInputs.map((inp, idx) => (
                            <div key={idx} className="space-y-1">
                              <Label className="text-xs">
                                {inp.label || `Field ${idx + 1}`}
                                {inp.required && <span className="text-destructive ml-1">*</span>}
                              </Label>
                              {inp.hint && <p className="text-[10px] text-muted-foreground">{inp.hint}</p>}
                              {inp.type === "textarea" ? (
                                <Textarea disabled placeholder={inp.placeholder} rows={2} className="bg-muted/50 border-border/50 resize-none text-xs" />
                              ) : inp.type === "select" || inp.type === "multi-select" ? (
                                <Select disabled>
                                  <SelectTrigger className="bg-muted/50 border-border/50 text-xs"><SelectValue placeholder={`Select ${inp.label?.toLowerCase()}...`} /></SelectTrigger>
                                </Select>
                              ) : (
                                <Input disabled placeholder={inp.placeholder} className="bg-muted/50 border-border/50 text-xs" />
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      {builderSystemPrompt && (
                        <div className="pt-2 border-t border-border/50">
                          <p className="text-xs text-muted-foreground font-medium mb-2">System Prompt ({builderSystemPrompt.length} chars)</p>
                          <pre className="text-[10px] bg-muted/50 p-3 rounded-lg overflow-y-auto max-h-40 whitespace-pre-wrap">{builderSystemPrompt.slice(0, 500)}{builderSystemPrompt.length > 500 ? "..." : ""}</pre>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Start filling in the skill details to see a preview here
                    </p>
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
