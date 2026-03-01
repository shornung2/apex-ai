import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { skills } from "@/data/mock-data";
import { Search, Filter, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import type { Skill } from "@/data/mock-data";

const complexityColor: Record<string, string> = {
  Basic: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  Advanced: "bg-primary/20 text-primary border-primary/30",
  Expert: "bg-accent/20 text-accent border-accent/30",
};

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

export default function Skills() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [selected, setSelected] = useState<Skill | null>(null);

  const types = [...new Set(skills.map((s) => s.type))];

  const filtered = skills.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.description.toLowerCase().includes(search.toLowerCase());
    const matchesType = !typeFilter || s.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-6xl">
      <motion.div variants={item}>
        <h1 className="text-3xl font-bold tracking-tight">Skills Marketplace</h1>
        <p className="text-muted-foreground mt-1">Browse and configure the skills that power your agents</p>
      </motion.div>

      {/* Filters */}
      <motion.div variants={item} className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search skills..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-muted/50 border-border/50"
          />
        </div>
        <div className="flex gap-2">
          {types.map((type) => (
            <Button
              key={type}
              variant={typeFilter === type ? "default" : "outline"}
              size="sm"
              onClick={() => setTypeFilter(typeFilter === type ? null : type)}
              className="text-xs"
            >
              {type}
            </Button>
          ))}
          {typeFilter && (
            <Button variant="ghost" size="sm" onClick={() => setTypeFilter(null)} className="text-xs text-muted-foreground">
              <X className="h-3 w-3 mr-1" /> Clear
            </Button>
          )}
        </div>
      </motion.div>

      {/* Skill Grid */}
      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filtered.map((skill) => (
          <Card
            key={skill.id}
            className="glass-card cursor-pointer hover:glow-border transition-all"
            onClick={() => setSelected(skill)}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{skill.icon}</span>
                  <h3 className="font-semibold">{skill.name}</h3>
                </div>
                <Badge variant="outline" className={complexityColor[skill.complexity]}>
                  {skill.complexity}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">{skill.description}</p>
              <div className="flex gap-2 mt-3">
                <Badge variant="secondary" className="text-[10px] capitalize">{skill.department}</Badge>
                <Badge variant="secondary" className="text-[10px]">{skill.type}</Badge>
                {skill.source === "Solutionment IP" && (
                  <Badge variant="secondary" className="text-[10px] bg-accent/10 text-accent border-accent/20">IP</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Skill Detail Sheet */}
      <Sheet open={!!selected} onOpenChange={() => setSelected(null)}>
        <SheetContent className="bg-card border-border/50">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <span className="text-2xl">{selected.icon}</span>
                  {selected.name}
                </SheetTitle>
                <SheetDescription>{selected.description}</SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                <div>
                  <h4 className="text-sm font-medium mb-2 text-muted-foreground">Required Inputs</h4>
                  <div className="flex flex-wrap gap-2">
                    {selected.inputs.map((input) => (
                      <Badge key={input} variant="outline">{input}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2 text-muted-foreground">Sample Output</h4>
                  <p className="text-sm bg-muted/50 rounded-lg p-3">{selected.sampleOutput}</p>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline" className={complexityColor[selected.complexity]}>{selected.complexity}</Badge>
                  <Badge variant="secondary" className="capitalize">{selected.department}</Badge>
                  <Badge variant="secondary">{selected.source}</Badge>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </motion.div>
  );
}
