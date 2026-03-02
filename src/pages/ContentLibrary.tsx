import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import {
  Search, FolderPlus, FolderOpen, Trash2, Download, MoreVertical,
  FileText, Pencil, ArrowRight, ChevronRight, X,
} from "lucide-react";

type Folder = { id: string; name: string; parent_id: string | null; created_at: string };
type ContentItem = {
  id: string; title: string; content: string; folder_id: string | null;
  agent_type: string | null; skill_id: string | null; skill_name: string | null;
  department: string | null; job_id: string | null; owner: string; created_at: string;
};

const container = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

export default function ContentLibrary() {
  const { toast } = useToast();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [items, setItems] = useState<ContentItem[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
  const [renamingFolder, setRenamingFolder] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);

  const fetchData = useCallback(async () => {
    const [fRes, iRes] = await Promise.all([
      supabase.from("content_folders").select("*").order("name"),
      supabase.from("content_items").select("*").order("created_at", { ascending: false }),
    ]);
    if (fRes.data) setFolders(fRes.data as Folder[]);
    if (iRes.data) setItems(iRes.data as ContentItem[]);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel("content_items_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "content_items" }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchData]);

  const filteredItems = items.filter((i) => {
    const inFolder = selectedFolder === null || i.folder_id === selectedFolder;
    const matchesSearch =
      !search ||
      i.title.toLowerCase().includes(search.toLowerCase()) ||
      (i.agent_type || "").toLowerCase().includes(search.toLowerCase()) ||
      (i.skill_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (i.department || "").toLowerCase().includes(search.toLowerCase());
    return inFolder && matchesSearch;
  });

  const createFolder = async () => {
    if (!newFolderName.trim()) return;
    await supabase.from("content_folders").insert({ name: newFolderName.trim() });
    setNewFolderName("");
    setFolderDialogOpen(false);
    fetchData();
    toast({ title: "Folder created" });
  };

  const renameFolder = async (id: string) => {
    if (!renameValue.trim()) return;
    await supabase.from("content_folders").update({ name: renameValue.trim() }).eq("id", id);
    setRenamingFolder(null);
    fetchData();
  };

  const deleteFolder = async (id: string) => {
    await supabase.from("content_items").update({ folder_id: null }).eq("folder_id", id);
    await supabase.from("content_folders").delete().eq("id", id);
    if (selectedFolder === id) setSelectedFolder(null);
    fetchData();
    toast({ title: "Folder deleted" });
  };

  const deleteItem = async (id: string) => {
    await supabase.from("content_items").delete().eq("id", id);
    if (selectedItem?.id === id) setSelectedItem(null);
    selectedIds.delete(id);
    setSelectedIds(new Set(selectedIds));
    fetchData();
    toast({ title: "Item deleted" });
  };

  const deleteSelected = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    for (const id of ids) {
      await supabase.from("content_items").delete().eq("id", id);
    }
    setSelectedIds(new Set());
    setSelectedItem(null);
    fetchData();
    toast({ title: `${ids.length} item(s) deleted` });
  };

  const downloadItem = (ci: ContentItem) => {
    const blob = new Blob([ci.content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${ci.title.replace(/[^a-zA-Z0-9]/g, "_")}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadSelected = () => {
    const toDownload = items.filter((i) => selectedIds.has(i.id));
    toDownload.forEach((ci) => downloadItem(ci));
  };

  const moveItem = async (itemId: string, folderId: string | null) => {
    await supabase.from("content_items").update({ folder_id: folderId }).eq("id", itemId);
    fetchData();
    toast({ title: "Item moved" });
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };

  const toggleAll = () => {
    if (selectedIds.size === filteredItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredItems.map((i) => i.id)));
    }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Content Library</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage agent-produced content and documents.</p>
        </div>
      </motion.div>

      <motion.div variants={item} className="flex gap-4 h-[calc(100vh-12rem)]">
        {/* Left: Folders + Items */}
        <div className="w-80 shrink-0 flex flex-col gap-3">
          {/* Folder panel */}
          <Card className="glass-card">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground">Folders</CardTitle>
              <Dialog open={folderDialogOpen} onOpenChange={setFolderDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6"><FolderPlus className="h-3.5 w-3.5" /></Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-sm">
                  <DialogHeader><DialogTitle>New Folder</DialogTitle></DialogHeader>
                  <div className="flex gap-2">
                    <Input value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} placeholder="Folder name" onKeyDown={(e) => e.key === "Enter" && createFolder()} />
                    <Button onClick={createFolder} size="sm">Create</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="space-y-0.5 max-h-48 overflow-y-auto">
              <button
                onClick={() => setSelectedFolder(null)}
                className={`w-full text-left text-sm px-2 py-1.5 rounded-md transition-colors flex items-center gap-2 ${selectedFolder === null ? "bg-sidebar-accent text-primary font-medium" : "hover:bg-muted"}`}
              >
                <FolderOpen className="h-3.5 w-3.5" /> All Content
                <span className="ml-auto text-xs text-muted-foreground">{items.length}</span>
              </button>
              {folders.map((f) => (
                <div key={f.id} className="group flex items-center">
                  {renamingFolder === f.id ? (
                    <Input
                      autoFocus
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onBlur={() => renameFolder(f.id)}
                      onKeyDown={(e) => e.key === "Enter" && renameFolder(f.id)}
                      className="h-7 text-sm"
                    />
                  ) : (
                    <button
                      onClick={() => setSelectedFolder(f.id)}
                      className={`flex-1 text-left text-sm px-2 py-1.5 rounded-md transition-colors flex items-center gap-2 ${selectedFolder === f.id ? "bg-sidebar-accent text-primary font-medium" : "hover:bg-muted"}`}
                    >
                      <FolderOpen className="h-3.5 w-3.5" /> {f.name}
                      <span className="ml-auto text-xs text-muted-foreground">
                        {items.filter((i) => i.folder_id === f.id).length}
                      </span>
                    </button>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100">
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => { setRenamingFolder(f.id); setRenameValue(f.name); }}>
                        <Pencil className="h-3 w-3 mr-2" /> Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => deleteFolder(f.id)}>
                        <Trash2 className="h-3 w-3 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Search content..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-8 text-sm" />
          </div>

          {/* Bulk actions */}
          {selectedIds.size > 0 && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={downloadSelected}>
                <Download className="h-3 w-3" /> Download ({selectedIds.size})
              </Button>
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1 text-destructive" onClick={deleteSelected}>
                <Trash2 className="h-3 w-3" /> Delete ({selectedIds.size})
              </Button>
            </div>
          )}

          {/* Items list */}
          <div className="flex-1 overflow-y-auto space-y-1">
            {filteredItems.length > 0 && (
              <div className="flex items-center gap-2 px-1 pb-1">
                <Checkbox checked={selectedIds.size === filteredItems.length && filteredItems.length > 0} onCheckedChange={toggleAll} />
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Select All</span>
              </div>
            )}
            {filteredItems.map((ci) => (
              <div
                key={ci.id}
                className={`flex items-start gap-2 p-2 rounded-lg cursor-pointer transition-colors ${selectedItem?.id === ci.id ? "bg-sidebar-accent" : "hover:bg-muted/50"}`}
              >
                <Checkbox
                  checked={selectedIds.has(ci.id)}
                  onCheckedChange={() => toggleSelect(ci.id)}
                  className="mt-1"
                />
                <div className="flex-1 min-w-0" onClick={() => setSelectedItem(ci)}>
                  <p className="text-sm font-medium truncate">{ci.title}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {ci.department && <Badge variant="outline" className="text-[10px] h-4 px-1">{ci.department}</Badge>}
                    {ci.skill_name && <Badge variant="secondary" className="text-[10px] h-4 px-1">{ci.skill_name}</Badge>}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(ci.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
            {filteredItems.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No content found.</p>
            )}
          </div>
        </div>

        {/* Right: Content viewer */}
        <Card className="glass-card flex-1 flex flex-col overflow-hidden">
          {selectedItem ? (
            <>
              <CardHeader className="pb-3 flex flex-row items-start justify-between shrink-0">
                <div className="space-y-1 min-w-0 flex-1">
                  <CardTitle className="text-lg truncate">{selectedItem.title}</CardTitle>
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span>{new Date(selectedItem.created_at).toLocaleString()}</span>
                    <span>·</span>
                    <span>Owner: {selectedItem.owner}</span>
                    {selectedItem.agent_type && <><span>·</span><span>Agent: {selectedItem.agent_type}</span></>}
                    {selectedItem.skill_name && <><span>·</span><span>Skill: {selectedItem.skill_name}</span></>}
                    {selectedItem.department && <><span>·</span><span>Dept: {selectedItem.department}</span></>}
                  </div>
                </div>
                <div className="flex gap-1.5 shrink-0 ml-3">
                  {/* Move to folder */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                        <ArrowRight className="h-3 w-3" /> Move
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => moveItem(selectedItem.id, null)}>
                        <FolderOpen className="h-3 w-3 mr-2" /> No Folder
                      </DropdownMenuItem>
                      {folders.map((f) => (
                        <DropdownMenuItem key={f.id} onClick={() => moveItem(selectedItem.id, f.id)}>
                          <ChevronRight className="h-3 w-3 mr-2" /> {f.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => downloadItem(selectedItem)}>
                    <Download className="h-3 w-3" /> Download
                  </Button>
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1 text-destructive" onClick={() => deleteItem(selectedItem.id)}>
                    <Trash2 className="h-3 w-3" /> Delete
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelectedItem(null)}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto">
                <div className="prose dark:prose-invert max-w-none [&>h2]:mt-6 [&>h2]:mb-3 [&>h2]:text-lg [&>h2]:font-bold [&>h3]:mt-4 [&>h3]:mb-2 [&>h3]:text-base [&>h3]:font-semibold [&>p]:my-3 [&>ul]:my-3 [&>ol]:my-3 [&>p+p]:mt-4 [&>li]:my-1 [&>ul>li]:my-1">
                  <ReactMarkdown>{selectedItem.content}</ReactMarkdown>
                </div>
              </CardContent>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Select an item to preview</p>
              </div>
            </div>
          )}
        </Card>
      </motion.div>
    </motion.div>
  );
}
