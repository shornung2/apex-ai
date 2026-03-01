import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";

type Props = { onSubmit: (data: any) => void };

const focusAreas = ["Deal Health", "Pipeline Velocity", "Win/Loss Analysis", "Forecast Accuracy", "Rep Performance"];
const pipelineStages = ["Prospecting", "Discovery", "Proposal", "Negotiation", "Closed Won", "Closed Lost"];

export function PulseForm({ onSubmit }: Props) {
  const { register, handleSubmit, setValue } = useForm({
    defaultValues: { timeHorizon: "", context: "" },
  });
  const [selectedFocus, setSelectedFocus] = useState<string[]>([]);
  const [selectedStages, setSelectedStages] = useState<string[]>([]);

  const toggleItem = (arr: string[], setArr: React.Dispatch<React.SetStateAction<string[]>>, val: string) => {
    setArr((prev) => prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]);
  };

  const handleFormSubmit = (data: any) => {
    onSubmit({ ...data, focusAreas: selectedFocus, pipelineStages: selectedStages });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
      <div className="space-y-3">
        <Label>Focus Areas</Label>
        <div className="space-y-2">
          {focusAreas.map((area) => (
            <label key={area} className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={selectedFocus.includes(area)}
                onCheckedChange={() => toggleItem(selectedFocus, setSelectedFocus, area)}
              />
              <span className="text-sm">{area}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        <Label>Pipeline Stages</Label>
        <div className="space-y-2">
          {pipelineStages.map((stage) => (
            <label key={stage} className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={selectedStages.includes(stage)}
                onCheckedChange={() => toggleItem(selectedStages, setSelectedStages, stage)}
              />
              <span className="text-sm">{stage}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label>Time Horizon</Label>
        <Select onValueChange={(v) => setValue("timeHorizon", v)}>
          <SelectTrigger className="bg-muted/50 border-border/50"><SelectValue placeholder="Select period" /></SelectTrigger>
          <SelectContent>
            {["This Week", "This Month", "This Quarter", "Last 30 Days", "Last 90 Days", "Year to Date"].map((t) => (
              <SelectItem key={t} value={t.toLowerCase().replace(/\s/g, "-")}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Additional Context</Label>
        <Textarea {...register("context")} placeholder="Any specific deals, reps, or areas to focus on..." className="bg-muted/50 border-border/50 min-h-[80px]" />
      </div>
      <Button type="submit" className="w-full">Run Pulse Analysis</Button>
    </form>
  );
}
