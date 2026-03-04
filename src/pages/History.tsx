import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { agentDefinitions, departmentDefinitions, type Department } from "@/data/mock-data";
import { Search, ExternalLink, Loader2, MoreVertical, FileText, FileDown, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { jsPDF } from "jspdf";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import { saveAs } from "file-saver";

const statusColors: Record<string, string> = {
  complete: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  running: "bg-primary/20 text-primary border-primary/30",
  queued: "bg-muted text-muted-foreground border-border",
  failed: "bg-destructive/20 text-destructive border-destructive/30",
  retrying: "bg-amber-500/20 text-amber-400 border-amber-500/30",
};

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

function sanitizeFilename(title: string) {
  return title.replace(/[^a-zA-Z0-9 _-]/g, "").trim().replace(/\s+/g, "_").slice(0, 80) || "job-output";
}

async function downloadAsPdf(job: any) {
  const doc = new jsPDF();
  const margin = 20;
  const pageWidth = doc.internal.pageSize.getWidth() - margin * 2;

  doc.setFontSize(16);
  doc.text(job.title || "Job Output", margin, margin + 5);

  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(`Date: ${new Date(job.created_at).toLocaleString()}  •  Status: ${job.status}  •  Tokens: ${job.tokens_used || "N/A"}`, margin, margin + 14);
  doc.setTextColor(0);

  doc.setFontSize(11);
  const output = job.output || "No output available.";
  // Strip markdown formatting for clean PDF
  const clean = output.replace(/#{1,6}\s/g, "").replace(/\*\*/g, "").replace(/\*/g, "").replace(/`/g, "");
  const lines = doc.splitTextToSize(clean, pageWidth);
  let y = margin + 24;
  for (const line of lines) {
    if (y > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      y = margin;
    }
    doc.text(line, margin, y);
    y += 5.5;
  }

  doc.save(`${sanitizeFilename(job.title)}.pdf`);
}

async function downloadAsWord(job: any) {
  const output = job.output || "No output available.";
  const paragraphs: Paragraph[] = [
    new Paragraph({ text: job.title || "Job Output", heading: HeadingLevel.HEADING_1 }),
    new Paragraph({
      children: [
        new TextRun({ text: `Date: ${new Date(job.created_at).toLocaleString()}  •  Status: ${job.status}  •  Tokens: ${job.tokens_used || "N/A"}`, size: 18, color: "888888" }),
      ],
      spacing: { after: 300 },
    }),
  ];

  // Split by double newlines for paragraphs, handle markdown headings
  for (const block of output.split(/\n\n+/)) {
    const trimmed = block.trim();
    if (!trimmed) continue;
    const headingMatch = trimmed.match(/^(#{1,3})\s+(.*)/);
    if (headingMatch) {
      const level = headingMatch[1].length === 1 ? HeadingLevel.HEADING_2 : headingMatch[1].length === 2 ? HeadingLevel.HEADING_3 : HeadingLevel.HEADING_4;
      paragraphs.push(new Paragraph({ text: headingMatch[2], heading: level }));
    } else {
      // Handle bold markdown
      const runs: TextRun[] = [];
      const parts = trimmed.split(/(\*\*[^*]+\*\*)/);
      for (const part of parts) {
        if (part.startsWith("**") && part.endsWith("**")) {
          runs.push(new TextRun({ text: part.slice(2, -2), bold: true }));
        } else {
          runs.push(new TextRun({ text: part }));
        }
      }
      paragraphs.push(new Paragraph({ children: runs }));
    }
  }

  const doc = new Document({ sections: [{ children: paragraphs }] });
  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${sanitizeFilename(job.title)}.docx`);
}

export default function History() {
  const { toast } = useToast();
  const [agentFilter, setAgentFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deptFilter, setDeptFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

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

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase.from("agent_jobs").delete().eq("id", deleteTarget);
    if (error) {
      toast({ title: "Failed to delete job", description: error.message, variant: "destructive" });
    } else {
      setJobs(prev => prev.filter(j => j.id !== deleteTarget));
      toast({ title: "Job deleted" });
    }
    setDeleteTarget(null);
  };

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
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((job) => {
                    const agent = agentDefinitions.find((a) => a.type === job.agent_type);
                    const dept = departmentDefinitions[job.department as Department];
                    const hasOutput = job.status === "complete" && job.output;
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
                          <div className="flex items-center gap-1">
                            <Link to={`/jobs/${job.id}`}>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0"><ExternalLink className="h-3 w-3" /></Button>
                            </Link>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0"><MoreVertical className="h-3.5 w-3.5" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-44">
                                <DropdownMenuItem
                                  disabled={!hasOutput}
                                  onClick={() => downloadAsPdf(job)}
                                >
                                  <FileText className="h-3.5 w-3.5 mr-2" />
                                  Download PDF
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  disabled={!hasOutput}
                                  onClick={() => downloadAsWord(job)}
                                >
                                  <FileDown className="h-3.5 w-3.5 mr-2" />
                                  Download Word
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => setDeleteTarget(job.id)}
                                >
                                  <Trash2 className="h-3.5 w-3.5 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
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

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this job?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. The job record and its output will be permanently removed.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
