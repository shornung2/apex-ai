import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  Star,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  RotateCcw,
  MessageSquare,
  AlertTriangle,
} from "lucide-react";
import type { OnboardingPhase, PhaseConfig } from "@/types/onboarding";

const PHASE_LABELS: Record<string, string> = {
  immerse: "Immerse",
  observe: "Observe",
  demonstrate: "Demonstrate",
};

type CheckpointQuestion = {
  id: string;
  question: string;
  passingThreshold?: number;
};

type ExistingResponse = {
  id: string;
  question_id: string;
  question: string;
  user_response: string;
  agent_score: number;
  agent_feedback: string;
  evaluated_at: string;
};

export default function CheckpointSession() {
  const { phase } = useParams<{ phase: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { tenantId } = useTenant();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [justEvaluated, setJustEvaluated] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);

  // Load current user
  const { data: user } = useQuery({
    queryKey: ["auth-user"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user;
    },
  });

  // Load active assignment
  const { data: assignment, isLoading: assignmentLoading } = useQuery({
    queryKey: ["active-assignment", user?.id],
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

  // Load program with success profile
  const { data: program } = useQuery({
    queryKey: ["onboarding-program", assignment?.program_id],
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

  // Load existing responses for this phase
  const { data: existingResponses, isLoading: responsesLoading } = useQuery({
    queryKey: ["checkpoint-responses", assignment?.id, phase],
    enabled: !!assignment?.id && !!phase,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("onboarding_checkpoint_responses")
        .select("*")
        .eq("assignment_id", assignment!.id)
        .eq("phase", phase!);
      if (error) throw error;
      return data as ExistingResponse[];
    },
  });

  // Extract checkpoint questions for this phase from program
  const questions: CheckpointQuestion[] = useMemo(() => {
    if (!program?.phase_content) return [];
    const phaseContent = (program.phase_content as any[]).find(
      (pc: any) => pc.phase === phase
    );
    return phaseContent?.checkpointQuestions || [];
  }, [program, phase]);

  // Get phase config for objectives
  const phaseConfig: PhaseConfig | undefined = useMemo(() => {
    if (!program?.success_profiles) return undefined;
    const sp = program.success_profiles as any;
    const configs = sp.phase_configs as PhaseConfig[];
    return configs?.find((pc) => pc.phase === phase);
  }, [program, phase]);

  const roleName = (program?.success_profiles as any)?.role_name || "";
  const programName = program?.name || "";
  const enforceGating = program?.enforce_checkpoint_gating || false;

  // Map responses by question_id
  const responseMap = useMemo(() => {
    const map = new Map<string, ExistingResponse>();
    existingResponses?.forEach((r) => map.set(r.question_id, r));
    return map;
  }, [existingResponses]);

  const answeredCount = questions.filter((q) => responseMap.has(q.id)).length;
  const allAnswered = questions.length > 0 && answeredCount === questions.length;

  // Show summary if all answered on load (not during active session)
  useEffect(() => {
    if (allAnswered && !justEvaluated && !reviewMode) {
      setShowSummary(true);
    }
  }, [allAnswered, justEvaluated, reviewMode]);

  // Auto-advance after evaluation
  useEffect(() => {
    if (!justEvaluated) return;
    const timer = setTimeout(() => {
      setJustEvaluated(null);
      // Find next unanswered
      const nextIdx = questions.findIndex(
        (q, i) => i > currentIndex && !responseMap.has(q.id)
      );
      if (nextIdx !== -1) {
        setCurrentIndex(nextIdx);
        setAnswer("");
      } else {
        // Check if all done
        const allDone = questions.every((q) => responseMap.has(q.id));
        if (allDone) setShowSummary(true);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [justEvaluated, questions, currentIndex, responseMap]);

  // Submit mutation
  const submitMutation = useMutation({
    mutationFn: async (questionItem: CheckpointQuestion) => {
      setIsSubmitting(true);
      // Call edge function
      const { data: evalData, error: evalError } = await supabase.functions.invoke(
        "evaluate-checkpoint",
        {
          body: {
            question: questionItem.question,
            userResponse: answer,
            roleName,
            phase,
            objectives: phaseConfig?.objectives || [],
          },
        }
      );
      if (evalError) throw evalError;
      if (evalData?.error) throw new Error(evalData.error);

      const { score, feedback } = evalData;

      // Save to DB
      const { error: insertError } = await supabase
        .from("onboarding_checkpoint_responses")
        .insert({
          assignment_id: assignment!.id,
          program_id: program!.id,
          tenant_id: tenantId!,
          phase: phase!,
          question_id: questionItem.id,
          question: questionItem.question,
          user_response: answer,
          agent_score: score,
          agent_feedback: feedback,
        });
      if (insertError) throw insertError;

      return { score, feedback, questionId: questionItem.id };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["checkpoint-responses"] });
      setJustEvaluated(data.questionId);
      setAnswer("");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to evaluate answer");
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  // Retake: delete existing responses for this phase
  const retakeMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("onboarding_checkpoint_responses")
        .delete()
        .eq("assignment_id", assignment!.id)
        .eq("phase", phase!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checkpoint-responses"] });
      setShowSummary(false);
      setReviewMode(false);
      setCurrentIndex(0);
      setAnswer("");
      toast.success("Checkpoint reset. You can answer again.");
    },
    onError: () => toast.error("Failed to reset checkpoint"),
  });

  const currentQuestion = questions[currentIndex];
  const currentResponse = currentQuestion
    ? responseMap.get(currentQuestion.id)
    : undefined;

  const isLoading = assignmentLoading || responsesLoading;

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-3xl mx-auto p-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No active onboarding assignment found.
          </CardContent>
        </Card>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="max-w-3xl mx-auto p-4 space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">
          {PHASE_LABELS[phase || ""] || phase} Knowledge Checkpoint
        </h1>
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No checkpoint questions have been configured for this phase. Check
            back after your manager updates the program.
          </CardContent>
        </Card>
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
      </div>
    );
  }

  // Summary screen
  if (showSummary) {
    const scores = questions
      .map((q) => responseMap.get(q.id)?.agent_score || 0)
      .filter(Boolean);
    const avg = scores.length
      ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
      : "0";

    return (
      <div className="max-w-3xl mx-auto p-4 space-y-6">
        <div className="text-center space-y-2">
          <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
          <h1 className="text-2xl font-bold tracking-tight">
            Checkpoint Complete
          </h1>
          <p className="text-muted-foreground">
            {PHASE_LABELS[phase || ""]} phase · {programName}
          </p>
        </div>

        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-sm text-muted-foreground mb-1">Average Score</p>
            <p className="text-4xl font-bold">{avg}</p>
            <p className="text-muted-foreground">/5</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Question Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {questions.map((q, i) => {
              const r = responseMap.get(q.id);
              return (
                <div
                  key={q.id}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <span className="text-sm truncate max-w-[70%]">
                    Q{i + 1}: {q.question}
                  </span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`h-4 w-4 ${
                          s <= (r?.agent_score || 0)
                            ? "fill-amber-400 text-amber-400"
                            : "text-muted-foreground/30"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => {
              setShowSummary(false);
              setReviewMode(true);
              setCurrentIndex(0);
            }}
          >
            Review Answers
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline">
                <RotateCcw className="mr-2 h-4 w-4" /> Retake Checkpoint
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Retake this checkpoint?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will clear your existing answers for this phase. You'll be
                  able to answer all questions again. Only your most recent
                  submission counts.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => retakeMutation.mutate()}>
                  Retake
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button onClick={() => navigate("/talent/onboarding/my-journey")}>
            Return to My Journey
          </Button>
        </div>
      </div>
    );
  }

  // Question view
  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {PHASE_LABELS[phase || ""] || phase} Knowledge Checkpoint
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Answer each question in your own words. Your responses will be
          evaluated by the Coach and you'll receive a score and feedback on each
          one.
        </p>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>
            {answeredCount} of {questions.length} questions answered
          </span>
          <span>
            Question {currentIndex + 1} of {questions.length}
          </span>
        </div>
        <Progress
          value={(answeredCount / questions.length) * 100}
          className="h-2"
        />
      </div>

      {/* Question card */}
      <Card>
        <CardContent className="p-6 space-y-6">
          <p className="text-lg font-medium leading-relaxed">
            {currentQuestion?.question}
          </p>

          {/* Answered state */}
          {(currentResponse || justEvaluated === currentQuestion?.id) && (() => {
            const resp = currentResponse;
            if (!resp && justEvaluated !== currentQuestion?.id) return null;

            // If just evaluated, we may not have the response in cache yet
            // but the mutation result was already shown via invalidation
            if (!resp) {
              return (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Loading evaluation...</span>
                </div>
              );
            }

            return (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium text-green-600">
                      Answered
                    </span>
                  </div>
                  <div className="bg-muted/50 rounded-md p-3 text-sm whitespace-pre-wrap">
                    {resp.user_response}
                  </div>
                </div>

                {/* Score */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`h-5 w-5 ${
                          s <= resp.agent_score
                            ? "fill-amber-400 text-amber-400"
                            : "text-muted-foreground/30"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium">
                    Score: {resp.agent_score}/5
                  </span>
                </div>

                {/* Coach feedback */}
                <div className="border border-border rounded-lg p-4 bg-accent/30">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Coach Feedback</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {resp.agent_feedback}
                  </p>
                </div>

                {/* Gating warning */}
                {enforceGating &&
                  currentQuestion?.passingThreshold &&
                  resp.agent_score < currentQuestion.passingThreshold && (
                    <div className="border border-amber-300 bg-amber-50 dark:bg-amber-950/20 rounded-lg p-4 flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
                      <p className="text-sm">
                        You'll need to revisit this topic before advancing to
                        the next phase. Your coach has noted this for your
                        development.
                      </p>
                    </div>
                  )}
              </div>
            );
          })()}

          {/* Unanswered state */}
          {!currentResponse && justEvaluated !== currentQuestion?.id && (
            <div className="space-y-4">
              {isSubmitting ? (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">
                    Coach is reviewing your answer...
                  </p>
                </div>
              ) : (
                <>
                  <Textarea
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    rows={6}
                    placeholder="Explain this in your own words as if you were describing it to a colleague or a customer..."
                    disabled={reviewMode}
                  />
                  {!reviewMode && (
                    <Button
                      onClick={() =>
                        currentQuestion &&
                        submitMutation.mutate(currentQuestion)
                      }
                      disabled={!answer.trim()}
                    >
                      Submit Answer
                    </Button>
                  )}
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
          disabled={currentIndex === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-1" /> Previous
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))
          }
          disabled={currentIndex === questions.length - 1}
        >
          Next <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
