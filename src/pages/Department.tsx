import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { agents, mockTasks, skills } from "@/data/mock-data";
import { Play, CheckCircle, Clock, TrendingUp } from "lucide-react";

const statusDot: Record<string, string> = {
  online: "bg-emerald-400",
  busy: "bg-amber-400",
  offline: "bg-muted-foreground/40",
};

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

export default function Department() {
  const { dept } = useParams<{ dept: string }>();
  const department = dept as "marketing" | "sales";
  const deptAgents = agents.filter((a) => a.department === department);
  const deptTasks = mockTasks.filter((t) => t.department === department);
  const completed = deptTasks.filter((t) => t.status === "completed").length;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8 max-w-6xl">
      <motion.div variants={item}>
        <h1 className="text-3xl font-bold tracking-tight capitalize">{department}</h1>
        <p className="text-muted-foreground mt-1">Manage agents and review recent work</p>
      </motion.div>

      {/* Department Metrics */}
      <motion.div variants={item} className="flex gap-6 text-sm">
        {[
          { label: "Tasks Run", value: deptTasks.length, icon: CheckCircle },
          { label: "Completed", value: completed, icon: TrendingUp },
          { label: "In Progress", value: deptTasks.filter((t) => t.status === "running").length, icon: Clock },
        ].map((m) => (
          <div key={m.label} className="flex items-center gap-2">
            <m.icon className="h-4 w-4 text-primary" />
            <span className="font-bold text-lg">{m.value}</span>
            <span className="text-muted-foreground">{m.label}</span>
          </div>
        ))}
      </motion.div>

      {/* Agent Cards */}
      <motion.div variants={item}>
        <h2 className="text-lg font-semibold mb-4">Agents</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {deptAgents.map((agent) => (
            <Card key={agent.id} className="glass-card hover:glow-border transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{agent.avatar}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{agent.name}</h3>
                        <span className={`h-2 w-2 rounded-full ${statusDot[agent.status]}`} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{agent.description}</p>
                    </div>
                  </div>
                  <Button size="sm" className="shrink-0 gap-1">
                    <Play className="h-3 w-3" /> Launch
                  </Button>
                </div>
                <div className="flex gap-1.5 mt-3">
                  {agent.skills.map((sid) => {
                    const s = skills.find((sk) => sk.id === sid);
                    return (
                      <Badge key={sid} variant="secondary" className="text-[10px]">
                        {s?.icon} {s?.name}
                      </Badge>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>

      {/* Recent Outputs */}
      <motion.div variants={item}>
        <h2 className="text-lg font-semibold mb-4">Recent Outputs</h2>
        <div className="space-y-3">
          {deptTasks
            .filter((t) => t.output)
            .map((task) => {
              const agent = agents.find((a) => a.id === task.agentId);
              return (
                <Card key={task.id} className="glass-card">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span>{agent?.avatar}</span>
                      <span className="font-medium text-sm">{task.title}</span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 whitespace-pre-line">{task.output}</p>
                  </CardContent>
                </Card>
              );
            })}
        </div>
      </motion.div>
    </motion.div>
  );
}
