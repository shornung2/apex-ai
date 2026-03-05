import { useState } from "react";
import { format, addDays } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Loader2, Search, CheckCircle2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { OnboardingPhase, PhaseConfig } from "@/types/onboarding";

interface AssignUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  programId: string;
  programName: string;
  profileRoleName: string;
  phaseConfigs: PhaseConfig[];
}

type FoundUser = { id: string; full_name: string | null; email: string | null };

const PHASES: OnboardingPhase[] = ["immerse", "observe", "demonstrate"];

function DatePicker({ date, onSelect, label }: { date: Date; onSelect: (d: Date) => void; label: string }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-start text-left h-9 text-sm">
            <CalendarIcon className="h-3.5 w-3.5 mr-2" />
            {format(date, "PPP")}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => d && onSelect(d)}
            className={cn("p-3 pointer-events-auto")}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default function AssignUserDialog({
  open,
  onOpenChange,
  programId,
  programName,
  profileRoleName,
  phaseConfigs,
}: AssignUserDialogProps) {
  const { tenantId } = useTenant();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [searching, setSearching] = useState(false);
  const [foundUser, setFoundUser] = useState<FoundUser | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [deadlines, setDeadlines] = useState<Record<OnboardingPhase, Date>>(() => {
    const today = new Date();
    let cursor = today;
    const d: Partial<Record<OnboardingPhase, Date>> = {};
    for (const p of PHASES) {
      const cfg = phaseConfigs.find((c) => c.phase === p);
      cursor = addDays(cursor, cfg?.durationDays ?? 7);
      d[p] = cursor;
    }
    return d as Record<OnboardingPhase, Date>;
  });
  const [assigning, setAssigning] = useState(false);

  const searchUser = async () => {
    if (!email.trim() || !tenantId) return;
    setSearching(true);
    setNotFound(false);
    setFoundUser(null);
    const { data, error } = await supabase
      .from("user_profiles")
      .select("id, full_name, email")
      .eq("tenant_id", tenantId)
      .eq("email", email.trim().toLowerCase())
      .maybeSingle();
    setSearching(false);
    if (error || !data) {
      setNotFound(true);
    } else {
      setFoundUser(data);
    }
  };

  const recalcDeadlines = (newStart: Date) => {
    setStartDate(newStart);
    let cursor = newStart;
    const d: Partial<Record<OnboardingPhase, Date>> = {};
    for (const p of PHASES) {
      const cfg = phaseConfigs.find((c) => c.phase === p);
      cursor = addDays(cursor, cfg?.durationDays ?? 7);
      d[p] = cursor;
    }
    setDeadlines(d as Record<OnboardingPhase, Date>);
  };

  const assign = async () => {
    if (!foundUser || !tenantId) return;
    setAssigning(true);
    try {
      const phaseDeadlinesArr = PHASES.map((p) => ({
        phase: p,
        dueDate: deadlines[p].toISOString(),
      }));
      const { error } = await supabase.from("onboarding_assignments").insert({
        tenant_id: tenantId,
        program_id: programId,
        user_id: foundUser.id,
        user_display_name: foundUser.full_name || "",
        user_email: foundUser.email || "",
        status: "active",
        current_phase: "immerse",
        started_at: startDate.toISOString(),
        phase_deadlines: phaseDeadlinesArr,
        phase_completed_at: {},
      });
      if (error) throw error;
      toast({
        title: "Assigned!",
        description: `${foundUser.full_name || foundUser.email} has been enrolled in ${programName}. They'll see their Journey on next login.`,
      });
      onOpenChange(false);
      resetState();
    } catch (e: any) {
      toast({ title: "Assignment failed", description: e.message, variant: "destructive" });
    } finally {
      setAssigning(false);
    }
  };

  const resetState = () => {
    setStep(1);
    setEmail("");
    setFoundUser(null);
    setNotFound(false);
    setStartDate(new Date());
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) resetState(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {step === 1 && "Find User"}
            {step === 2 && "Set Start Date & Deadlines"}
            {step === 3 && "Confirm Assignment"}
          </DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter user email..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchUser()}
              />
              <Button onClick={searchUser} disabled={searching || !email.trim()}>
                {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>
            {notFound && <p className="text-sm text-destructive">No user found with that email in your organization.</p>}
            {foundUser && (
              <Card>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{foundUser.full_name || "No name"}</p>
                    <p className="text-sm text-muted-foreground">{foundUser.email}</p>
                  </div>
                  <Button onClick={() => setStep(2)}>Select</Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <DatePicker date={startDate} onSelect={recalcDeadlines} label="Start Date" />
            {PHASES.map((p) => (
              <DatePicker
                key={p}
                date={deadlines[p]}
                onSelect={(d) => setDeadlines((prev) => ({ ...prev, [p]: d }))}
                label={`${p.charAt(0).toUpperCase() + p.slice(1)} due by`}
              />
            ))}
            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button onClick={() => setStep(3)}>Next</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">User</span>
                  <span className="text-sm font-medium">{foundUser?.full_name || foundUser?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Program</span>
                  <span className="text-sm font-medium">{programName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Role</span>
                  <Badge variant="outline">{profileRoleName}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Start</span>
                  <span className="text-sm">{format(startDate, "PPP")}</span>
                </div>
                {PHASES.map((p) => (
                  <div key={p} className="flex justify-between">
                    <span className="text-sm text-muted-foreground capitalize">{p} due</span>
                    <span className="text-sm">{format(deadlines[p], "PPP")}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
              <Button onClick={assign} disabled={assigning}>
                {assigning ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                Assign
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
