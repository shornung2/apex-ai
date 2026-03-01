import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Search, FileText, Bot, Loader2, BookOpen, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

const statusBadge: Record<string, string> = {
  ready: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  processing: "bg-primary/20 text-primary border-primary/30",
  failed: "bg-destructive/20 text-destructive border-destructive/30",
};

export default function Knowledge() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);

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
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    // Read text content
    const text = await file.text();

    // Insert document
    const { data: doc, error } = await supabase
      .from("knowledge_documents")
      .insert({
        title: file.name,
        content: text,
        doc_type: "upload",
        status: "ready",
        tokens: Math.ceil(text.length / 4),
      })
      .select()
      .single();

    if (error) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    // Create chunks (simple splitting by paragraphs)
    if (doc) {
      const paragraphs = text.split(/\n\n+/).filter((p) => p.trim().length > 20);
      const chunks = paragraphs.map((content, idx) => ({
        document_id: doc.id,
        content: content.trim(),
        chunk_index: idx,
        tokens: Math.ceil(content.length / 4),
      }));

      if (chunks.length > 0) {
        await supabase.from("knowledge_chunks").insert(chunks);
      }
    }

    setUploading(false);
    toast({ title: "Document uploaded", description: `${file.name} added to Knowledge Base` });
    fetchDocs();
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const deleteDoc = async (id: string) => {
    await supabase.from("knowledge_documents").delete().eq("id", id);
    if (selectedDoc?.id === id) setSelectedDoc(null);
    fetchDocs();
    toast({ title: "Document deleted" });
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-7xl">
      <motion.div variants={item}>
        <h1 className="text-3xl font-bold tracking-tight">Knowledge Base</h1>
        <p className="text-muted-foreground mt-1">Your organization's intelligence library — agents use this to ground their responses</p>
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Document Library */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-muted/50 border-border/50"
            />
          </div>

          {/* Upload zone */}
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
              <p className="text-sm font-medium">{uploading ? "Uploading..." : "Upload Documents"}</p>
              <p className="text-xs text-muted-foreground mt-1">TXT, MD files — click to browse</p>
            </CardContent>
          </Card>
          <input ref={fileInputRef} type="file" accept=".txt,.md,.csv" className="hidden" onChange={handleUpload} />

          {/* Document list */}
          <div className="space-y-2">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : docs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No documents yet. Upload files or save agent outputs.</p>
            ) : (
              docs.map((doc) => (
                <Card
                  key={doc.id}
                  className={`glass-card hover:border-primary/20 transition-colors cursor-pointer ${selectedDoc?.id === doc.id ? "border-primary/40" : ""}`}
                  onClick={() => setSelectedDoc(doc)}
                >
                  <CardContent className="p-3 flex items-center gap-3">
                    {doc.doc_type === "agent_output" ? (
                      <Bot className="h-4 w-4 text-primary shrink-0" />
                    ) : (
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{doc.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {doc.tokens?.toLocaleString() || 0} tokens · {new Date(doc.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="outline" className={statusBadge[doc.status] || ""}>
                      {doc.status}
                    </Badge>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Document Viewer */}
        <div className="lg:col-span-3">
          <Card className="glass-card h-full min-h-[400px]">
            {selectedDoc ? (
              <>
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <div>
                    <CardTitle className="text-lg">{selectedDoc.title}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      {selectedDoc.doc_type === "agent_output" ? "Agent Output" : "Upload"} · {selectedDoc.tokens?.toLocaleString()} tokens
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteDoc(selectedDoc.id)}>
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-invert prose-sm max-w-none max-h-[60vh] overflow-y-auto">
                    <ReactMarkdown>{selectedDoc.content || "No content"}</ReactMarkdown>
                  </div>
                </CardContent>
              </>
            ) : (
              <CardContent className="p-8 flex flex-col items-center justify-center text-center h-full">
                <BookOpen className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">Select a document to view its contents</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Documents are chunked and used to ground agent responses
                </p>
              </CardContent>
            )}
          </Card>
        </div>
      </motion.div>
    </motion.div>
  );
}
