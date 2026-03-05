import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, ArrowLeft, ArrowRight, Save, Loader2, Search } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import KnowledgeDocPicker from "@/components/onboarding/KnowledgeDocPicker";
import CheckpointQuestionsEditor, { type CheckpointQuestion } from "@/components/onboarding/CheckpointQuestionsEditor";
import type { OnboardingPhase, PhaseConfig, SuccessProfileSkillItem } from "@/types/onboarding";

const PHASES: OnboardingPhase[] = ["immerse", "observe", "demonstrate"];
const PHASE_COLORS: Record<OnboardingPhase, string> = {
  immerse: "bg-blue-500/10 text-blue-700",
  observe: "bg-amber-500/10 text-amber-700",
  demonstrate: "bg-green-500/10 text-green-700",
};

type PhaseContentState = {
  phase: OnboardingPhase;
  assignedKbDocumentIds: string[];
  checkpointQuestions: CheckpointQuestion[];
};

type ProfileRow = {
  id: string;
  role_name: string;
  department: string;
  items: any;
  phase_configs: any;
};

export default function ProgramBuilder() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tenantId } = useTenant();
  const isEdit = !!id;

  const [step, setStep] = useState(isEdit ? 2 : 1);
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [selectedProfile, setSelectedProfile] = useState<ProfileRow | null>(null);
  const [programName, setProgramName] = useState("");
  const [enforceGating, setEnforceGating] = useState(false);
  const [phaseContent, setPhaseContent] = useState<PhaseContentState[]>(
    PHASES.map((p) => ({ phase: p, assignedKbDocumentIds: [], checkpointQuestions: [] }))
  );
  const [saving, setSaving] = useState(false);
  const [profileSearch, setProfileSearch] = useState("");
  const [openPhases, setOpenPhases] = useState<Record<string, boolean>>({
    immerse: true,
    observe: true,
    demonstrate: true,
  });

  // Fetch profiles for step 1
  const { data: profiles = [] } = useQuery({
    queryKey: ["success-profiles-for-program", tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      const { data, error } = await supabase
        .from("success_profiles")
        .select("id, role_name, department, items, phase_configs")
        .eq("tenant_id", tenantId)
        .eq("is_template", false)
        .order("role_name");
      if (error) throw error;
      return (data || []) as ProfileRow[];
    },
    enabled: !!tenantId && step === 1,
  });

  // Fetch KB doc titles for AI generation context
  const { data: allDocs = [] } = useQuery({
    queryKey: ["kb-docs-titles", tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      const { data } = await supabase
        .from("knowledge_documents")
        .select("id, title")
        .eq("tenant_id", tenantId)
        .eq("status", "ready");
      return data || [];
    },
    enabled: !!tenantId,
  });

  // Load existing program for edit
  useEffect(() => {
    if (!isEdit || !id || !tenantId) return;
    (async () => {
      const { data: program, error } = await supabase
        .from("onboarding_programs")
        .select("*, success_profiles(id, role_name, department, items, phase_configs)")
        .eq("id", id)
        .single();
      if (error || !program) {
        toast({ title: "Program not found", variant: "destructive" });
        navigate("/talent/onboarding/programs");
        return;
      }
      const profile = program.success_profiles as any;
      setSelectedProfileId(program.success_profile_id);
      setSelectedProfile(profile);
      setProgramName(program.name);
      setEnforceGating(program.enforce_checkpoint_gating);
      const pc = program.phase_content as any[];
      if (Array.isArray(pc)) {
        setPhaseContent(
          PHASES.map((p) => {
            const existing = pc.find((c: any) => c.phase === p);
            return {
              phase: p,
              assignedKbDocumentIds: existing?.assignedKbDocumentIds || [],
              checkpointQuestions: (existing?.checkpointQuestions || []).map((q: any) => ({
                id: q.id,
                question: q.question,
                passingThreshold: q.passingThreshold,
              })),
            };
          })
        );
      }
      setStep(2);
    })();
  }, [isEdit, id, tenantId]);

  const selectProfile = (profile: ProfileRow) => {
    setSelectedProfileId(profile.id);
    setSelectedProfile(profile);
    setProgramName(`${profile.role_name} Onboarding Program`);
    setStep(2);
  };

  const updatePhaseContent = (phase: OnboardingPhase, update: Partial<PhaseContentState>) => {
    setPhaseContent((prev) =>
      prev.map((p) => (p.phase === phase ? { ...p, ...update } : p))
    );
  };

  const getDocTitlesForPhase = (phase: OnboardingPhase) => {
    const pc = phaseContent.find((p) => p.phase === phase);
    return (pc?.assignedKbDocumentIds || [])
      .map((id) => allDocs.find((d) => d.id === id)?.title)
      .filter(Boolean) as string[];
  };

  const save = async () => {
    if (!tenantId || !selectedProfileId || !programName.trim()) return;
    setSaving(true);
    try {
      const payload = {
        tenant_id: tenantId,
        name: programName.trim(),
        success_profile_id: selectedProfileId,
        enforce_checkpoint_gating: enforceGating,
        phase_content: phaseContent,
      };

      if (isEdit && id) {
        const { error } = await supabase.from("onboarding_programs").update(payload).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("onboarding_programs").insert(payload);
        if (error) throw error;
      }
      toast({ title: isEdit ? "Program updated" : "Program created" });
      navigate("/talent/onboarding/programs");
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const phaseConfigs = (selectedProfile?.phase_configs || []) as PhaseConfig[];
  const filteredProfiles = profiles.filter((p) =>
    p.role_name.toLowerCase().includes(profileSearch.toLowerCase()) ||
    p.department.toLowerCase().includes(profileSearch.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/talent/onboarding/programs")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isEdit ? "Edit Program" : "New Onboarding Program"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {step === 1 && "Choose a Success Profile to base this program on."}
            {step === 2 && "Configure program details."}
            {step === 3 && "Set up phase content and checkpoint questions."}
          </p>
        </div>
      </div>

      {/* Step indicators */}
      <div className="flex gap-2">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded-full ${s <= step ? "bg-primary" : "bg-muted"}`}
          />
        ))}
      </div>

      {/* STEP 1: Select Profile */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search profiles..."
              value={profileSearch}
              onChange={(e) => setProfileSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          {filteredProfiles.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <p>No Success Profiles found. Create one first.</p>
                <Button className="mt-3" variant="outline" onClick={() => navigate("/talent/onboarding/profiles/new")}>
                  Create Profile
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredProfiles.map((profile) => {
                const items = (profile.items as any[]) || [];
                return (
                  <Card
                    key={profile.id}
                    className="cursor-pointer hover:border-primary transition-colors"
                    onClick={() => selectProfile(profile)}
                  >
                    <CardContent className="p-4">
                      <p className="font-semibold">{profile.role_name}</p>
                      <Badge variant="secondary" className="mt-1 text-xs">{profile.department}</Badge>
                      <p className="text-xs text-muted-foreground mt-2">{items.length} items</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* STEP 2: Program Details */}
      {step === 2 && (
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label>Program Name</Label>
                <Input value={programName} onChange={(e) => setProgramName(e.target.value)} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enforce Checkpoint Gating</Label>
                  <p className="text-xs text-muted-foreground">
                    Learners must meet passing thresholds before advancing phases.
                  </p>
                </div>
                <Switch checked={enforceGating} onCheckedChange={setEnforceGating} />
              </div>
              {selectedProfile && (
                <div className="pt-2 border-t">
                  <p className="text-sm text-muted-foreground">
                    Based on: <span className="font-medium text-foreground">{selectedProfile.role_name}</span> ({selectedProfile.department})
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
          <div className="flex justify-between">
            {!isEdit && (
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            )}
            <Button className="ml-auto" onClick={() => setStep(3)}>
              Next
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3: Phase Configuration */}
      {step === 3 && (
        <div className="space-y-4">
          {PHASES.map((phase) => {
            const cfg = phaseConfigs.find((c) => c.phase === phase);
            const pc = phaseContent.find((p) => p.phase === phase)!;
            const isOpen = openPhases[phase];

            return (
              <Collapsible
                key={phase}
                open={isOpen}
                onOpenChange={(o) => setOpenPhases((prev) => ({ ...prev, [phase]: o }))}
              >
                <Card>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer flex-row items-center justify-between py-3">
                      <div className="flex items-center gap-2">
                        {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        <Badge className={PHASE_COLORS[phase]}>
                          {phase.charAt(0).toUpperCase() + phase.slice(1)}
                        </Badge>
                        {cfg && (
                          <span className="text-xs text-muted-foreground">{cfg.durationDays} days</span>
                        )}
                      </div>
                      <div className="flex gap-2 text-xs text-muted-foreground">
                        <span>{pc.assignedKbDocumentIds.length} docs</span>
                        <span>{pc.checkpointQuestions.length} questions</span>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="space-y-6 pt-0">
                      {/* Objectives from profile */}
                      {cfg?.objectives && cfg.objectives.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">Phase Objectives (from Success Profile)</p>
                          <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                            {cfg.objectives.map((o, i) => (
                              <li key={i}>{o}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Knowledge Content */}
                      <div>
                        <p className="text-sm font-medium mb-2">Knowledge Content</p>
                        <KnowledgeDocPicker
                          selectedIds={pc.assignedKbDocumentIds}
                          onChange={(ids) => updatePhaseContent(phase, { assignedKbDocumentIds: ids })}
                        />
                      </div>

                      {/* Checkpoint Questions */}
                      <div>
                        <p className="text-sm font-medium mb-2">Checkpoint Questions</p>
                        <CheckpointQuestionsEditor
                          questions={pc.checkpointQuestions}
                          onChange={(q) => updatePhaseContent(phase, { checkpointQuestions: q })}
                          phase={phase}
                          objectives={cfg?.objectives || []}
                          documentTitles={getDocTitlesForPhase(phase)}
                        />
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            );
          })}

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={() => setStep(2)}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <Button onClick={save} disabled={saving || !programName.trim()}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              {isEdit ? "Update Program" : "Create Program"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
