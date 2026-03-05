import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Search, FileText } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface KnowledgeDocPickerProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export default function KnowledgeDocPicker({ selectedIds, onChange }: KnowledgeDocPickerProps) {
  const { tenantId } = useTenant();
  const [search, setSearch] = useState("");
  const [showPicker, setShowPicker] = useState(false);

  const { data: docs = [] } = useQuery({
    queryKey: ["kb-docs", tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      const { data, error } = await supabase
        .from("knowledge_documents")
        .select("id, title, doc_type, status")
        .eq("tenant_id", tenantId)
        .eq("status", "ready")
        .order("title");
      if (error) throw error;
      return data || [];
    },
    enabled: !!tenantId,
  });

  const selectedDocs = docs.filter((d) => selectedIds.includes(d.id));
  const filteredDocs = docs.filter(
    (d) =>
      !selectedIds.includes(d.id) &&
      d.title.toLowerCase().includes(search.toLowerCase())
  );

  const addDoc = (id: string) => onChange([...selectedIds, id]);
  const removeDoc = (id: string) => onChange(selectedIds.filter((i) => i !== id));

  return (
    <div className="space-y-2">
      {selectedDocs.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedDocs.map((doc) => (
            <Badge key={doc.id} variant="secondary" className="gap-1 pr-1">
              <FileText className="h-3 w-3" />
              {doc.title}
              <button onClick={() => removeDoc(doc.id)} className="ml-1 rounded-full hover:bg-muted p-0.5">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {!showPicker ? (
        <Button variant="outline" size="sm" onClick={() => setShowPicker(true)}>
          <Search className="h-3.5 w-3.5 mr-1.5" />
          Add Knowledge Documents
        </Button>
      ) : (
        <div className="border rounded-md p-2 space-y-2">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search documents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 text-sm"
            />
            <Button variant="ghost" size="sm" onClick={() => setShowPicker(false)}>
              Done
            </Button>
          </div>
          <ScrollArea className="h-40">
            {filteredDocs.length === 0 ? (
              <p className="text-xs text-muted-foreground p-2">
                {docs.length === 0 ? "No documents in your knowledge base yet." : "No matching documents."}
              </p>
            ) : (
              <div className="space-y-1">
                {filteredDocs.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => addDoc(doc.id)}
                    className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-accent flex items-center gap-2"
                  >
                    <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    {doc.title}
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Learners will be assigned these documents to study during this phase.
      </p>
    </div>
  );
}
