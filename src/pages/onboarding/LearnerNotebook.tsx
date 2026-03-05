import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Loader2, FileDown, Pencil, Trash2, Check, X, BookOpen } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import jsPDF from "jspdf";
import type { NotebookEntryType, OnboardingPhase } from "@/types/onboarding";

const ENTRY_TYPES: { value: NotebookEntryType; label: string; icon: string; color: string }[] = [
  { value: "observation", label: "Observation", icon: "💡", color: "text-blue-600 bg-blue-50 border-blue-200" },
  { value: "question", label: "Question", icon: "❓", color: "text-amber-600 bg-amber-50 border-amber-200" },
  { value: "insight", label: "Insight", icon: "🔍", color: "text-purple-600 bg-purple-50 border-purple-200" },
  { value: "key_learning", label: "Key Learning", icon: "📌", color: "text-green-600 bg-green-50 border-green-200" },
];

const PHASE_LABELS: Record<string, string> = {
  immerse: "Immerse",
  observe: "Observe",
  demonstrate: "Demonstrate",
};

const PHASE_COLORS: Record<string, string> = {
  immerse: "bg-blue-100 text-blue-700",
  observe: "bg-amber-100 text-amber-700",
  demonstrate: "bg-green-100 text-green-700",
};

function getEntryMeta(type: string) {
  return ENTRY_TYPES.find((t) => t.value === type) ?? ENTRY_TYPES[0];
}

export default function LearnerNotebook() {
  const { tenantId } = useTenant();
  const queryClient = useQueryClient();

  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [phaseFilter, setPhaseFilter] = useState<string>("all");
  const [newType, setNewType] = useState<NotebookEntryType>("observation");
  const [newContent, setNewContent] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editType, setEditType] = useState<NotebookEntryType>("observation");
  const [saved, setSaved] = useState(false);

  // Current user
  const { data: user } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user;
    },
    staleTime: 10 * 60 * 1000,
  });

  // Active assignment
  const { data: assignment, isLoading: loadingAssignment } = useQuery({
    queryKey: ["notebook-assignment", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("onboarding_assignments")
        .select("*")
        .eq("user_id", user!.id)
        .eq("status", "active")
        .maybeSingle();
      return data;
    },
  });

  // Program + profile
  const { data: program } = useQuery({
    queryKey: ["notebook-program", assignment?.program_id],
    enabled: !!assignment?.program_id,
    queryFn: async () => {
      const { data } = await supabase
        .from("onboarding_programs")
        .select("*, success_profiles(*)")
        .eq("id", assignment!.program_id)
        .single();
      return data;
    },
  });

  // Notebook entries
  const { data: entries = [], isLoading: loadingEntries } = useQuery({
    queryKey: ["notebook-entries", assignment?.id],
    enabled: !!assignment?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("onboarding_notebook_entries")
        .select("*")
        .eq("assignment_id", assignment!.id)
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const profile = program?.success_profiles as any;
  const roleName = profile?.role_name ?? "";
  const programName = program?.name ?? "";

  // Filtered entries
  const filtered = entries.filter((e: any) => {
    if (typeFilter !== "all" && e.entry_type !== typeFilter) return false;
    if (phaseFilter !== "all" && e.phase !== phaseFilter) return false;
    return true;
  });

  // Create entry
  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("onboarding_notebook_entries").insert({
        assignment_id: assignment!.id,
        user_id: user!.id,
        tenant_id: tenantId!,
        phase: assignment!.current_phase,
        entry_type: newType,
        content: newContent.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notebook-entries"] });
      setNewContent("");
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
    onError: () => toast.error("Failed to save entry"),
  });

  // Update entry
  const updateMutation = useMutation({
    mutationFn: async ({ id, content, entry_type }: { id: string; content: string; entry_type: string }) => {
      const { error } = await supabase
        .from("onboarding_notebook_entries")
        .update({ content, entry_type, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notebook-entries"] });
      setEditingId(null);
      toast.success("Entry updated");
    },
    onError: () => toast.error("Failed to update entry"),
  });

  // Delete entry
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("onboarding_notebook_entries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notebook-entries"] });
      toast.success("Entry deleted");
    },
    onError: () => toast.error("Failed to delete entry"),
  });

  // PDF export
  const exportPdf = () => {
    const doc = new jsPDF();
    const margin = 20;
    let y = margin;
    const pageWidth = doc.internal.pageSize.getWidth();
    const maxWidth = pageWidth - margin * 2;

    const addPage = () => { doc.addPage(); y = margin; };
    const checkPage = (needed: number) => { if (y + needed > 270) addPage(); };

    // Cover
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("Onboarding Notebook", margin, y);
    y += 12;
    doc.setFontSize(14);
    doc.setFont("helvetica", "normal");
    doc.text(user?.user_metadata?.full_name || user?.email || "Learner", margin, y);
    y += 8;
    doc.setFontSize(11);
    doc.text(`Role: ${roleName}  ·  Program: ${programName}`, margin, y);
    y += 6;
    doc.text(`Exported: ${format(new Date(), "MMMM d, yyyy")}`, margin, y);
    y += 12;

    doc.setFontSize(9);
    doc.setTextColor(120);
    const privacyNote = "This notebook is your personal record. It was not shared with your manager or administrator.";
    const privacyLines = doc.splitTextToSize(privacyNote, maxWidth);
    doc.text(privacyLines, margin, y);
    doc.setTextColor(0);
    y += privacyLines.length * 5 + 10;

    // Sections by phase
    const phases: OnboardingPhase[] = ["immerse", "observe", "demonstrate"];
    for (const phase of phases) {
      const phaseEntries = entries.filter((e: any) => e.phase === phase);
      if (phaseEntries.length === 0) continue;

      checkPage(20);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text(PHASE_LABELS[phase], margin, y);
      y += 10;

      for (const type of ENTRY_TYPES) {
        const typeEntries = phaseEntries.filter((e: any) => e.entry_type === type.value);
        if (typeEntries.length === 0) continue;

        checkPage(14);
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text(`${type.icon} ${type.label}s`, margin + 4, y);
        y += 7;

        for (const entry of typeEntries) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(10);
          const lines = doc.splitTextToSize(entry.content, maxWidth - 8);
          checkPage(lines.length * 5 + 10);
          doc.text(lines, margin + 8, y);
          y += lines.length * 5 + 2;
          doc.setFontSize(8);
          doc.setTextColor(140);
          doc.text(format(new Date(entry.created_at), "MMM d, yyyy h:mm a"), margin + 8, y);
          doc.setTextColor(0);
          y += 8;
        }
      }
      y += 6;
    }

    const lastName = (user?.user_metadata?.full_name || "Learner").split(" ").pop();
    doc.save(`OnboardingNotebook_${lastName}_${format(new Date(), "yyyy-MM-dd")}.pdf`);
    toast.success("PDF downloaded");
  };

  if (loadingAssignment || loadingEntries) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3 max-w-md mx-auto">
        <BookOpen className="h-12 w-12 text-muted-foreground/50" />
        <h2 className="text-xl font-semibold">No Active Onboarding</h2>
        <p className="text-sm text-muted-foreground">
          Your onboarding program hasn't been set up yet. Your manager will assign one when you're ready.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Onboarding Notebook</h1>
          {roleName && (
            <p className="text-sm text-muted-foreground mt-1">
              {roleName} · {programName}
            </p>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={exportPdf} disabled={entries.length === 0}>
          <FileDown className="h-4 w-4 mr-1.5" />
          Export PDF
        </Button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Tabs value={typeFilter} onValueChange={setTypeFilter} className="flex-1">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="observation">💡 Observations</TabsTrigger>
            <TabsTrigger value="question">❓ Questions</TabsTrigger>
            <TabsTrigger value="insight">🔍 Insights</TabsTrigger>
            <TabsTrigger value="key_learning">📌 Key Learnings</TabsTrigger>
          </TabsList>
        </Tabs>
        <Select value={phaseFilter} onValueChange={setPhaseFilter}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="All Phases" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Phases</SelectItem>
            <SelectItem value="immerse">Immerse</SelectItem>
            <SelectItem value="observe">Observe</SelectItem>
            <SelectItem value="demonstrate">Demonstrate</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Composer */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardContent className="pt-5 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <ToggleGroup
                type="single"
                value={newType}
                onValueChange={(v) => v && setNewType(v as NotebookEntryType)}
              >
                {ENTRY_TYPES.map((t) => (
                  <ToggleGroupItem
                    key={t.value}
                    value={t.value}
                    className="text-xs px-3 py-1 rounded-full"
                  >
                    {t.icon} {t.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              <Badge variant="secondary" className={PHASE_COLORS[assignment.current_phase] ?? ""}>
                {PHASE_LABELS[assignment.current_phase] ?? assignment.current_phase}
              </Badge>
            </div>
            <Textarea
              placeholder="What do you want to capture?"
              rows={4}
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
            />
            <div className="flex items-center gap-3">
              <Button
                size="sm"
                onClick={() => createMutation.mutate()}
                disabled={!newContent.trim() || createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : null}
                Save Entry
              </Button>
              <AnimatePresence>
                {saved && (
                  <motion.span
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-sm text-green-600 flex items-center gap-1"
                  >
                    <Check className="h-3.5 w-3.5" /> Entry saved
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Entry list */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          {typeFilter !== "all"
            ? `No ${getEntryMeta(typeFilter).label.toLowerCase()} entries yet. Capture your first one above.`
            : "No entries yet. Capture your first one above."}
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {filtered.map((entry: any) => {
              const meta = getEntryMeta(entry.entry_type);
              const isEditing = editingId === entry.id;

              return (
                <motion.div
                  key={entry.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                >
                  <Card>
                    <CardContent className="pt-4 space-y-3">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${meta.color}`}>
                            {meta.icon} {meta.label}
                          </span>
                          <Badge variant="secondary" className={`text-[10px] ${PHASE_COLORS[entry.phase] ?? ""}`}>
                            {PHASE_LABELS[entry.phase] ?? entry.phase}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          {!isEditing && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => {
                                  setEditingId(entry.id);
                                  setEditContent(entry.content);
                                  setEditType(entry.entry_type);
                                }}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive">
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete this entry?</AlertDialogTitle>
                                    <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => deleteMutation.mutate(entry.id)}>
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </>
                          )}
                        </div>
                      </div>

                      {isEditing ? (
                        <div className="space-y-3">
                          <ToggleGroup
                            type="single"
                            value={editType}
                            onValueChange={(v) => v && setEditType(v as NotebookEntryType)}
                          >
                            {ENTRY_TYPES.map((t) => (
                              <ToggleGroupItem key={t.value} value={t.value} className="text-xs px-3 py-1 rounded-full">
                                {t.icon} {t.label}
                              </ToggleGroupItem>
                            ))}
                          </ToggleGroup>
                          <Textarea rows={4} value={editContent} onChange={(e) => setEditContent(e.target.value)} />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() =>
                                updateMutation.mutate({ id: entry.id, content: editContent.trim(), entry_type: editType })
                              }
                              disabled={!editContent.trim() || updateMutation.isPending}
                            >
                              Save
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                              <X className="h-4 w-4 mr-1" /> Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm whitespace-pre-wrap">{entry.content}</p>
                      )}

                      <p className="text-xs text-muted-foreground" title={format(new Date(entry.created_at), "PPpp")}>
                        {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
