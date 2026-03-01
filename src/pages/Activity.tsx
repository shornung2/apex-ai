import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mockTasks, agents, skills } from "@/data/mock-data";
import { Search, CheckCircle, XCircle } from "lucide-react";
import type { TaskStatus } from "@/data/mock-data";

const statusColors: Record<string, string> = {
  completed: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  running: "bg-primary/20 text-primary border-primary/30",
  needs_review: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  queued: "bg-muted text-muted-foreground border-border",
  failed: "bg-destructive/20 text-destructive border-destructive/30",
};

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

export default function ActivityFeed() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deptFilter, setDeptFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const filtered = mockTasks.filter((t) => {
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (deptFilter !== "all" && t.department !== deptFilter) return false;
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-5xl">
      <motion.div variants={item}>
        <h1 className="text-3xl font-bold tracking-tight">Agent Activity</h1>
        <p className="text-muted-foreground mt-1">Monitor all running and completed agent tasks</p>
      </motion.div>

      {/* Filters */}
      <motion.div variants={item} className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search tasks..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-muted/50 border-border/50" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px] bg-muted/50 border-border/50"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="queued">Queued</SelectItem>
            <SelectItem value="running">Running</SelectItem>
            <SelectItem value="needs_review">Needs Review</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={deptFilter} onValueChange={setDeptFilter}>
          <SelectTrigger className="w-[140px] bg-muted/50 border-border/50"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Depts</SelectItem>
            <SelectItem value="marketing">Marketing</SelectItem>
            <SelectItem value="sales">Sales</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Task List */}
      <motion.div variants={item} className="space-y-3">
        {filtered.map((task) => {
          const agent = agents.find((a) => a.id === task.agentId);
          const skill = skills.find((s) => s.id === task.skillId);
          return (
            <Card key={task.id} className="glass-card">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <span className="text-lg mt-0.5">{agent?.avatar}</span>
                    <div>
                      <h3 className="font-medium text-sm">{task.title}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {agent?.name} · {skill?.icon} {skill?.name} · {new Date(task.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {task.status === "needs_review" && (
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10">
                          <CheckCircle className="h-3 w-3" /> Approve
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-destructive border-destructive/30 hover:bg-destructive/10">
                          <XCircle className="h-3 w-3" /> Reject
                        </Button>
                      </div>
                    )}
                    <Badge variant="outline" className={statusColors[task.status]}>
                      {task.status.replace("_", " ")}
                    </Badge>
                  </div>
                </div>
                {task.output && (
                  <div className="mt-3 p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground whitespace-pre-line line-clamp-3">{task.output}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-8">No tasks match your filters</p>
        )}
      </motion.div>
    </motion.div>
  );
}
