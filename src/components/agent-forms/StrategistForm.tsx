import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Props = { onSubmit: (data: any) => void };

export function StrategistForm({ onSubmit }: Props) {
  const { register, handleSubmit, setValue } = useForm({
    defaultValues: {
      companyName: "",
      meetingType: "",
      dateTime: "",
      duration: "",
      stakeholders: "",
      challenges: "",
      objectives: "",
      sensitivity: "",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-2">
        <Label>Company Name *</Label>
        <Input {...register("companyName", { required: true })} placeholder="e.g. TechFlow" className="bg-muted/50 border-border/50" />
      </div>
      <div className="space-y-2">
        <Label>Meeting Type</Label>
        <Select onValueChange={(v) => setValue("meetingType", v)}>
          <SelectTrigger className="bg-muted/50 border-border/50"><SelectValue placeholder="Select type" /></SelectTrigger>
          <SelectContent>
            {["Discovery Call", "Demo", "Negotiation", "QBR", "Executive Briefing", "Technical Review"].map((t) => (
              <SelectItem key={t} value={t.toLowerCase().replace(/\s/g, "-")}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Date & Time</Label>
          <Input type="datetime-local" {...register("dateTime")} className="bg-muted/50 border-border/50" />
        </div>
        <div className="space-y-2">
          <Label>Duration</Label>
          <Input {...register("duration")} placeholder="e.g. 45 min" className="bg-muted/50 border-border/50" />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Key Stakeholders</Label>
        <Textarea {...register("stakeholders")} placeholder="Name, Title — one per line" className="bg-muted/50 border-border/50 min-h-[60px]" />
      </div>
      <div className="space-y-2">
        <Label>Known Challenges</Label>
        <Textarea {...register("challenges")} placeholder="What problems are they trying to solve?" className="bg-muted/50 border-border/50 min-h-[60px]" />
      </div>
      <div className="space-y-2">
        <Label>Meeting Objectives</Label>
        <Textarea {...register("objectives")} placeholder="What do you want to achieve?" className="bg-muted/50 border-border/50 min-h-[60px]" />
      </div>
      <div className="space-y-2">
        <Label>Sensitivity Notes</Label>
        <Textarea {...register("sensitivity")} placeholder="Any topics to avoid or handle carefully" className="bg-muted/50 border-border/50 min-h-[60px]" />
      </div>
      <Button type="submit" className="w-full">Run Strategist</Button>
    </form>
  );
}
