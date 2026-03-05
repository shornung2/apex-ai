import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import type { SuccessProfileSkillItem, PhaseConfig } from "@/types/onboarding";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Save, Loader2, Sparkles, ArrowLeft } from "lucide-react";
import SkillItemsEditor from "@/components/onboarding/SkillItemsEditor";
import PhaseTimelineEditor from "@/components/onboarding/PhaseTimelineEditor";
import ProfilePreviewCard from "@/components/onboarding/ProfilePreviewCard";
import AIGenerateDrawer from "@/components/onboarding/AIGenerateDrawer";
import { toast } from "@/hooks/use-toast";

const defaultPhases: PhaseConfig[] = [
  { phase: "immerse", durationDays: 14, objectives: [] },
  { phase: "observe", durationDays: 7, objectives: [] },
  { phase: "demonstrate", durationDays: 14, objectives: [] },
];

export default function SuccessProfileBuilder() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tenantId } = useTenant();
  const isEdit = !!id;

  const [roleName, setRoleName] = useState("");
  const [department, setDepartment] = useState("");
  const [roleDescription, setRoleDescription] = useState("");
  const [items, setItems] = useState<SuccessProfileSkillItem[]>([]);
  const [phases, setPhases] = useState<PhaseConfig[]>(defaultPhases);
  const [elevatorPitchTopic, setElevatorPitchTopic] = useState("");
  const [capstoneScenarioDescription, setCapstoneScenarioDescription] = useState("");
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);

  const { isLoading: loadingExisting } = useQuery({
    queryKey: ["success-profile", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("success_profiles").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
    enabled: isEdit,
    meta: { onSuccess: undefined },
  });

  // Load existing profile data when query succeeds
  const { data: existingProfile } = useQuery({
    queryKey: ["success-profile", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("success_profiles").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
    enabled: isEdit,
  });

  useEffect(() => {
    if (existingProfile) {
      setRoleName(existingProfile.role_name);
      setDepartment(existingProfile.department);
      setRoleDescription(existingProfile.role_description);
      setItems(existingProfile.items as any);
      setPhases(existingProfile.phase_configs as any);
      setElevatorPitchTopic(existingProfile.elevator_pitch_topic);
      setCapstoneScenarioDescription(existingProfile.capstone_scenario_description);
    }
  }, [existingProfile]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        tenant_id: tenantId!,
        role_name: roleName,
        role_description: roleDescription,
        department,
        items: items as any,
        phase_configs: phases as any,
        elevator_pitch_topic: elevatorPitchTopic,
        capstone_scenario_description: capstoneScenarioDescription,
        is_template: false,
      };
      if (isEdit) {
        const { error } = await supabase.from("success_profiles").update(payload).eq("id", id!);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("success_profiles").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ title: isEdit ? "Profile updated" : "Profile created" });
      navigate("/talent/onboarding/profiles");
    },
    onError: (e: any) => {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    },
  });

  const handleAIGenerated = (profile: any) => {
    setRoleName(profile.roleName || "");
    setDepartment(profile.department || "");
    setRoleDescription(profile.roleDescription || "");
    setItems(profile.items || []);
    setPhases(profile.phaseConfigs || defaultPhases);
    setElevatorPitchTopic(profile.elevatorPitchTopic || "");
    setCapstoneScenarioDescription(profile.capstoneScenarioDescription || "");
  };

  if (isEdit && loadingExisting) {
    return <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading profile…</div>;
  }

  return (
    <div className="max-w-7xl">
      <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate("/talent/onboarding/profiles")}>
        <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back to Profiles
      </Button>

      <div className="flex gap-6">
        {/* Left panel */}
        <div className="flex-1 space-y-4 min-w-0">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold tracking-tight">{isEdit ? "Edit Success Profile" : "New Success Profile"}</h1>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setAiDrawerOpen(true)}>
                <Sparkles className="mr-1.5 h-4 w-4" /> Generate with AI
              </Button>
              <Button onClick={() => saveMutation.mutate()} disabled={!roleName.trim() || saveMutation.isPending}>
                {saveMutation.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />}
                Save
              </Button>
            </div>
          </div>

          <Section title="Role Identity" defaultOpen>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Role Name *</Label>
                <Input value={roleName} onChange={(e) => setRoleName(e.target.value)} placeholder="e.g. Solution Architect" />
              </div>
              <div className="space-y-1.5">
                <Label>Department *</Label>
                <Input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="e.g. Presales" />
              </div>
            </div>
            <div className="space-y-1.5 mt-3">
              <Label>Role Description</Label>
              <Textarea rows={3} value={roleDescription} onChange={(e) => setRoleDescription(e.target.value)} placeholder="Brief description of the role…" />
            </div>
          </Section>

          <Section title="Skills & Attributes" defaultOpen>
            <SkillItemsEditor items={items} onChange={setItems} />
          </Section>

          <Section title="Phase Timeline" defaultOpen>
            <PhaseTimelineEditor phases={phases} onChange={setPhases} />
          </Section>

          <Section title="Role-Play Configuration" defaultOpen>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Elevator Pitch Topic</Label>
                <Textarea rows={2} value={elevatorPitchTopic} onChange={(e) => setElevatorPitchTopic(e.target.value)} placeholder="The prompt given to the learner for their elevator pitch session…" />
              </div>
              <div className="space-y-1.5">
                <Label>Capstone Scenario Description</Label>
                <Textarea rows={4} value={capstoneScenarioDescription} onChange={(e) => setCapstoneScenarioDescription(e.target.value)} placeholder="The scenario the learner receives before their capstone session…" />
              </div>
            </div>
          </Section>
        </div>

        {/* Right panel */}
        <div className="hidden lg:block w-80 shrink-0">
          <ProfilePreviewCard
            roleName={roleName}
            department={department}
            roleDescription={roleDescription}
            items={items}
            phaseConfigs={phases}
            elevatorPitchTopic={elevatorPitchTopic}
            capstoneScenarioDescription={capstoneScenarioDescription}
          />
        </div>
      </div>

      <AIGenerateDrawer open={aiDrawerOpen} onOpenChange={setAiDrawerOpen} onGenerated={handleAIGenerated} />
    </div>
  );
}

function Section({ title, defaultOpen = false, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="rounded-lg border">
      <CollapsibleTrigger className="flex w-full items-center justify-between p-4 text-sm font-medium hover:bg-muted/50 transition-colors">
        {title}
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "" : "-rotate-90"}`} />
      </CollapsibleTrigger>
      <CollapsibleContent className="px-4 pb-4">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}
