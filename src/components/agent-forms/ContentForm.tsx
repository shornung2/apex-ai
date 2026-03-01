import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Props = { onSubmit: (data: any) => void };

export function ContentForm({ onSubmit }: Props) {
  const { register, handleSubmit, setValue } = useForm({
    defaultValues: {
      documentType: "",
      company: "",
      stakeholders: "",
      solutionComponents: "",
      investmentRange: "",
      timeline: "",
      keyOutcomes: "",
      personalization: "",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-2">
        <Label>Document Type *</Label>
        <Select onValueChange={(v) => setValue("documentType", v)}>
          <SelectTrigger className="bg-muted/50 border-border/50"><SelectValue placeholder="Select type" /></SelectTrigger>
          <SelectContent>
            {["Proposal", "SOW", "Executive Summary", "Case Study", "Sales One-Pager", "Email Sequence"].map((t) => (
              <SelectItem key={t} value={t.toLowerCase().replace(/\s/g, "-")}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Company / Recipient *</Label>
        <Input {...register("company", { required: true })} placeholder="e.g. GlobalTech" className="bg-muted/50 border-border/50" />
      </div>
      <div className="space-y-2">
        <Label>Key Stakeholders</Label>
        <Textarea {...register("stakeholders")} placeholder="Name, Title — one per line" className="bg-muted/50 border-border/50 min-h-[60px]" />
      </div>
      <div className="space-y-2">
        <Label>Solution Components</Label>
        <Textarea {...register("solutionComponents")} placeholder="What services/products are being proposed?" className="bg-muted/50 border-border/50 min-h-[60px]" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Investment Range</Label>
          <Input {...register("investmentRange")} placeholder="e.g. $50k-$80k" className="bg-muted/50 border-border/50" />
        </div>
        <div className="space-y-2">
          <Label>Timeline</Label>
          <Input {...register("timeline")} placeholder="e.g. Q2 2026" className="bg-muted/50 border-border/50" />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Key Outcomes</Label>
        <Textarea {...register("keyOutcomes")} placeholder="What should the client expect?" className="bg-muted/50 border-border/50 min-h-[60px]" />
      </div>
      <div className="space-y-2">
        <Label>Personalization Notes</Label>
        <Textarea {...register("personalization")} placeholder="Tone, references, specific points to emphasize" className="bg-muted/50 border-border/50 min-h-[60px]" />
      </div>
      <Button type="submit" className="w-full">Run Content Agent</Button>
    </form>
  );
}
