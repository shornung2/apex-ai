import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, UserPlus, FileText, HelpCircle, Users } from "lucide-react";
import AssignUserDialog from "@/components/onboarding/AssignUserDialog";
import type { PhaseConfig } from "@/types/onboarding";

type ProgramRow = {
  id: string;
  name: string;
  success_profile_id: string;
  phase_content: any;
  enforce_checkpoint_gating: boolean;
  success_profiles: { role_name: string; phase_configs: any } | null;
};

export default function ProgramList() {
  const { tenantId } = useTenant();
  const navigate = useNavigate();
  const [assignTarget, setAssignTarget] = useState<ProgramRow | null>(null);

  const { data: programs = [], isLoading } = useQuery({
    queryKey: ["onboarding-programs", tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      const { data, error } = await supabase
        .from("onboarding_programs")
        .select("id, name, success_profile_id, phase_content, enforce_checkpoint_gating, success_profiles(role_name, phase_configs)")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as ProgramRow[];
    },
    enabled: !!tenantId,
  });

  const { data: assignmentCounts = {} } = useQuery({
    queryKey: ["assignment-counts", tenantId],
    queryFn: async () => {
      if (!tenantId) return {};
      const { data, error } = await supabase
        .from("onboarding_assignments")
        .select("program_id, id")
        .eq("tenant_id", tenantId)
        .eq("status", "active");
      if (error) throw error;
      const counts: Record<string, number> = {};
      for (const row of data || []) {
        counts[row.program_id] = (counts[row.program_id] || 0) + 1;
      }
      return counts;
    },
    enabled: !!tenantId,
  });

  const getPhaseDocCounts = (phaseContent: any[]) => {
    if (!Array.isArray(phaseContent)) return "";
    return phaseContent
      .map((p: any) => {
        const count = p.assignedKbDocumentIds?.length || 0;
        return `${p.phase?.charAt(0).toUpperCase()}${p.phase?.slice(1)}: ${count} doc${count !== 1 ? "s" : ""}`;
      })
      .join(" · ");
  };

  const getTotalQuestions = (phaseContent: any[]) => {
    if (!Array.isArray(phaseContent)) return 0;
    return phaseContent.reduce((sum: number, p: any) => sum + (p.checkpointQuestions?.length || 0), 0);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Onboarding Programs</h1>
          <p className="text-sm text-muted-foreground">Link Success Profiles to curated content and checkpoint questions.</p>
        </div>
        <Button onClick={() => navigate("/talent/onboarding/programs/new")}>
          <Plus className="h-4 w-4 mr-2" />
          New Program
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <Card key={i} className="animate-pulse"><CardContent className="h-40" /></Card>
          ))}
        </div>
      ) : programs.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-1">No programs yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Create your first onboarding program to get started.</p>
            <Button onClick={() => navigate("/talent/onboarding/programs/new")}>
              <Plus className="h-4 w-4 mr-2" />
              Create Program
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {programs.map((program) => {
            const profile = program.success_profiles as any;
            const phaseContent = program.phase_content as any[];
            const totalQ = getTotalQuestions(phaseContent);
            const activeCount = assignmentCounts[program.id] || 0;

            return (
              <Card key={program.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{program.name}</CardTitle>
                  {profile?.role_name && (
                    <Link
                      to={`/talent/onboarding/profiles/${program.success_profile_id}/edit`}
                      className="text-sm text-primary hover:underline"
                    >
                      {profile.role_name}
                    </Link>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <FileText className="h-3.5 w-3.5" />
                      {getPhaseDocCounts(phaseContent)}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <HelpCircle className="h-3.5 w-3.5" />
                      {totalQ} checkpoint question{totalQ !== 1 ? "s" : ""}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {activeCount} active assignment{activeCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                  {program.enforce_checkpoint_gating && (
                    <Badge variant="outline" className="text-xs">Gating enabled</Badge>
                  )}
                  <div className="flex gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/talent/onboarding/programs/${program.id}/edit`)}
                    >
                      <Edit className="h-3.5 w-3.5 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAssignTarget(program)}
                    >
                      <UserPlus className="h-3.5 w-3.5 mr-1" />
                      Assign
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {assignTarget && (
        <AssignUserDialog
          open={!!assignTarget}
          onOpenChange={(o) => !o && setAssignTarget(null)}
          programId={assignTarget.id}
          programName={assignTarget.name}
          profileRoleName={(assignTarget.success_profiles as any)?.role_name || ""}
          phaseConfigs={((assignTarget.success_profiles as any)?.phase_configs || []) as PhaseConfig[]}
        />
      )}
    </div>
  );
}
