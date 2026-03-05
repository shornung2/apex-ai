import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { starterTemplates } from "@/data/starter-templates";
import type { SuccessProfile } from "@/types/onboarding";
import ProfileCard from "@/components/onboarding/ProfileCard";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Plus, FileText } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";

function rowToProfile(row: any): SuccessProfile {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    roleName: row.role_name,
    roleDescription: row.role_description,
    department: row.department,
    items: row.items as any,
    phaseConfigs: row.phase_configs as any,
    elevatorPitchTopic: row.elevator_pitch_topic,
    capstoneScenarioDescription: row.capstone_scenario_description,
    isTemplate: row.is_template,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export default function SuccessProfileList() {
  const navigate = useNavigate();
  const { tenantId } = useTenant();
  const queryClient = useQueryClient();
  const [templatesOpen, setTemplatesOpen] = useState(false);

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ["success-profiles", tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("success_profiles")
        .select("*")
        .eq("is_template", false)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map(rowToProfile);
    },
    enabled: !!tenantId,
  });

  const duplicateMutation = useMutation({
    mutationFn: async (profile: SuccessProfile) => {
      const { error } = await supabase.from("success_profiles").insert({
        tenant_id: tenantId!,
        role_name: `${profile.roleName} (Copy)`,
        role_description: profile.roleDescription,
        department: profile.department,
        items: profile.items as any,
        phase_configs: profile.phaseConfigs as any,
        elevator_pitch_topic: profile.elevatorPitchTopic,
        capstone_scenario_description: profile.capstoneScenarioDescription,
        is_template: false,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["success-profiles"] });
      toast({ title: "Profile duplicated" });
    },
  });

  const useTemplateMutation = useMutation({
    mutationFn: async (template: SuccessProfile) => {
      const { data, error } = await supabase.from("success_profiles").insert({
        tenant_id: tenantId!,
        role_name: template.roleName,
        role_description: template.roleDescription,
        department: template.department,
        items: template.items as any,
        phase_configs: template.phaseConfigs as any,
        elevator_pitch_topic: template.elevatorPitchTopic,
        capstone_scenario_description: template.capstoneScenarioDescription,
        is_template: false,
      }).select("id").single();
      if (error) throw error;
      return data.id;
    },
    onSuccess: (id) => {
      navigate(`/talent/onboarding/profiles/${id}/edit`);
    },
  });

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Success Profiles</h1>
          <p className="text-sm text-muted-foreground">Define what &ldquo;great&rdquo; looks like for each role.</p>
        </div>
        <Button onClick={() => navigate("/talent/onboarding/profiles/new")}>
          <Plus className="mr-1.5 h-4 w-4" /> New Success Profile
        </Button>
      </div>

      <Collapsible open={templatesOpen} onOpenChange={setTemplatesOpen}>
        <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          <ChevronDown className={`h-4 w-4 transition-transform ${templatesOpen ? "" : "-rotate-90"}`} />
          Solutionment Starter Templates
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-3">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {starterTemplates.map((t) => (
              <ProfileCard
                key={t.id}
                profile={t}
                isTemplate
                onUseTemplate={() => useTemplateMutation.mutate(t)}
              />
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading profiles…</div>
      ) : profiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <FileText className="h-10 w-10 text-muted-foreground mb-3" />
          <h3 className="text-lg font-medium">No success profiles yet</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">Create your first profile or start from a template above.</p>
          <Button variant="outline" onClick={() => setTemplatesOpen(true)}>Browse Templates</Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {profiles.map((p) => (
            <ProfileCard
              key={p.id}
              profile={p}
              onEdit={() => navigate(`/talent/onboarding/profiles/${p.id}/edit`)}
              onDuplicate={() => duplicateMutation.mutate(p)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
