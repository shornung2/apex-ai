import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Paperclip, X, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Skill } from "@/data/mock-data";

const ACCEPTED = ".pdf,.docx,.pptx,.txt,.md,.csv";
const CONTEXT_ACCEPTED = ".pdf,.docx,.pptx,.txt,.md,.csv,.xlsx";
const MAX_FILE_SIZE = 20 * 1024 * 1024; // per-file for skill file inputs
const MAX_TOTAL_CONTEXT_SIZE = 10 * 1024 * 1024; // 10MB total budget for context files
const MAX_CONTEXT_FILES = 10;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface ContextFile {
  id: string;
  name: string;
  size: number;
  uploading: boolean;
  content?: string;
  error?: boolean;
}

interface SkillFormProps {
  skill: Skill;
  onSubmit: (data: Record<string, string>) => void;
  isRunning?: boolean;
}

export function SkillForm({ skill, onSubmit, isRunning = false }: SkillFormProps) {
  const { toast } = useToast();
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<Record<string, string>>();
  const [fileStates, setFileStates] = useState<Record<string, { name: string; uploading: boolean }>>({});
  const [contextFiles, setContextFiles] = useState<ContextFile[]>([]);
  const contextInputRef = useRef<HTMLInputElement>(null);

  const totalContextSize = contextFiles.reduce((sum, cf) => sum + cf.size, 0);

  const handleFileUpload = async (fieldName: string, file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      toast({ title: "File too large", description: "Max 20MB", variant: "destructive" });
      return;
    }
    setFileStates((s) => ({ ...s, [fieldName]: { name: file.name, uploading: true } }));
    try {
      const fileId = crypto.randomUUID();
      const filePath = `skill-uploads/${fileId}/${file.name}`;
      await supabase.storage.from("documents").upload(filePath, file);
      const { data } = await supabase.functions.invoke("knowledge-ingest", {
        body: { file_path: filePath, title: file.name, mime_type: file.type },
      });
      const content = data?.document?.content || `[File: ${file.name}]`;
      setValue(fieldName, content);
      setFileStates((s) => ({ ...s, [fieldName]: { name: file.name, uploading: false } }));
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
      setFileStates((s) => { const n = { ...s }; delete n[fieldName]; return n; });
    }
  };

  const clearFile = (fieldName: string) => {
    setValue(fieldName, "");
    setFileStates((s) => { const n = { ...s }; delete n[fieldName]; return n; });
  };

  // --- Context files logic ---
  const handleContextFiles = async (files: FileList) => {
    const remaining = MAX_CONTEXT_FILES - contextFiles.length;
    if (remaining <= 0) {
      toast({ title: "File limit reached", description: `Maximum ${MAX_CONTEXT_FILES} context files`, variant: "destructive" });
      return;
    }
    const toAdd = Array.from(files).slice(0, remaining);

    // Check total size budget
    const newTotalSize = toAdd.reduce((sum, f) => sum + f.size, 0);
    if (totalContextSize + newTotalSize > MAX_TOTAL_CONTEXT_SIZE) {
      const budgetLeft = MAX_TOTAL_CONTEXT_SIZE - totalContextSize;
      toast({
        title: "Total size limit exceeded",
        description: `Only ${formatBytes(budgetLeft)} remaining of the 10 MB budget`,
        variant: "destructive",
      });
      return;
    }

    const newEntries: ContextFile[] = toAdd.map(f => ({ id: crypto.randomUUID(), name: f.name, size: f.size, uploading: true }));
    setContextFiles(prev => [...prev, ...newEntries]);

    await Promise.all(toAdd.map(async (file, i) => {
      const entry = newEntries[i];
      try {
        const filePath = `skill-uploads/${entry.id}/${file.name}`;
        await supabase.storage.from("documents").upload(filePath, file);
        const { data } = await supabase.functions.invoke("knowledge-ingest", {
          body: { file_path: filePath, title: file.name, mime_type: file.type },
        });
        const content = data?.document?.content || `[File: ${file.name}]`;
        setContextFiles(prev => prev.map(cf => cf.id === entry.id ? { ...cf, uploading: false, content } : cf));
      } catch {
        setContextFiles(prev => prev.map(cf => cf.id === entry.id ? { ...cf, uploading: false, error: true } : cf));
      }
    }));
  };

  const removeContextFile = (id: string) => {
    setContextFiles(prev => prev.filter(cf => cf.id !== id));
  };

  const anyContextUploading = contextFiles.some(cf => cf.uploading);
  const anyFieldUploading = Object.values(fileStates).some(f => f.uploading);

  const handleFormSubmit = (data: Record<string, string>) => {
    const contextTexts = contextFiles
      .filter(cf => cf.content && !cf.error)
      .map(cf => `### ${cf.name}\n${cf.content}`)
      .join("\n\n---\n\n");
    if (contextTexts) {
      data._attached_context = contextTexts;
    }
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
      {skill.inputs.map((input) => {
        const fieldName = input.name || input.field || input.label.toLowerCase().replace(/\s+/g, "_");
        const rawType = input.type === "multiselect" ? "multi-select" : input.type;
        const isTextField = rawType === "text" || rawType === "url";

        return (
          <div key={fieldName} className="space-y-2">
            <Label htmlFor={fieldName}>
              {input.label}
              {input.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            {input.hint && <p className="text-[10px] text-muted-foreground">{input.hint}</p>}

            {isTextField && (
              <Input id={fieldName} placeholder={input.placeholder} className="bg-muted/50 border-border/50" disabled={isRunning} {...register(fieldName, { required: input.required && `${input.label} is required` })} />
            )}

            {rawType === "textarea" && (
              <Textarea id={fieldName} placeholder={input.placeholder} rows={3} className="bg-muted/50 border-border/50 resize-none" disabled={isRunning} {...register(fieldName, { required: input.required && `${input.label} is required` })} />
            )}

            {rawType === "select" && input.options && (
              <Select onValueChange={(v) => setValue(fieldName, v)} defaultValue={typeof input.default === "string" ? input.default : ""} disabled={isRunning}>
                <SelectTrigger className="bg-muted/50 border-border/50"><SelectValue placeholder={`Select ${input.label.toLowerCase()}...`} /></SelectTrigger>
                <SelectContent>{input.options.map((opt) => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent>
              </Select>
            )}

            {rawType === "radio" && input.options && (
              <RadioGroup onValueChange={(v) => setValue(fieldName, v)} className="flex flex-wrap gap-3" disabled={isRunning}>
                {input.options.map((opt) => (
                  <div key={opt} className="flex items-center gap-2">
                    <RadioGroupItem value={opt} id={`${fieldName}-${opt}`} />
                    <Label htmlFor={`${fieldName}-${opt}`} className="text-sm font-normal">{opt}</Label>
                  </div>
                ))}
              </RadioGroup>
            )}

            {rawType === "multi-select" && input.options && (
              <div className="flex flex-wrap gap-3">
                {input.options.map((opt) => {
                  const current = watch(fieldName) || "";
                  const selected = current.split(",").filter(Boolean);
                  const isChecked = selected.includes(opt);
                  return (
                    <div key={opt} className="flex items-center gap-2">
                      <Checkbox id={`${fieldName}-${opt}`} checked={isChecked} disabled={isRunning} onCheckedChange={(checked) => {
                        const next = checked ? [...selected, opt] : selected.filter((s) => s !== opt);
                        setValue(fieldName, next.join(","));
                      }} />
                      <Label htmlFor={`${fieldName}-${opt}`} className="text-sm font-normal">{opt}</Label>
                    </div>
                  );
                })}
              </div>
            )}

            {rawType === "file" && (
              <div>
                {fileStates[fieldName] ? (
                  <div className="flex items-center gap-2 text-sm bg-muted/50 rounded-md px-3 py-2 border border-border/50">
                    {fileStates[fieldName].uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Paperclip className="h-3 w-3" />}
                    <span className="truncate flex-1">{fileStates[fieldName].uploading ? "Uploading..." : fileStates[fieldName].name}</span>
                    {!fileStates[fieldName].uploading && (
                      <button type="button" onClick={() => clearFile(fieldName)} className="text-muted-foreground hover:text-foreground"><X className="h-3 w-3" /></button>
                    )}
                  </div>
                ) : (
                  <div>
                    <input type="file" accept={ACCEPTED} className="hidden" id={`file-${fieldName}`} disabled={isRunning}
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(fieldName, f); e.target.value = ""; }} />
                    <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById(`file-${fieldName}`)?.click()} disabled={isRunning}>
                      <Paperclip className="h-3.5 w-3.5 mr-1.5" /> Attach File
                    </Button>
                    <p className="text-[10px] text-muted-foreground mt-1">PDF, DOCX, PPTX, TXT, MD, CSV</p>
                  </div>
                )}
                <input type="hidden" {...register(fieldName, { required: input.required && `${input.label} is required` })} />
              </div>
            )}

            {errors[fieldName] && <p className="text-xs text-destructive">{errors[fieldName]?.message as string}</p>}
          </div>
        );
      })}

      {/* Additional Context Files */}
      <div className="space-y-2 pt-2 border-t border-border/30">
        <div className="flex items-center justify-between">
          <Label className="text-sm">Additional Context <span className="text-muted-foreground font-normal">(optional)</span></Label>
          <span className="text-[10px] text-muted-foreground font-mono">
            {formatBytes(totalContextSize)} / {formatBytes(MAX_TOTAL_CONTEXT_SIZE)}
          </span>
        </div>
        <p className="text-[10px] text-muted-foreground">
          Upload up to {MAX_CONTEXT_FILES} files (10 MB total). PDF, Word, PowerPoint, Excel, Text, Markdown.
        </p>

        {/* Size bar */}
        {contextFiles.length > 0 && (
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${totalContextSize / MAX_TOTAL_CONTEXT_SIZE > 0.8 ? "bg-destructive" : "bg-emerald-500"}`}
              style={{ width: `${Math.min((totalContextSize / MAX_TOTAL_CONTEXT_SIZE) * 100, 100)}%` }}
            />
          </div>
        )}

        {contextFiles.length > 0 && (
          <div className="space-y-1.5">
            {contextFiles.map((cf) => (
              <div key={cf.id} className="flex items-center gap-2 text-sm bg-muted/50 rounded-md px-3 py-1.5 border border-border/50">
                {cf.uploading ? (
                  <Loader2 className="h-3 w-3 animate-spin shrink-0" />
                ) : cf.error ? (
                  <X className="h-3 w-3 text-destructive shrink-0" />
                ) : (
                  <Paperclip className="h-3 w-3 shrink-0" />
                )}
                <span className="truncate flex-1">
                  {cf.uploading ? `Uploading ${cf.name}...` : cf.error ? `Failed: ${cf.name}` : cf.name}
                </span>
                <span className="text-[10px] text-muted-foreground shrink-0">{formatBytes(cf.size)}</span>
                {!cf.uploading && (
                  <button type="button" onClick={() => removeContextFile(cf.id)} className="text-muted-foreground hover:text-foreground">
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {contextFiles.length < MAX_CONTEXT_FILES && (
          <div>
            <input
              ref={contextInputRef}
              type="file"
              accept={CONTEXT_ACCEPTED}
              multiple
              className="hidden"
              disabled={isRunning}
              onChange={(e) => {
                if (e.target.files?.length) handleContextFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => contextInputRef.current?.click()}
              disabled={isRunning || anyContextUploading}
            >
              <Upload className="h-3.5 w-3.5 mr-1.5" />
              Add Context Files
              {contextFiles.length > 0 && <span className="ml-1 text-muted-foreground">({contextFiles.length}/{MAX_CONTEXT_FILES})</span>}
            </Button>
          </div>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isRunning || anyFieldUploading || anyContextUploading}>
        {isRunning ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        {isRunning ? "Running..." : `Run ${skill.displayName || skill.name}`}
      </Button>
    </form>
  );
}
