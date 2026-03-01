import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import type { Skill } from "@/data/mock-data";

interface SkillFormProps {
  skill: Skill;
  onSubmit: (data: Record<string, string>) => void;
  isRunning?: boolean;
}

export function SkillForm({ skill, onSubmit, isRunning = false }: SkillFormProps) {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<Record<string, string>>();

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
              <Input
                id={fieldName}
                placeholder={input.placeholder}
                className="bg-muted/50 border-border/50"
                disabled={isRunning}
                {...register(fieldName, { required: input.required && `${input.label} is required` })}
              />
            )}

            {rawType === "textarea" && (
              <Textarea
                id={fieldName}
                placeholder={input.placeholder}
                rows={3}
                className="bg-muted/50 border-border/50 resize-none"
                disabled={isRunning}
                {...register(fieldName, { required: input.required && `${input.label} is required` })}
              />
            )}

            {rawType === "select" && input.options && (
              <Select onValueChange={(v) => setValue(fieldName, v)} defaultValue={typeof input.default === "string" ? input.default : ""} disabled={isRunning}>
                <SelectTrigger className="bg-muted/50 border-border/50">
                  <SelectValue placeholder={`Select ${input.label.toLowerCase()}...`} />
                </SelectTrigger>
                <SelectContent>
                  {input.options.map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
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
                      <Checkbox
                        id={`${fieldName}-${opt}`}
                        checked={isChecked}
                        disabled={isRunning}
                        onCheckedChange={(checked) => {
                          const next = checked
                            ? [...selected, opt]
                            : selected.filter((s) => s !== opt);
                          setValue(fieldName, next.join(","));
                        }}
                      />
                      <Label htmlFor={`${fieldName}-${opt}`} className="text-sm font-normal">{opt}</Label>
                    </div>
                  );
                })}
              </div>
            )}

            {errors[fieldName] && (
              <p className="text-xs text-destructive">{errors[fieldName]?.message as string}</p>
            )}
          </div>
        );
      })}

      <Button type="submit" className="w-full" disabled={isRunning}>
        {isRunning ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        {isRunning ? "Running..." : `Run ${skill.displayName || skill.name}`}
      </Button>
    </form>
  );
}
