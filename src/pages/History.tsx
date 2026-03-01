import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { agentDefinitions, departmentDefinitions, type Department } from "@/data/mock-data";
import { Search, ExternalLink, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

const statusColors: Record<string, string> = {
  complete: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  running: "bg-primary/20 text-primary border-primary/30",
  queued: "bg-muted text-muted-foreground border-border",
  failed: "bg-destructive/20 text-destructive border-destructive/30",
  retrying: "bg-amber-500/20 text-amber-400 border-amber-500/30",
};

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

export default function History() {
  const [agentFilter, setAgentFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deptFilter, setDeptFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJobs = async () => {
      let query = supabase
        .from("agent_jobs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (agentFilter !== "all") query = query.eq("agent_type", agentFilter);
      if (statusFilter !== "all") query = query.eq("status", statusFilter);
      if (deptFilter !== "all") query = query.eq("department", deptFilter);
      if (search) query = query.ilike("title", `%${search}%`);

      const { data } = await query;
      setJobs(data || []);
      setLoading(false);
    };

    fetchJobs();
  }, [agentFilter, statusFilter, deptFilter, search]);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-7xl">
      <motion.div variants={item}>
        <h1 className="text-3xl font-bold tracking-tight">History</h1>
        <p className="text-muted-foreground mt-1">All agent runs and their results</p>
      </motion.div>

      <motion.div variants={item} className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search jobs..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-muted/50 border-border/50" />
        </div>
        <Select value={deptFilter} onValueChange={setDeptFilter}>
          <SelectTrigger className="w-[150px] bg-muted/50 border-border/50"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Depts</SelectItem>
            {Object.entries(departmentDefinitions).map(([key, d]) => (
              <SelectItem key={key} value={key}>{d.emoji} {d.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={agentFilter} onValueChange={setAgentFilter}>
          <SelectTrigger className="w-[150px] bg-muted/50 border-border/50"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Agents</SelectItem>
            {agentDefinitions.map((a) => (
              <SelectItem key={a.type} value={a.type}>{a.emoji} {a.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px] bg-muted/50 border-border/50"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="queued">Queued</SelectItem>
            <SelectItem value="running">Running</SelectItem>
            <SelectItem value="complete">Complete</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      <motion.div variants={item}>
        <Card className="glass-card">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50">
                    <TableHead>Date</TableHead>
                    <TableHead>Dept</TableHead>
                    <TableHead>Agent</TableHead>
                    <TableHead>Task</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Tokens</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((job) => {
                    const agent = agentDefinitions.find((a) => a.type === job.agent_type);
                    const dept = departmentDefinitions[job.department as Department];
                    return (
                      <TableRow key={job.id} className="border-border/30 hover:bg-muted/30">
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(job.created_at).toLocaleDateString()}<br />
                          {new Date(job.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px]">{dept?.name}</Badge>
                        </TableCell>
                        <TableCell>
                          <span className="flex items-center gap-1.5">
                            <span>{agent?.emoji}</span>
                            <span className="text-sm">{agent?.name}</span>
                          </span>
                        </TableCell>
                        <TableCell className="text-sm max-w-[250px] truncate">{job.title}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={statusColors[job.status] || ""}>{job.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">
                          {job.tokens_used ? job.tokens_used.toLocaleString() : "—"}
                        </TableCell>
                        <TableCell>
                          <Link to={`/jobs/${job.id}`}>
                            <Button variant="ghost" size="sm" className="h-7 text-xs"><ExternalLink className="h-3 w-3" /></Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {jobs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No jobs found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
