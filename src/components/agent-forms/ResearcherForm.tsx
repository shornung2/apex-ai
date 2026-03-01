import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

type Props = { onSubmit: (data: any) => void };

export function ResearcherForm({ onSubmit }: Props) {
  const { register, handleSubmit, setValue, watch } = useForm({
    defaultValues: {
      companyName: "",
      websiteUrl: "",
      linkedinUrl: "",
      industry: "",
      knownContext: "",
      researchDepth: "standard",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-2">
        <Label>Company Name *</Label>
        <Input {...register("companyName", { required: true })} placeholder="e.g. Acme Corp" className="bg-muted/50 border-border/50" />
      </div>
      <div className="space-y-2">
        <Label>Website URL</Label>
        <Input {...register("websiteUrl")} placeholder="https://..." className="bg-muted/50 border-border/50" />
      </div>
      <div className="space-y-2">
        <Label>LinkedIn URL</Label>
        <Input {...register("linkedinUrl")} placeholder="https://linkedin.com/company/..." className="bg-muted/50 border-border/50" />
      </div>
      <div className="space-y-2">
        <Label>Industry</Label>
        <Select onValueChange={(v) => setValue("industry", v)}>
          <SelectTrigger className="bg-muted/50 border-border/50"><SelectValue placeholder="Select industry" /></SelectTrigger>
          <SelectContent>
            {["SaaS", "FinTech", "Healthcare", "E-Commerce", "Manufacturing", "Professional Services", "Other"].map((i) => (
              <SelectItem key={i} value={i.toLowerCase()}>{i}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Known Context</Label>
        <Textarea {...register("knownContext")} placeholder="Any existing knowledge about this company..." className="bg-muted/50 border-border/50 min-h-[80px]" />
      </div>
      <div className="space-y-3">
        <Label>Research Depth</Label>
        <RadioGroup defaultValue="standard" onValueChange={(v) => setValue("researchDepth", v)} className="flex gap-4">
          {[
            { value: "quick", label: "Quick Brief" },
            { value: "standard", label: "Standard" },
            { value: "deep", label: "Deep Dive" },
          ].map((opt) => (
            <div key={opt.value} className="flex items-center gap-2">
              <RadioGroupItem value={opt.value} id={`depth-${opt.value}`} />
              <Label htmlFor={`depth-${opt.value}`} className="text-sm font-normal cursor-pointer">{opt.label}</Label>
            </div>
          ))}
        </RadioGroup>
      </div>
      <Button type="submit" className="w-full">Run Researcher</Button>
    </form>
  );
}
