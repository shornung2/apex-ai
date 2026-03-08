import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useTenant } from "@/contexts/TenantContext";
import ReactMarkdown from "react-markdown";
import {
  Search, Trash2, Download, MoreVertical, FileText, Pencil,
  ArrowUpDown, Copy, Eye, X, Bookmark, Loader2,
} from "lucide-react";

type SavedItem = {
  id: string; title: string; content: string;
  agent_type: string | null; skill_name: string | null;
  department: string | null; created_at: string;
  view_count: number; updated_at: string;
};

type SortKey = "created_at" | "title" | "view_count" | "department";
type SortDir = "asc" | "desc";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

export default function MySaves() {
  const { toast } = useToast();
  const [items, setItems] = useState<SavedItem[]>([]);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selectedItem, setSelectedItem] = useState<SavedItem | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [renameItemId, setRenameItemId] = useState<string | null>(null);
  const [renameItemValue, setRenameItemValue] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: "item" | "bulk"; id?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const { data } = await supabase
      .from("content_items")
      .select("id, title, content, agent_type, skill_name, department, created_at, view_count, updated_at")
      .eq("scope", "personal")
      .order("created_at", { ascending: false });
    if (data) setItems(data as SavedItem[]);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = useMemo(() => {
    let list = items;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(i =>
        i.title.toLowerCase().includes(q) ||
        (i.department || "").toLowerCase().includes(q) ||
        (i.skill_name || "").toLowerCase().includes(q) ||
        i.content.toLowerCase().includes(q)
      );
    }
    list = [...list].sort((a, b) => {
      let av: string | number = (a as any)[sortKey] ?? "";
      let bv: string | number = (b as any)[sortKey] ?? "";
      if (sortKey === "view_count") { av = a.view_count; bv = b.view_count; }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return list;
  }, [items, search, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
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

  const downloadItem = (ci: SavedItem) => {
    const blob = new Blob([ci.content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${ci.title.replace(/[^a-zA-Z0-9]/g, "_")}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadSelected = () => {
    items.filter(i => selectedIds.has(i.id)).forEach(downloadItem);
  };

  const doRenameItem = async () => {
    if (!renameItemId || !renameItemValue.trim()) return;
    await supabase.from("content_items").update({ title: renameItemValue.trim() }).eq("id", renameItemId);
    if (selectedItem?.id === renameItemId) setSelectedItem({ ...selectedItem, title: renameItemValue.trim() });
    setRenameItemId(null);
    fetchData();
    toast({ title: "Item renamed" });
  };

  const openDetail = async (ci: SavedItem) => {
    setSelectedItem(ci);
    await supabase.from("content_items").update({ view_count: (ci.view_count || 0) + 1 }).eq("id", ci.id);
    setItems(prev => prev.map(i => i.id === ci.id ? { ...i, view_count: (i.view_count || 0) + 1 } : i));
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
    if (selectedIds.size === filtered.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filtered.map(i => i.id)));
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    if (deleteConfirm.type === "item" && deleteConfirm.id) await deleteItem(deleteConfirm.id);
    else if (deleteConfirm.type === "bulk") await deleteBulk();
    setDeleteConfirm(null);
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Bookmark className="h-6 w-6 text-primary" /> My Saves
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Your personal saved content and notes</p>
        </div>
      </motion.div>

      <motion.div variants={item} className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search your saved content..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
        </div>
        {selectedIds.size > 0 && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={downloadSelected}>
              <Download className="h-3 w-3" /> Download ({selectedIds.size})
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1 text-destructive" onClick={() => setDeleteConfirm({ type: "bulk" })}>
              <Trash2 className="h-3 w-3" /> Delete ({selectedIds.size})
            </Button>
          </div>
        )}
      </motion.div>

      <motion.div variants={item} className="rounded-lg border border-border/50 bg-card/60 backdrop-blur-xl overflow-hidden">
        {filtered.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox checked={selectedIds.size === filtered.length && filtered.length > 0} onCheckedChange={toggleAll} />
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => toggleSort("title")}>
                  <span className="flex items-center gap-1">Title <ArrowUpDown className="h-3 w-3" /></span>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => toggleSort("department")}>
                  <span className="flex items-center gap-1">Department <ArrowUpDown className="h-3 w-3" /></span>
                </TableHead>
                <TableHead>Skill</TableHead>
                <TableHead className="cursor-pointer" onClick={() => toggleSort("created_at")}>
                  <span className="flex items-center gap-1">Saved <ArrowUpDown className="h-3 w-3" /></span>
                </TableHead>
                <TableHead className="cursor-pointer text-right" onClick={() => toggleSort("view_count")}>
                  <span className="flex items-center gap-1 justify-end">Views <ArrowUpDown className="h-3 w-3" /></span>
                </TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(ci => (
                <TableRow key={ci.id} className="cursor-pointer" onClick={() => openDetail(ci)}>
                  <TableCell onClick={e => e.stopPropagation()}>
                    <Checkbox checked={selectedIds.has(ci.id)} onCheckedChange={() => toggleSelect(ci.id)} />
                  </TableCell>
                  <TableCell className="font-medium max-w-[250px] truncate">{ci.title}</TableCell>
                  <TableCell>
                    {ci.department && <Badge variant="secondary" className="text-[10px]">{ci.department}</Badge>}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{ci.skill_name || "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(ci.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="flex items-center gap-1 justify-end text-xs text-muted-foreground">
                      <Eye className="h-3 w-3" /> {ci.view_count}
                    </span>
                  </TableCell>
                  <TableCell onClick={e => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7"><MoreVertical className="h-3.5 w-3.5" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setRenameItemId(ci.id); setRenameItemValue(ci.title); }}>
                          <Pencil className="h-3 w-3 mr-2" /> Rename
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
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Bookmark className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">No saved items yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Save content from agent outputs to access it here</p>
          </div>
        )}
      </motion.div>

      {/* Detail Sheet */}
      <Sheet open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          {selectedItem && (
            <>
              <SheetHeader>
                <SheetTitle className="text-lg pr-8">{selectedItem.title}</SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-4">
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {selectedItem.department && <Badge variant="secondary" className="text-[10px]">{selectedItem.department}</Badge>}
                  {selectedItem.skill_name && <Badge variant="outline" className="text-[10px]">{selectedItem.skill_name}</Badge>}
                  <span>Saved {new Date(selectedItem.created_at).toLocaleDateString()}</span>
                  <span>· <Eye className="h-3 w-3 inline" /> {selectedItem.view_count}</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => copyToClipboard(selectedItem.content)}>
                    <Copy className="h-3 w-3" /> Copy
                  </Button>
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => downloadItem(selectedItem)}>
                    <Download className="h-3 w-3" /> Download
                  </Button>
                </div>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>{selectedItem.content}</ReactMarkdown>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Rename Dialog */}
      <Dialog open={!!renameItemId} onOpenChange={() => setRenameItemId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Rename Item</DialogTitle></DialogHeader>
          <Input value={renameItemValue} onChange={e => setRenameItemValue(e.target.value)} onKeyDown={e => e.key === "Enter" && doRenameItem()} />
          <DialogFooter><Button onClick={doRenameItem}>Rename</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Confirm Delete</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            {deleteConfirm?.type === "bulk"
              ? `Delete ${selectedIds.size} selected item(s)?`
              : "Delete this item?"}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
