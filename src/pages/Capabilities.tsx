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
import { Search, Plus, Trash2, GripVertical, BookOpen, Wrench, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { skills as systemSkills, agentDefinitions, departmentDefinitions, type Department, type AgentType, type SkillInput, type Skill } from "@/data/mock-data";
import { useToast } from "@/hooks/use-toast";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

const inputTypes = [
  { value: "text", label: "Text" },
  { value: "textarea", label: "Text Area" },
  { value: "select", label: "Dropdown" },
  { value: "radio", label: "Radio Group" },
  { value: "multi-select", label: "Multi-Select" },
];

export default function Capabilities() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState<string>("all");
  const [agentFilter, setAgentFilter] = useState<string>("all");
  const [dbSkills, setDbSkills] = useState<Skill[]>([]);
  const [saving, setSaving] = useState(false);

  // Skill Builder state
  const [builderName, setBuilderName] = useState("");
  const [builderDesc, setBuilderDesc] = useState("");
  const [builderEmoji, setBuilderEmoji] = useState("⚡");
  const [builderDept, setBuilderDept] = useState<Department | "">("");
  const [builderAgent, setBuilderAgent] = useState<AgentType | "">("");
  const [builderInputs, setBuilderInputs] = useState<Partial<SkillInput>[]>([]);
  const [builderPrompt, setBuilderPrompt] = useState("");

  const fetchDbSkills = async () => {
    const { data } = await supabase.from("skills").select("*").eq("is_system", false);
    if (data) {
      setDbSkills(data.map((s: any) => ({
        id: s.id,
        name: s.name,
        description: s.description || "",
        department: s.department as Department,
        agentType: s.agent_type as AgentType,
        emoji: s.emoji || "⚡",
        inputs: (s.inputs as SkillInput[]) || [],
        promptTemplate: s.prompt_template || "",
      })));
    }
  };

  useEffect(() => { fetchDbSkills(); }, []);

  const allSkills = [...systemSkills, ...dbSkills];

  const filtered = allSkills.filter((s) => {
    if (deptFilter !== "all" && s.department !== deptFilter) return false;
    if (agentFilter !== "all" && s.agentType !== agentFilter) return false;
    if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.description.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

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
      name: (inp.label || "").toLowerCase().replace(/\s+/g, "_"),
      label: inp.label || "",
      type: inp.type || "text",
      required: inp.required || false,
      placeholder: inp.placeholder || "",
      options: inp.options || [],
    }));

    const { error } = await supabase.from("skills").insert({
      name: builderName,
      description: builderDesc,
      department: builderDept,
      agent_type: builderAgent,
      emoji: builderEmoji,
      inputs,
      prompt_template: builderPrompt,
      is_system: false,
    });

    setSaving(false);
    if (error) {
      toast({ title: "Error saving skill", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Skill saved!" });
      setBuilderName("");
      setBuilderDesc("");
      setBuilderEmoji("⚡");
      setBuilderDept("");
      setBuilderAgent("");
      setBuilderInputs([]);
      setBuilderPrompt("");
      fetchDbSkills();
    }
  };

  const deleteSkill = async (id: string) => {
    await supabase.from("skills").delete().eq("id", id);
    fetchDbSkills();
    toast({ title: "Skill deleted" });
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-7xl">
      <motion.div variants={item}>
        <h1 className="text-3xl font-bold tracking-tight">Capabilities</h1>
        <p className="text-muted-foreground mt-1">Browse, search, and create skills that power your agents</p>
      </motion.div>

      <motion.div variants={item}>
        <Tabs defaultValue="library" className="space-y-6">
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((skill) => {
                const agent = agentDefinitions.find((a) => a.type === skill.agentType);
                const dept = departmentDefinitions[skill.department];
                const isUserSkill = dbSkills.some((s) => s.id === skill.id);
                return (
                  <Card key={skill.id} className="glass-card">
                    <CardContent className="p-5 space-y-3">
                      <div className="flex items-start justify-between">
                        <span className="text-2xl">{skill.emoji}</span>
                        <div className="flex gap-1.5 items-center">
                          <Badge variant="outline" className="text-[10px]">{dept?.name}</Badge>
                          <Badge variant="outline" className="text-[10px]">{agent?.name}</Badge>
                          {isUserSkill && (
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteSkill(skill.id)}>
                              <Trash2 className="h-3 w-3 text-muted-foreground" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold">{skill.name}</h3>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{skill.description}</p>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span>{skill.inputs.length} inputs</span>
                        <span>·</span>
                        <span>{skill.inputs.filter((i) => i.required).length} required</span>
                        {isUserSkill && <Badge variant="outline" className="text-[10px] ml-auto">Custom</Badge>}
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
          </TabsContent>

          {/* ── Skill Builder ── */}
          <TabsContent value="builder" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Builder form */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-lg">Create a New Skill</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-[60px_1fr] gap-3">
                    <div className="space-y-2">
                      <Label>Emoji</Label>
                      <Input value={builderEmoji} onChange={(e) => setBuilderEmoji(e.target.value)} className="bg-muted/50 border-border/50 text-center text-lg" maxLength={2} />
                    </div>
                    <div className="space-y-2">
                      <Label>Skill Name</Label>
                      <Input value={builderName} onChange={(e) => setBuilderName(e.target.value)} placeholder="e.g. Competitive Analysis" className="bg-muted/50 border-border/50" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea value={builderDesc} onChange={(e) => setBuilderDesc(e.target.value)} placeholder="What does this skill do?" rows={2} className="bg-muted/50 border-border/50 resize-none" />
                  </div>
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

                  {/* Input fields builder */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Input Fields</Label>
                      <Button variant="outline" size="sm" onClick={addInput} className="h-7 text-xs gap-1">
                        <Plus className="h-3 w-3" /> Add Field
                      </Button>
                    </div>
                    {builderInputs.map((inp, idx) => (
                      <div key={idx} className="flex items-start gap-2 p-3 rounded-lg bg-muted/30">
                        <GripVertical className="h-4 w-4 text-muted-foreground mt-2 shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <Input placeholder="Field name" value={inp.label || ""} onChange={(e) => updateInput(idx, "label", e.target.value)} className="bg-muted/50 border-border/50 h-8 text-xs" />
                            <Select value={inp.type || "text"} onValueChange={(v) => updateInput(idx, "type", v)}>
                              <SelectTrigger className="bg-muted/50 border-border/50 h-8 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {inputTypes.map((t) => (
                                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex items-center gap-3">
                            <Input placeholder="Placeholder text" value={inp.placeholder || ""} onChange={(e) => updateInput(idx, "placeholder", e.target.value)} className="bg-muted/50 border-border/50 h-8 text-xs flex-1" />
                            <div className="flex items-center gap-1.5">
                              <Switch checked={inp.required || false} onCheckedChange={(v) => updateInput(idx, "required", v)} />
                              <span className="text-[10px] text-muted-foreground">Required</span>
                            </div>
                          </div>
                          {(inp.type === "select" || inp.type === "radio" || inp.type === "multi-select") && (
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

                  <div className="space-y-2">
                    <Label>Prompt Template</Label>
                    <Textarea
                      value={builderPrompt}
                      onChange={(e) => setBuilderPrompt(e.target.value)}
                      placeholder={"Use {{field_name}} to reference inputs.\n\nExample: Research {{company_name}} in the {{industry}} industry..."}
                      rows={6}
                      className="bg-muted/50 border-border/50 resize-none font-mono text-xs"
                    />
                  </div>

                  <Button className="w-full" disabled={!builderName || !builderDept || !builderAgent || saving} onClick={saveSkill}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    {saving ? "Saving..." : "Save Skill"}
                  </Button>
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
                          <h3 className="font-semibold">{builderName}</h3>
                          {builderDesc && <p className="text-sm text-muted-foreground mt-0.5">{builderDesc}</p>}
                        </div>
                      </div>
                      <div className="flex gap-1.5">
                        {builderDept && <Badge variant="outline" className="text-[10px]">{departmentDefinitions[builderDept as Department]?.name}</Badge>}
                        {builderAgent && <Badge variant="outline" className="text-[10px]">{agentDefinitions.find((a) => a.type === builderAgent)?.name}</Badge>}
                      </div>
                      {builderInputs.length > 0 && (
                        <div className="space-y-3 pt-2 border-t border-border/50">
                          <p className="text-xs text-muted-foreground font-medium">Form Preview</p>
                          {builderInputs.map((inp, idx) => (
                            <div key={idx} className="space-y-1">
                              <Label className="text-xs">
                                {inp.label || `Field ${idx + 1}`}
                                {inp.required && <span className="text-destructive ml-1">*</span>}
                              </Label>
                              {inp.type === "textarea" ? (
                                <Textarea disabled placeholder={inp.placeholder} rows={2} className="bg-muted/50 border-border/50 resize-none text-xs" />
                              ) : inp.type === "select" ? (
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
                      {builderPrompt && (
                        <div className="pt-2 border-t border-border/50">
                          <p className="text-xs text-muted-foreground font-medium mb-2">Prompt Template</p>
                          <pre className="text-xs bg-muted/50 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap">{builderPrompt}</pre>
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
