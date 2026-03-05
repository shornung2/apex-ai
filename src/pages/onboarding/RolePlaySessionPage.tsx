import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic, Target, ArrowLeft, Send, Clock, Loader2, Star,
  ChevronRight, RotateCcw, MessageSquare
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import type { SuccessProfileSkillItem, PhaseConfig } from "@/types/onboarding";
import type { Json } from "@/integrations/supabase/types";

type Msg = { role: "user" | "assistant"; content: string };
type ViewState = "briefing" | "chat" | "scoring" | "score" | "review";
type RubricScore = { rubricItemId: string; label: string; score: number; feedback: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/roleplay-chat`;

function formatTimer(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function getScoreLabel(score: number) {
  if (score <= 2) return "Needs Development";
  if (score <= 3) return "Getting There";
  if (score <= 4) return "Ready";
  return "Exceptional";
}

function getScoreLabelColor(score: number) {
  if (score <= 2) return "text-red-600 dark:text-red-400";
  if (score <= 3) return "text-amber-600 dark:text-amber-400";
  if (score <= 4) return "text-blue-600 dark:text-blue-400";
  return "text-green-600 dark:text-green-400";
}

function ScoreDots({ score, max = 5 }: { score: number; max?: number }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: max }, (_, i) => (
        <div
          key={i}
          className={`w-3 h-3 rounded-full ${
            i < score ? "bg-primary" : "bg-muted"
          }`}
        />
      ))}
    </div>
  );
}

export default function RolePlaySessionPage() {
  const { sessionType } = useParams<{ sessionType: string }>();
  const navigate = useNavigate();
  const { tenantId } = useTenant();

  const [view, setView] = useState<ViewState>("briefing");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [scoringResult, setScoringResult] = useState<{
    overallScore: number;
    rubricScores: RubricScore[];
    summaryFeedback: string;
  } | null>(null);
  const [reviewSession, setReviewSession] = useState<any>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isElevatorPitch = sessionType === "elevator_pitch";
  const sessionLabel = isElevatorPitch ? "Elevator Pitch Practice" : "Capstone Scenario Practice";
  const sessionIcon = isElevatorPitch ? "🎤" : "🎯";

  // --- Data Loading ---
  const { data: user } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user;
    },
  });

  const { data: assignment } = useQuery({
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
  const items = (profile?.items ?? []) as SuccessProfileSkillItem[];
  const rubricItems = items.filter(i => i.isRolePlayRubricItem);
  const phaseConfigs = (profile?.phase_configs ?? []) as PhaseConfig[];

  const { data: previousSessions, refetch: refetchSessions } = useQuery({
    queryKey: ["roleplay-sessions", assignment?.id, sessionType],
    enabled: !!assignment?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("onboarding_roleplay_sessions")
        .select("*")
        .eq("assignment_id", assignment!.id)
        .eq("session_type", sessionType!)
        .order("started_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const completedSessions = (previousSessions ?? []).filter(s => s.is_complete);
  const bestScore = completedSessions.reduce((max, s) => Math.max(max, s.overall_score ?? 0), 0);

  // --- System Prompt ---
  const systemPrompt = useMemo(() => {
    if (!profile) return "";

    const rubricList = rubricItems
      .map(r => `- ${r.label}: ${r.description}`)
      .join("\n");

    const demonstrateConfig = phaseConfigs.find(pc => pc.phase === "demonstrate");
    const objectives = demonstrateConfig?.objectives?.join(", ") || "";

    let sessionBlock = "";
    if (isElevatorPitch) {
      sessionBlock = `SESSION TYPE: Elevator Pitch
Your job: Play the role of a skeptical but fair executive or prospect. The learner will deliver a pitch. Listen, then ask 3-5 probing follow-up questions that a real buyer would ask. Be realistic but not cruel. After asking your questions, wait for the learner to respond to each one. When the learner types 'done' or signals they want to end the session, do NOT score yet — just acknowledge and say the session will now be scored. The scoring happens separately.

Opening message: Start by setting the scene. For example: 'Alright, I've got 90 seconds. Tell me what you do and why I should care.' Adapt this to the specific pitch topic: ${profile.elevator_pitch_topic}`;
    } else {
      sessionBlock = `SESSION TYPE: Capstone Scenario Preparation
Your job: Guide the learner through the following scenario as if it were real. Play all relevant characters (executive sponsor, prospect, internal stakeholder — whatever the scenario requires). React authentically to what the learner says. Push back where appropriate. Ask clarifying questions. Don't make it easy.

The scenario: ${profile.capstone_scenario_description}

Opening message: Set the scene and present the opening situation. Make it feel real. The learner should feel like they've just walked into the situation.`;
    }

    return `You are the Apex AI Onboarding Coach conducting a ${isElevatorPitch ? "Elevator Pitch" : "Capstone Scenario"} simulation with a new employee.

ROLE CONTEXT:
The learner is a new ${profile.role_name} at their company.
Their role description: ${profile.role_description}

SCORING RUBRIC (you will score the learner on these dimensions at end of session):
${rubricList}

${sessionBlock}

GENERAL COACHING GUIDELINES FOR ALL SESSIONS:
- Stay in character throughout. Do not break the simulation unless the learner appears confused about the format.
- Be rigorous. This person is being evaluated on readiness. Surface gaps naturally through your questions and reactions.
- Do not give hints or help. If they miss something important, probe deeper rather than filling in the gap for them.
- Be professional and fair. The goal is to help them demonstrate what they know, not to trick them.
- Keep your responses concise — this is a spoken/real-time simulation context.
- When the session ends, acknowledge it and indicate scoring is coming.`;
  }, [profile, rubricItems, phaseConfigs, isElevatorPitch]);

  // --- Timer ---
  useEffect(() => {
    if (view === "chat") {
      timerRef.current = setInterval(() => setElapsedSeconds(s => s + 1), 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [view]);

  // --- Scroll to bottom ---
  useEffect(() => {
    if (view === "chat" || view === "review") {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, view]);

  // --- Stream chat ---
  const streamChat = useCallback(async (allMessages: Msg[]) => {
    setIsStreaming(true);
    let assistantSoFar = "";

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ mode: "chat", messages: allMessages, systemPrompt }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(err.error || `Error ${resp.status}`);
      }

      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantSoFar += content;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
                }
                return [...prev, { role: "assistant", content: assistantSoFar }];
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Flush remaining
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw || raw.startsWith(":") || raw.trim() === "") continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantSoFar += content;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
                }
                return [...prev, { role: "assistant", content: assistantSoFar }];
              });
            }
          } catch { /* ignore */ }
        }
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsStreaming(false);
    }
  }, [systemPrompt]);

  // --- Start Session ---
  const startSession = useCallback(async () => {
    setMessages([]);
    setElapsedSeconds(0);
    setScoringResult(null);
    setView("chat");
    // Get opening message from Coach
    await streamChat([]);
  }, [streamChat]);

  // --- Send Message ---
  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isStreaming) return;

    // Check for "done" trigger
    const isDone = text.toLowerCase() === "done";

    const userMsg: Msg = { role: "user", content: text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");

    if (isDone) {
      // Let the coach acknowledge, then score
      await streamChat(updated);
      // After streaming completes, trigger scoring
      setTimeout(() => endSession(updated), 500);
    } else {
      await streamChat(updated);
    }
  }, [input, isStreaming, messages, streamChat]);

  // --- End Session ---
  const endSession = useCallback(async (finalMessages?: Msg[]) => {
    const conversationHistory = finalMessages ?? messages;
    setView("scoring");

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          mode: "score",
          conversationHistory,
          roleName: profile?.role_name || "New Employee",
          sessionType,
          rubricItems: rubricItems.map(r => ({ id: r.id, label: r.label, description: r.description })),
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Scoring failed" }));
        throw new Error(err.error || "Scoring failed");
      }

      const result = await resp.json();
      setScoringResult(result);

      // Save to DB
      const { error } = await supabase
        .from("onboarding_roleplay_sessions")
        .insert({
          assignment_id: assignment!.id,
          user_id: user!.id,
          tenant_id: tenantId,
          session_type: sessionType!,
          conversation_history: conversationHistory as unknown as Json,
          is_complete: true,
          overall_score: Math.round(result.overallScore),
          rubric_scores: result.rubricScores as unknown as Json,
          summary_feedback: result.summaryFeedback,
          completed_at: new Date().toISOString(),
        });

      if (error) throw error;

      refetchSessions();
      setView("score");
    } catch (e: any) {
      toast({ title: "Scoring Error", description: e.message, variant: "destructive" });
      setView("chat"); // Return to chat on error
    }
  }, [messages, profile, sessionType, rubricItems, assignment, user, tenantId, refetchSessions]);

  // --- Key handler for textarea ---
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // --- Review a previous session ---
  const openReview = (session: any) => {
    setReviewSession(session);
    setMessages((session.conversation_history as Msg[]) ?? []);
    setScoringResult({
      overallScore: session.overall_score ?? 0,
      rubricScores: (session.rubric_scores as RubricScore[]) ?? [],
      summaryFeedback: session.summary_feedback ?? "",
    });
    setView("review");
  };

  // ======================== BRIEFING VIEW ========================
  if (view === "briefing") {
    const topic = isElevatorPitch ? profile?.elevator_pitch_topic : profile?.capstone_scenario_description;

    return (
      <div className="space-y-6 max-w-3xl mx-auto pb-12">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Button variant="ghost" size="sm" onClick={() => navigate("/talent/onboarding/my-journey")} className="mb-4 -ml-2">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Journey
          </Button>

          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">{sessionIcon}</span>
            <h1 className="text-2xl font-bold tracking-tight">{sessionLabel}</h1>
          </div>

          <p className="text-muted-foreground leading-relaxed mt-2">
            {isElevatorPitch
              ? "In this session, you'll deliver a short elevator pitch to the Coach, who will play the role of a prospect or executive. After your pitch, the Coach will ask follow-up questions. When you're ready to end the session and receive your score, type 'done' or click End Session. There are no open books in this simulation. Rely on what you've learned."
              : "This is your preparation environment for the capstone. The Coach will guide you through the scenario below as if it were real. You can practice as many times as you need — no open books. When you're ready to end the session and receive your score and feedback, type 'done' or click End Session. Your in-person capstone will use this same scenario."}
          </p>
        </motion.div>

        {/* Prompt / Scenario Callout */}
        {topic && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-primary">
                  {isElevatorPitch ? "Your Prompt" : "Your Scenario Brief"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-base leading-relaxed">{topic}</p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Previous Sessions */}
        {completedSessions.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="secondary">
                {completedSessions.length} session{completedSessions.length !== 1 ? "s" : ""} completed
              </Badge>
              {bestScore > 0 && (
                <Badge variant="outline">Best score: {bestScore}/5</Badge>
              )}
            </div>

            <div className="space-y-2">
              {completedSessions.map(session => (
                <Card key={session.id} className="bg-muted/30">
                  <CardContent className="flex items-center justify-between py-3 px-4">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">
                          {format(new Date(session.started_at), "MMM d, yyyy · h:mm a")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Score: {session.overall_score ?? "—"}/5
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => openReview(session)}>
                      Review <ChevronRight className="h-3 w-3 ml-1" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Button size="lg" onClick={startSession} className="w-full sm:w-auto">
            Start New Session <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </motion.div>
      </div>
    );
  }

  // ======================== SCORING OVERLAY ========================
  if (view === "scoring") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <h2 className="text-xl font-semibold">Coach is scoring your session...</h2>
          <p className="text-muted-foreground">Reviewing your performance against the rubric.</p>
        </motion.div>
      </div>
    );
  }

  // ======================== SCORE VIEW ========================
  if (view === "score" && scoringResult) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto pb-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Overall Score */}
          <div className="text-center py-8">
            <div className="text-6xl font-bold tracking-tight">
              {scoringResult.overallScore.toFixed(1)}
              <span className="text-2xl text-muted-foreground font-normal"> / 5</span>
            </div>
            <p className={`text-lg font-semibold mt-2 ${getScoreLabelColor(scoringResult.overallScore)}`}>
              {getScoreLabel(scoringResult.overallScore)}
            </p>
            <p className="text-sm text-muted-foreground mt-1">{sessionLabel}</p>
          </div>

          <Separator />

          {/* Rubric Breakdown */}
          <div className="space-y-3 mt-6">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Rubric Breakdown</h3>
            {scoringResult.rubricScores.map((rs) => (
              <Card key={rs.rubricItemId} className="bg-muted/30">
                <CardContent className="py-4 px-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{rs.label}</span>
                    <div className="flex items-center gap-2">
                      <ScoreDots score={rs.score} />
                      <span className="text-sm font-semibold">{rs.score}/5</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{rs.feedback}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Summary Feedback */}
          <Card className="mt-6 border-primary/20 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-primary">Coach Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">{scoringResult.summaryFeedback}</p>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3 mt-8">
            <Button onClick={startSession} variant="outline" className="flex-1">
              <RotateCcw className="h-4 w-4 mr-2" /> Practice Again
            </Button>
            <Button onClick={() => navigate("/talent/onboarding/my-journey")} className="flex-1">
              Return to My Journey
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ======================== REVIEW VIEW ========================
  if (view === "review" && reviewSession) {
    const reviewScores = (reviewSession.rubric_scores as RubricScore[]) ?? [];

    return (
      <div className="space-y-6 max-w-3xl mx-auto pb-12">
        <Button variant="ghost" size="sm" onClick={() => { setView("briefing"); setReviewSession(null); }} className="-ml-2">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Briefing
        </Button>

        <h2 className="text-xl font-bold">Session Review — {format(new Date(reviewSession.started_at), "MMM d, yyyy")}</h2>

        {/* Transcript */}
        <Card>
          <CardContent className="p-4 space-y-3 max-h-[50vh] overflow-y-auto">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-muted rounded-bl-md"
                }`}>
                  <ReactMarkdown className="prose prose-sm dark:prose-invert max-w-none [&>p]:m-0">{msg.content}</ReactMarkdown>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Score Summary */}
        <div className="text-center py-4">
          <div className="text-4xl font-bold">{reviewSession.overall_score ?? 0}<span className="text-lg text-muted-foreground"> / 5</span></div>
          <p className={`font-semibold ${getScoreLabelColor(reviewSession.overall_score ?? 0)}`}>
            {getScoreLabel(reviewSession.overall_score ?? 0)}
          </p>
        </div>

        {reviewScores.length > 0 && (
          <div className="space-y-2">
            {reviewScores.map(rs => (
              <Card key={rs.rubricItemId} className="bg-muted/30">
                <CardContent className="py-3 px-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{rs.label}</span>
                    <div className="flex items-center gap-2">
                      <ScoreDots score={rs.score} />
                      <span className="text-sm font-semibold">{rs.score}/5</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{rs.feedback}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {reviewSession.summary_feedback && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-primary">Coach Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">{reviewSession.summary_feedback}</p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // ======================== CHAT VIEW ========================
  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-2.5 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-lg">{sessionIcon}</span>
          <span className="font-semibold text-sm">{sessionLabel}</span>
          {profile?.role_name && (
            <Badge variant="outline" className="text-xs">{profile.role_name}</Badge>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span className="font-mono">{formatTimer(elapsedSeconds)}</span>
          </div>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => endSession()}
            disabled={isStreaming || messages.length < 2}
          >
            End Session & Get Score
          </Button>
        </div>
      </div>

      {/* Chat Area */}
      <ScrollArea className="flex-1 px-4">
        <div className="max-w-3xl mx-auto py-4 space-y-3">
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <Avatar className="h-8 w-8 mr-2 mt-1 shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">AI</AvatarFallback>
                </Avatar>
              )}
              <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-md"
                  : "bg-muted rounded-bl-md"
              }`}>
                <ReactMarkdown className="prose prose-sm dark:prose-invert max-w-none [&>p]:m-0">{msg.content}</ReactMarkdown>
              </div>
            </motion.div>
          ))}
          {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="flex justify-start">
              <Avatar className="h-8 w-8 mr-2 mt-1 shrink-0">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">AI</AvatarFallback>
              </Avatar>
              <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t px-4 py-3 shrink-0">
        <div className="max-w-3xl mx-auto flex gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your response..."
            className="min-h-[44px] max-h-[120px] resize-none"
            rows={1}
            disabled={isStreaming}
          />
          <Button
            onClick={sendMessage}
            disabled={!input.trim() || isStreaming}
            size="icon"
            className="shrink-0 h-11 w-11"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
