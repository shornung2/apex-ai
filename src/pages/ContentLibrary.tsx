import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useTenant } from "@/hooks/use-tenant";
import ReactMarkdown from "react-markdown";
import {
  Search, FolderPlus, FolderOpen, Trash2, Download, MoreVertical,
  FileText, Pencil, ArrowRight, ChevronRight, Home, Eye, Copy,
  ArrowUpDown, Folder, X,
} from "lucide-react";

type ContentFolder = { id: string; name: string; parent_id: string | null; created_at: string };
type ContentItem = {
  id: string; title: string; content: string; folder_id: string | null;
  agent_type: string | null; skill_id: string | null; skill_name: string | null;
  department: string | null; job_id: string | null; owner: string; created_at: string;
  view_count: number; updated_at: string;
};

type SortKey = "created_at" | "title" | "view_count" | "department" | "owner";
type SortDir = "asc" | "desc";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

export default function ContentLibrary() {
  const { toast } = useToast();
  const { tenantId } = useTenant();
  const [folders, setFolders] = useState<ContentFolder[]>([]);
  const [items, setItems] = useState<ContentItem[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // Dialogs
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [renameFolderId, setRenameFolderId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [moveFolderId, setMoveFolderId] = useState<string | null>(null);
  const [moveTargetParent, setMoveTargetParent] = useState<string>("root");
  const [renameItemId, setRenameItemId] = useState<string | null>(null);
  const [renameItemValue, setRenameItemValue] = useState("");
  const [moveItemId, setMoveItemId] = useState<string | null>(null);
  const [moveItemTarget, setMoveItemTarget] = useState<string>("root");
  const [bulkMoveOpen, setBulkMoveOpen] = useState(false);
  const [bulkMoveTarget, setBulkMoveTarget] = useState<string>("root");
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: "folder" | "item" | "bulk"; id?: string } | null>(null);

  const fetchData = useCallback(async () => {
    const [fRes, iRes] = await Promise.all([
      supabase.from("content_folders").select("*").order("name"),
      supabase.from("content_items").select("*").order("created_at", { ascending: false }),
    ]);
    if (fRes.data) setFolders(fRes.data as ContentFolder[]);
    if (iRes.data) setItems(iRes.data as ContentItem[]);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const channel = supabase
      .channel("content_items_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "content_items" }, () => fetchData())
      .on("postgres_changes", { event: "*", schema: "public", table: "content_folders" }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchData]);

  // Build breadcrumb path
  const breadcrumb = useMemo(() => {
    const path: ContentFolder[] = [];
    let id = currentFolderId;
    while (id) {
      const f = folders.find((f) => f.id === id);
      if (!f) break;
      path.unshift(f);
      id = f.parent_id;
    }
    return path;
  }, [currentFolderId, folders]);

  // Subfolders of current folder
  const childFolders = useMemo(
    () => folders.filter((f) => f.parent_id === currentFolderId),
    [folders, currentFolderId]
  );

  // Items in current folder
  const currentItems = useMemo(() => {
    let list = items.filter((i) =>
      currentFolderId === null ? i.folder_id === null : i.folder_id === currentFolderId
    );
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          (i.department || "").toLowerCase().includes(q) ||
          (i.skill_name || "").toLowerCase().includes(q) ||
          (i.owner || "").toLowerCase().includes(q) ||
          i.content.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      let av: string | number = (a as any)[sortKey] ?? "";
      let bv: string | number = (b as any)[sortKey] ?? "";
      if (sortKey === "view_count") { av = a.view_count; bv = b.view_count; }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return list;
  }, [items, currentFolderId, search, sortKey, sortDir]);

  const folderItemCount = useCallback(
    (folderId: string): number => {
      const direct = items.filter((i) => i.folder_id === folderId).length;
      const subfolders = folders.filter((f) => f.parent_id === folderId);
      return direct + subfolders.reduce((sum, sf) => sum + folderItemCount(sf.id), 0);
    },
    [items, folders]
  );

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  };

  // --- CRUD operations ---
  const createFolder = async () => {
    if (!newFolderName.trim()) return;
    await supabase.from("content_folders").insert({ name: newFolderName.trim(), parent_id: currentFolderId, tenant_id: tenantId! });
    setNewFolderName("");
    setNewFolderOpen(false);
    fetchData();
    toast({ title: "Folder created" });
  };

  const doRenameFolder = async () => {
    if (!renameFolderId || !renameValue.trim()) return;
    await supabase.from("content_folders").update({ name: renameValue.trim() }).eq("id", renameFolderId);
    setRenameFolderId(null);
    fetchData();
    toast({ title: "Folder renamed" });
  };

  const doMoveFolder = async () => {
    if (!moveFolderId) return;
    const newParent = moveTargetParent === "root" ? null : moveTargetParent;
    await supabase.from("content_folders").update({ parent_id: newParent }).eq("id", moveFolderId);
    setMoveFolderId(null);
    fetchData();
    toast({ title: "Folder moved" });
  };

  const deleteFolder = async (id: string) => {
    const parent = folders.find((f) => f.id === id)?.parent_id ?? null;
    // Move child items to parent
    await supabase.from("content_items").update({ folder_id: parent }).eq("folder_id", id);
    // Move child folders to parent
    await supabase.from("content_folders").update({ parent_id: parent }).match({ parent_id: id });
    await supabase.from("content_folders").delete().eq("id", id);
    if (currentFolderId === id) setCurrentFolderId(parent);
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

  const deleteBulk = async () => {
    const ids = Array.from(selectedIds);
    await supabase.from("content_items").delete().in("id", ids);
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
    items.filter((i) => selectedIds.has(i.id)).forEach(downloadItem);
  };

  const moveItem = async (itemId: string, folderId: string | null) => {
    await supabase.from("content_items").update({ folder_id: folderId }).eq("id", itemId);
    fetchData();
    toast({ title: "Item moved" });
  };

  const moveBulk = async () => {
    const target = bulkMoveTarget === "root" ? null : bulkMoveTarget;
    const ids = Array.from(selectedIds);
    await supabase.from("content_items").update({ folder_id: target }).in("id", ids);
    setBulkMoveOpen(false);
    setSelectedIds(new Set());
    fetchData();
    toast({ title: `${ids.length} item(s) moved` });
  };

  const doRenameItem = async () => {
    if (!renameItemId || !renameItemValue.trim()) return;
    await supabase.from("content_items").update({ title: renameItemValue.trim() }).eq("id", renameItemId);
    if (selectedItem?.id === renameItemId) setSelectedItem({ ...selectedItem, title: renameItemValue.trim() });
    setRenameItemId(null);
    fetchData();
    toast({ title: "Item renamed" });
  };

  const openDetail = async (ci: ContentItem) => {
    setSelectedItem(ci);
    // Increment view count
    await supabase.from("content_items").update({ view_count: (ci.view_count || 0) + 1 }).eq("id", ci.id);
    // Update local state
    setItems((prev) => prev.map((i) => i.id === ci.id ? { ...i, view_count: (i.view_count || 0) + 1 } : i));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };

  const toggleAll = () => {
    if (selectedIds.size === currentItems.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(currentItems.map((i) => i.id)));
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    if (deleteConfirm.type === "folder" && deleteConfirm.id) await deleteFolder(deleteConfirm.id);
    else if (deleteConfirm.type === "item" && deleteConfirm.id) await deleteItem(deleteConfirm.id);
    else if (deleteConfirm.type === "bulk") await deleteBulk();
    setDeleteConfirm(null);
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
      {/* Header */}
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Content Library</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage agent-produced content and documents.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setNewFolderOpen(true)}>
            <FolderPlus className="h-4 w-4 mr-1.5" /> New Folder
          </Button>
        </div>
      </motion.div>

      {/* Breadcrumb */}
      <motion.div variants={item} className="flex items-center gap-1 text-sm text-muted-foreground">
        <button onClick={() => setCurrentFolderId(null)} className="flex items-center gap-1 hover:text-foreground transition-colors">
          <Home className="h-3.5 w-3.5" /> All Content
        </button>
        {breadcrumb.map((f) => (
          <span key={f.id} className="flex items-center gap-1">
            <ChevronRight className="h-3 w-3" />
            <button onClick={() => setCurrentFolderId(f.id)} className="hover:text-foreground transition-colors">
              {f.name}
            </button>
          </span>
        ))}
      </motion.div>

      {/* Search + Bulk actions */}
      <motion.div variants={item} className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search by title, department, skill, owner..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
        </div>
        {selectedIds.size > 0 && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={downloadSelected}>
              <Download className="h-3 w-3" /> Download ({selectedIds.size})
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={() => setBulkMoveOpen(true)}>
              <ArrowRight className="h-3 w-3" /> Move ({selectedIds.size})
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1 text-destructive" onClick={() => setDeleteConfirm({ type: "bulk" })}>
              <Trash2 className="h-3 w-3" /> Delete ({selectedIds.size})
            </Button>
          </div>
        )}
      </motion.div>

      {/* Subfolders */}
      {childFolders.length > 0 && (
        <motion.div variants={item} className="flex flex-wrap gap-2">
          {childFolders.map((f) => (
            <div key={f.id} className="group flex items-center gap-1">
              <button
                onClick={() => setCurrentFolderId(f.id)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border/50 bg-card/60 hover:bg-muted/50 transition-colors text-sm"
              >
                <Folder className="h-4 w-4 text-primary" />
                <span className="font-medium">{f.name}</span>
                <Badge variant="secondary" className="text-[10px] h-4 px-1.5 ml-1">{folderItemCount(f.id)}</Badge>
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100">
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => { setRenameFolderId(f.id); setRenameValue(f.name); }}>
                    <Pencil className="h-3 w-3 mr-2" /> Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setMoveFolderId(f.id); setMoveTargetParent(f.parent_id || "root"); }}>
                    <ArrowRight className="h-3 w-3 mr-2" /> Move
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive" onClick={() => setDeleteConfirm({ type: "folder", id: f.id })}>
                    <Trash2 className="h-3 w-3 mr-2" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </motion.div>
      )}

      {/* Content Table */}
      <motion.div variants={item} className="rounded-lg border border-border/50 bg-card/60 backdrop-blur-xl overflow-hidden">
        {currentItems.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={selectedIds.size === currentItems.length && currentItems.length > 0}
                    onCheckedChange={toggleAll}
                  />
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => toggleSort("title")}>
                  <span className="flex items-center gap-1">Title <ArrowUpDown className="h-3 w-3" /></span>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => toggleSort("department")}>
                  <span className="flex items-center gap-1">Department <ArrowUpDown className="h-3 w-3" /></span>
                </TableHead>
                <TableHead>Skill</TableHead>
                <TableHead className="cursor-pointer" onClick={() => toggleSort("owner")}>
                  <span className="flex items-center gap-1">Owner <ArrowUpDown className="h-3 w-3" /></span>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => toggleSort("created_at")}>
                  <span className="flex items-center gap-1">Created <ArrowUpDown className="h-3 w-3" /></span>
                </TableHead>
                <TableHead className="cursor-pointer text-right" onClick={() => toggleSort("view_count")}>
                  <span className="flex items-center gap-1 justify-end">Views <ArrowUpDown className="h-3 w-3" /></span>
                </TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentItems.map((ci) => (
                <TableRow key={ci.id} className="cursor-pointer" onClick={() => openDetail(ci)}>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox checked={selectedIds.has(ci.id)} onCheckedChange={() => toggleSelect(ci.id)} />
                  </TableCell>
                  <TableCell className="font-medium max-w-[250px] truncate">{ci.title}</TableCell>
                  <TableCell>{ci.department && <Badge variant="outline" className="text-[10px]">{ci.department}</Badge>}</TableCell>
                  <TableCell>{ci.skill_name && <Badge variant="secondary" className="text-[10px]">{ci.skill_name}</Badge>}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{ci.owner}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{new Date(ci.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right text-muted-foreground text-xs">
                    <span className="flex items-center gap-1 justify-end"><Eye className="h-3 w-3" /> {ci.view_count || 0}</span>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreVertical className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setRenameItemId(ci.id); setRenameItemValue(ci.title); }}>
                          <Pencil className="h-3 w-3 mr-2" /> Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setMoveItemId(ci.id); setMoveItemTarget(ci.folder_id || "root"); }}>
                          <ArrowRight className="h-3 w-3 mr-2" /> Move
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => downloadItem(ci)}>
                          <Download className="h-3 w-3 mr-2" /> Download
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={() => setDeleteConfirm({ type: "item", id: ci.id })}>
                          <Trash2 className="h-3 w-3 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <FileText className="h-12 w-12 mb-4 opacity-20" />
            <p className="text-sm font-medium">No content in this folder</p>
            <p className="text-xs mt-1">Save agent outputs from the Job Detail page, or move items here.</p>
          </div>
        )}
      </motion.div>

      {/* Detail Sheet */}
      <Sheet open={!!selectedItem} onOpenChange={(open) => { if (!open) setSelectedItem(null); }}>
        <SheetContent className="sm:max-w-xl overflow-y-auto">
          {selectedItem && (
            <>
              <SheetHeader>
                <SheetTitle className="text-lg pr-6">{selectedItem.title}</SheetTitle>
              </SheetHeader>
              {/* Metadata */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4 text-xs text-muted-foreground border rounded-lg p-3 bg-muted/30">
                <div><span className="font-medium text-foreground">Owner:</span> {selectedItem.owner}</div>
                <div><span className="font-medium text-foreground">Created:</span> {new Date(selectedItem.created_at).toLocaleString()}</div>
                {selectedItem.updated_at && (
                  <div><span className="font-medium text-foreground">Updated:</span> {new Date(selectedItem.updated_at).toLocaleString()}</div>
                )}
                <div><span className="font-medium text-foreground">Views:</span> {selectedItem.view_count || 0}</div>
                {selectedItem.department && (
                  <div><span className="font-medium text-foreground">Department:</span> {selectedItem.department}</div>
                )}
                {selectedItem.agent_type && (
                  <div><span className="font-medium text-foreground">Agent:</span> {selectedItem.agent_type}</div>
                )}
                {selectedItem.skill_name && (
                  <div className="col-span-2"><span className="font-medium text-foreground">Skill:</span> {selectedItem.skill_name}</div>
                )}
              </div>
              {/* Actions */}
              <div className="flex flex-wrap gap-2 mt-4">
                <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => downloadItem(selectedItem)}>
                  <Download className="h-3 w-3" /> Download
                </Button>
                <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => copyToClipboard(selectedItem.content)}>
                  <Copy className="h-3 w-3" /> Copy
                </Button>
                <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => { setRenameItemId(selectedItem.id); setRenameItemValue(selectedItem.title); }}>
                  <Pencil className="h-3 w-3" /> Rename
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="text-xs gap-1">
                      <ArrowRight className="h-3 w-3" /> Move
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => moveItem(selectedItem.id, null)}>
                      <FolderOpen className="h-3 w-3 mr-2" /> Root (no folder)
                    </DropdownMenuItem>
                    {folders.map((f) => (
                      <DropdownMenuItem key={f.id} onClick={() => moveItem(selectedItem.id, f.id)}>
                        <ChevronRight className="h-3 w-3 mr-2" /> {f.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button variant="outline" size="sm" className="text-xs gap-1 text-destructive" onClick={() => setDeleteConfirm({ type: "item", id: selectedItem.id })}>
                  <Trash2 className="h-3 w-3" /> Delete
                </Button>
              </div>
              {/* Content */}
              <div className="mt-6 prose dark:prose-invert max-w-none text-sm [&>h2]:mt-6 [&>h2]:mb-3 [&>h2]:text-lg [&>h2]:font-bold [&>h3]:mt-4 [&>h3]:mb-2 [&>h3]:text-base [&>h3]:font-semibold [&>p]:my-3 [&>ul]:my-3 [&>ol]:my-3">
                <ReactMarkdown>{selectedItem.content}</ReactMarkdown>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* New Folder Dialog */}
      <Dialog open={newFolderOpen} onOpenChange={setNewFolderOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>New Folder</DialogTitle></DialogHeader>
          <Input value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} placeholder="Folder name" onKeyDown={(e) => e.key === "Enter" && createFolder()} autoFocus />
          <DialogFooter>
            <Button onClick={createFolder} size="sm">Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Folder Dialog */}
      <Dialog open={!!renameFolderId} onOpenChange={(o) => { if (!o) setRenameFolderId(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Rename Folder</DialogTitle></DialogHeader>
          <Input value={renameValue} onChange={(e) => setRenameValue(e.target.value)} onKeyDown={(e) => e.key === "Enter" && doRenameFolder()} autoFocus />
          <DialogFooter>
            <Button onClick={doRenameFolder} size="sm">Rename</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Move Folder Dialog */}
      <Dialog open={!!moveFolderId} onOpenChange={(o) => { if (!o) setMoveFolderId(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Move Folder</DialogTitle></DialogHeader>
          <Select value={moveTargetParent} onValueChange={setMoveTargetParent}>
            <SelectTrigger><SelectValue placeholder="Select parent" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="root">Root (top level)</SelectItem>
              {folders.filter((f) => f.id !== moveFolderId).map((f) => (
                <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button onClick={doMoveFolder} size="sm">Move</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Item Dialog */}
      <Dialog open={!!renameItemId} onOpenChange={(o) => { if (!o) setRenameItemId(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Rename Item</DialogTitle></DialogHeader>
          <Input value={renameItemValue} onChange={(e) => setRenameItemValue(e.target.value)} onKeyDown={(e) => e.key === "Enter" && doRenameItem()} autoFocus />
          <DialogFooter>
            <Button onClick={doRenameItem} size="sm">Rename</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Move Item Dialog */}
      <Dialog open={!!moveItemId} onOpenChange={(o) => { if (!o) setMoveItemId(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Move Item</DialogTitle></DialogHeader>
          <Select value={moveItemTarget} onValueChange={setMoveItemTarget}>
            <SelectTrigger><SelectValue placeholder="Select folder" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="root">Root (no folder)</SelectItem>
              {folders.map((f) => (
                <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button onClick={() => { moveItem(moveItemId!, moveItemTarget === "root" ? null : moveItemTarget); setMoveItemId(null); }} size="sm">Move</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Move Dialog */}
      <Dialog open={bulkMoveOpen} onOpenChange={setBulkMoveOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Move {selectedIds.size} Items</DialogTitle></DialogHeader>
          <Select value={bulkMoveTarget} onValueChange={setBulkMoveTarget}>
            <SelectTrigger><SelectValue placeholder="Select folder" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="root">Root (no folder)</SelectItem>
              {folders.map((f) => (
                <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button onClick={moveBulk} size="sm">Move</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={(o) => { if (!o) setDeleteConfirm(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {deleteConfirm?.type === "folder"
              ? "This will delete the folder and move its contents to the parent folder."
              : deleteConfirm?.type === "bulk"
              ? `Delete ${selectedIds.size} selected item(s)? This cannot be undone.`
              : "Delete this item? This cannot be undone."}
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" size="sm" onClick={handleDeleteConfirm}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
