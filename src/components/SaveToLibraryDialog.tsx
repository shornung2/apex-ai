import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useTenant } from "@/contexts/TenantContext";
import { FolderOpen, FolderPlus, BookOpen } from "lucide-react";

type Folder = { id: string; name: string };

interface SaveToLibraryDialogProps {
  title: string;
  content: string;
  agentType?: string;
  skillId?: string;
  skillName?: string;
  department?: string;
  jobId?: string;
  disabled?: boolean;
  scope?: "workspace" | "personal";
}

export function SaveToLibraryDialog({
  title, content, agentType, skillId, skillName, department, jobId, disabled, scope = "workspace",
}: SaveToLibraryDialogProps) {
  const { toast } = useToast();
  const { tenantId } = useTenant();
  const [open, setOpen] = useState(false);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [saving, setSaving] = useState(false);
  const [creatingFolder, setCreatingFolder] = useState(false);

  useEffect(() => {
    if (open) {
      supabase.from("content_folders").select("id, name").order("name").then(({ data }) => {
        if (data) setFolders(data);
      });
    }
  }, [open]);

  const createFolder = async () => {
    if (!newFolderName.trim()) return;
    const { data } = await supabase.from("content_folders").insert({ name: newFolderName.trim(), tenant_id: tenantId! }).select().single();
    if (data) {
      setFolders((prev) => [...prev, data as Folder].sort((a, b) => a.name.localeCompare(b.name)));
      setSelectedFolder(data.id);
      setNewFolderName("");
      setCreatingFolder(false);
    }
  };

  const save = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("content_items").insert({
      title,
      content,
      folder_id: scope === "personal" ? null : selectedFolder,
      agent_type: agentType || null,
      skill_id: skillId || null,
      skill_name: skillName || null,
      department: department || null,
      job_id: jobId || null,
      tenant_id: tenantId!,
      scope,
      user_id: scope === "personal" ? user?.id || null : null,
    });
    setSaving(false);
    if (error) {
      toast({ title: "Error saving", description: error.message, variant: "destructive" });
    } else {
      toast({ title: scope === "personal" ? "Saved to My Saves" : "Saved to Workspace Library" });
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1" disabled={disabled}>
          <BookOpen className="h-3 w-3" /> {scope === "personal" ? "Save to My Saves" : "Save to Library"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base">{scope === "personal" ? "Save to My Saves" : "Save to Workspace Library"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {scope !== "personal" && (
            <>
              <p className="text-sm text-muted-foreground">Choose a folder (optional):</p>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            <button
              onClick={() => setSelectedFolder(null)}
              className={`w-full text-left text-sm px-3 py-1.5 rounded-md flex items-center gap-2 transition-colors ${selectedFolder === null ? "bg-sidebar-accent text-primary font-medium" : "hover:bg-muted"}`}
            >
              <FolderOpen className="h-3.5 w-3.5" /> No Folder
            </button>
            {folders.map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedFolder(f.id)}
                className={`w-full text-left text-sm px-3 py-1.5 rounded-md flex items-center gap-2 transition-colors ${selectedFolder === f.id ? "bg-sidebar-accent text-primary font-medium" : "hover:bg-muted"}`}
              >
                <FolderOpen className="h-3.5 w-3.5" /> {f.name}
              </button>
            ))}
          </div>
          {creatingFolder ? (
            <div className="flex gap-2">
              <Input
                autoFocus
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Folder name"
                onKeyDown={(e) => e.key === "Enter" && createFolder()}
                className="h-8 text-sm"
              />
              <Button size="sm" onClick={createFolder} className="h-8">Add</Button>
            </div>
          ) : (
            <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => setCreatingFolder(true)}>
              <FolderPlus className="h-3 w-3" /> New Folder
            </Button>
          )}
          <Button onClick={save} disabled={saving} className="w-full">
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
