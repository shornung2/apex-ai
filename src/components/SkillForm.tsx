import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Paperclip, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Skill } from "@/data/mock-data";

const ACCEPTED = ".pdf,.docx,.pptx,.txt,.md,.csv";
const MAX_SIZE = 20 * 1024 * 1024;

interface SkillFormProps {
  skill: Skill;
  onSubmit: (data: Record<string, string>) => void;
  isRunning?: boolean;
}

export function SkillForm({ skill, onSubmit, isRunning = false }: SkillFormProps) {
  const { toast } = useToast();
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<Record<string, string>>();
  const [fileStates, setFileStates] = useState<Record<string, { name: string; uploading: boolean }>>({});

  const handleFileUpload = async (fieldName: string, file: File) => {
    if (file.size > MAX_SIZE) {
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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

      <Button type="submit" className="w-full" disabled={isRunning || Object.values(fileStates).some((f) => f.uploading)}>
        {isRunning ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        {isRunning ? "Running..." : `Run ${skill.displayName || skill.name}`}
      </Button>
    </form>
  );
}
