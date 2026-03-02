import { useState, useRef, useEffect } from "react";
import { X, Send, Loader2, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type Msg = { role: "user" | "assistant"; content: string };
type Attachment = { name: string; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/alex-chat`;
const ACCEPTED = ".pdf,.docx,.pptx,.txt,.md,.csv";
const MAX_SIZE = 20 * 1024 * 1024;

export function AlexChat() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);
  useEffect(() => { if (open && inputRef.current) inputRef.current.focus(); }, [open]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_SIZE) {
      toast({ title: "File too large", description: "Max 20MB", variant: "destructive" });
      return;
    }
    setUploadingFile(true);
    try {
      const fileId = crypto.randomUUID();
      const filePath = `chat-attachments/${fileId}/${file.name}`;
      await supabase.storage.from("documents").upload(filePath, file);
      const { data } = await supabase.functions.invoke("knowledge-ingest", {
        body: { file_path: filePath, title: file.name, mime_type: file.type },
      });
      const extractedContent = data?.document?.content || "";
      setAttachment({ name: file.name, content: extractedContent });
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    }
    setUploadingFile(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const send = async () => {
    const text = input.trim();
    if (!text || isLoading) return;
    const userMsg: Msg = { role: "user", content: text };
    setInput("");
    const currentAttachment = attachment;
    setAttachment(null);
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    let assistantSoFar = "";
    const allMessages = [...messages, userMsg];
    const attachments = currentAttachment ? [{ title: currentAttachment.name, content: currentAttachment.content }] : undefined;

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ messages: allMessages, attachments }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Request failed" }));
        setMessages((prev) => [...prev, { role: "assistant", content: `⚠️ ${err.error || "Something went wrong."}` }]);
        setIsLoading(false);
        return;
      }

      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let newlineIdx: number;
        while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIdx);
          buffer = buffer.slice(newlineIdx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            if (parsed.content) {
              assistantSoFar += parsed.content;
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
                return [...prev, { role: "assistant", content: assistantSoFar }];
              });
            }
          } catch { buffer = line + "\n" + buffer; break; }
        }
      }
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "⚠️ Connection error. Please try again." }]);
    }
    setIsLoading(false);
  };

  return (
    <>
      {!open && (
        <button onClick={() => setOpen(true)} className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 overflow-hidden border-2 border-primary/30 bg-background" aria-label="Chat with Alex">
          <img src="/favicon.png" alt="Alex" className="w-full h-full object-cover" />
        </button>
      )}

      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[400px] h-[520px] flex flex-col rounded-xl border border-border bg-background shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card shrink-0">
            <img src="/favicon.png" alt="Alex" className="w-8 h-8 rounded-full object-cover" />
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-foreground">Alex</h3>
              <p className="text-xs text-muted-foreground">AI Assistant</p>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setOpen(false)}><X className="h-4 w-4" /></Button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <img src="/favicon.png" alt="Alex" className="w-12 h-12 rounded-full mx-auto mb-3 object-cover" />
                <p className="text-sm font-medium text-foreground">Hi! I'm Alex 👋</p>
                <p className="text-xs text-muted-foreground mt-1">Ask me anything about Apex AI or your Knowledge Base.</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"><ReactMarkdown>{msg.content}</ReactMarkdown></div>
                  ) : msg.content}
                </div>
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
              <div className="flex justify-start"><div className="bg-muted rounded-lg px-3 py-2"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div></div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-border p-3 shrink-0 space-y-2">
            {/* Attachment chip */}
            {(attachment || uploadingFile) && (
              <div className="flex items-center gap-2 text-xs bg-muted rounded-md px-2 py-1">
                {uploadingFile ? <Loader2 className="h-3 w-3 animate-spin" /> : <Paperclip className="h-3 w-3" />}
                <span className="truncate flex-1">{uploadingFile ? "Uploading..." : attachment?.name}</span>
                {!uploadingFile && <button onClick={() => setAttachment(null)} className="text-muted-foreground hover:text-foreground"><X className="h-3 w-3" /></button>}
              </div>
            )}
            <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-2">
              <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => fileRef.current?.click()} disabled={isLoading || uploadingFile}>
                <Paperclip className="h-4 w-4" />
              </Button>
              <input ref={fileRef} type="file" accept={ACCEPTED} className="hidden" onChange={handleFileSelect} />
              <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask Alex anything..." className="flex-1 text-sm bg-muted rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground" disabled={isLoading} />
              <Button type="submit" size="icon" className="h-9 w-9 shrink-0" disabled={isLoading || !input.trim() || uploadingFile}><Send className="h-4 w-4" /></Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
