import { useState, useEffect, useRef, useCallback } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { motion } from "framer-motion";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Search, Plus, Trash2, GripVertical, BookOpen, Wrench, Loader2, Check, Pencil, X, AlertTriangle, Sparkles, Send, Eye, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { agentDefinitions, departmentDefinitions, dbRowToSkill, type Department, type AgentType, type SkillInput, type Skill } from "@/data/mock-data";
import { useToast } from "@/hooks/use-toast";
import { useTenant } from "@/contexts/TenantContext";
import ReactMarkdown from "react-markdown";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

const inputTypes = [
  { value: "text", label: "Text" },
  { value: "textarea", label: "Text Area" },
  { value: "url", label: "URL" },
  { value: "select", label: "Dropdown" },
  { value: "radio", label: "Radio Group" },
  { value: "multi-select", label: "Multi-Select" },
  { value: "file", label: "File Upload" },
];

const AI_MODELS = [
  { id: "google/gemini-2.5-flash-lite", name: "Gemini Flash Lite", tier: "standard" as const, desc: "Simple tasks, classification", promptPer1M: 0.075, completionPer1M: 0.30 },
  { id: "google/gemini-2.5-flash", name: "Gemini Flash", tier: "standard" as const, desc: "Balanced speed/quality", promptPer1M: 0.15, completionPer1M: 0.60 },
  { id: "google/gemini-3-flash-preview", name: "Gemini 3 Flash", tier: "standard" as const, desc: "Good all-rounder (default)", promptPer1M: 0.15, completionPer1M: 0.60 },
  { id: "openai/gpt-5-nano", name: "GPT-5 Nano", tier: "standard" as const, desc: "Fast, cost-efficient", promptPer1M: 0.10, completionPer1M: 0.40 },
  { id: "openai/gpt-5-mini", name: "GPT-5 Mini", tier: "standard" as const, desc: "Strong balance", promptPer1M: 0.40, completionPer1M: 1.60 },
  { id: "google/gemini-2.5-pro", name: "Gemini Pro", tier: "premium" as const, desc: "Deep reasoning, complex analysis", promptPer1M: 1.25, completionPer1M: 10.00 },
  { id: "google/gemini-3-pro-preview", name: "Gemini 3 Pro", tier: "premium" as const, desc: "Next-gen deep reasoning", promptPer1M: 1.25, completionPer1M: 10.00 },
  { id: "openai/gpt-5", name: "GPT-5", tier: "premium" as const, desc: "Maximum accuracy", promptPer1M: 2.00, completionPer1M: 8.00 },
  { id: "openai/gpt-5.2", name: "GPT-5.2", tier: "premium" as const, desc: "Latest, complex problem-solving", promptPer1M: 2.50, completionPer1M: 10.00 },
];

const AGENT_DEFAULT_MODELS: Record<string, string> = {
  researcher: "google/gemini-2.5-pro",
  strategist: "google/gemini-3-flash-preview",
  content: "google/gemini-3-flash-preview",
  coach: "google/gemini-3-flash-preview",
};

interface OpenRouterModel {
  id: string;
  name: string;
  promptPrice?: string | null;
  completionPrice?: string | null;
  contextLength?: number | null;
}

const estimateCostForModel = (modelId: string, tokenBudget: number, orModels: OpenRouterModel[]): number | null => {
  const promptTokens = Math.round(tokenBudget * 0.6);
  const completionTokens = Math.round(tokenBudget * 0.4);
  const builtIn = AI_MODELS.find(m => m.id === modelId);
  if (builtIn) return (promptTokens * builtIn.promptPer1M + completionTokens * builtIn.completionPer1M) / 1_000_000;
  const orModel = orModels.find(m => m.id === modelId);
  if (orModel?.promptPrice && orModel?.completionPrice) return parseFloat(orModel.promptPrice) * promptTokens + parseFloat(orModel.completionPrice) * completionTokens;
  return null;
};

const LEGACY_MODEL_IDS = new Set(["haiku", "sonnet", "opus", "claude", "simple_haiku", "gpt-4", "gpt-4o"]);
const isLegacyModel = (modelId: string) => LEGACY_MODEL_IDS.has(modelId.toLowerCase());
const isKnownModel = (modelId: string) => AI_MODELS.some(m => m.id === modelId);
const isPremiumModel = (modelId: string) => AI_MODELS.find(m => m.id === modelId)?.tier === "premium";
const isOpenRouterModel = (modelId: string) => !isKnownModel(modelId) && !isLegacyModel(modelId) && modelId.includes("/");
const getModelName = (modelId: string) => AI_MODELS.find(m => m.id === modelId)?.name || modelId;

const resolveModelId = (skill: Skill) => {
  const raw = skill.preferredModel;
  if (!raw || isLegacyModel(raw)) return AGENT_DEFAULT_MODELS[skill.agentType] || "google/gemini-3-flash-preview";
  return raw;
};

function SectionHeader({ title, step, isOpen }: { title: string; step: number; isOpen: boolean }) {
  return (
    <div className="flex items-center gap-3 w-full py-1">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0 ${isOpen ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
        {step}
      </div>
      <span className="text-sm font-semibold flex-1 text-left">{title}</span>
      <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
    </div>
  );
}

function SortableSkillCard({ skill, feedbackStats, openrouterModels, onEdit }: {
  skill: Skill;
  feedbackStats: Record<string, { total: number; positive: number }>;
  openrouterModels: OpenRouterModel[];
  onEdit?: (skill: Skill) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: skill.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1, zIndex: isDragging ? 10 : undefined };
  const agent = agentDefinitions.find((a) => a.type === skill.agentType);
  const dept = departmentDefinitions[skill.department];
  const modelId = resolveModelId(skill);
  const isOR = isOpenRouterModel(modelId);
  const dynamicCost = estimateCostForModel(modelId, skill.tokenBudget || 10000, openrouterModels);

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card
        className={`glass-card hover:border-primary/30 transition-all group ${isDragging ? "cursor-grabbing ring-2 ring-primary/30" : onEdit ? "cursor-grab" : "cursor-default"}`}
        onClick={() => { if (!isDragging && onEdit) onEdit(skill); }}
      >
        <CardContent className="p-5 space-y-3">
          <div className="flex items-start justify-between">
            <span className="text-2xl">{skill.emoji}</span>
            <div className="flex gap-1.5 items-center">
              <GripVertical className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-50 transition-opacity" />
              <Badge variant="outline" className="text-[10px]">{dept?.name}</Badge>
              <Badge variant="outline" className="text-[10px]">{agent?.name}</Badge>
              <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold">{skill.displayName || skill.name}</h3>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{skill.description}</p>
            {feedbackStats[skill.id]?.total >= 5 && (
              <p className="text-[10px] text-muted-foreground mt-1">
                ⭐ {Math.round((feedbackStats[skill.id].positive / feedbackStats[skill.id].total) * 100)}% positive ({feedbackStats[skill.id].total} ratings)
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <span>{skill.inputs.length} inputs</span>
            <span>·</span>
            <span>{skill.inputs.filter((i) => i.required).length} required</span>
            {dynamicCost !== null && (
              <>
                <span>·</span>
                <span>~${dynamicCost < 0.01 ? "<0.01" : dynamicCost.toFixed(2)}</span>
              </>
            )}
            <span>·</span>
            <span className={isOR ? "text-blue-400" : isPremiumModel(modelId) ? "text-primary" : ""}>
              {isOR ? `🔗 ${modelId}` : getModelName(modelId)}
            </span>
            {skill.isSystem && <Badge variant="outline" className="text-[10px] ml-auto">System</Badge>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Capabilities() {
  const { toast } = useToast();
  const { tenantId, isAdmin } = useTenant();
  const [activeTab, setActiveTab] = useState("library");
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState<string>("all");
  const [agentFilter, setAgentFilter] = useState<string>("all");
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [feedbackStats, setFeedbackStats] = useState<Record<string, { total: number; positive: number }>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingSkillId, setEditingSkillId] = useState<string | null>(null);

  const [openrouterEnabled, setOpenrouterEnabled] = useState(false);
  const [openrouterModels, setOpenrouterModels] = useState<OpenRouterModel[]>([]);

  // Builder state
  const [builderName, setBuilderName] = useState("");
  const [builderDisplayName, setBuilderDisplayName] = useState("");
  const [builderDesc, setBuilderDesc] = useState("");
  const [builderEmoji, setBuilderEmoji] = useState("⚡");
  const [builderDept, setBuilderDept] = useState<Department | "">("");
  const [builderAgent, setBuilderAgent] = useState<AgentType | "">("");
  const [builderPreferredModel, setBuilderPreferredModel] = useState("google/gemini-3-flash-preview");
  const [builderInputs, setBuilderInputs] = useState<Partial<SkillInput>[]>([]);
  const [builderSystemPrompt, setBuilderSystemPrompt] = useState("");
  const [builderWebSearch, setBuilderWebSearch] = useState(false);
  const [builderSchedulable, setBuilderSchedulable] = useState(false);

  // Collapsible sections
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ identity: true });
  const toggleSection = (key: string) => setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));

  // Build with Alex state
  const [builderMode, setBuilderMode] = useState<"manual" | "alex">("manual");
  const [alexMessages, setAlexMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [alexInput, setAlexInput] = useState("");
  const [alexLoading, setAlexLoading] = useState(false);
  const alexScrollRef = useRef<HTMLDivElement>(null);
  const alexInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (alexScrollRef.current) alexScrollRef.current.scrollTop = alexScrollRef.current.scrollHeight;
  }, [alexMessages]);

  const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/alex-chat`;

  const parseSkillUpdates = (content: string) => {
    const updates: { field: string; value: any; raw: string }[] = [];
    const regex = /```skill-update\s*\n([\s\S]*?)```/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
      try {
        const parsed = JSON.parse(match[1].trim());
        if (parsed.field && parsed.value !== undefined) {
          updates.push({ field: parsed.field, value: parsed.value, raw: match[0] });
        }
      } catch { /* skip invalid JSON */ }
    }
    return updates;
  };

  const applySkillUpdate = (field: string, value: any) => {
    switch (field) {
      case "systemPrompt":
        setBuilderSystemPrompt(value);
        setOpenSections(prev => ({ ...prev, prompt: true }));
        toast({ title: "System prompt applied" });
        break;
      case "description": setBuilderDesc(value); toast({ title: "Description applied" }); break;
      case "name": setBuilderName(value); toast({ title: "Name applied" }); break;
      case "displayName": setBuilderDisplayName(value); toast({ title: "Display name applied" }); break;
      case "emoji": setBuilderEmoji(value); toast({ title: "Emoji applied" }); break;
      case "inputs":
        if (Array.isArray(value)) {
          setBuilderInputs(value.map((inp: any) => ({
            label: inp.label || "",
            type: inp.type || "text",
            placeholder: inp.placeholder || "",
            hint: inp.hint || "",
            required: inp.required ?? false,
            options: inp.options || [],
          })));
          setOpenSections(prev => ({ ...prev, inputs: true }));
          toast({ title: `${value.length} input fields applied` });
        }
        break;
      default: toast({ title: `Unknown field: ${field}`, variant: "destructive" });
    }
  };

  const sendAlexMessage = async () => {
    const text = alexInput.trim();
    if (!text || alexLoading) return;
    const userMsg = { role: "user" as const, content: text };
    setAlexInput("");
    setAlexMessages(prev => [...prev, userMsg]);
    setAlexLoading(true);

    const allMessages = [...alexMessages, userMsg];
    const builderState = {
      name: builderName, displayName: builderDisplayName, description: builderDesc,
      department: builderDept, agentType: builderAgent, inputs: builderInputs,
      systemPrompt: builderSystemPrompt, preferredModel: builderPreferredModel,
    };

    let assistantSoFar = "";
    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ messages: allMessages, mode: "skill-builder", builderState }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Request failed" }));
        setAlexMessages(prev => [...prev, { role: "assistant", content: `Error: ${err.error || "Something went wrong."}` }]);
        setAlexLoading(false);
        return;
      }

      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let newlineIdx: number;
        while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIdx);
          buffer = buffer.slice(newlineIdx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            if (parsed.content) {
              assistantSoFar += parsed.content;
              setAlexMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
                return [...prev, { role: "assistant", content: assistantSoFar }];
              });
            }
          } catch { buffer = line + "\n" + buffer; break; }
        }
      }
    } catch {
      setAlexMessages(prev => [...prev, { role: "assistant", content: "Connection error. Please try again." }]);
    }
    setAlexLoading(false);
  };

  const fetchSkills = async () => {
    setLoading(true);
    const { data } = await supabase.from("skills").select("*").order("department").order("agent_type").order("name");
    if (data) {
      const skills = data.map(dbRowToSkill);
      setAllSkills(skills);
      // Fetch feedback stats
      const skillIds = skills.map(s => s.id);
      if (skillIds.length > 0) {
        const { data: jobs } = await supabase
          .from("agent_jobs")
          .select("skill_id, feedback_rating")
          .in("skill_id", skillIds)
          .not("feedback_rating", "is", null);
        if (jobs) {
          const stats: Record<string, { total: number; positive: number }> = {};
          for (const j of jobs) {
            if (!stats[j.skill_id]) stats[j.skill_id] = { total: 0, positive: 0 };
            stats[j.skill_id].total++;
            if (j.feedback_rating === 1) stats[j.skill_id].positive++;
          }
          setFeedbackStats(stats);
        }
      }
    }
    setLoading(false);
  };

  useEffect(() => { fetchSkills(); }, []);

  useEffect(() => {
    async function fetchOpenRouterSettings() {
      const { data } = await supabase.from("workspace_settings").select("key, value").in("key", ["openrouter_enabled", "openrouter_models"]);
      if (data) {
        for (const row of data) {
          if (row.key === "openrouter_enabled") setOpenrouterEnabled(row.value === true);
          if (row.key === "openrouter_models" && Array.isArray(row.value)) setOpenrouterModels(row.value as unknown as OpenRouterModel[]);
        }
      }
    }
    fetchOpenRouterSettings();
  }, []);

  const [skillOrder, setSkillOrder] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("apex-skill-order") || "[]"); }
    catch { return []; }
  });

  const filtered = allSkills.filter((s) => {
    if (deptFilter !== "all" && s.department !== deptFilter) return false;
    if (agentFilter !== "all" && s.agentType !== agentFilter) return false;
    if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !(s.displayName || "").toLowerCase().includes(search.toLowerCase()) && !(s.description || "").toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const orderedSkills = [...filtered].sort((a, b) => {
    const ai = skillOrder.indexOf(a.id), bi = skillOrder.indexOf(b.id);
    if (ai === -1 && bi === -1) return 0;
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = orderedSkills.findIndex(s => s.id === active.id);
    const newIndex = orderedSkills.findIndex(s => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(orderedSkills, oldIndex, newIndex);
    const ids = reordered.map(s => s.id);
    setSkillOrder(ids);
    localStorage.setItem("apex-skill-order", JSON.stringify(ids));
  }, [orderedSkills]);

  const resetBuilder = () => {
    setEditingSkillId(null);
    setBuilderName(""); setBuilderDisplayName(""); setBuilderDesc(""); setBuilderEmoji("⚡");
    setBuilderDept(""); setBuilderAgent(""); setBuilderPreferredModel("google/gemini-3-flash-preview");
    setBuilderInputs([]);
    setBuilderSystemPrompt("");
    setBuilderWebSearch(false); setBuilderSchedulable(false);
    setOpenSections({ identity: true });
    setBuilderMode("manual");
    setAlexMessages([]);
    setAlexInput("");
  };

  const loadSkillIntoBuilder = (skill: Skill) => {
    setEditingSkillId(skill.id);
    setBuilderName(skill.name);
    setBuilderDisplayName(skill.displayName || skill.name);
    setBuilderDesc(skill.description);
    setBuilderEmoji(skill.emoji);
    setBuilderDept(skill.department);
    setBuilderAgent(skill.agentType);
    setBuilderPreferredModel(resolveModelId(skill));
    setBuilderInputs(skill.inputs.map(inp => ({ ...inp })));
    setBuilderSystemPrompt(skill.systemPrompt || "");
    setBuilderWebSearch(skill.webSearchEnabled || false);
    setBuilderSchedulable((skill as any).schedulable || false);
    setOpenSections({ identity: true, routing: true, inputs: true, prompt: true, behavior: true });
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

    const skillData = {
      name: builderName,
      display_name: builderDisplayName || builderName,
      description: builderDesc,
      department: builderDept,
      agent_type: builderAgent,
      emoji: builderEmoji,
      system_prompt: builderSystemPrompt,
      prompt_template: "",
      inputs,
      preferred_model: builderPreferredModel,
      estimated_cost_usd: estimateCostForModel(builderPreferredModel, 10000, openrouterModels),
      web_search_enabled: builderWebSearch,
      is_system: false,
      schedulable: builderSchedulable,
      tenant_id: tenantId!,
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
            {isAdmin && <TabsTrigger value="builder" className="gap-1.5"><Wrench className="h-3.5 w-3.5" /> Skill Builder</TabsTrigger>}
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
              {isAdmin && (
                <Button variant="outline" size="sm" className="gap-1.5 ml-auto" onClick={() => { resetBuilder(); setActiveTab("builder"); }}>
                  <Plus className="h-3.5 w-3.5" /> New Skill
                </Button>
              )}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={orderedSkills.map(s => s.id)} strategy={rectSortingStrategy}>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {orderedSkills.map((skill) => (
                      <SortableSkillCard
                        key={skill.id}
                        skill={skill}
                        feedbackStats={feedbackStats}
                        openrouterModels={openrouterModels}
                        onEdit={isAdmin ? loadSkillIntoBuilder : undefined}
                      />
                    ))}
                    {orderedSkills.length === 0 && (
                      <div className="col-span-full text-center text-muted-foreground py-12">No skills match your filters</div>
                    )}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </TabsContent>

          {/* ── Skill Builder (Collapsible Sections) ── */}
          <TabsContent value="builder" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{editingSkillId ? "Edit Skill" : "Create a New Skill"}</h2>
              <div className="flex gap-2 items-center">
                <Button
                  variant={builderMode === "alex" ? "default" : "outline"}
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={() => {
                    setBuilderMode(m => m === "alex" ? "manual" : "alex");
                    if (builderMode === "manual") setTimeout(() => alexInputRef.current?.focus(), 100);
                  }}
                >
                  {builderMode === "alex" ? <Eye className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
                  {builderMode === "alex" ? "Preview" : "Build with Alex"}
                </Button>
                {editingSkillId && (
                  <>
                    <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={resetBuilder}>
                      <X className="h-3 w-3" /> Cancel
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="gap-1 text-xs text-destructive">
                          <Trash2 className="h-3 w-3" /> Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete this skill?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. The skill and its configuration will be permanently removed.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => { deleteSkill(editingSkillId); resetBuilder(); }}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left: Scrollable form with collapsible sections */}
              <div className="space-y-3">
                {/* Section 1: Identity */}
                <Collapsible open={openSections.identity} onOpenChange={() => toggleSection("identity")}>
                  <Card className="glass-card">
                    <CollapsibleTrigger asChild>
                      <button className="w-full px-5 py-3 text-left hover:bg-muted/30 transition-colors rounded-t-lg">
                        <SectionHeader title="Identity" step={1} isOpen={!!openSections.identity} />
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="px-5 pb-5 pt-0 space-y-4">
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
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>

                {/* Section 2: Routing */}
                <Collapsible open={openSections.routing} onOpenChange={() => toggleSection("routing")}>
                  <Card className="glass-card">
                    <CollapsibleTrigger asChild>
                      <button className="w-full px-5 py-3 text-left hover:bg-muted/30 transition-colors rounded-t-lg">
                        <SectionHeader title="Routing" step={2} isOpen={!!openSections.routing} />
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="px-5 pb-5 pt-0 space-y-4">
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
                            <Select value={builderAgent} onValueChange={(v) => {
                              const agent = v as AgentType;
                              setBuilderAgent(agent);
                              const defaultModel = AGENT_DEFAULT_MODELS[agent] || "google/gemini-3-flash-preview";
                              setBuilderPreferredModel(defaultModel);
                            }}>
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
                          <Label>Preferred Model</Label>
                          <Select value={builderPreferredModel} onValueChange={setBuilderPreferredModel}>
                            <SelectTrigger className="bg-muted/50 border-border/50"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                <SelectLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">Standard</SelectLabel>
                                {AI_MODELS.filter(m => m.tier === "standard").map(m => {
                                  const c = (6000 * m.promptPer1M + 4000 * m.completionPer1M) / 1_000_000;
                                  return (
                                    <SelectItem key={m.id} value={m.id}>
                                      <span className="flex items-center gap-2">{m.name} <span className="text-[10px] text-muted-foreground">— ~${c < 0.01 ? "<0.01" : c.toFixed(3)}/run</span></span>
                                    </SelectItem>
                                  );
                                })}
                              </SelectGroup>
                              <SelectSeparator />
                              <SelectGroup>
                                <SelectLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">Premium</SelectLabel>
                                {AI_MODELS.filter(m => m.tier === "premium").map(m => {
                                  const c = (6000 * m.promptPer1M + 4000 * m.completionPer1M) / 1_000_000;
                                  return (
                                    <SelectItem key={m.id} value={m.id}>
                                      <span className="flex items-center gap-2">{m.name} <span className="text-[10px] text-muted-foreground">— ~${c < 0.01 ? "<0.01" : c.toFixed(3)}/run</span></span>
                                    </SelectItem>
                                  );
                                })}
                              </SelectGroup>
                              {openrouterEnabled && openrouterModels.length > 0 && (
                                <>
                                  <SelectSeparator />
                                  <SelectGroup>
                                    <SelectLabel className="text-[10px] uppercase tracking-wider text-blue-400">🔗 OpenRouter</SelectLabel>
                                    {openrouterModels.map(m => (
                                      <SelectItem key={m.id} value={m.id}>
                                        <span className="flex items-center gap-2">
                                          {m.name}
                                          <span className="text-[10px] text-blue-400">OpenRouter</span>
                                        </span>
                                      </SelectItem>
                                    ))}
                                  </SelectGroup>
                                </>
                              )}
                            </SelectContent>
                          </Select>
                          {isPremiumModel(builderPreferredModel) && (
                            <div className="flex items-center gap-1.5 text-xs text-amber-500">
                              <AlertTriangle className="h-3 w-3" />
                              <span>Premium model — significantly higher cost per run</span>
                            </div>
                          )}
                          {isOpenRouterModel(builderPreferredModel) && (
                            <div className="flex items-center gap-1.5 text-xs text-blue-400">
                              <span>🔗</span>
                              <span>OpenRouter model — uses your OpenRouter API key and credits</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>

                {/* Section 3: Inputs */}
                <Collapsible open={openSections.inputs} onOpenChange={() => toggleSection("inputs")}>
                  <Card className="glass-card">
                    <CollapsibleTrigger asChild>
                      <button className="w-full px-5 py-3 text-left hover:bg-muted/30 transition-colors rounded-t-lg">
                        <SectionHeader title={`Inputs (${builderInputs.length})`} step={3} isOpen={!!openSections.inputs} />
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="px-5 pb-5 pt-0 space-y-3">
                        <div className="flex items-center justify-end">
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
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>

                {/* Section 4: System Prompt */}
                <Collapsible open={openSections.prompt} onOpenChange={() => toggleSection("prompt")}>
                  <Card className="glass-card">
                    <CollapsibleTrigger asChild>
                      <button className="w-full px-5 py-3 text-left hover:bg-muted/30 transition-colors rounded-t-lg">
                        <SectionHeader title={`System Prompt${builderSystemPrompt ? ` (${builderSystemPrompt.length} chars)` : ""}`} step={4} isOpen={!!openSections.prompt} />
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="px-5 pb-5 pt-0 space-y-2">
                        <p className="text-xs text-muted-foreground">The core instructions that power this skill's AI behavior. Use markdown formatting.</p>
                        <Textarea
                          value={builderSystemPrompt}
                          onChange={(e) => setBuilderSystemPrompt(e.target.value)}
                          placeholder="You are an expert..."
                          rows={16}
                          className="bg-muted/50 border-border/50 resize-none font-mono text-xs"
                        />
                        {builderInputs.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-2">
                            <span className="text-[10px] text-muted-foreground mr-1">Insert variable:</span>
                            {builderInputs.map((inp, idx) => {
                              const fieldName = (inp.name || inp.label || "").toLowerCase().replace(/\s+/g, "_");
                              if (!fieldName) return null;
                              return (
                                <Button key={idx} variant="outline" size="sm" className="h-5 text-[10px] px-1.5" onClick={() => setBuilderSystemPrompt(prev => prev + `{{${fieldName}}}`)}>{`{{${fieldName}}}`}</Button>
                              );
                            })}
                          </div>
                        )}
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>

                {/* Section 5: Behavior & Save */}
                <Collapsible open={openSections.behavior} onOpenChange={() => toggleSection("behavior")}>
                  <Card className="glass-card">
                    <CollapsibleTrigger asChild>
                      <button className="w-full px-5 py-3 text-left hover:bg-muted/30 transition-colors rounded-t-lg">
                        <SectionHeader title="Behavior & Options" step={5} isOpen={!!openSections.behavior} />
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="px-5 pb-5 pt-0 space-y-4">
                        {(() => {
                          const autoCost = estimateCostForModel(builderPreferredModel, 10000, openrouterModels);
                          return (
                            <div className="space-y-2">
                              <Label>Est. Cost per Run (USD)</Label>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-mono bg-muted/50 border border-border/50 rounded-md px-3 py-2">
                                  {autoCost !== null ? (autoCost < 0.01 ? "< $0.01" : `~$${autoCost.toFixed(3)}`) : "—"}
                                </span>
                                <span className="text-[10px] text-muted-foreground">based on {getModelName(builderPreferredModel)} · 10K token budget</span>
                              </div>
                            </div>
                          );
                        })()}
                        <div className="space-y-3">
                          <div className="flex items-center gap-1.5">
                            <Switch checked={builderWebSearch} onCheckedChange={setBuilderWebSearch} />
                            <span className="text-xs text-muted-foreground">Enable Web Search</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Switch checked={builderSchedulable} onCheckedChange={setBuilderSchedulable} />
                            <span className="text-xs text-muted-foreground">Schedulable (can be automated via Tasks)</span>
                          </div>
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>

                {/* Save button */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button variant="ghost" size="sm" onClick={() => { resetBuilder(); setActiveTab("library"); }}>Cancel</Button>
                  <Button size="sm" disabled={saving || !builderName || !builderDept || !builderAgent} onClick={saveSkill} className="gap-1.5">
                    {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                    {editingSkillId ? "Update Skill" : "Save Skill"}
                  </Button>
                </div>
              </div>

              {/* Right Panel: Preview or Alex Chat */}
              {builderMode === "alex" ? (
                <Card className="glass-card flex flex-col sticky top-6" style={{ minHeight: 480, maxHeight: "calc(100vh - 200px)" }}>
                  <CardHeader className="shrink-0 pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <CardTitle className="text-lg">Build with Alex</CardTitle>
                      </div>
                      {alexMessages.length > 0 && (
                        <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setAlexMessages([])}>Clear</Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">Describe your skill idea and Alex will generate prompts and configurations</p>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
                    <div ref={alexScrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                      {alexMessages.length === 0 && (
                        <div className="text-center py-8">
                          <Sparkles className="h-8 w-8 mx-auto mb-3 text-primary/50" />
                          <p className="text-sm font-medium text-foreground">Ready to build</p>
                          <p className="text-xs text-muted-foreground mt-1 max-w-[260px] mx-auto">
                            Describe your skill idea and I'll generate a complete system prompt and configuration for you.
                          </p>
                        </div>
                      )}
                      {alexMessages.map((msg, i) => {
                        const updates = msg.role === "assistant" ? parseSkillUpdates(msg.content) : [];
                        const cleanContent = msg.role === "assistant"
                          ? msg.content.replace(/```skill-update\s*\n[\s\S]*?```/g, "").trim()
                          : msg.content;
                        return (
                          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[90%] rounded-lg px-3 py-2 text-sm ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                              {msg.role === "assistant" ? (
                                <div className="space-y-2">
                                  <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&>p]:my-1.5 [&>ul]:my-1.5 [&>ol]:my-1.5">
                                    <ReactMarkdown>{cleanContent}</ReactMarkdown>
                                  </div>
                                  {updates.length > 0 && (
                                    <div className="space-y-1.5 pt-2 border-t border-border/50">
                                      {updates.map((u, ui) => (
                                        <Button
                                          key={ui}
                                          variant="outline"
                                          size="sm"
                                          className="w-full justify-start gap-2 text-xs h-8"
                                          onClick={() => applySkillUpdate(u.field, u.value)}
                                        >
                                          <Check className="h-3 w-3 text-primary" />
                                          Apply {u.field === "systemPrompt" ? "System Prompt" : u.field === "displayName" ? "Display Name" : u.field}
                                          {u.field === "systemPrompt" && <span className="text-muted-foreground ml-auto">{String(u.value).length} chars</span>}
                                          {u.field === "inputs" && Array.isArray(u.value) && <span className="text-muted-foreground ml-auto">{u.value.length} fields</span>}
                                        </Button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ) : cleanContent}
                            </div>
                          </div>
                        );
                      })}
                      {alexLoading && alexMessages[alexMessages.length - 1]?.role !== "assistant" && (
                        <div className="flex justify-start">
                          <div className="bg-muted rounded-lg px-3 py-2">
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="border-t border-border p-3 shrink-0">
                      <form onSubmit={(e) => { e.preventDefault(); sendAlexMessage(); }} className="flex gap-2">
                        <input
                          ref={alexInputRef}
                          value={alexInput}
                          onChange={(e) => setAlexInput(e.target.value)}
                          placeholder="Describe your skill idea..."
                          className="flex-1 text-sm bg-muted rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground"
                          disabled={alexLoading}
                        />
                        <Button type="submit" size="icon" className="h-9 w-9 shrink-0" disabled={alexLoading || !alexInput.trim()}>
                          <Send className="h-4 w-4" />
                        </Button>
                      </form>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="glass-card sticky top-6">
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
              )}
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}
