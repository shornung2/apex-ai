import type { SuccessProfileSkillItem, PhaseConfig } from "@/types/onboarding";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface ProfilePreviewCardProps {
  roleName: string;
  department: string;
  roleDescription: string;
  items: SuccessProfileSkillItem[];
  phaseConfigs: PhaseConfig[];
  elevatorPitchTopic: string;
  capstoneScenarioDescription: string;
}

const categoryLabels: Record<string, string> = {
  hard_skill: "Hard Skills",
  soft_skill: "Soft Skills",
  behavioral: "Behavioral",
  knowledge_area: "Knowledge Areas",
};

export default function ProfilePreviewCard(props: ProfilePreviewCardProps) {
  const { roleName, department, roleDescription, items, phaseConfigs, elevatorPitchTopic, capstoneScenarioDescription } = props;
  const rubricItems = items.filter((i) => i.isRolePlayRubricItem);

  const grouped = items.reduce<Record<string, SuccessProfileSkillItem[]>>((acc, item) => {
    (acc[item.category] ??= []).push(item);
    return acc;
  }, {});

  return (
    <Card className="sticky top-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{roleName || "Untitled Role"}</CardTitle>
        {department && <Badge variant="outline" className="w-fit text-xs">{department}</Badge>}
        {roleDescription && <p className="text-xs text-muted-foreground mt-1">{roleDescription}</p>}
      </CardHeader>
      <CardContent className="space-y-4 text-xs">
        {Object.entries(grouped).map(([cat, catItems]) => (
          <div key={cat}>
            <p className="font-medium text-muted-foreground mb-1">{categoryLabels[cat] ?? cat}</p>
            <div className="flex flex-wrap gap-1">
              {catItems.map((i) => (
                <Badge key={i.id} variant="secondary" className="text-[10px] font-normal">
                  {i.label}
                </Badge>
              ))}
            </div>
          </div>
        ))}

        {phaseConfigs.some((p) => p.durationDays > 0) && (
          <>
            <Separator />
            <div>
              <p className="font-medium text-muted-foreground mb-1">Timeline</p>
              <p>{phaseConfigs.map((p) => `${p.phase.charAt(0).toUpperCase() + p.phase.slice(1)} ${p.durationDays}d`).join(" · ")}</p>
            </div>
          </>
        )}

        {rubricItems.length > 0 && (
          <>
            <Separator />
            <div>
              <p className="font-medium text-muted-foreground mb-1">Rubric Items ({rubricItems.length})</p>
              <div className="flex flex-wrap gap-1">
                {rubricItems.map((i) => (
                  <Badge key={i.id} variant="outline" className="text-[10px] font-normal">{i.label}</Badge>
                ))}
              </div>
            </div>
          </>
        )}

        {elevatorPitchTopic && (
          <>
            <Separator />
            <div>
              <p className="font-medium text-muted-foreground mb-1">Elevator Pitch</p>
              <p className="italic text-muted-foreground">&ldquo;{elevatorPitchTopic}&rdquo;</p>
            </div>
          </>
        )}

        {capstoneScenarioDescription && (
          <>
            <Separator />
            <div>
              <p className="font-medium text-muted-foreground mb-1">Capstone Scenario</p>
              <p className="text-muted-foreground line-clamp-4">{capstoneScenarioDescription}</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
