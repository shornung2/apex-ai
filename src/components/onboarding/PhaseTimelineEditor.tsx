import { useState } from "react";
import type { PhaseConfig, OnboardingPhase } from "@/types/onboarding";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X, BookOpen, Eye, Trophy } from "lucide-react";

const phaseConfig: { phase: OnboardingPhase; label: string; icon: React.ReactNode; color: string }[] = [
  { phase: "immerse", label: "Immerse", icon: <BookOpen className="h-4 w-4" />, color: "text-blue-500" },
  { phase: "observe", label: "Observe", icon: <Eye className="h-4 w-4" />, color: "text-amber-500" },
  { phase: "demonstrate", label: "Demonstrate", icon: <Trophy className="h-4 w-4" />, color: "text-green-500" },
];

interface PhaseTimelineEditorProps {
  phases: PhaseConfig[];
  onChange: (phases: PhaseConfig[]) => void;
}

export default function PhaseTimelineEditor({ phases, onChange }: PhaseTimelineEditorProps) {
  const [objectiveInputs, setObjectiveInputs] = useState<Record<string, string>>({});

  const update = (phase: OnboardingPhase, partial: Partial<PhaseConfig>) => {
    onChange(phases.map((p) => (p.phase === phase ? { ...p, ...partial } : p)));
  };

  const addObjective = (phase: OnboardingPhase) => {
    const text = objectiveInputs[phase]?.trim();
    if (!text) return;
    const current = phases.find((p) => p.phase === phase);
    if (current) {
      update(phase, { objectives: [...current.objectives, text] });
      setObjectiveInputs((prev) => ({ ...prev, [phase]: "" }));
    }
  };

  const removeObjective = (phase: OnboardingPhase, idx: number) => {
    const current = phases.find((p) => p.phase === phase);
    if (current) {
      update(phase, { objectives: current.objectives.filter((_, i) => i !== idx) });
    }
  };

  return (
    <div className="space-y-4">
      {phaseConfig.map((pc) => {
        const phase = phases.find((p) => p.phase === pc.phase)!;
        return (
          <div key={pc.phase} className="rounded-md border p-3 space-y-2">
            <div className="flex items-center gap-2">
              <span className={pc.color}>{pc.icon}</span>
              <span className="font-medium text-sm">{pc.label}</span>
              <div className="flex items-center gap-1 ml-auto">
                <Input
                  type="number"
                  min={1}
                  className="w-20 h-8 text-sm"
                  value={phase.durationDays}
                  onChange={(e) => update(pc.phase, { durationDays: parseInt(e.target.value) || 1 })}
                />
                <span className="text-xs text-muted-foreground">days</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-1">
              {phase.objectives.map((obj, i) => (
                <Badge key={i} variant="secondary" className="text-xs font-normal gap-1 pr-1">
                  {obj}
                  <button onClick={() => removeObjective(pc.phase, i)} className="hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <Input
              placeholder="Add an objective and press Enter"
              className="text-sm h-8"
              value={objectiveInputs[pc.phase] || ""}
              onChange={(e) => setObjectiveInputs((prev) => ({ ...prev, [pc.phase]: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addObjective(pc.phase);
                }
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
