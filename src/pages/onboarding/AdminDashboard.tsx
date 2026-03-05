import { useState, useMemo } from "react";
import { format, isPast } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Users, CheckCircle2, AlertTriangle, BarChart3, Search, Eye, MessageSquare, UserPlus } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import AssignUserDialog from "@/components/onboarding/AssignUserDialog";
import type { OnboardingPhase, PhaseConfig } from "@/types/onboarding";

type Assignment = {
  id: string;
  program_id: string;
  user_id: string;
  user_display_name: string;
  user_email: string;
  current_phase: string;
  started_at: string;
  phase_deadlines: { phase: string; dueDate: string }[];
  phase_completed_at: Record<string, string>;
  status: string;
};

type Program = { id: string; name: string; success_profile_id: string; phase_content: any };
type Profile = { id: string; role_name: string; phase_configs: PhaseConfig[] };
type CheckpointResp = { assignment_id: string; phase: string; question: string; agent_score: number; agent_feedback: string; question_id: string };
type RoleplaySession = { id: string; assignment_id: string; session_type: string; overall_score: number | null; is_complete: boolean; completed_at: string | null; conversation_history: { role: string; content: string }[] };

const PHASES: OnboardingPhase[] = ["immerse", "observe", "demonstrate"];

const phaseBadgeClass: Record<string, string> = {
  immerse: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  observe: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  demonstrate: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
};

function isAtRisk(a: Assignment): boolean {
  if (a.status !== "active") return false;
  const deadline = a.phase_deadlines?.find((d) => d.phase === a.current_phase);
  if (!deadline) return false;
  return isPast(new Date(deadline.dueDate)) && !a.phase_completed_at?.[a.current_phase];
}

function getCurrentDeadline(a: Assignment): string | null {
  return a.phase_deadlines?.find((d) => d.phase === a.current_phase)?.dueDate ?? null;
}

export default function AdminDashboard() {
  const { tenantId } = useTenant();
  const queryClient = useQueryClient();

  // Filters
  const [programFilter, setProgramFilter] = useState("all");
  const [phaseFilter, setPhaseFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  // Detail drawer
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reviewSession, setReviewSession] = useState<RoleplaySession | null>(null);

  // Reassign / Assign dialog
  const [reassignFor, setReassignFor] = useState<{ programId: string; programName: string; roleName: string; phaseConfigs: PhaseConfig[] } | null>(null);
  const [showAssignPicker, setShowAssignPicker] = useState(false);

  // Data queries
  const { data: assignments = [], isLoading: loadingAssignments } = useQuery({
    queryKey: ["admin-assignments", tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("onboarding_assignments")
        .select("*")
        .eq("tenant_id", tenantId!);
      if (error) throw error;
      return (data ?? []) as unknown as Assignment[];
    },
    enabled: !!tenantId,
  });

  const { data: programs = [] } = useQuery({
    queryKey: ["admin-programs", tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("onboarding_programs")
        .select("id, name, success_profile_id, phase_content")
        .eq("tenant_id", tenantId!);
      if (error) throw error;
      return (data ?? []) as Program[];
    },
    enabled: !!tenantId,
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["admin-profiles", tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("success_profiles")
        .select("id, role_name, phase_configs")
        .eq("tenant_id", tenantId!);
      if (error) throw error;
      return (data ?? []) as unknown as Profile[];
    },
    enabled: !!tenantId,
  });

  const { data: checkpoints = [] } = useQuery({
    queryKey: ["admin-checkpoints", tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("onboarding_checkpoint_responses")
        .select("assignment_id, phase, question, agent_score, agent_feedback, question_id")
        .eq("tenant_id", tenantId!);
      if (error) throw error;
      return (data ?? []) as CheckpointResp[];
    },
    enabled: !!tenantId,
  });

  const { data: roleplaySessions = [] } = useQuery({
    queryKey: ["admin-roleplay", tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("onboarding_roleplay_sessions")
        .select("id, assignment_id, session_type, overall_score, is_complete, completed_at, conversation_history")
        .eq("tenant_id", tenantId!)
        .eq("is_complete", true);
      if (error) throw error;
      return (data ?? []) as unknown as RoleplaySession[];
    },
    enabled: !!tenantId,
  });

  // Lookups
  const programMap = useMemo(() => new Map(programs.map((p) => [p.id, p])), [programs]);
  const profileMap = useMemo(() => new Map(profiles.map((p) => [p.id, p])), [profiles]);

  const getRoleName = (a: Assignment) => {
    const prog = programMap.get(a.program_id);
    if (!prog) return "—";
    return profileMap.get(prog.success_profile_id)?.role_name ?? "—";
  };

  const getProgramName = (a: Assignment) => programMap.get(a.program_id)?.name ?? "—";

  const getCheckpointAvg = (assignmentId: string, phase?: string) => {
    const relevant = checkpoints.filter((c) => c.assignment_id === assignmentId && (!phase || c.phase === phase));
    if (!relevant.length) return null;
    return relevant.reduce((s, c) => s + c.agent_score, 0) / relevant.length;
  };

  const getBestRoleplay = (assignmentId: string, sessionType: string) => {
    const sessions = roleplaySessions.filter((s) => s.assignment_id === assignmentId && s.session_type === sessionType && s.overall_score != null);
    if (!sessions.length) return null;
    return sessions.reduce((best, s) => (s.overall_score! > (best.overall_score ?? 0) ? s : best));
  };

  const getRoleplayCount = (assignmentId: string, sessionType: string) =>
    roleplaySessions.filter((s) => s.assignment_id === assignmentId && s.session_type === sessionType).length;

  // Stats
  const activeCount = assignments.filter((a) => a.status === "active").length;
  const completedCount = assignments.filter((a) => a.status === "completed").length;
  const atRiskCount = assignments.filter(isAtRisk).length;
  const allScores = checkpoints.map((c) => c.agent_score);
  const avgCheckpoint = allScores.length ? (allScores.reduce((s, v) => s + v, 0) / allScores.length).toFixed(1) : "—";

  const uniquePrograms = new Set(assignments.map((a) => a.program_id));

  // Filtering
  const filterAssignments = (list: Assignment[]) => {
    let filtered = list;
    if (programFilter !== "all") filtered = filtered.filter((a) => a.program_id === programFilter);
    if (phaseFilter !== "all") filtered = filtered.filter((a) => a.current_phase === phaseFilter);
    if (statusFilter === "at_risk") filtered = filtered.filter(isAtRisk);
    else if (statusFilter !== "all") filtered = filtered.filter((a) => a.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter((a) => a.user_display_name.toLowerCase().includes(q) || a.user_email.toLowerCase().includes(q));
    }
    return filtered;
  };

  const activeAssignments = filterAssignments(assignments.filter((a) => a.status !== "completed"));
  const completedAssignments = filterAssignments(assignments.filter((a) => a.status === "completed"));

  // Mutations
  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("onboarding_assignments").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-assignments"] });
      setSelectedId(null);
      toast({ title: "Assignment updated" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  // Selected assignment detail
  const selected = assignments.find((a) => a.id === selectedId);

  if (loadingAssignments) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Onboarding Assignments</h1>
          <p className="text-sm text-muted-foreground">
            {uniquePrograms.size} active program{uniquePrograms.size !== 1 ? "s" : ""} · {activeCount} learner{activeCount !== 1 ? "s" : ""} in progress
          </p>
        </div>
        <Button onClick={() => setShowAssignPicker(true)}>
          <UserPlus className="h-4 w-4 mr-2" /> Assign to Program
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Active" value={activeCount} />
        <StatCard icon={CheckCircle2} label="Completed" value={completedCount} />
        <StatCard icon={AlertTriangle} label="At Risk" value={atRiskCount} className={atRiskCount > 0 ? "border-amber-500/50" : ""} />
        <StatCard icon={BarChart3} label="Avg Checkpoint" value={`${avgCheckpoint}/5`} />
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-3">
        <Select value={programFilter} onValueChange={setProgramFilter}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="All Programs" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Programs</SelectItem>
            {programs.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={phaseFilter} onValueChange={setPhaseFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Phases" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Phases</SelectItem>
            {PHASES.map((p) => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="at_risk">At Risk</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search learner..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">Active & At Risk</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
        <TabsContent value="active">
          <AssignmentTable assignments={activeAssignments} onViewDetail={setSelectedId} getRoleName={getRoleName} getProgramName={getProgramName} getCheckpointAvg={getCheckpointAvg} getBestRoleplay={getBestRoleplay} isAtRisk={isAtRisk} getCurrentDeadline={getCurrentDeadline} />
        </TabsContent>
        <TabsContent value="completed">
          <AssignmentTable assignments={completedAssignments} onViewDetail={setSelectedId} getRoleName={getRoleName} getProgramName={getProgramName} getCheckpointAvg={getCheckpointAvg} getBestRoleplay={getBestRoleplay} isAtRisk={isAtRisk} getCurrentDeadline={getCurrentDeadline} />
        </TabsContent>
      </Tabs>

      {/* Detail Drawer */}
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelectedId(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          {selected && (
            <div className="space-y-6 pt-4">
              <SheetHeader>
                <SheetTitle>Learner Detail</SheetTitle>
              </SheetHeader>

              {/* Learner Info */}
              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Learner Info</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Name</span><span className="font-medium">{selected.user_display_name || "—"}</span>
                  <span className="text-muted-foreground">Email</span><span className="font-medium">{selected.user_email}</span>
                  <span className="text-muted-foreground">Role</span><span className="font-medium">{getRoleName(selected)}</span>
                  <span className="text-muted-foreground">Program</span><span className="font-medium">{getProgramName(selected)}</span>
                  <span className="text-muted-foreground">Start Date</span><span className="font-medium">{format(new Date(selected.started_at), "PPP")}</span>
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant={selected.status === "completed" ? "default" : selected.status === "paused" ? "secondary" : isAtRisk(selected) ? "destructive" : "outline"}>
                    {isAtRisk(selected) ? "At Risk" : selected.status}
                  </Badge>
                </div>
              </section>

              <Separator />

              {/* Phase Timeline */}
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Phase Timeline</h3>
                {PHASES.map((phase) => {
                  const deadline = selected.phase_deadlines?.find((d) => d.phase === phase);
                  const completedAt = selected.phase_completed_at?.[phase];
                  const avg = getCheckpointAvg(selected.id, phase);
                  const overdue = deadline && isPast(new Date(deadline.dueDate)) && !completedAt;
                  return (
                    <div key={phase} className={`rounded-lg border p-3 ${overdue ? "border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20" : ""}`}>
                      <div className="flex items-center justify-between">
                        <Badge className={phaseBadgeClass[phase]}>{phase}</Badge>
                        {completedAt ? (
                          <span className="text-xs text-green-600">✓ Completed {format(new Date(completedAt), "MMM d")}</span>
                        ) : deadline ? (
                          <span className={`text-xs ${overdue ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                            {overdue && "⚠️ "}Due {format(new Date(deadline.dueDate), "MMM d, yyyy")}
                          </span>
                        ) : null}
                      </div>
                      {avg != null && <p className="text-xs text-muted-foreground mt-1">Checkpoint Avg: {avg.toFixed(1)}/5</p>}
                    </div>
                  );
                })}
              </section>

              <Separator />

              {/* Checkpoint Detail */}
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Checkpoint Detail</h3>
                {PHASES.map((phase) => {
                  const phaseCheckpoints = checkpoints.filter((c) => c.assignment_id === selected.id && c.phase === phase);
                  if (!phaseCheckpoints.length) return null;
                  return (
                    <div key={phase} className="space-y-2">
                      <Badge variant="outline" className="capitalize">{phase}</Badge>
                      {phaseCheckpoints.map((c, i) => (
                        <div key={i} className="rounded border p-3 space-y-1">
                          <p className="text-sm font-medium">{c.question}</p>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{c.agent_score}/5</Badge>
                          </div>
                          {c.agent_feedback && <p className="text-xs text-muted-foreground italic">{c.agent_feedback}</p>}
                        </div>
                      ))}
                    </div>
                  );
                })}
                {!checkpoints.some((c) => c.assignment_id === selected.id) && (
                  <p className="text-sm text-muted-foreground">No checkpoint responses yet.</p>
                )}
              </section>

              <Separator />

              {/* Role-Play Performance */}
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Role-Play Performance</h3>
                {(["elevator_pitch", "capstone_prep"] as const).map((type) => {
                  const count = getRoleplayCount(selected.id, type);
                  const best = getBestRoleplay(selected.id, type);
                  return (
                    <div key={type} className="rounded border p-3 space-y-1">
                      <p className="text-sm font-medium">{type === "elevator_pitch" ? "🎤 Elevator Pitch" : "🎯 Capstone Prep"}</p>
                      {count === 0 ? (
                        <p className="text-xs text-muted-foreground">Not started</p>
                      ) : (
                        <>
                          <p className="text-xs text-muted-foreground">{count} session{count !== 1 ? "s" : ""} · Best: {best?.overall_score ?? "—"}/5{best?.completed_at ? ` on ${format(new Date(best.completed_at), "MMM d")}` : ""}</p>
                          {best && (
                            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setReviewSession(best)}>
                              <MessageSquare className="h-3 w-3 mr-1" /> Review Best Session
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </section>

              <Separator />

              {/* Program Actions */}
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Program Actions</h3>
                <div className="flex flex-wrap gap-2">
                  {selected.status === "active" && (
                    <>
                      <Button variant="outline" size="sm" onClick={() => updateStatus.mutate({ id: selected.id, status: "completed" })}>
                        <CheckCircle2 className="h-4 w-4 mr-1" /> Mark as Complete
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => updateStatus.mutate({ id: selected.id, status: "paused" })}>
                        Pause Program
                      </Button>
                    </>
                  )}
                  {selected.status === "paused" && (
                    <Button variant="outline" size="sm" onClick={() => updateStatus.mutate({ id: selected.id, status: "active" })}>
                      Resume Program
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const prog = programMap.get(selected.program_id);
                      const prof = prog ? profileMap.get(prog.success_profile_id) : null;
                      if (prog && prof) {
                        setReassignFor({
                          programId: prog.id,
                          programName: prog.name,
                          roleName: prof.role_name,
                          phaseConfigs: (prof.phase_configs as any) ?? [],
                        });
                      }
                    }}
                  >
                    Reassign Program
                  </Button>
                </div>
              </section>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Review Session Modal */}
      <Dialog open={!!reviewSession} onOpenChange={(o) => !o && setReviewSession(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Session Transcript {reviewSession?.overall_score != null && `— Score: ${reviewSession.overall_score}/5`}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[60vh] pr-4">
            <div className="space-y-3">
              {(reviewSession?.conversation_history ?? []).map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-lg px-4 py-2 text-sm ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Reassign Dialog */}
      {reassignFor && (
        <AssignUserDialog
          open={!!reassignFor}
          onOpenChange={(o) => { if (!o) { setReassignFor(null); queryClient.invalidateQueries({ queryKey: ["admin-assignments"] }); queryClient.invalidateQueries({ queryKey: ["my-active-assignment"] }); } }}
          programId={reassignFor.programId}
          programName={reassignFor.programName}
          profileRoleName={reassignFor.roleName}
          phaseConfigs={reassignFor.phaseConfigs}
        />
      )}

      {/* Assign Program Picker */}
      <Dialog open={showAssignPicker} onOpenChange={setShowAssignPicker}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select a Program</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {programs.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No programs available. Create one first.</p>
            ) : (
              programs.map((p) => {
                const prof = profileMap.get(p.success_profile_id);
                return (
                  <button
                    key={p.id}
                    className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors text-left"
                    onClick={() => {
                      setShowAssignPicker(false);
                      setReassignFor({
                        programId: p.id,
                        programName: p.name,
                        roleName: prof?.role_name ?? "—",
                        phaseConfigs: (prof?.phase_configs as any) ?? [],
                      });
                    }}
                  >
                    <div>
                      <p className="text-sm font-medium">{p.name}</p>
                      {prof && <p className="text-xs text-muted-foreground">{prof.role_name}</p>}
                    </div>
                    <UserPlus className="h-4 w-4 text-muted-foreground" />
                  </button>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// --- Sub-components ---

function StatCard({ icon: Icon, label, value, className = "" }: { icon: any; label: string; value: string | number; className?: string }) {
  return (
    <Card className={className}>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="rounded-lg bg-muted p-2">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function AssignmentTable({
  assignments,
  onViewDetail,
  getRoleName,
  getProgramName,
  getCheckpointAvg,
  getBestRoleplay,
  isAtRisk,
  getCurrentDeadline,
}: {
  assignments: Assignment[];
  onViewDetail: (id: string) => void;
  getRoleName: (a: Assignment) => string;
  getProgramName: (a: Assignment) => string;
  getCheckpointAvg: (id: string) => number | null;
  getBestRoleplay: (id: string, type: string) => RoleplaySession | null;
  isAtRisk: (a: Assignment) => boolean;
  getCurrentDeadline: (a: Assignment) => string | null;
}) {
  if (!assignments.length) {
    return <p className="text-sm text-muted-foreground py-8 text-center">No assignments found.</p>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Learner</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Program</TableHead>
            <TableHead>Phase</TableHead>
            <TableHead>Deadline</TableHead>
            <TableHead>Checkpoint</TableHead>
            <TableHead>Pitch</TableHead>
            <TableHead>Capstone</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[80px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {assignments.map((a) => {
            const atRisk = isAtRisk(a);
            const deadline = getCurrentDeadline(a);
            const overdue = deadline && isPast(new Date(deadline));
            const cpAvg = getCheckpointAvg(a.id);
            const pitchBest = getBestRoleplay(a.id, "elevator_pitch");
            const capstoneBest = getBestRoleplay(a.id, "capstone_prep");

            return (
              <TableRow key={a.id} className={atRisk ? "border-l-2 border-l-amber-500" : ""}>
                <TableCell>
                  <div>
                    <p className="font-medium text-sm">{a.user_display_name || "—"}</p>
                    <p className="text-xs text-muted-foreground">{a.user_email}</p>
                  </div>
                </TableCell>
                <TableCell className="text-sm">{getRoleName(a)}</TableCell>
                <TableCell className="text-sm">{getProgramName(a)}</TableCell>
                <TableCell>
                  <Badge className={phaseBadgeClass[a.current_phase] ?? ""}>{a.current_phase}</Badge>
                </TableCell>
                <TableCell>
                  {deadline ? (
                    <span className={`text-sm ${overdue ? "text-destructive font-medium" : ""}`}>
                      {overdue && "⚠️ "}{format(new Date(deadline), "MMM d")}
                    </span>
                  ) : "—"}
                </TableCell>
                <TableCell className="text-sm">{cpAvg != null ? `${cpAvg.toFixed(1)}/5` : "—"}</TableCell>
                <TableCell className="text-sm">{pitchBest ? `${pitchBest.overall_score}/5` : "—"}</TableCell>
                <TableCell className="text-sm">{capstoneBest ? `${capstoneBest.overall_score}/5` : "—"}</TableCell>
                <TableCell>
                  <Badge variant={a.status === "completed" ? "default" : atRisk ? "destructive" : a.status === "paused" ? "secondary" : "outline"}>
                    {atRisk ? "At Risk" : a.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" onClick={() => onViewDetail(a.id)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
