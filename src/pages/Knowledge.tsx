import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Upload, Search, FileText, Bot } from "lucide-react";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

const mockDocs = [
  { id: "1", name: "Acme Corp Research Brief.md", type: "agent_output", status: "ready", chunks: 12, tokens: 3400, createdAt: "2026-02-28" },
  { id: "2", name: "Sales Playbook 2026.pdf", type: "upload", status: "ready", chunks: 45, tokens: 18200, createdAt: "2026-02-15" },
  { id: "3", name: "TechFlow Proposal Draft.md", type: "agent_output", status: "processing", chunks: 0, tokens: 0, createdAt: "2026-03-01" },
  { id: "4", name: "Competitive Landscape Q1.pdf", type: "upload", status: "ready", chunks: 28, tokens: 9800, createdAt: "2026-02-20" },
];

const statusBadge: Record<string, string> = {
  ready: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  processing: "bg-primary/20 text-primary border-primary/30",
  failed: "bg-destructive/20 text-destructive border-destructive/30",
};

export default function Knowledge() {
  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-7xl">
      <motion.div variants={item}>
        <h1 className="text-3xl font-bold tracking-tight">Knowledge Base</h1>
        <p className="text-muted-foreground mt-1">Your organization's intelligence library</p>
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Document Library */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search documents..." className="pl-9 bg-muted/50 border-border/50" />
          </div>

          {/* Upload zone */}
          <Card className="glass-card border-dashed border-2 border-border/50 hover:border-primary/30 transition-colors cursor-pointer">
            <CardContent className="p-6 flex flex-col items-center text-center">
              <Upload className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm font-medium">Upload Documents</p>
              <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, TXT — max 50MB</p>
            </CardContent>
          </Card>

          {/* Document list */}
          <div className="space-y-2">
            {mockDocs.map((doc) => (
              <Card key={doc.id} className="glass-card hover:border-primary/20 transition-colors cursor-pointer">
                <CardContent className="p-3 flex items-center gap-3">
                  {doc.type === "agent_output" ? (
                    <Bot className="h-4 w-4 text-primary shrink-0" />
                  ) : (
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {doc.chunks} chunks · {doc.tokens.toLocaleString()} tokens
                    </p>
                  </div>
                  <Badge variant="outline" className={statusBadge[doc.status]}>
                    {doc.status}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Document Viewer */}
        <div className="lg:col-span-3">
          <Card className="glass-card h-full min-h-[400px]">
            <CardContent className="p-8 flex flex-col items-center justify-center text-center h-full">
              <BookOpen className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">Select a document to view its contents and chunks</p>
              <p className="text-xs text-muted-foreground mt-2">
                Semantic search and chunk inspection coming soon
              </p>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </motion.div>
  );
}

function BookOpen(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}
