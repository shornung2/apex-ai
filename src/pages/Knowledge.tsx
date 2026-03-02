import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import {
  Upload, Search, FileText, Bot, Loader2, Trash2, Download,
  ExternalLink, Pencil, Check, X, File, FileSpreadsheet, Presentation,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

const statusBadge: Record<string, string> = {
  ready: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  processing: "bg-primary/20 text-primary border-primary/30",
  failed: "bg-destructive/20 text-destructive border-destructive/30",
};

const ACCEPTED_TYPES = ".pdf,.docx,.pptx,.txt,.md,.csv";
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

function fileIcon(mimeType?: string | null, title?: string) {
  if (mimeType?.includes("pdf") || title?.endsWith(".pdf")) return <File className="h-4 w-4 text-red-400 shrink-0" />;
  if (mimeType?.includes("presentation") || title?.endsWith(".pptx")) return <Presentation className="h-4 w-4 text-orange-400 shrink-0" />;
  if (mimeType?.includes("spreadsheet") || mimeType?.includes("csv") || title?.endsWith(".csv")) return <FileSpreadsheet className="h-4 w-4 text-emerald-400 shrink-0" />;
  if (mimeType?.includes("word") || title?.endsWith(".docx")) return <FileText className="h-4 w-4 text-blue-400 shrink-0" />;
  return <FileText className="h-4 w-4 text-muted-foreground shrink-0" />;
}

function typeBadge(mimeType?: string | null, title?: string) {
  if (mimeType?.includes("pdf") || title?.endsWith(".pdf")) return "PDF";
  if (mimeType?.includes("presentation") || title?.endsWith(".pptx")) return "PPTX";
  if (mimeType?.includes("word") || title?.endsWith(".docx")) return "DOCX";
  if (mimeType?.includes("csv") || title?.endsWith(".csv")) return "CSV";
  if (title?.endsWith(".md")) return "MD";
  if (title?.endsWith(".txt")) return "TXT";
  return "File";
}

export default function Knowledge() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const fetchDocs = async () => {
    let query = supabase
      .from("knowledge_documents")
      .select("*")
      .order("created_at", { ascending: false });
    if (search) query = query.ilike("title", `%${search}%`);
    const { data } = await query;
    setDocs(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchDocs(); }, [search]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    for (const file of Array.from(files)) {
      if (file.size > MAX_FILE_SIZE) {
        toast({ title: "File too large", description: `${file.name} exceeds 20MB limit`, variant: "destructive" });
        continue;
      }

      const fileId = crypto.randomUUID();
      const filePath = `knowledge/${fileId}/${file.name}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, file);

      if (uploadError) {
        toast({ title: "Upload failed", description: `${file.name}: ${uploadError.message}`, variant: "destructive" });
        continue;
      }

      // Call knowledge-ingest edge function
      const { data, error } = await supabase.functions.invoke("knowledge-ingest", {
        body: { file_path: filePath, title: file.name, mime_type: file.type },
      });

      if (error) {
        toast({ title: "Ingestion failed", description: `${file.name}: ${error.message}`, variant: "destructive" });
      } else {
        toast({ title: "Document uploaded", description: `${file.name} added to Knowledge Base` });
      }
    }

    setUploading(false);
    fetchDocs();
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const deleteDoc = async (doc: any) => {
    // Delete chunks first, then document, then storage file
    await supabase.from("knowledge_chunks").delete().eq("document_id", doc.id);
    await supabase.from("knowledge_documents").delete().eq("id", doc.id);
    if (doc.file_path) {
      await supabase.storage.from("documents").remove([doc.file_path]);
    }
    fetchDocs();
    toast({ title: "Document deleted" });
  };

  const handleDownload = async (doc: any) => {
    if (!doc.file_path) return;
    const { data } = await supabase.storage.from("documents").createSignedUrl(doc.file_path, 60);
    if (data?.signedUrl) {
      const a = document.createElement("a");
      a.href = data.signedUrl;
      a.download = doc.title;
      a.click();
    }
  };

  const handleOpen = async (doc: any) => {
    if (!doc.file_path) return;
    const { data } = await supabase.storage.from("documents").createSignedUrl(doc.file_path, 300);
    if (data?.signedUrl) {
      window.open(data.signedUrl, "_blank");
    }
  };

  const startRename = (doc: any) => {
    setEditingId(doc.id);
    setEditTitle(doc.title);
  };

  const confirmRename = async () => {
    if (!editingId || !editTitle.trim()) return;
    await supabase.from("knowledge_documents").update({ title: editTitle.trim() }).eq("id", editingId);
    setEditingId(null);
    fetchDocs();
  };

  const cancelRename = () => {
    setEditingId(null);
    setEditTitle("");
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-5xl">
      <motion.div variants={item}>
        <h1 className="text-3xl font-bold tracking-tight">Knowledge Base</h1>
        <p className="text-muted-foreground mt-1">Upload documents to ground agent responses with your organization's knowledge</p>
      </motion.div>

      <motion.div variants={item} className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-muted/50 border-border/50"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
          {uploading ? "Uploading..." : "Upload Files"}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES}
          multiple
          className="hidden"
          onChange={handleUpload}
        />
      </motion.div>

      {/* Upload drop zone */}
      <motion.div variants={item}>
        <Card
          className="glass-card border-dashed border-2 border-border/50 hover:border-primary/30 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <CardContent className="p-6 flex flex-col items-center text-center">
            {uploading ? (
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            ) : (
              <Upload className="h-8 w-8 text-muted-foreground mb-2" />
            )}
            <p className="text-sm font-medium">{uploading ? "Processing files..." : "Drop files here or click to upload"}</p>
            <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, PPTX, TXT, MD, CSV — max 20MB per file</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Document list */}
      <motion.div variants={item}>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : docs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-12">No documents yet. Upload files to get started.</p>
        ) : (
          <Card className="glass-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead className="w-[80px]">Type</TableHead>
                  <TableHead className="w-[80px]">Tokens</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead className="w-[100px]">Date</TableHead>
                  <TableHead className="w-[140px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {docs.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {doc.doc_type === "agent_output" ? (
                          <Bot className="h-4 w-4 text-primary shrink-0" />
                        ) : (
                          fileIcon(doc.mime_type, doc.title)
                        )}
                        {editingId === doc.id ? (
                          <div className="flex items-center gap-1 flex-1">
                            <Input
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              className="h-7 text-sm"
                              onKeyDown={(e) => e.key === "Enter" && confirmRename()}
                              autoFocus
                            />
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={confirmRename}>
                              <Check className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={cancelRename}>
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-sm font-medium truncate max-w-[300px]">{doc.title}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {doc.doc_type === "agent_output" ? "AI" : typeBadge(doc.mime_type, doc.title)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {doc.tokens?.toLocaleString() || 0}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusBadge[doc.status] || ""}>
                        {doc.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(doc.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        {doc.file_path && (
                          <>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpen(doc)} title="Open">
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDownload(doc)} title="Download">
                              <Download className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startRename(doc)} title="Rename">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteDoc(doc)} title="Delete">
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </motion.div>
    </motion.div>
  );
}
