import { useState } from "react";
import type { SuccessProfileSkillItem } from "@/types/onboarding";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Plus } from "lucide-react";

const categories = [
  { value: "hard_skill" as const, label: "Hard Skills" },
  { value: "soft_skill" as const, label: "Soft Skills" },
  { value: "behavioral" as const, label: "Behavioral" },
  { value: "knowledge_area" as const, label: "Knowledge Areas" },
];

interface SkillItemsEditorProps {
  items: SuccessProfileSkillItem[];
  onChange: (items: SuccessProfileSkillItem[]) => void;
}

export default function SkillItemsEditor({ items, onChange }: SkillItemsEditorProps) {
  const [newLabel, setNewLabel] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const addItem = (category: SuccessProfileSkillItem["category"]) => {
    if (!newLabel.trim()) return;
    const newItem: SuccessProfileSkillItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      category,
      label: newLabel.trim(),
      description: newDesc.trim(),
      isRolePlayRubricItem: false,
    };
    onChange([...items, newItem]);
    setNewLabel("");
    setNewDesc("");
  };

  const removeItem = (id: string) => onChange(items.filter((i) => i.id !== id));

  const toggleRubric = (id: string) =>
    onChange(items.map((i) => (i.id === id ? { ...i, isRolePlayRubricItem: !i.isRolePlayRubricItem } : i)));

  return (
    <Tabs defaultValue="hard_skill">
      <TabsList className="w-full grid grid-cols-4">
        {categories.map((c) => (
          <TabsTrigger key={c.value} value={c.value} className="text-xs">
            {c.label} ({items.filter((i) => i.category === c.value).length})
          </TabsTrigger>
        ))}
      </TabsList>

      {categories.map((cat) => (
        <TabsContent key={cat.value} value={cat.value} className="space-y-3 mt-3">
          {items
            .filter((i) => i.category === cat.value)
            .map((item) => (
              <div key={item.id} className="flex items-start gap-2 rounded-md border p-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{item.label}</p>
                  {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <label className="flex items-center gap-1.5 text-[10px] text-muted-foreground cursor-pointer">
                    <Checkbox
                      checked={item.isRolePlayRubricItem}
                      onCheckedChange={() => toggleRubric(item.id)}
                      className="h-3.5 w-3.5"
                    />
                    Rubric
                  </label>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeItem(item.id)}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          <div className="flex gap-2">
            <Input
              placeholder="Label"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              className="flex-1"
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addItem(cat.value))}
            />
            <Input
              placeholder="Description (optional)"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              className="flex-1"
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addItem(cat.value))}
            />
            <Button size="sm" variant="outline" onClick={() => addItem(cat.value)}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Add
            </Button>
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}
