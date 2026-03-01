import { motion } from "framer-motion";
import { Zap, Brain, FileText, TrendingUp, ArrowRight, Briefcase, Megaphone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { dashboardMetrics, mockJobs, agentDefinitions, departmentDefinitions } from "@/data/mock-data";
import { Link } from "react-router-dom";

const statusColors: Record<string, string> = {
  complete: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  running: "bg-primary/20 text-primary border-primary/30",
  queued: "bg-muted text-muted-foreground border-border",
  failed: "bg-destructive/20 text-destructive border-destructive/30",
  retrying: "bg-amber-500/20 text-amber-400 border-amber-500/30",
};

const metrics = [
  { label: "Agent Runs Today", value: dashboardMetrics.agentRunsToday, icon: Zap, color: "text-primary" },
  { label: "Tokens Used", value: dashboardMetrics.tokensUsed.toLocaleString(), icon: Brain, color: "text-accent" },
  { label: "Knowledge Base", value: `${dashboardMetrics.knowledgeBaseSize} docs`, icon: FileText, color: "text-emerald-400" },
  { label: "Avg Confidence", value: `${dashboardMetrics.avgConfidence}%`, icon: TrendingUp, color: "text-amber-400" },
];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

const deptIcons: Record<string, React.ElementType> = { sales: Briefcase, marketing: Megaphone };

export default function Dashboard() {
  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8 max-w-7xl">
      {/* Hero */}
      <motion.div variants={item} className="relative overflow-hidden rounded-2xl p-8 glass-card glow-border">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold tracking-tight">What do you need today?</h1>
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
            {mockJobs.slice(0, 5).map((job) => {
              const agent = agentDefinitions.find((a) => a.type === job.agentType);
              const dept = departmentDefinitions[job.department];
              return (
                <div key={job.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <span className="text-lg">{agent?.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{job.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {dept?.name} · {agent?.name} · {new Date(job.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant="outline" className={statusColors[job.status]}>
                    {job.status}
                  </Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
