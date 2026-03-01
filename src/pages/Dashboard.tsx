import { motion } from "framer-motion";
import { Activity, CheckCircle, Clock, TrendingUp, Zap, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { dashboardMetrics, mockTasks, agents } from "@/data/mock-data";
import { Link } from "react-router-dom";

const statusColors: Record<string, string> = {
  completed: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  running: "bg-primary/20 text-primary border-primary/30",
  needs_review: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  queued: "bg-muted text-muted-foreground border-border",
  failed: "bg-destructive/20 text-destructive border-destructive/30",
};

const metrics = [
  { label: "Active Agents", value: dashboardMetrics.activeAgents, icon: Zap, color: "text-primary" },
  { label: "Tasks Today", value: dashboardMetrics.tasksToday, icon: CheckCircle, color: "text-emerald-400" },
  { label: "In Queue", value: dashboardMetrics.tasksInQueue, icon: Clock, color: "text-amber-400" },
  { label: "Success Rate", value: `${dashboardMetrics.successRate}%`, icon: TrendingUp, color: "text-primary" },
];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

export default function Dashboard() {
  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8 max-w-7xl">
      <motion.div variants={item}>
        <h1 className="text-3xl font-bold tracking-tight">Command Center</h1>
        <p className="text-muted-foreground mt-1">Real-time overview of your AI workforce</p>
      </motion.div>

      {/* Metrics */}
      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <Card key={m.label} className="glass-card">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <m.icon className={`h-5 w-5 ${m.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{m.value}</p>
                <p className="text-xs text-muted-foreground">{m.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Timeline */}
        <motion.div variants={item} className="lg:col-span-2">
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                Recent Activity
              </CardTitle>
              <Link to="/activity">
                <Button variant="ghost" size="sm" className="text-muted-foreground text-xs">
                  View all <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockTasks.map((task) => {
                const agent = agents.find((a) => a.id === task.agentId);
                return (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <span className="text-lg">{agent?.avatar}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{task.title}</p>
                      <p className="text-xs text-muted-foreground">{agent?.name} · {task.department}</p>
                    </div>
                    <Badge variant="outline" className={statusColors[task.status]}>
                      {task.status.replace("_", " ")}
                    </Badge>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>

        {/* Department Summary */}
        <motion.div variants={item} className="space-y-4">
          {(["marketing", "sales"] as const).map((dept) => {
            const deptAgents = agents.filter((a) => a.department === dept);
            const deptTasks = mockTasks.filter((t) => t.department === dept);
            const activeTasks = deptTasks.filter((t) => t.status === "running" || t.status === "queued").length;
            return (
              <Card key={dept} className="glass-card">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold capitalize">{dept}</h3>
                    <Link to={`/departments/${dept}`}>
                      <Button variant="ghost" size="sm" className="text-xs text-muted-foreground h-7">
                        Open <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                  <div className="flex gap-4 text-sm">
                    <div>
                      <p className="text-xl font-bold">{deptAgents.length}</p>
                      <p className="text-xs text-muted-foreground">Agents</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold">{activeTasks}</p>
                      <p className="text-xs text-muted-foreground">Active</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold">{deptTasks.length}</p>
                      <p className="text-xs text-muted-foreground">Total</p>
                    </div>
                  </div>
                  <div className="flex gap-1 mt-3">
                    {deptAgents.map((a) => (
                      <span key={a.id} className="text-sm" title={a.name}>{a.avatar}</span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </motion.div>
      </div>
    </motion.div>
  );
}
