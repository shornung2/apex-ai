import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { format, differenceInDays, isPast, parseISO } from "date-fns";
import {
  BookOpen, Eye, Target, Check, ChevronRight, Clock,
  NotebookPen, FileText, Sparkles, Trophy, ArrowRight,
  Loader2, AlertTriangle, MessageSquare
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import type { OnboardingPhase, PhaseConfig } from "@/types/onboarding";
import type { Json } from "@/integrations/supabase/types";

const PHASES: OnboardingPhase[] = ["immerse", "observe", "demonstrate"];

const PHASE_META: Record<OnboardingPhase, { label: string; icon: typeof BookOpen; emoji: string; color: string; bgColor: string; borderColor: string }> = {
  immerse: { label: "Immerse", icon: BookOpen, emoji: "📚", color: "text-blue-600 dark:text-blue-400", bgColor: "bg-blue-50 dark:bg-blue-950/40", borderColor: "border-blue-200 dark:border-blue-800" },
  observe: { label: "Observe", icon: Eye, emoji: "👁️", color: "text-amber-600 dark:text-amber-400", bgColor: "bg-amber-50 dark:bg-amber-950/40", borderColor: "border-amber-200 dark:border-amber-800" },
  demonstrate: { label: "Demonstrate", icon: Target, emoji: "🎯", color: "text-green-600 dark:text-green-400", bgColor: "bg-green-50 dark:bg-green-950/40", borderColor: "border-green-200 dark:border-green-800" },
};

type PhaseContent = {
  phase: string;
  assignedKbDocumentIds: string[];
  checkpointQuestions: { id: string; question: string; passingThreshold?: number }[];
};

export default function LearnerJourney() {
  const { tenantId } = useTenant();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();

  // Get current user
  const { data: user } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user;
    },
  });

  // Get active assignment
  const { data: assignment, isLoading: loadingAssignment } = useQuery({
    queryKey: ["my-assignment", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("onboarding_assignments")
        .select("*")
        .eq("user_id", user!.id)
        .eq("status", "active")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Get program + profile
  const { data: program } = useQuery({
    queryKey: ["my-program", assignment?.program_id],
    enabled: !!assignment?.program_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("onboarding_programs")
        .select("*, success_profiles(*)")
        .eq("id", assignment!.program_id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const profile = program?.success_profiles as any;
  const phaseConfigs = (profile?.phase_configs ?? []) as PhaseConfig[];
  const phaseContent = (program?.phase_content ?? []) as unknown as PhaseContent[];

  // Get all KB doc IDs for the current phase to fetch titles
  const currentPhase = (assignment?.current_phase ?? "immerse") as OnboardingPhase;
  const currentPhaseContent = phaseContent.find(pc => pc.phase === currentPhase);
  const allDocIds = phaseContent.flatMap(pc => pc.assignedKbDocumentIds ?? []);

  // KB docs
  const { data: kbDocs } = useQuery({
    queryKey: ["journey-kb-docs", allDocIds],
    enabled: allDocIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("knowledge_documents")
        .select("id, title, doc_type")
        .in("id", allDocIds);
      if (error) throw error;
      return data ?? [];
    },
  });

  // Notebook entries
  const { data: notebookEntries } = useQuery({
    queryKey: ["journey-notebook", assignment?.id],
    enabled: !!assignment?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("onboarding_notebook_entries")
        .select("id, phase, entry_type")
        .eq("assignment_id", assignment!.id);
      if (error) throw error;
      return data ?? [];
    },
  });

  // Checkpoint responses
  const { data: checkpointResponses } = useQuery({
    queryKey: ["journey-checkpoints", assignment?.id],
    enabled: !!assignment?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("onboarding_checkpoint_responses")
        .select("id, phase, question_id, agent_score")
        .eq("assignment_id", assignment!.id);
      if (error) throw error;
      return data ?? [];
    },
  });

  // Roleplay sessions
  const { data: roleplaySessions } = useQuery({
    queryKey: ["journey-roleplay", assignment?.id],
    enabled: !!assignment?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("onboarding_roleplay_sessions")
        .select("id, session_type, is_complete, overall_score")
        .eq("assignment_id", assignment!.id);
      if (error) throw error;
      return data ?? [];
    },
  });

  // Phase advancement mutation
  const advanceMutation = useMutation({
    mutationFn: async () => {
      const phaseIndex = PHASES.indexOf(currentPhase);
      const completedAt = { ...(assignment!.phase_completed_at as Record<string, string>), [currentPhase]: new Date().toISOString() };

      if (phaseIndex >= PHASES.length - 1) {
        // All phases done
        await supabase
          .from("onboarding_assignments")
          .update({ status: "completed", phase_completed_at: completedAt as unknown as Json, current_phase: currentPhase })
          .eq("id", assignment!.id);
      } else {
        const nextPhase = PHASES[phaseIndex + 1];
        await supabase
          .from("onboarding_assignments")
          .update({ current_phase: nextPhase, phase_completed_at: completedAt as unknown as Json })
          .eq("id", assignment!.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-assignment"] });
      const phaseIndex = PHASES.indexOf(currentPhase);
      if (phaseIndex >= PHASES.length - 1) {
        toast({ title: "🎉 Congratulations!", description: "You've completed your onboarding program." });
      } else {
        toast({ title: "Phase complete!", description: `You've advanced to the ${PHASE_META[PHASES[phaseIndex + 1]].label} phase.` });
      }
    },
  });

  // Derived data
  const phaseDeadlines = useMemo(() => {
    const deadlines = (assignment?.phase_deadlines ?? []) as { phase: string; dueDate: string }[];
    return Object.fromEntries(deadlines.map(d => [d.phase, d.dueDate]));
  }, [assignment?.phase_deadlines]);

  const phaseCompletedAt = (assignment?.phase_completed_at ?? {}) as Record<string, string>;
  const completedPhasesCount = PHASES.filter(p => !!phaseCompletedAt[p]).length;
  const overallProgress = Math.round((completedPhasesCount / 3) * 100);

  const currentPhaseConfig = phaseConfigs.find(pc => pc.phase === currentPhase);
  const currentDocs = (currentPhaseContent?.assignedKbDocumentIds ?? [])
    .map(id => kbDocs?.find(d => d.id === id))
    .filter(Boolean);
  const currentQuestions = currentPhaseContent?.checkpointQuestions ?? [];
  const currentCheckpointResponses = (checkpointResponses ?? []).filter(r => r.phase === currentPhase);
  const currentNotebookEntries = (notebookEntries ?? []).filter(e => e.phase === currentPhase);

  const checkpointComplete = currentQuestions.length > 0 &&
    currentQuestions.every(q => currentCheckpointResponses.some(r => r.question_id === q.id));

  const elevatorSessions = (roleplaySessions ?? []).filter(s => s.session_type === "elevator_pitch");
  const capstoneSessions = (roleplaySessions ?? []).filter(s => s.session_type === "capstone_prep");
  const bestElevatorScore = elevatorSessions.filter(s => s.overall_score != null).reduce((max, s) => Math.max(max, s.overall_score!), 0);
  const bestCapstoneScore = capstoneSessions.filter(s => s.overall_score != null).reduce((max, s) => Math.max(max, s.overall_score!), 0);

  // Can advance?
  const canAdvance = useMemo(() => {
    if (currentPhase === "immerse") return checkpointComplete;
    if (currentPhase === "observe") return checkpointComplete && currentNotebookEntries.length >= 3;
    if (currentPhase === "demonstrate") return elevatorSessions.some(s => s.is_complete) && capstoneSessions.some(s => s.is_complete);
    return false;
  }, [currentPhase, checkpointComplete, currentNotebookEntries.length, elevatorSessions, capstoneSessions]);

  const gatingPassed = useMemo(() => {
    if (!program?.enforce_checkpoint_gating) return true;
    return currentQuestions.every(q => {
      if (!q.passingThreshold) return true;
      const resp = currentCheckpointResponses.find(r => r.question_id === q.id);
      return resp && resp.agent_score >= q.passingThreshold;
    });
  }, [program?.enforce_checkpoint_gating, currentQuestions, currentCheckpointResponses]);

  // Loading state
  if (loadingAssignment) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Check for completed assignment
  const { data: completedAssignment } = useQuery({
    queryKey: ["my-completed-assignment", user?.id],
    enabled: !!user?.id && !assignment,
    queryFn: async () => {
      const { data } = await supabase
        .from("onboarding_assignments")
        .select("*, onboarding_programs(name, success_profiles(role_name))")
        .eq("user_id", user!.id)
        .eq("status", "completed")
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  // Empty state
  if (!assignment && !completedAssignment) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-lg mx-auto text-center space-y-6 px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Sparkles className="h-10 w-10 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Your Onboarding Journey</h1>
          <p className="text-muted-foreground mt-3 text-base leading-relaxed">
            Your onboarding program hasn't been set up yet.
            Your manager will assign one when you're ready.
          </p>
        </motion.div>
      </div>
    );
  }

  // Completed state
  if (!assignment && completedAssignment) {
    const cProgram = completedAssignment.onboarding_programs as any;
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-lg mx-auto text-center space-y-6 px-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
          <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-950/50 flex items-center justify-center mx-auto mb-4">
            <Trophy className="h-10 w-10 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Onboarding Complete! 🎉</h1>
          <p className="text-muted-foreground mt-3 text-base leading-relaxed">
            You've completed the <span className="font-medium text-foreground">{cProgram?.name}</span> program.
            You're ready for your in-person capstone.
          </p>
        </motion.div>
      </div>
    );
  }

  if (!program || !profile) return null;

  const firstName = assignment.user_display_name?.split(" ")[0] || "there";
  const deadline = phaseDeadlines[currentPhase];
  const deadlineDate = deadline ? parseISO(deadline) : null;
  const daysRemaining = deadlineDate ? differenceInDays(deadlineDate, new Date()) : null;
  const isOverdue = deadlineDate ? isPast(deadlineDate) && !phaseCompletedAt[currentPhase] : false;

  return (
    <div className="space-y-8 max-w-5xl pb-12">
      {/* Welcome Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-3xl font-bold tracking-tight">Welcome, {firstName}. Here's where you are.</h1>
        <p className="text-muted-foreground mt-2 text-base">
          {profile.role_name} Onboarding Program · Started {format(parseISO(assignment.started_at), "MMM d, yyyy")}
        </p>
      </motion.div>

      {/* Phase Advancement Banner */}
      <AnimatePresence>
        {canAdvance && gatingPassed && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
            <Card className="border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950/30">
              <CardContent className="flex items-center justify-between py-4 px-6">
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <span className="font-medium text-green-800 dark:text-green-200">
                    {PHASES.indexOf(currentPhase) < 2
                      ? `Ready to advance to ${PHASE_META[PHASES[PHASES.indexOf(currentPhase) + 1]].label}?`
                      : "Ready to complete your onboarding?"}
                  </span>
                </div>
                <Button
                  size="sm"
                  onClick={() => advanceMutation.mutate()}
                  disabled={advanceMutation.isPending}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {advanceMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Mark Phase Complete & Advance"}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Phase Progress Stepper */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
        <div className="flex items-center gap-2">
          {PHASES.map((phase, i) => {
            const meta = PHASE_META[phase];
            const isCompleted = !!phaseCompletedAt[phase];
            const isCurrent = phase === currentPhase;
            const dl = phaseDeadlines[phase];
            const dlDate = dl ? parseISO(dl) : null;
            const overdue = dlDate ? isPast(dlDate) && !isCompleted : false;
            const phaseCheckpoints = (checkpointResponses ?? []).filter(r => r.phase === phase);
            const phaseNotes = (notebookEntries ?? []).filter(e => e.phase === phase);
            const avgScore = phaseCheckpoints.length > 0
              ? Math.round(phaseCheckpoints.reduce((s, r) => s + r.agent_score, 0) / phaseCheckpoints.length * 10) / 10
              : null;

            const stepContent = (
              <div
                className={`flex-1 rounded-xl border-2 p-4 transition-all ${
                  isCurrent ? `${meta.borderColor} ${meta.bgColor}` : isCompleted ? "border-green-300 dark:border-green-700 bg-green-50/50 dark:bg-green-950/20" : "border-muted bg-muted/30"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {isCompleted ? (
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                      <Check className="h-3.5 w-3.5 text-white" />
                    </div>
                  ) : (
                    <span className="text-lg">{meta.emoji}</span>
                  )}
                  <span className={`font-semibold text-sm ${isCurrent ? meta.color : isCompleted ? "text-green-700 dark:text-green-300" : "text-muted-foreground"}`}>
                    {meta.label}
                  </span>
                </div>
                {isCompleted && phaseCompletedAt[phase] && (
                  <p className="text-xs text-green-600 dark:text-green-400">Completed {format(parseISO(phaseCompletedAt[phase]), "MMM d")}</p>
                )}
                {!isCompleted && dlDate && (
                  <p className={`text-xs ${overdue ? "text-red-600 dark:text-red-400 font-medium" : "text-muted-foreground"}`}>
                    {overdue ? "Overdue" : `Due ${format(dlDate, "MMM d")}`}
                  </p>
                )}
              </div>
            );

            return (
              <div key={phase} className="flex-1 flex items-center gap-2">
                {isCompleted ? (
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="w-full text-left">{stepContent}</button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 text-sm">
                      <p className="font-medium mb-2">{meta.label} Summary</p>
                      <div className="space-y-1 text-muted-foreground">
                        <p>Checkpoint avg: {avgScore ?? "N/A"}/5</p>
                        <p>Notebook entries: {phaseNotes.length}</p>
                      </div>
                    </PopoverContent>
                  </Popover>
                ) : stepContent}
                {i < PHASES.length - 1 && <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
              </div>
            );
          })}
        </div>
      </motion.div>

      <div className={`${isMobile ? "space-y-6" : "grid grid-cols-[1fr_260px] gap-6"}`}>
        {/* Current Phase Panel */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
          <Card className={`${PHASE_META[currentPhase].borderColor} border-2`}>
            <CardHeader className={`${PHASE_META[currentPhase].bgColor} rounded-t-lg`}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{PHASE_META[currentPhase].emoji}</span>
                <div>
                  <CardTitle className={PHASE_META[currentPhase].color}>
                    {PHASE_META[currentPhase].label} Phase
                  </CardTitle>
                  {currentPhaseConfig && (
                    <CardDescription>{currentPhaseConfig.durationDays} days</CardDescription>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-8 pt-6">
              {/* Objectives */}
              {currentPhaseConfig && currentPhaseConfig.objectives.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-3">By the end of this phase, you should be able to:</p>
                  <ul className="space-y-2">
                    {currentPhaseConfig.objectives.map((obj, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30 mt-0.5 shrink-0" />
                        <span>{obj}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <Separator />

              {/* Assigned Reading */}
              <div>
                <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                  <FileText className="h-4 w-4" /> Assigned Reading
                </h3>
                {currentDocs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No reading assigned for this phase.</p>
                ) : (
                  <div className="space-y-2">
                    {currentDocs.map(doc => (
                      <div key={doc!.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                        <span className="text-sm font-medium">{doc!.title}</span>
                        <Button variant="outline" size="sm" asChild>
                          <Link to="/knowledge">View</Link>
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              {/* Phase Tasks */}
              <div>
                <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                  <Target className="h-4 w-4" /> Phase Tasks
                </h3>
                <div className="space-y-3">
                  {/* Checkpoint task (all phases) */}
                  {currentQuestions.length > 0 && (
                    <TaskCard
                      title="Complete knowledge checkpoint"
                      status={
                        checkpointComplete ? "completed" : currentCheckpointResponses.length > 0 ? "in_progress" : "not_started"
                      }
                      detail={checkpointComplete ? `Score: ${Math.round(currentCheckpointResponses.reduce((s, r) => s + r.agent_score, 0) / currentCheckpointResponses.length * 10) / 10}/5` : `${currentCheckpointResponses.length}/${currentQuestions.length} answered`}
                      linkTo={`/talent/onboarding/my-journey/checkpoint/${currentPhase}`}
                    />
                  )}

                  {/* Observe phase extras */}
                  {currentPhase === "observe" && (
                    <>
                      <TaskCard
                        title="Record your first observation"
                        status={currentNotebookEntries.length > 0 ? "completed" : "not_started"}
                        linkTo="/talent/onboarding/notebook"
                      />
                      <TaskCard
                        title="Capture at least 3 notebook entries"
                        status={currentNotebookEntries.length >= 3 ? "completed" : "in_progress"}
                        detail={`${currentNotebookEntries.length}/3 entries`}
                        linkTo="/talent/onboarding/notebook"
                      />
                    </>
                  )}

                  {/* Demonstrate phase extras */}
                  {currentPhase === "demonstrate" && (
                    <>
                      {/* Elevator Pitch */}
                      <Card className="border bg-card">
                        <CardContent className="py-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-sm flex items-center gap-2">
                              <MessageSquare className="h-4 w-4" /> Elevator Pitch
                            </h4>
                            <StatusBadge status={elevatorSessions.some(s => s.is_complete) ? "completed" : elevatorSessions.length > 0 ? "in_progress" : "not_started"} />
                          </div>
                          {profile.elevator_pitch_topic && (
                            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-sm">
                              <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">Topic</p>
                              {profile.elevator_pitch_topic}
                            </div>
                          )}
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              {elevatorSessions.length} session{elevatorSessions.length !== 1 ? "s" : ""}
                              {bestElevatorScore > 0 ? ` · Best: ${bestElevatorScore}/5` : ""}
                            </span>
                            <Button size="sm" variant="outline" asChild>
                              <Link to="/talent/onboarding/my-journey/roleplay/elevator_pitch">Enter Practice Session</Link>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Capstone Prep */}
                      <Card className="border bg-card">
                        <CardContent className="py-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-sm flex items-center gap-2">
                              <Trophy className="h-4 w-4" /> Capstone Prep
                            </h4>
                            <StatusBadge status={capstoneSessions.some(s => s.is_complete) ? "completed" : capstoneSessions.length > 0 ? "in_progress" : "not_started"} />
                          </div>
                          {profile.capstone_scenario_description && (
                            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-sm">
                              <p className="text-xs font-medium text-amber-600 dark:text-amber-400 mb-1">Your Capstone Scenario (prepare for this)</p>
                              {profile.capstone_scenario_description}
                            </div>
                          )}
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              {capstoneSessions.length} session{capstoneSessions.length !== 1 ? "s" : ""}
                              {bestCapstoneScore > 0 ? ` · Best: ${bestCapstoneScore}/5` : ""}
                            </span>
                            <Button size="sm" variant="outline" asChild>
                              <Link to="/talent/onboarding/my-journey/roleplay/capstone_prep">Practice the Capstone</Link>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Sidebar */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="space-y-4"
        >
          {/* Days remaining */}
          <Card>
            <CardContent className="py-4 space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Current Phase</span>
              </div>
              {isOverdue ? (
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm font-medium">Phase overdue</span>
                </div>
              ) : daysRemaining != null ? (
                <p className="text-2xl font-bold">{daysRemaining} <span className="text-sm font-normal text-muted-foreground">days remaining</span></p>
              ) : (
                <p className="text-sm text-muted-foreground">No deadline set</p>
              )}
            </CardContent>
          </Card>

          {/* Overall progress */}
          <Card>
            <CardContent className="py-4 space-y-3">
              <p className="text-sm font-medium">Overall Progress</p>
              <Progress value={overallProgress} className="h-2" />
              <p className="text-xs text-muted-foreground">{completedPhasesCount}/3 phases complete</p>
            </CardContent>
          </Card>

          {/* Quick links */}
          <Card>
            <CardContent className="py-4">
              <Button variant="outline" className="w-full justify-start gap-2" asChild>
                <Link to="/talent/onboarding/notebook">
                  <NotebookPen className="h-4 w-4" />
                  Onboarding Notebook
                </Link>
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

// Sub-components

function TaskCard({ title, status, detail, linkTo }: {
  title: string;
  status: "not_started" | "in_progress" | "completed";
  detail?: string;
  linkTo: string;
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
      <div className="flex items-center gap-3">
        {status === "completed" ? (
          <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
            <Check className="h-3 w-3 text-white" />
          </div>
        ) : status === "in_progress" ? (
          <div className="w-5 h-5 rounded-full border-2 border-amber-500 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
          </div>
        ) : (
          <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30" />
        )}
        <div>
          <p className="text-sm font-medium">{title}</p>
          {detail && <p className="text-xs text-muted-foreground">{detail}</p>}
        </div>
      </div>
      <Button variant="ghost" size="sm" asChild>
        <Link to={linkTo}><ArrowRight className="h-4 w-4" /></Link>
      </Button>
    </div>
  );
}

function StatusBadge({ status }: { status: "not_started" | "in_progress" | "completed" }) {
  if (status === "completed") return <Badge variant="default" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 border-0">Completed</Badge>;
  if (status === "in_progress") return <Badge variant="secondary">In Progress</Badge>;
  return <Badge variant="outline">Not Started</Badge>;
}
