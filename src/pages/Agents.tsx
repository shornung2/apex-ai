import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { agentDefinitions, type AgentType } from "@/data/mock-data";
import { ArrowRight } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ResearcherForm } from "@/components/agent-forms/ResearcherForm";
import { StrategistForm } from "@/components/agent-forms/StrategistForm";
import { ContentForm } from "@/components/agent-forms/ContentForm";
import { PulseForm } from "@/components/agent-forms/PulseForm";
import { ConciergeForm } from "@/components/agent-forms/ConciergeForm";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

const formComponents: Record<AgentType, React.FC<{ onSubmit: (data: any) => void }>> = {
  researcher: ResearcherForm,
  strategist: StrategistForm,
  content: ContentForm,
  pulse: PulseForm,
  concierge: ConciergeForm,
};

export default function Agents() {
  const [selectedAgent, setSelectedAgent] = useState<AgentType | null>(null);
  const agent = agentDefinitions.find((a) => a.type === selectedAgent);
  const FormComponent = selectedAgent ? formComponents[selectedAgent] : null;

  const handleSubmit = (data: any) => {
    console.log("Submitting to agent:", selectedAgent, data);
    setSelectedAgent(null);
    // TODO: call agent-dispatch edge function
  };

  return (
    <>
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-8 max-w-7xl">
        <motion.div variants={item}>
          <h1 className="text-3xl font-bold tracking-tight">Agents</h1>
          <p className="text-muted-foreground mt-1">Your AI workforce — select an agent to run a task</p>
        </motion.div>

        <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {agentDefinitions.map((agent) => (
            <Card
              key={agent.type}
              className="glass-card hover:border-primary/30 transition-all cursor-pointer group"
              onClick={() => setSelectedAgent(agent.type)}
            >
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <span className="text-3xl">{agent.emoji}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground group-hover:text-primary transition-colors"
                  >
                    Run <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{agent.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{agent.description}</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {agent.capabilities.map((cap) => (
                    <Badge
                      key={cap}
                      variant="outline"
                      className="text-[10px] bg-muted/50 border-border/50 text-muted-foreground"
                    >
                      {cap}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      </motion.div>

      <Sheet open={!!selectedAgent} onOpenChange={(open) => !open && setSelectedAgent(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <span className="text-2xl">{agent?.emoji}</span>
              Run {agent?.name}
            </SheetTitle>
            <SheetDescription>{agent?.description}</SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            {FormComponent && <FormComponent onSubmit={handleSubmit} />}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
