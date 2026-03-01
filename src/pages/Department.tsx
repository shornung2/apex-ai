import { useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ArrowRight } from "lucide-react";
import {
  departmentDefinitions,
  departmentAgents,
  agentDefinitions,
  skills,
  type Department as DeptType,
  type Skill,
} from "@/data/mock-data";
import { SkillForm } from "@/components/SkillForm";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

export default function Department() {
  const { dept } = useParams<{ dept: string }>();
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);

  if (!dept || !departmentDefinitions[dept as DeptType]) {
    return <Navigate to="/" replace />;
  }

  const department = dept as DeptType;
  const deptMeta = departmentDefinitions[department];
  const agents = departmentAgents[department];
  const deptSkills = skills.filter((s) => s.department === department);

  const handleSubmit = (data: Record<string, string>) => {
    console.log("Run skill:", selectedSkill?.id, data);
    setSelectedSkill(null);
    // TODO: call agent-dispatch edge function
  };

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

        {agents.map((agentType) => {
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
                        <h3 className="text-sm font-semibold">{skill.name}</h3>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{skill.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] bg-muted/50 border-border/50 text-muted-foreground">
                          {skill.inputs.length} inputs
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      <Sheet open={!!selectedSkill} onOpenChange={(open) => !open && setSelectedSkill(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <span className="text-2xl">{selectedSkill?.emoji}</span>
              {selectedSkill?.name}
            </SheetTitle>
            <SheetDescription>{selectedSkill?.description}</SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            {selectedSkill && <SkillForm skill={selectedSkill} onSubmit={handleSubmit} />}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
