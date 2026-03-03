import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { supabase } from "@/integrations/supabase/client";
import {
  Upload, Search, FileText, Bot, Loader2, Trash2, Download,
  ExternalLink, Pencil, Check, X, File, FileSpreadsheet, Presentation,
  FolderPlus, Folder, FolderOpen, ChevronRight,
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
const MAX_FILE_SIZE = 20 * 1024 * 1024;

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

type FolderRow = { id: string; name: string; parent_id: string | null; created_at: string };

export default function Knowledge() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [docs, setDocs] = useState<any[]>([]);
  const [folders, setFolders] = useState<FolderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editFolderName, setEditFolderName] = useState("");
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState<FolderRow[]>([]);
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: "doc" | "folder"; item: any } | null>(null);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const dragCounter = useRef(0);

  // Build breadcrumb path
  const buildPath = useCallback(async (folderId: string | null) => {
    if (!folderId) { setFolderPath([]); return; }
    const path: FolderRow[] = [];
    let id: string | null = folderId;
    while (id) {
      const { data } = await supabase.from("knowledge_folders").select("*").eq("id", id).single();
      if (!data) break;
      path.unshift(data);
      id = data.parent_id;
    }
    setFolderPath(path);
  }, []);

  const fetchData = useCallback(async () => {
    // Fetch folders in current folder
    let folderQuery = supabase.from("knowledge_folders").select("*").order("name");
    if (currentFolderId) {
      folderQuery = folderQuery.eq("parent_id", currentFolderId);
    } else {
      folderQuery = folderQuery.is("parent_id", null);
    }
    const { data: folderData } = await folderQuery;
    setFolders(folderData || []);

    // Fetch docs in current folder
    let docQuery = supabase.from("knowledge_documents").select("*").order("created_at", { ascending: false });
    if (currentFolderId) {
      docQuery = docQuery.eq("folder_id", currentFolderId);
    } else {
      docQuery = docQuery.is("folder_id", null);
    }
    if (search) docQuery = docQuery.ilike("title", `%${search}%`);
    const { data: docData } = await docQuery;
    setDocs(docData || []);
    setLoading(false);
  }, [currentFolderId, search]);

  useEffect(() => { fetchData(); buildPath(currentFolderId); }, [currentFolderId, search, fetchData, buildPath]);

  const navigateToFolder = (folderId: string | null) => {
    setCurrentFolderId(folderId);
    setLoading(true);
  };

  // File upload (both click and drag-drop)
  const uploadFiles = async (files: FileList | File[]) => {
    setUploading(true);
    for (const file of Array.from(files)) {
      if (file.size > MAX_FILE_SIZE) {
        toast({ title: "File too large", description: `${file.name} exceeds 20MB limit`, variant: "destructive" });
        continue;
      }
      const fileId = crypto.randomUUID();
      const filePath = `knowledge/${fileId}/${file.name}`;
      const { error: uploadError } = await supabase.storage.from("documents").upload(filePath, file);
      if (uploadError) {
        toast({ title: "Upload failed", description: `${file.name}: ${uploadError.message}`, variant: "destructive" });
        continue;
      }
      const { error } = await supabase.functions.invoke("knowledge-ingest", {
        body: { file_path: filePath, title: file.name, mime_type: file.type, folder_id: currentFolderId },
      });
      if (error) {
        toast({ title: "Ingestion failed", description: `${file.name}: ${error.message}`, variant: "destructive" });
      } else {
        toast({ title: "Document uploaded", description: `${file.name} added to Knowledge Base` });
      }
    }
    setUploading(false);
    fetchData();
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) uploadFiles(e.target.files);
  };

  // Drag-drop file upload handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current++;
    if (e.dataTransfer.types.includes("Files")) setIsDraggingFile(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) setIsDraggingFile(false);
  };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDraggingFile(false);
    if (e.dataTransfer.files.length > 0) {
      uploadFiles(e.dataTransfer.files);
    }
  };

  // Drag-drop reorganization
  const handleDocDragStart = (e: React.DragEvent, docId: string) => {
    e.dataTransfer.setData("text/doc-id", docId);
    e.dataTransfer.effectAllowed = "move";
  };
  const handleFolderDragOver = (e: React.DragEvent, folderId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverTarget(folderId);
  };
  const handleFolderDragLeave = () => { setDragOverTarget(null); };
  const handleFolderDrop = async (e: React.DragEvent, targetFolderId: string | null) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverTarget(null);
    const docId = e.dataTransfer.getData("text/doc-id");
    if (docId) {
      await supabase.from("knowledge_documents").update({ folder_id: targetFolderId }).eq("id", docId);
      toast({ title: "File moved" });
      fetchData();
    }
  };

  // CRUD
  const deleteDoc = async (doc: any) => {
    await supabase.from("knowledge_chunks").delete().eq("document_id", doc.id);
    await supabase.from("knowledge_documents").delete().eq("id", doc.id);
    if (doc.file_path) await supabase.storage.from("documents").remove([doc.file_path]);
    fetchData();
    toast({ title: "Document deleted" });
  };

  const deleteFolder = async (folder: FolderRow) => {
    // Recursively collect all descendant folder IDs
    const allFolderIds = [folder.id];
    const collectDescendants = async (parentId: string) => {
      const { data: children } = await supabase
        .from("knowledge_folders")
        .select("id")
        .eq("parent_id", parentId);
      if (children) {
        for (const child of children) {
          allFolderIds.push(child.id);
          await collectDescendants(child.id);
        }
      }
    };
    await collectDescendants(folder.id);

    // Move ALL docs from all descendant folders to parent
    await supabase.from("knowledge_documents")
      .update({ folder_id: folder.parent_id })
      .in("folder_id", allFolderIds);

    // Delete all descendant folders + the folder itself
    await supabase.from("knowledge_folders")
      .delete()
      .in("id", allFolderIds);

    fetchData();
    toast({ title: "Folder and subfolders deleted" });
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
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  const startRename = (doc: any) => { setEditingId(doc.id); setEditTitle(doc.title); };
  const confirmRename = async () => {
    if (!editingId || !editTitle.trim()) return;
    await supabase.from("knowledge_documents").update({ title: editTitle.trim() }).eq("id", editingId);
    setEditingId(null);
    fetchData();
  };

  const startFolderRename = (f: FolderRow) => { setEditingFolderId(f.id); setEditFolderName(f.name); };
  const confirmFolderRename = async () => {
    if (!editingFolderId || !editFolderName.trim()) return;
    await supabase.from("knowledge_folders").update({ name: editFolderName.trim() }).eq("id", editingFolderId);
    setEditingFolderId(null);
    fetchData();
  };

  const createFolder = async () => {
    if (!newFolderName.trim()) return;
    await supabase.from("knowledge_folders").insert({ name: newFolderName.trim(), parent_id: currentFolderId });
    setCreatingFolder(false);
    setNewFolderName("");
    fetchData();
    toast({ title: "Folder created" });
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === "doc") deleteDoc(deleteTarget.item);
    else deleteFolder(deleteTarget.item);
    setDeleteTarget(null);
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6 max-w-5xl relative"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Full-page drop overlay */}
      {isDraggingFile && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center pointer-events-none">
          <div className="border-2 border-dashed border-primary rounded-xl p-12 text-center">
            <Upload className="h-12 w-12 text-primary mx-auto mb-3" />
            <p className="text-lg font-semibold">Drop files to upload</p>
            <p className="text-sm text-muted-foreground">PDF, DOCX, PPTX, TXT, MD, CSV</p>
          </div>
        </div>
      )}

      <motion.div variants={item}>
        <h1 className="text-3xl font-bold tracking-tight">Knowledge Base</h1>
        <p className="text-muted-foreground mt-1">Upload documents to ground agent responses with your organization's knowledge</p>
      </motion.div>

      {/* Breadcrumbs */}
      {folderPath.length > 0 && (
        <motion.div variants={item}>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink
                  className="cursor-pointer"
                  onClick={() => navigateToFolder(null)}
                  onDragOver={(e) => { e.preventDefault(); setDragOverTarget("root"); }}
                  onDragLeave={() => setDragOverTarget(null)}
                  onDrop={(e) => handleFolderDrop(e, null)}
                >
                  <span className={dragOverTarget === "root" ? "text-primary font-semibold" : ""}>Home</span>
                </BreadcrumbLink>
              </BreadcrumbItem>
              {folderPath.map((f, i) => (
                <span key={f.id} className="contents">
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    {i === folderPath.length - 1 ? (
                      <BreadcrumbPage>{f.name}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink
                        className="cursor-pointer"
                        onClick={() => navigateToFolder(f.id)}
                        onDragOver={(e) => { e.preventDefault(); setDragOverTarget(f.id); }}
                        onDragLeave={() => setDragOverTarget(null)}
                        onDrop={(e) => handleFolderDrop(e, f.id)}
                      >
                        <span className={dragOverTarget === f.id ? "text-primary font-semibold" : ""}>{f.name}</span>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </span>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </motion.div>
      )}

      {/* Toolbar */}
      <motion.div variants={item} className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search documents..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-muted/50 border-border/50" />
        </div>
        <Button variant="outline" onClick={() => setCreatingFolder(true)}>
          <FolderPlus className="h-4 w-4 mr-2" /> New Folder
        </Button>
        <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
          {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
          {uploading ? "Uploading..." : "Upload Files"}
        </Button>
        <input ref={fileInputRef} type="file" accept={ACCEPTED_TYPES} multiple className="hidden" onChange={handleUpload} />
      </motion.div>

      {/* New folder inline form */}
      {creatingFolder && (
        <motion.div variants={item} className="flex gap-2 items-center">
          <Folder className="h-4 w-4 text-muted-foreground" />
          <Input
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Folder name..."
            className="max-w-xs"
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && createFolder()}
          />
          <Button size="sm" onClick={createFolder}><Check className="h-3 w-3" /></Button>
          <Button size="sm" variant="ghost" onClick={() => { setCreatingFolder(false); setNewFolderName(""); }}><X className="h-3 w-3" /></Button>
        </motion.div>
      )}

      {/* Content list */}
      <motion.div variants={item}>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : folders.length === 0 && docs.length === 0 ? (
          <Card className="glass-card border-dashed border-2 border-border/50 hover:border-primary/30 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <CardContent className="p-6 flex flex-col items-center text-center">
              <Upload className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm font-medium">Drop files here or click to upload</p>
              <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, PPTX, TXT, MD, CSV — max 20MB per file</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="glass-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="w-[80px]">Type</TableHead>
                  <TableHead className="w-[80px]">Tokens</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead className="w-[100px]">Date</TableHead>
                  <TableHead className="w-[140px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Folders first */}
                {folders.map((f) => (
                  <TableRow
                    key={`folder-${f.id}`}
                    className={`cursor-pointer transition-colors ${dragOverTarget === f.id ? "bg-primary/10 border-primary" : ""}`}
                    onDragOver={(e) => handleFolderDragOver(e, f.id)}
                    onDragLeave={handleFolderDragLeave}
                    onDrop={(e) => handleFolderDrop(e, f.id)}
                    onClick={() => navigateToFolder(f.id)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {dragOverTarget === f.id ? (
                          <FolderOpen className="h-4 w-4 text-primary shrink-0" />
                        ) : (
                          <Folder className="h-4 w-4 text-muted-foreground shrink-0" />
                        )}
                        {editingFolderId === f.id ? (
                          <div className="flex items-center gap-1 flex-1" onClick={(e) => e.stopPropagation()}>
                            <Input value={editFolderName} onChange={(e) => setEditFolderName(e.target.value)} className="h-7 text-sm" onKeyDown={(e) => e.key === "Enter" && confirmFolderRename()} autoFocus />
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={confirmFolderRename}><Check className="h-3 w-3" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingFolderId(null)}><X className="h-3 w-3" /></Button>
                          </div>
                        ) : (
                          <span className="text-sm font-medium">{f.name}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">Folder</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">—</TableCell>
                    <TableCell>—</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{new Date(f.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startFolderRename(f)} title="Rename"><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDeleteTarget({ type: "folder", item: f })} title="Delete"><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {/* Documents */}
                {docs.map((doc) => (
                  <TableRow
                    key={doc.id}
                    draggable
                    onDragStart={(e) => handleDocDragStart(e, doc.id)}
                    className="cursor-grab active:cursor-grabbing"
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {doc.doc_type === "agent_output" ? <Bot className="h-4 w-4 text-primary shrink-0" /> : fileIcon(doc.mime_type, doc.title)}
                        {editingId === doc.id ? (
                          <div className="flex items-center gap-1 flex-1">
                            <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="h-7 text-sm" onKeyDown={(e) => e.key === "Enter" && confirmRename()} autoFocus />
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={confirmRename}><Check className="h-3 w-3" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingId(null)}><X className="h-3 w-3" /></Button>
                          </div>
                        ) : (
                          <span className="text-sm font-medium truncate max-w-[300px]">{doc.title}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{doc.doc_type === "agent_output" ? "AI" : typeBadge(doc.mime_type, doc.title)}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{doc.tokens?.toLocaleString() || 0}</TableCell>
                    <TableCell><Badge variant="outline" className={statusBadge[doc.status] || ""}>{doc.status}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{new Date(doc.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        {doc.file_path && (
                          <>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpen(doc)} title="Open"><ExternalLink className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDownload(doc)} title="Download"><Download className="h-3.5 w-3.5" /></Button>
                          </>
                        )}
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startRename(doc)} title="Rename"><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDeleteTarget({ type: "doc", item: doc })} title="Delete"><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </motion.div>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.type === "folder" ? "folder" : "document"}?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.type === "folder"
                ? `"${deleteTarget.item.name}" will be deleted. Documents inside will be moved to the parent folder.`
                : `"${deleteTarget?.item.title}" and its chunks will be permanently removed.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
