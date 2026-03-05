import { useState, useEffect, useRef } from "react";
import { useParams, Navigate, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ArrowRight, Loader2, MessageSquare, Plus, Clock } from "lucide-react";
import {
  departmentDefinitions,
  departmentAgents,
  agentDefinitions,
  dbRowToSkill,
  type Department as DeptType,
  type Skill,
} from "@/data/mock-data";
import { SkillForm } from "@/components/SkillForm";
import { runSkill, runDeckSkill } from "@/lib/agent-client";
import { useToast } from "@/hooks/use-toast";
import { useTenant } from "@/contexts/TenantContext";
import { supabase } from "@/integrations/supabase/client";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

const COACHING_SKILL_NAMES = ["new-employee-onboarding", "career-coaching"];

interface CoachingSession {
  id: string;
  title: string;
  status: string;
  session_data: any;
  updated_at: string;
  skill_id: string;
}

export default function Department() {
  const { dept } = useParams<{ dept: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { tenantId } = useTenant();
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [deptSkills, setDeptSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedbackStats, setFeedbackStats] = useState<Record<string, { total: number; positive: number }>>({});
  const abortRef = useRef<AbortController | null>(null);

  // Session picker state
  const [showSessionPicker, setShowSessionPicker] = useState(false);
  const [pendingSkill, setPendingSkill] = useState<Skill | null>(null);
  const [activeSessions, setActiveSessions] = useState<CoachingSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const isValidDept = dept && departmentDefinitions[dept as DeptType];
  const department = (dept || "marketing") as DeptType;
  const deptMeta = departmentDefinitions[department] || departmentDefinitions.marketing;
  const agents = departmentAgents[department] || [];

  const isCoachingSkill = (skill: Skill) => COACHING_SKILL_NAMES.includes(skill.name);

  useEffect(() => {
    if (!isValidDept) return;
    const fetchSkills = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("skills")
        .select("*")
        .eq("department", department);
      if (data) {
        const skills = data.map(dbRowToSkill);
        setDeptSkills(skills);
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
    fetchSkills();
  }, [department, isValidDept]);

  const handleSkillClick = async (skill: Skill) => {
    if (!isCoachingSkill(skill)) {
      setSelectedSkill(skill);
      setSelectedSessionId(null);
      return;
    }

    // For coaching skills, check for active sessions
    setLoadingSessions(true);
    setPendingSkill(skill);
    setShowSessionPicker(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: sessions } = await supabase
        .from("coaching_sessions")
        .select("id, title, status, session_data, updated_at, skill_id")
        .eq("skill_id", skill.id)
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("updated_at", { ascending: false });
      setActiveSessions((sessions as CoachingSession[]) || []);
    }
    setLoadingSessions(false);
  };

  const startNewSession = async () => {
    if (!pendingSkill || !tenantId) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: session, error } = await supabase
      .from("coaching_sessions")
      .insert({
        tenant_id: tenantId,
        user_id: user.id,
        skill_id: pendingSkill.id,
        skill_name: pendingSkill.name,
        title: `${pendingSkill.displayName} — ${new Date().toLocaleDateString()}`,
        status: "active",
        session_data: {},
        messages: [],
      })
      .select("id")
      .single();

    if (error) {
      toast({ title: "Error creating session", description: error.message, variant: "destructive" });
      return;
    }

    setSelectedSessionId(session.id);
    setSelectedSkill(pendingSkill);
    setShowSessionPicker(false);
    setPendingSkill(null);
  };

  const continueSession = (session: CoachingSession) => {
    setSelectedSessionId(session.id);
    setSelectedSkill(pendingSkill);
    setShowSessionPicker(false);
    setPendingSkill(null);
  };

  const handleSubmit = async (data: Record<string, string>) => {
    if (!selectedSkill) return;
    setIsRunning(true);

    // Inject session ID for coaching skills
    if (selectedSessionId) {
      data._session_id = selectedSessionId;
    }

    // Deck generation flow (pptx output)
    if (selectedSkill.outputFormat === "pptx") {
      try {
        const deckType = selectedSkill.name.toLowerCase().includes("proposal") ? "proposal" : "capabilities";
        toast({ title: "Generating deck...", description: "This may take 30-60 seconds." });
        const result = await runDeckSkill({ skill: selectedSkill, inputs: data, deckType, tenantId: tenantId || undefined });
        setSelectedSkill(null);
        setIsRunning(false);
        toast({ title: "Deck ready!", description: `${result.slideCount} slides generated.` });
        navigate(`/jobs/${result.jobId}`);
      } catch (e) {
        setIsRunning(false);
        toast({ title: "Error", description: e instanceof Error ? e.message : "Deck generation failed", variant: "destructive" });
      }
      return;
    }

    // Standard streaming flow
    const controller = new AbortController();
    abortRef.current = controller;

    let jobId: string | null = null;

    runSkill({
      skill: selectedSkill,
      inputs: data,
      tenantId: tenantId || undefined,
      signal: controller.signal,
      onJobId: (id) => {
        jobId = id;
        toast({ title: "Job started", description: "Redirecting to results..." });
        setSelectedSkill(null);
        setIsRunning(false);
        setSelectedSessionId(null);
        navigate(`/jobs/${id}`);
        controller.abort();
      },
      onDelta: () => {},
      onDone: () => {
        setIsRunning(false);
        if (!jobId) {
          toast({ title: "Job completed", variant: "default" });
        }
      },
      onError: (error) => {
        setIsRunning(false);
        if (!controller.signal.aborted) {
          toast({ title: "Error", description: error, variant: "destructive" });
        }
      },
    });
  };

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  if (!isValidDept) {
    return <Navigate to="/" replace />;
  }

  return (
    <>
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-8 max-w-7xl">
        <motion.div variants={item}>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{deptMeta.emoji}</span>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{deptMeta.name}</h1>
              <p className="text-muted-foreground mt-1">{deptMeta.description}</p>
            </div>
          </div>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          agents.map((agentType) => {
            const agent = agentDefinitions.find((a) => a.type === agentType);
            const agentSkills = deptSkills.filter((s) => s.agentType === agentType);
            if (!agent || agentSkills.length === 0) return null;

            return (
              <motion.div key={agentType} variants={item} className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{agent.emoji}</span>
                  <h2 className="text-lg font-semibold">{agent.name}</h2>
                  <Badge variant="outline" className="text-[10px] text-muted-foreground">
                    {agentSkills.length} {agentSkills.length === 1 ? "skill" : "skills"}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {agentSkills.map((skill) => (
                    <Card
                      key={skill.id}
                      className="glass-card hover:border-primary/30 transition-all cursor-pointer group"
                      onClick={() => handleSkillClick(skill)}
                    >
                      <CardContent className="p-5 space-y-3">
                        <div className="flex items-start justify-between">
                          <span className="text-2xl">{skill.emoji}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground group-hover:text-primary transition-colors"
                          >
                            Run <ArrowRight className="ml-1 h-3 w-3" />
                          </Button>
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold">{skill.displayName || skill.name}</h3>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{skill.description}</p>
                          {isCoachingSkill(skill) && (
                            <Badge variant="secondary" className="text-[10px] mt-1.5 gap-1">
                              <MessageSquare className="h-2.5 w-2.5" /> Multi-session
                            </Badge>
                          )}
                          {feedbackStats[skill.id]?.total >= 5 && (
                            <p className="text-[10px] text-muted-foreground mt-1">
                              ⭐ {Math.round((feedbackStats[skill.id].positive / feedbackStats[skill.id].total) * 100)}% positive ({feedbackStats[skill.id].total} ratings)
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] bg-muted/50 border-border/50 text-muted-foreground">
                            {skill.inputs.length} inputs
                          </Badge>
                          {skill.estimatedCost && (
                            <Badge variant="outline" className="text-[10px] bg-muted/50 border-border/50 text-muted-foreground">
                              ~${skill.estimatedCost.toFixed(2)}
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </motion.div>
            );
          })
        )}
      </motion.div>

      {/* Session Picker Sheet */}
      <Sheet open={showSessionPicker} onOpenChange={(open) => { if (!open) { setShowSessionPicker(false); setPendingSkill(null); } }}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <span className="text-2xl">{pendingSkill?.emoji}</span>
              {pendingSkill?.displayName}
            </SheetTitle>
            <SheetDescription>This is a multi-session coaching experience with persistent memory.</SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <Button onClick={startNewSession} className="w-full gap-2" variant="default">
              <Plus className="h-4 w-4" /> Start New Session
            </Button>

            {loadingSessions ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : activeSessions.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Or continue an existing session:</p>
                {activeSessions.map((session) => (
                  <Card
                    key={session.id}
                    className="glass-card hover:border-primary/30 transition-all cursor-pointer"
                    onClick={() => continueSession(session)}
                  >
                    <CardContent className="p-4 space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium truncate">{session.title}</h4>
                        <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        Last active: {new Date(session.updated_at).toLocaleDateString()}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-2">No active sessions yet. Start your first one above!</p>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Skill Form Sheet */}
      <Sheet open={!!selectedSkill} onOpenChange={(open) => !open && !isRunning && setSelectedSkill(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <span className="text-2xl">{selectedSkill?.emoji}</span>
              {selectedSkill?.displayName || selectedSkill?.name}
            </SheetTitle>
            <SheetDescription>{selectedSkill?.description}</SheetDescription>
            {selectedSessionId && (
              <Badge variant="secondary" className="w-fit gap-1 mt-1">
                <MessageSquare className="h-3 w-3" /> Continuing session
              </Badge>
            )}
          </SheetHeader>
          <div className="mt-6">
            {selectedSkill && <SkillForm skill={selectedSkill} onSubmit={handleSubmit} isRunning={isRunning} sessionId={selectedSessionId} />}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
