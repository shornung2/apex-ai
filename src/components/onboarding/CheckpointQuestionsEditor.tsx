import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export interface CheckpointQuestion {
  id: string;
  question: string;
  passingThreshold?: number;
}

interface CheckpointQuestionsEditorProps {
  questions: CheckpointQuestion[];
  onChange: (questions: CheckpointQuestion[]) => void;
  phase: string;
  objectives: string[];
  documentTitles: string[];
}

export default function CheckpointQuestionsEditor({
  questions,
  onChange,
  phase,
  objectives,
  documentTitles,
}: CheckpointQuestionsEditorProps) {
  const [newQuestion, setNewQuestion] = useState("");
  const [newThreshold, setNewThreshold] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const addQuestion = () => {
    if (!newQuestion.trim()) return;
    const q: CheckpointQuestion = {
      id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      question: newQuestion.trim(),
      passingThreshold: newThreshold ? parseInt(newThreshold) : undefined,
    };
    onChange([...questions, q]);
    setNewQuestion("");
    setNewThreshold("");
    setShowAdd(false);
  };

  const removeQuestion = (id: string) => onChange(questions.filter((q) => q.id !== id));

  const addSuggestion = (text: string) => {
    const q: CheckpointQuestion = {
      id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      question: text,
    };
    onChange([...questions, q]);
    setSuggestions((prev) => prev.filter((s) => s !== text));
  };

  const generateQuestions = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-checkpoint-questions", {
        body: { phase, objectives, documentTitles },
      });
      if (error) throw error;
      if (data?.questions) {
        setSuggestions(data.questions);
        toast({ title: "Questions generated", description: "Click any suggestion to add it." });
      }
    } catch (e: any) {
      toast({ title: "Generation failed", description: e.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-3">
      {questions.length > 0 && (
        <div className="space-y-2">
          {questions.map((q, i) => (
            <div key={q.id} className="flex items-start gap-2 p-2 rounded border bg-card">
              <span className="text-xs text-muted-foreground mt-1 shrink-0">{i + 1}.</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm">{q.question}</p>
                {q.passingThreshold && (
                  <Badge variant="outline" className="mt-1 text-xs">
                    Pass: {q.passingThreshold}/5
                  </Badge>
                )}
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => removeQuestion(q.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="border border-dashed rounded-md p-3 space-y-2">
          <p className="text-xs font-medium text-muted-foreground">AI Suggestions — click to add:</p>
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => addSuggestion(s)}
              className="w-full text-left text-sm p-2 rounded hover:bg-accent border bg-card"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {showAdd ? (
        <div className="border rounded-md p-3 space-y-2">
          <Textarea
            placeholder="Enter checkpoint question..."
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            rows={2}
            className="text-sm"
          />
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={1}
              max={5}
              placeholder="Threshold (1-5)"
              value={newThreshold}
              onChange={(e) => setNewThreshold(e.target.value)}
              className="h-8 w-36 text-sm"
            />
            <span className="text-xs text-muted-foreground">Leave blank for informational — no gate</span>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={addQuestion} disabled={!newQuestion.trim()}>
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowAdd(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowAdd(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add Question
          </Button>
          <Button variant="outline" size="sm" onClick={generateQuestions} disabled={generating}>
            {generating ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 mr-1" />}
            Generate with AI
          </Button>
        </div>
      )}
    </div>
  );
}
