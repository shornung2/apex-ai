import { useState, useEffect, useRef } from "react";
import { useParams, Navigate, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ArrowRight, Loader2 } from "lucide-react";
import {
  departmentDefinitions,
  departmentAgents,
  agentDefinitions,
  dbRowToSkill,
  type Department as DeptType,
  type Skill,
} from "@/data/mock-data";
import { SkillForm } from "@/components/SkillForm";
import { runSkill, runDeckSkill } from "@/lib/agent-client";
import { useToast } from "@/hooks/use-toast";
import { useTenant } from "@/contexts/TenantContext";
import { supabase } from "@/integrations/supabase/client";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

export default function Department() {
  const { dept } = useParams<{ dept: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { tenantId } = useTenant();
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [deptSkills, setDeptSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const abortRef = useRef<AbortController | null>(null);

  const isValidDept = dept && departmentDefinitions[dept as DeptType];
  const department = (dept || "marketing") as DeptType;
  const deptMeta = departmentDefinitions[department] || departmentDefinitions.marketing;
  const agents = departmentAgents[department] || [];

  useEffect(() => {
    if (!isValidDept) return;
    const fetchSkills = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("skills")
        .select("*")
        .eq("department", department);
      if (data) {
        setDeptSkills(data.map(dbRowToSkill));
      }
      setLoading(false);
    };
    fetchSkills();
  }, [department, isValidDept]);

  const handleSubmit = async (data: Record<string, string>) => {
    if (!selectedSkill) return;
    setIsRunning(true);

    // Deck generation flow (pptx output)
    if (selectedSkill.outputFormat === "pptx") {
      try {
        const deckType = selectedSkill.name.toLowerCase().includes("proposal") ? "proposal" : "capabilities";
        toast({ title: "Generating deck...", description: "This may take 30-60 seconds." });
        const result = await runDeckSkill({ skill: selectedSkill, inputs: data, deckType, tenantId: tenantId || undefined });
        setSelectedSkill(null);
        setIsRunning(false);
        toast({ title: "Deck ready!", description: `${result.slideCount} slides generated.` });
        navigate(`/jobs/${result.jobId}`);
      } catch (e) {
        setIsRunning(false);
        toast({ title: "Error", description: e instanceof Error ? e.message : "Deck generation failed", variant: "destructive" });
      }
      return;
    }

    // Standard streaming flow
    const controller = new AbortController();
    abortRef.current = controller;

    let jobId: string | null = null;

    runSkill({
      skill: selectedSkill,
      inputs: data,
      tenantId: tenantId || undefined,
      signal: controller.signal,
      onJobId: (id) => {
        jobId = id;
        toast({ title: "Job started", description: "Redirecting to results..." });
        setSelectedSkill(null);
        setIsRunning(false);
        navigate(`/jobs/${id}`);
        controller.abort();
      },
      onDelta: () => {},
      onDone: () => {
        setIsRunning(false);
        if (!jobId) {
          toast({ title: "Job completed", variant: "default" });
        }
      },
      onError: (error) => {
        setIsRunning(false);
        if (!controller.signal.aborted) {
          toast({ title: "Error", description: error, variant: "destructive" });
        }
      },
    });
  };

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  if (!isValidDept) {
    return <Navigate to="/" replace />;
  }

  return (
    <>
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-8 max-w-7xl">
        <motion.div variants={item}>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{deptMeta.emoji}</span>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{deptMeta.name}</h1>
              <p className="text-muted-foreground mt-1">{deptMeta.description}</p>
            </div>
          </div>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          agents.map((agentType) => {
            const agent = agentDefinitions.find((a) => a.type === agentType);
            const agentSkills = deptSkills.filter((s) => s.agentType === agentType);
            if (!agent || agentSkills.length === 0) return null;

            return (
              <motion.div key={agentType} variants={item} className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{agent.emoji}</span>
                  <h2 className="text-lg font-semibold">{agent.name}</h2>
                  <Badge variant="outline" className="text-[10px] text-muted-foreground">
                    {agentSkills.length} {agentSkills.length === 1 ? "skill" : "skills"}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {agentSkills.map((skill) => (
                    <Card
                      key={skill.id}
                      className="glass-card hover:border-primary/30 transition-all cursor-pointer group"
                      onClick={() => setSelectedSkill(skill)}
                    >
                      <CardContent className="p-5 space-y-3">
                        <div className="flex items-start justify-between">
                          <span className="text-2xl">{skill.emoji}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground group-hover:text-primary transition-colors"
                          >
                            Run <ArrowRight className="ml-1 h-3 w-3" />
                          </Button>
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold">{skill.displayName || skill.name}</h3>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{skill.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] bg-muted/50 border-border/50 text-muted-foreground">
                            {skill.inputs.length} inputs
                          </Badge>
                          {skill.estimatedCost && (
                            <Badge variant="outline" className="text-[10px] bg-muted/50 border-border/50 text-muted-foreground">
                              ~${skill.estimatedCost.toFixed(2)}
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </motion.div>
            );
          })
        )}
      </motion.div>

      <Sheet open={!!selectedSkill} onOpenChange={(open) => !open && !isRunning && setSelectedSkill(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <span className="text-2xl">{selectedSkill?.emoji}</span>
              {selectedSkill?.displayName || selectedSkill?.name}
            </SheetTitle>
            <SheetDescription>{selectedSkill?.description}</SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            {selectedSkill && <SkillForm skill={selectedSkill} onSubmit={handleSubmit} isRunning={isRunning} />}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
