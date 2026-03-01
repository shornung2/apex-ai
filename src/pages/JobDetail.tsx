import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { mockJobs, agentDefinitions } from "@/data/mock-data";
import { ArrowLeft, Copy, BookOpen, RotateCcw, CheckCircle, XCircle, Loader2, Clock, AlertTriangle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useToast } from "@/hooks/use-toast";

const statusConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  queued: { icon: Clock, color: "text-muted-foreground", label: "Queued" },
  running: { icon: Loader2, color: "text-primary", label: "Running" },
  complete: { icon: CheckCircle, color: "text-emerald-400", label: "Complete" },
  failed: { icon: XCircle, color: "text-destructive", label: "Failed" },
  retrying: { icon: AlertTriangle, color: "text-amber-400", label: "Retrying" },
};

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

export default function JobDetail() {
  const { jobId } = useParams<{ jobId: string }>();
  const { toast } = useToast();
  const job = mockJobs.find((j) => j.id === jobId);
  const agent = job ? agentDefinitions.find((a) => a.type === job.agentType) : null;

  if (!job || !agent) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <p>Job not found</p>
        <Link to="/history"><Button variant="ghost" className="mt-4">Back to History</Button></Link>
      </div>
    );
  }

  const status = statusConfig[job.status];
  const StatusIcon = status.icon;

  const copyMarkdown = () => {
    if (job.output) {
      navigator.clipboard.writeText(job.output);
      toast({ title: "Copied to clipboard" });
    }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-4xl">
      <motion.div variants={item} className="flex items-center gap-3">
        <Link to="/history">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{job.title}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {agent.emoji} {agent.name} · {new Date(job.createdAt).toLocaleString()}
          </p>
        </div>
        <div className={`flex items-center gap-1.5 ${status.color}`}>
          <StatusIcon className={`h-4 w-4 ${job.status === "running" ? "animate-spin" : ""}`} />
          <span className="text-sm font-medium">{status.label}</span>
        </div>
      </motion.div>

      {/* Inputs */}
      <motion.div variants={item}>
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Inputs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(job.inputs).map(([key, value]) => (
                <div key={key}>
                  <p className="text-xs text-muted-foreground">{key}</p>
                  <p className="text-sm mt-0.5">{value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Metadata */}
      <motion.div variants={item} className="flex gap-4">
        {job.tokensUsed && (
          <Card className="glass-card flex-1">
            <CardContent className="p-4 text-center">
              <p className="text-xl font-bold">{job.tokensUsed.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Tokens Used</p>
            </CardContent>
          </Card>
        )}
        {job.confidenceScore && (
          <Card className="glass-card flex-1">
            <CardContent className="p-4 text-center">
              <p className="text-xl font-bold">{job.confidenceScore}%</p>
              <p className="text-xs text-muted-foreground">Confidence</p>
            </CardContent>
          </Card>
        )}
        {job.completedAt && (
          <Card className="glass-card flex-1">
            <CardContent className="p-4 text-center">
              <p className="text-xl font-bold">
                {Math.round((new Date(job.completedAt).getTime() - new Date(job.createdAt).getTime()) / 1000)}s
              </p>
              <p className="text-xs text-muted-foreground">Duration</p>
            </CardContent>
          </Card>
        )}
      </motion.div>

      {/* Output */}
      {job.output && (
        <motion.div variants={item}>
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Output</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={copyMarkdown}>
                  <Copy className="h-3 w-3" /> Copy
                </Button>
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1" disabled>
                  <BookOpen className="h-3 w-3" /> Save to KB
                </Button>
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1" disabled>
                  <RotateCcw className="h-3 w-3" /> Re-run
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose prose-invert prose-sm max-w-none">
                <ReactMarkdown>{job.output}</ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
