import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CalendarClock, Plus, Pause, Play, Trash2, Loader2, ArrowRight, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { dbRowToSkill, type Skill } from "@/data/mock-data";
import { SkillForm } from "@/components/SkillForm";
import { useToast } from "@/hooks/use-toast";
import { useTenant } from "@/hooks/use-tenant";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

const scheduleColors: Record<string, string> = {
  daily: "bg-primary/20 text-primary border-primary/30",
  weekly: "bg-accent/20 text-accent-foreground border-accent/30",
  monthly: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  once: "bg-muted text-muted-foreground border-border",
  custom: "bg-amber-500/20 text-amber-400 border-amber-500/30",
};

const statusColors: Record<string, string> = {
  active: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  paused: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  completed: "bg-muted text-muted-foreground border-border",
};

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

type ScheduledTask = {
  id: string;
  skill_id: string;
  skill_name: string;
  department: string;
  agent_type: string;
  title: string;
  inputs: Record<string, any>;
  schedule_type: string;
  cron_expression: string;
  next_run_at: string | null;
  last_run_at: string | null;
  last_job_id: string | null;
  status: string;
  run_count: number;
  created_at: string;
};

export default function Tasks() {
  const { toast } = useToast();
  const { tenantId } = useTenant();
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  // New task wizard state
  const [wizardStep, setWizardStep] = useState(1);
  const [schedulableSkills, setSchedulableSkills] = useState<Skill[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [collectedInputs, setCollectedInputs] = useState<Record<string, string>>({});
  const [scheduleType, setScheduleType] = useState("daily");
  const [scheduleHour, setScheduleHour] = useState("9");
  const [scheduleDow, setScheduleDow] = useState("1");
  const [scheduleDom, setScheduleDom] = useState("1");
  const [customCron, setCustomCron] = useState("0 9 * * *");
  const [taskTitle, setTaskTitle] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchTasks = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("scheduled_tasks")
      .select("*")
      .order("created_at", { ascending: false });
    setTasks((data as ScheduledTask[]) || []);
    setLoading(false);
  };

  const fetchSchedulableSkills = async () => {
    const { data } = await supabase.from("skills").select("*").eq("schedulable", true).order("department").order("name");
    if (data) setSchedulableSkills(data.map(dbRowToSkill));
  };

  useEffect(() => {
    fetchTasks();
    fetchSchedulableSkills();
  }, []);

  const resetWizard = () => {
    setWizardStep(1);
    setSelectedSkill(null);
    setCollectedInputs({});
    setScheduleType("daily");
    setScheduleHour("9");
    setScheduleDow("1");
    setScheduleDom("1");
    setCustomCron("0 9 * * *");
    setTaskTitle("");
  };

  const buildCronExpression = (): string => {
    const h = parseInt(scheduleHour) || 9;
    switch (scheduleType) {
      case "daily": return `0 ${h} * * *`;
      case "weekly": return `0 ${h} * * ${scheduleDow}`;
      case "monthly": return `0 ${h} ${scheduleDom} * *`;
      case "custom": return customCron;
      case "once": return `0 ${h} * * *`;
      default: return `0 ${h} * * *`;
    }
  };

  const computeInitialNextRun = (): string => {
    const now = new Date();
    const h = parseInt(scheduleHour) || 9;

    if (scheduleType === "daily" || scheduleType === "once") {
      const next = new Date(now);
      next.setUTCHours(h, 0, 0, 0);
      if (next <= now) next.setUTCDate(next.getUTCDate() + 1);
      return next.toISOString();
    }
    if (scheduleType === "weekly") {
      const next = new Date(now);
      next.setUTCHours(h, 0, 0, 0);
      const dow = parseInt(scheduleDow);
      let daysUntil = dow - next.getUTCDay();
      if (daysUntil <= 0) daysUntil += 7;
      next.setUTCDate(next.getUTCDate() + daysUntil);
      return next.toISOString();
    }
    if (scheduleType === "monthly") {
      const next = new Date(now);
      next.setUTCHours(h, 0, 0, 0);
      next.setUTCDate(parseInt(scheduleDom) || 1);
      if (next <= now) next.setUTCMonth(next.getUTCMonth() + 1);
      return next.toISOString();
    }
    // custom fallback
    const next = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    return next.toISOString();
  };

  const createTask = async () => {
    if (!selectedSkill || !taskTitle) return;
    setCreating(true);

    const { error } = await supabase.from("scheduled_tasks").insert({
      skill_id: selectedSkill.id,
      skill_name: selectedSkill.displayName || selectedSkill.name,
      department: selectedSkill.department,
      agent_type: selectedSkill.agentType,
      title: taskTitle,
      inputs: collectedInputs,
      schedule_type: scheduleType,
      cron_expression: buildCronExpression(),
      next_run_at: computeInitialNextRun(),
      status: "active",
      tenant_id: tenantId!,
    });

    setCreating(false);
    if (error) {
      toast({ title: "Error creating task", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Scheduled task created!" });
      setDialogOpen(false);
      resetWizard();
      fetchTasks();
    }
  };

  const togglePause = async (task: ScheduledTask) => {
    const newStatus = task.status === "active" ? "paused" : "active";
    await supabase.from("scheduled_tasks").update({ status: newStatus }).eq("id", task.id);
    fetchTasks();
  };

  const deleteTask = async (id: string) => {
    await supabase.from("scheduled_tasks").delete().eq("id", id);
    fetchTasks();
    toast({ title: "Task deleted" });
  };

  const groupedSkills = schedulableSkills.reduce<Record<string, Skill[]>>((acc, s) => {
    const dept = s.department;
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(s);
    return acc;
  }, {});

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-7xl">
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <CalendarClock className="h-7 w-7 text-primary" />
            Scheduled Tasks
          </h1>
          <p className="text-muted-foreground mt-1">Automate skills to run on a schedule</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetWizard(); }}>
          <DialogTrigger asChild>
            <Button className="gap-1.5"><Plus className="h-4 w-4" /> New Task</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {wizardStep === 1 && "Name & Select a Skill"}
                {wizardStep === 2 && "Fill Inputs"}
                {wizardStep === 3 && "Set Schedule"}
                {wizardStep === 4 && "Confirm"}
              </DialogTitle>
            </DialogHeader>

            {/* Step 1: Select Skill */}
            {wizardStep === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Task Name</Label>
                  <Input
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    placeholder="e.g. Morning Coffee, Daily Briefing"
                    className="bg-muted/50 border-border/50"
                  />
                </div>

                <div className="space-y-1">
                  <Label>Select a Skill</Label>
                  <p className="text-xs text-muted-foreground">Choose which skill this task will run.</p>
                </div>

                {Object.entries(groupedSkills).map(([dept, skills]) => (
                  <div key={dept}>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{dept}</p>
                    <div className="space-y-2">
                      {skills.map((skill) => (
                        <button
                          key={skill.id}
                          onClick={() => {
                            setSelectedSkill(skill);
                            if (!taskTitle) setTaskTitle(`${skill.displayName || skill.name}`);
                            setWizardStep(2);
                          }}
                          disabled={!taskTitle.trim()}
                          className="w-full flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/60 transition-colors text-left disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <span className="text-xl">{skill.emoji}</span>
                          <div>
                            <p className="text-sm font-medium">{skill.displayName || skill.name}</p>
                            <p className="text-xs text-muted-foreground line-clamp-1">{skill.description}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                {schedulableSkills.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-6">No schedulable skills available. Mark skills as schedulable in the Skill Builder.</p>
                )}
              </div>
            )}

            {/* Step 2: Fill Inputs */}
            {wizardStep === 2 && selectedSkill && (
              <div className="space-y-4">
                <SkillForm
                  skill={selectedSkill}
                  onSubmit={(data) => { setCollectedInputs(data); setWizardStep(3); }}
                  isRunning={false}
                />
                <Button variant="ghost" size="sm" onClick={() => setWizardStep(1)}>← Back</Button>
              </div>
            )}

            {/* Step 3: Set Schedule */}
            {wizardStep === 3 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <Select value={scheduleType} onValueChange={setScheduleType}>
                    <SelectTrigger className="bg-muted/50 border-border/50"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="once">Once</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="custom">Custom (Cron)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {scheduleType !== "custom" && (
                  <div className="space-y-2">
                    <Label>Time (UTC hour)</Label>
                    <Select value={scheduleHour} onValueChange={setScheduleHour}>
                      <SelectTrigger className="bg-muted/50 border-border/50"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, i) => (
                          <SelectItem key={i} value={String(i)}>{String(i).padStart(2, "0")}:00 UTC</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {scheduleType === "weekly" && (
                  <div className="space-y-2">
                    <Label>Day of Week</Label>
                    <Select value={scheduleDow} onValueChange={setScheduleDow}>
                      <SelectTrigger className="bg-muted/50 border-border/50"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {DAYS_OF_WEEK.map((day, i) => (
                          <SelectItem key={i} value={String(i)}>{day}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {scheduleType === "monthly" && (
                  <div className="space-y-2">
                    <Label>Day of Month</Label>
                    <Select value={scheduleDom} onValueChange={setScheduleDom}>
                      <SelectTrigger className="bg-muted/50 border-border/50"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 28 }, (_, i) => (
                          <SelectItem key={i + 1} value={String(i + 1)}>{i + 1}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {scheduleType === "custom" && (
                  <div className="space-y-2">
                    <Label>Cron Expression</Label>
                    <Input value={customCron} onChange={(e) => setCustomCron(e.target.value)} placeholder="0 9 * * 1" className="bg-muted/50 border-border/50 font-mono" />
                    <p className="text-[10px] text-muted-foreground">Format: minute hour day-of-month month day-of-week</p>
                  </div>
                )}

                <div className="flex justify-between pt-2">
                  <Button variant="ghost" size="sm" onClick={() => setWizardStep(2)}>← Back</Button>
                  <Button size="sm" onClick={() => setWizardStep(4)}>Next →</Button>
                </div>
              </div>
            )}

            {wizardStep === 4 && selectedSkill && (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-muted/30 space-y-2 text-sm">
                  <p><span className="font-medium">Task Name:</span> {taskTitle}</p>
                  <p><span className="font-medium">Skill:</span> {selectedSkill.emoji} {selectedSkill.displayName || selectedSkill.name}</p>
                  <p><span className="font-medium">Schedule:</span> {scheduleType} {scheduleType !== "custom" && `at ${String(scheduleHour).padStart(2, "0")}:00 UTC`}</p>
                  {scheduleType === "weekly" && <p><span className="font-medium">Day:</span> {DAYS_OF_WEEK[parseInt(scheduleDow)]}</p>}
                  {scheduleType === "monthly" && <p><span className="font-medium">Day of month:</span> {scheduleDom}</p>}
                  {scheduleType === "custom" && <p className="font-mono text-xs">{customCron}</p>}
                  <p><span className="font-medium">Inputs:</span> {Object.keys(collectedInputs).length} fields</p>
                </div>

                <div className="flex justify-between pt-2">
                  <Button variant="ghost" size="sm" onClick={() => setWizardStep(3)}>← Back</Button>
                  <Button size="sm" disabled={creating} onClick={createTask}>
                    {creating ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                    Create Task
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Task List */}
      <motion.div variants={item}>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : tasks.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="py-12 text-center">
              <CalendarClock className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No scheduled tasks yet.</p>
              <p className="text-sm text-muted-foreground mt-1">Create one to automate your skills on a recurring basis.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {tasks.map((task) => (
              <Card key={task.id} className="glass-card hover:border-primary/30 transition-all">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <h3 className="text-sm font-semibold">{task.title}</h3>
                    <div className="flex gap-1.5">
                      <Badge variant="outline" className={scheduleColors[task.schedule_type] || ""}>
                        {task.schedule_type}
                      </Badge>
                      <Badge variant="outline" className={statusColors[task.status] || ""}>
                        {task.status}
                      </Badge>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">{task.skill_name} · {task.department}</p>

                  <div className="space-y-1 text-xs text-muted-foreground">
                    {task.next_run_at && (
                      <p className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Next: {formatDistanceToNow(new Date(task.next_run_at), { addSuffix: true })}
                      </p>
                    )}
                    {task.last_run_at && (
                      <p>Last: {formatDistanceToNow(new Date(task.last_run_at), { addSuffix: true })}</p>
                    )}
                    <p>Runs: {task.run_count}</p>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    {task.last_job_id && (
                      <Link to={`/jobs/${task.last_job_id}`}>
                        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                          View last run <ArrowRight className="h-3 w-3" />
                        </Button>
                      </Link>
                    )}
                    <div className="ml-auto flex gap-1">
                      {task.status !== "completed" && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => togglePause(task)}>
                          {task.status === "active" ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteTask(task.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
