import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Zap, Brain, FileText, TrendingUp, ArrowRight, Briefcase, Megaphone, Loader2, CalendarClock, Clock, X, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { agentDefinitions, departmentDefinitions, type Department } from "@/data/mock-data";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

const statusColors: Record<string, string> = {
  complete: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  running: "bg-primary/20 text-primary border-primary/30",
  queued: "bg-muted text-muted-foreground border-border",
  failed: "bg-destructive/20 text-destructive border-destructive/30",
};

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

const deptIcons: Record<string, React.ElementType> = { sales: Briefcase, marketing: Megaphone };

export default function Dashboard() {
  const [recentJobs, setRecentJobs] = useState<any[]>([]);
  const [jobCount, setJobCount] = useState(0);
  const [docCount, setDocCount] = useState(0);
  const [totalTokens, setTotalTokens] = useState(0);
  const [upcomingTasks, setUpcomingTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQuickStart, setShowQuickStart] = useState(() => localStorage.getItem("show_quick_start") === "true");

  const quickStartPacks = (() => {
    try { return JSON.parse(localStorage.getItem("quick_start_packs") || "[]"); } catch { return []; }
  })();

  const dismissQuickStart = () => {
    setShowQuickStart(false);
    localStorage.removeItem("show_quick_start");
    localStorage.removeItem("quick_start_packs");
  };

  const suggestedSkills: { name: string; dept: string }[] = [];
  if (quickStartPacks.includes("presales")) suggestedSkills.push({ name: "RFP Response Drafter", dept: "sales" }, { name: "Discovery Prep", dept: "sales" });
  if (quickStartPacks.includes("sales")) suggestedSkills.push({ name: "Account Research", dept: "sales" });
  if (quickStartPacks.includes("marketing")) suggestedSkills.push({ name: "LinkedIn Post", dept: "marketing" });
  const topSuggestions = suggestedSkills.slice(0, 3);

  useEffect(() => {
    const fetchData = async () => {
      const [jobsRes, countRes, docsRes, tokensRes, tasksRes] = await Promise.all([
        supabase.from("agent_jobs").select("*").order("created_at", { ascending: false }).limit(5),
        supabase.from("agent_jobs").select("id", { count: "exact", head: true }),
        supabase.from("knowledge_documents").select("id", { count: "exact", head: true }),
        supabase.from("agent_jobs").select("tokens_used").eq("status", "complete"),
        supabase.from("scheduled_tasks").select("*").eq("status", "active").order("next_run_at", { ascending: true }).limit(3),
      ]);
      setRecentJobs(jobsRes.data || []);
      setJobCount(countRes.count || 0);
      setDocCount(docsRes.count || 0);
      setTotalTokens((tokensRes.data || []).reduce((sum, j) => sum + (j.tokens_used || 0), 0));
      setUpcomingTasks(tasksRes.data || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  const metrics = [
    { label: "Total Runs", value: jobCount, icon: Zap, color: "text-primary" },
    { label: "Tokens Used", value: totalTokens.toLocaleString(), icon: Brain, color: "text-accent" },
    { label: "Knowledge Base", value: `${docCount} docs`, icon: FileText, color: "text-emerald-400" },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8 max-w-7xl">
      {/* Quick Start Banner */}
      {showQuickStart && (
        <motion.div variants={item} className="relative rounded-2xl p-6 border border-primary/30 bg-primary/5">
          <button onClick={dismissQuickStart} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div>
              <h3 className="font-semibold">Your workspace is ready! Try a skill:</h3>
              <div className="flex flex-wrap gap-2 mt-2">
                {topSuggestions.map((s) => (
                  <Link key={s.name} to={`/departments/${s.dept}`}>
                    <Button variant="outline" size="sm" className="gap-1 border-primary/30 hover:border-primary">
                      {s.name} <ArrowRight className="h-3 w-3" />
                    </Button>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Hero */}
      <motion.div variants={item} className="relative overflow-hidden rounded-2xl p-8 glass-card glow-border">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold tracking-tight">Put your AI agents to work</h1>
          <p className="text-muted-foreground mt-2 max-w-lg">
            Select a department to browse skills, or explore Capabilities to build new ones.
          </p>
          <div className="flex flex-wrap gap-3 mt-6">
            {Object.entries(departmentDefinitions).map(([key, dept]) => {
              const Icon = deptIcons[key];
              return (
                <Link key={key} to={`/departments/${key}`}>
                  <Button variant="outline" className="gap-2 border-border/50 bg-card/50 hover:bg-card hover:border-primary/50 transition-all">
                    <Icon className="h-4 w-4" />
                    {dept.name}
                  </Button>
                </Link>
              );
            })}
            <Link to="/capabilities">
              <Button variant="outline" className="gap-2 border-border/50 bg-card/50 hover:bg-card hover:border-primary/50 transition-all">
                ✨ Capabilities
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Stat cards */}
      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {metrics.map((m) => (
          <Card key={m.label} className="glass-card">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <m.icon className={`h-5 w-5 ${m.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{loading ? "—" : m.value}</p>
                <p className="text-xs text-muted-foreground">{m.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Scheduled Tasks */}
      <motion.div variants={item}>
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-primary" />
              Scheduled Tasks
            </CardTitle>
            <Link to="/tasks">
              <Button variant="ghost" size="sm" className="text-muted-foreground text-xs">
                View all <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : upcomingTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No scheduled tasks yet. Set one up to automate your skills.</p>
            ) : (
              upcomingTasks.map((task: any) => (
                <Link key={task.id} to="/tasks" className="block">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <CalendarClock className="h-4 w-4 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{task.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {task.skill_name} · {task.schedule_type}
                      </p>
                    </div>
                    {task.next_run_at && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(task.next_run_at), { addSuffix: true })}
                      </span>
                    )}
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Activity */}
      <motion.div variants={item}>
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              Recent Activity
            </CardTitle>
            <Link to="/history">
              <Button variant="ghost" size="sm" className="text-muted-foreground text-xs">
                View all <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : recentJobs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No agent runs yet. Go to a department and run a skill!</p>
            ) : (
              recentJobs.map((job) => {
                const agent = agentDefinitions.find((a) => a.type === job.agent_type);
                const dept = departmentDefinitions[job.department as Department];
                return (
                  <Link key={job.id} to={`/jobs/${job.id}`} className="block">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <span className="text-lg">{agent?.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{job.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {dept?.name} · {agent?.name} · {new Date(job.created_at).toLocaleString()}
                        </p>
                      </div>
                      <Badge variant="outline" className={statusColors[job.status] || ""}>
                        {job.status}
                      </Badge>
                    </div>
                  </Link>
                );
              })
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
