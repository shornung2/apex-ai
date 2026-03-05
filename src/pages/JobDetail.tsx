import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { subscribeToJob } from "@/lib/agent-client";
import { agentDefinitions, departmentDefinitions, type Department } from "@/data/mock-data";
import { ArrowLeft, Copy, BookOpen, RotateCcw, CheckCircle, XCircle, Loader2, Clock, AlertTriangle, FileDown, Presentation, ThumbsUp, ThumbsDown } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useToast } from "@/hooks/use-toast";
import { useTenant } from "@/contexts/TenantContext";
import { SaveToLibraryDialog } from "@/components/SaveToLibraryDialog";

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
  const { tenantId } = useTenant();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deckUrl, setDeckUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) return;

    const fetchJob = async () => {
      const { data, error } = await supabase
        .from("agent_jobs")
        .select("*")
        .eq("id", jobId)
        .single();

      if (data) {
        setJob(data);
        // Generate signed URL for deck files
        if (data.file_url) {
          // Extract path from full URL or use as-is
          const path = data.file_url.includes("/storage/v1/object/public/decks/")
            ? data.file_url.split("/storage/v1/object/public/decks/")[1]
            : data.file_url;
          const { data: signed } = await supabase.storage.from("decks").createSignedUrl(path, 3600);
          if (signed?.signedUrl) setDeckUrl(signed.signedUrl);
        }
      }
      setLoading(false);
    };

    fetchJob();

    // Subscribe to realtime updates
    const unsubscribe = subscribeToJob(jobId, (updated) => {
      setJob(updated);
    });

    return unsubscribe;
  }, [jobId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <p>Job not found</p>
        <Link to="/history"><Button variant="ghost" className="mt-4">Back to History</Button></Link>
      </div>
    );
  }

  const agent = agentDefinitions.find((a) => a.type === job.agent_type);
  const dept = departmentDefinitions[job.department as Department];
  const status = statusConfig[job.status] || statusConfig.queued;
  const StatusIcon = status.icon;

  const copyMarkdown = () => {
    if (job.output) {
      navigator.clipboard.writeText(job.output);
      toast({ title: "Copied to clipboard" });
    }
  };

  const saveToKB = async () => {
    if (!job.output) return;
    setSaving(true);
    const { error } = await supabase.from("knowledge_documents").insert({
      title: job.title,
      content: job.output,
      doc_type: "agent_output",
      status: "ready",
      tokens: job.tokens_used || 0,
      tenant_id: tenantId!,
    });
    setSaving(false);
    if (error) {
      toast({ title: "Error saving", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Saved to Knowledge Base" });
    }
  };

  const inputs = job.inputs as Record<string, string>;

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
            {dept?.name} · {agent?.emoji} {agent?.name} · {new Date(job.created_at).toLocaleString()}
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
              {Object.entries(inputs).map(([key, value]) => (
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
        {job.tokens_used > 0 && (
          <Card className="glass-card flex-1">
            <CardContent className="p-4 text-center">
              <p className="text-xl font-bold">{job.tokens_used.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Tokens Used</p>
            </CardContent>
          </Card>
        )}
        {job.confidence_score && (
          <Card className="glass-card flex-1">
            <CardContent className="p-4 text-center">
              <p className="text-xl font-bold">{job.confidence_score}%</p>
              <p className="text-xs text-muted-foreground">Confidence</p>
            </CardContent>
          </Card>
        )}
        {job.completed_at && (
          <Card className="glass-card flex-1">
            <CardContent className="p-4 text-center">
              <p className="text-xl font-bold">
                {Math.round((new Date(job.completed_at).getTime() - new Date(job.created_at).getTime()) / 1000)}s
              </p>
              <p className="text-xs text-muted-foreground">Duration</p>
            </CardContent>
          </Card>
        )}
      </motion.div>

      {/* Download button for deck jobs */}
      {deckUrl && (
        <motion.div variants={item}>
          <Card className="glass-card border-primary/20">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Presentation className="h-6 w-6 text-primary" />
                <div>
                  <p className="text-sm font-semibold">PowerPoint Deck Ready</p>
                  <p className="text-xs text-muted-foreground">Download your generated presentation</p>
                </div>
              </div>
              <Button asChild>
                <a href={deckUrl} download target="_blank" rel="noopener noreferrer">
                  <FileDown className="h-4 w-4 mr-2" /> Download .pptx
                </a>
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Output */}
      {job.status === "running" && !job.output && (
        <motion.div variants={item}>
          <Card className="glass-card">
            <CardContent className="p-8 flex flex-col items-center text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
              <p className="text-sm text-muted-foreground">Agent is working...</p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {job.output && (
        <motion.div variants={item}>
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Output</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={copyMarkdown}>
                  <Copy className="h-3 w-3" /> Copy
                </Button>
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={saveToKB} disabled={saving}>
                  <BookOpen className="h-3 w-3" /> {saving ? "Saving..." : "Save to KB"}
                </Button>
                <SaveToLibraryDialog
                  title={job.title}
                  content={job.output}
                  agentType={job.agent_type}
                  skillId={job.skill_id}
                  skillName={agent?.name}
                  department={job.department}
                  jobId={job.id}
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose dark:prose-invert max-w-none [&>h2]:mt-6 [&>h2]:mb-3 [&>h2]:text-lg [&>h2]:font-bold [&>h3]:mt-4 [&>h3]:mb-2 [&>h3]:text-base [&>h3]:font-semibold [&>p]:my-3 [&>ul]:my-3 [&>ol]:my-3 [&>p+p]:mt-4 [&>li]:my-1 [&>ul>li]:my-1">
                <ReactMarkdown>{job.output}</ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Continue coaching session */}
      {job.status === "complete" && (job.department === "talent") && (
        <motion.div variants={item}>
          <Card className="glass-card border-primary/20">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Continue Coaching Session</p>
                <p className="text-xs text-muted-foreground">Pick up where you left off in your next session</p>
              </div>
              <Link to={`/departments/talent`}>
                <Button variant="outline" size="sm" className="gap-1">
                  <RotateCcw className="h-3.5 w-3.5" /> Continue
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Feedback */}
      {job.status === "complete" && (
        <FeedbackSection jobId={job.id} initialRating={job.feedback_rating} initialNote={job.feedback_note} />
      )}
    </motion.div>
  );
}

function FeedbackSection({ jobId, initialRating, initialNote }: { jobId: string; initialRating: number | null; initialNote: string | null }) {
  const { toast } = useToast();
  const [rating, setRating] = useState<number | null>(initialRating);
  const [note, setNote] = useState(initialNote || "");
  const [showNote, setShowNote] = useState(false);
  const [saving, setSaving] = useState(false);
  const submitted = rating !== null;

  const submitFeedback = async (value: number) => {
    setSaving(true);
    setRating(value);
    const update: Record<string, any> = { feedback_rating: value };
    if (value === -1) {
      setShowNote(true);
      // Don't save note yet — wait for explicit submit
      await supabase.from("agent_jobs").update({ feedback_rating: value }).eq("id", jobId);
      setSaving(false);
      return;
    }
    await supabase.from("agent_jobs").update(update).eq("id", jobId);
    setSaving(false);
    toast({ title: "Thanks — your feedback helps us improve Apex AI." });
  };

  const submitNote = async () => {
    setSaving(true);
    await supabase.from("agent_jobs").update({ feedback_note: note || null }).eq("id", jobId);
    setSaving(false);
    setShowNote(false);
    toast({ title: "Thanks — your feedback helps us improve Apex AI." });
  };

  return (
    <motion.div variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}>
      <Card className="glass-card">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Was this output useful?</span>
            <div className="flex gap-2">
              <Button
                variant={rating === 1 ? "default" : "outline"}
                size="sm"
                className="h-8 w-8 p-0"
                disabled={submitted || saving}
                onClick={() => submitFeedback(1)}
              >
                <ThumbsUp className="h-4 w-4" />
              </Button>
              <Button
                variant={rating === -1 ? "destructive" : "outline"}
                size="sm"
                className="h-8 w-8 p-0"
                disabled={(submitted && rating !== -1) || saving}
                onClick={() => submitFeedback(-1)}
              >
                <ThumbsDown className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {showNote && rating === -1 && (
            <div className="space-y-2">
              <Textarea
                placeholder="What could be improved? (optional)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="min-h-[60px]"
              />
              <Button size="sm" onClick={submitNote} disabled={saving}>
                Submit Feedback
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
