import { useState } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from "@/components/ui/drawer";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { SuccessProfileSkillItem, PhaseConfig } from "@/types/onboarding";

interface GeneratedProfile {
  roleName: string;
  roleDescription: string;
  department: string;
  items: SuccessProfileSkillItem[];
  phaseConfigs: PhaseConfig[];
  elevatorPitchTopic: string;
  capstoneScenarioDescription: string;
}

interface AIGenerateDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerated: (profile: GeneratedProfile) => void;
}

export default function AIGenerateDrawer({ open, onOpenChange, onGenerated }: AIGenerateDrawerProps) {
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!description.trim()) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-success-profile", {
        body: { description: description.trim() },
      });
      if (error) throw error;
      if (!data?.profile) throw new Error("No profile returned");
      onGenerated(data.profile);
      toast({ title: "Profile drafted", description: "Review and edit before saving." });
      onOpenChange(false);
      setDescription("");
    } catch (e: any) {
      console.error(e);
      toast({ title: "Generation failed", description: e.message || "Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" /> Generate with AI
          </DrawerTitle>
          <DrawerDescription>
            Describe the role and your company context and the AI will draft a complete Success Profile.
          </DrawerDescription>
        </DrawerHeader>
        <div className="px-4 pb-2">
          <Textarea
            rows={4}
            placeholder="e.g. We're a B2B SaaS company selling to mid-market HR teams. We need a profile for a new Product Marketing Manager who will own positioning, competitive intel, and sales enablement content."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading}
          />
        </div>
        <DrawerFooter>
          <Button onClick={handleGenerate} disabled={loading || !description.trim()}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            {loading ? "Generating…" : "Generate"}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
