import type { SuccessProfile } from "@/types/onboarding";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Copy, ArrowRight } from "lucide-react";

interface ProfileCardProps {
  profile: SuccessProfile;
  isTemplate?: boolean;
  onEdit?: () => void;
  onDuplicate?: () => void;
  onUseTemplate?: () => void;
}

export default function ProfileCard({ profile, isTemplate, onEdit, onDuplicate, onUseTemplate }: ProfileCardProps) {
  const itemCount = profile.items.length;
  const phaseSummary = profile.phaseConfigs
    .map((p) => `${p.phase.charAt(0).toUpperCase() + p.phase.slice(1)} ${p.durationDays}d`)
    .join(" · ");

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg leading-tight">{profile.roleName}</CardTitle>
          {profile.isTemplate && <Badge variant="secondary" className="shrink-0">Template</Badge>}
        </div>
        <Badge variant="outline" className="w-fit text-xs">{profile.department}</Badge>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3 pt-0">
        <p className="text-sm text-muted-foreground line-clamp-2">{profile.roleDescription}</p>
        <div className="text-xs text-muted-foreground space-y-1">
          <p>{itemCount} skills & attributes</p>
          <p>{phaseSummary}</p>
        </div>
        <div className="mt-auto flex gap-2 pt-2">
          {isTemplate ? (
            <Button size="sm" className="w-full" onClick={onUseTemplate}>
              <ArrowRight className="mr-1.5 h-3.5 w-3.5" /> Use as Starting Point
            </Button>
          ) : (
            <>
              <Button size="sm" variant="outline" className="flex-1" onClick={onEdit}>
                <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit
              </Button>
              <Button size="sm" variant="outline" className="flex-1" onClick={onDuplicate}>
                <Copy className="mr-1.5 h-3.5 w-3.5" /> Duplicate
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
