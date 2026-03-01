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
}

export function SkillForm({ skill, onSubmit }: SkillFormProps) {
  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<Record<string, string>>();

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {skill.inputs.map((input) => (
        <div key={input.name} className="space-y-2">
          <Label htmlFor={input.name}>
            {input.label}
            {input.required && <span className="text-destructive ml-1">*</span>}
          </Label>

          {input.type === "text" && (
            <Input
              id={input.name}
              placeholder={input.placeholder}
              className="bg-muted/50 border-border/50"
              {...register(input.name, { required: input.required && `${input.label} is required` })}
            />
          )}

          {input.type === "textarea" && (
            <Textarea
              id={input.name}
              placeholder={input.placeholder}
              rows={3}
              className="bg-muted/50 border-border/50 resize-none"
              {...register(input.name, { required: input.required && `${input.label} is required` })}
            />
          )}

          {input.type === "select" && input.options && (
            <Select onValueChange={(v) => setValue(input.name, v)} defaultValue="">
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

          {input.type === "radio" && input.options && (
            <RadioGroup onValueChange={(v) => setValue(input.name, v)} className="flex flex-wrap gap-3">
              {input.options.map((opt) => (
                <div key={opt} className="flex items-center gap-2">
                  <RadioGroupItem value={opt} id={`${input.name}-${opt}`} />
                  <Label htmlFor={`${input.name}-${opt}`} className="text-sm font-normal">{opt}</Label>
                </div>
              ))}
            </RadioGroup>
          )}

          {input.type === "multi-select" && input.options && (
            <div className="flex flex-wrap gap-3">
              {input.options.map((opt) => {
                const current = watch(input.name) || "";
                const selected = current.split(",").filter(Boolean);
                const isChecked = selected.includes(opt);
                return (
                  <div key={opt} className="flex items-center gap-2">
                    <Checkbox
                      id={`${input.name}-${opt}`}
                      checked={isChecked}
                      onCheckedChange={(checked) => {
                        const next = checked
                          ? [...selected, opt]
                          : selected.filter((s) => s !== opt);
                        setValue(input.name, next.join(","));
                      }}
                    />
                    <Label htmlFor={`${input.name}-${opt}`} className="text-sm font-normal">{opt}</Label>
                  </div>
                );
              })}
            </div>
          )}

          {errors[input.name] && (
            <p className="text-xs text-destructive">{errors[input.name]?.message as string}</p>
          )}
        </div>
      ))}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        Run {skill.name}
      </Button>
    </form>
  );
}
