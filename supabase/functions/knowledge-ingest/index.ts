import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function getServiceSupabase() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

/** Generate embedding vector using Lovable AI gateway */
async function generateEmbedding(text: string): Promise<number[] | null> {
  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) { console.error("LOVABLE_API_KEY not set, skipping embedding"); return null; }
    const res = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "google/text-embedding-004", input: text.slice(0, 8000) }),
    });
    if (!res.ok) { console.error("Embedding API error:", res.status, await res.text()); return null; }
    const data = await res.json();
    return data?.data?.[0]?.embedding ?? null;
  } catch (err) {
    console.error("Embedding generation failed:", err);
    return null;
  }
}

/** Extract text from a DOCX file (ZIP containing word/document.xml) */
async function extractDocxText(data: Uint8Array): Promise<string> {
  const { JSZip } = await import("https://esm.sh/jszip@3.10.1");
  const zip = await JSZip.loadAsync(data);
  const docXml = await zip.file("word/document.xml")?.async("string");
  if (!docXml) return "";
  // Strip XML tags, keep text content
  return docXml
    .replace(/<w:p[^>]*>/g, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Extract text from a PPTX file (ZIP containing ppt/slides/slide*.xml) */
async function extractPptxText(data: Uint8Array): Promise<string> {
  const { JSZip } = await import("https://esm.sh/jszip@3.10.1");
  const zip = await JSZip.loadAsync(data);
  const slideTexts: string[] = [];

  const slideFiles = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => {
      const numA = parseInt(a.match(/slide(\d+)/)?.[1] || "0");
      const numB = parseInt(b.match(/slide(\d+)/)?.[1] || "0");
      return numA - numB;
    });

  for (const slidePath of slideFiles) {
    const xml = await zip.file(slidePath)?.async("string");
    if (!xml) continue;
    const text = xml
      .replace(/<a:p[^>]*>/g, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .trim();
    if (text) slideTexts.push(text);
  }

  return slideTexts.join("\n\n---\n\n");
}

/** Extract text from a PDF using pdf-parse */
async function extractPdfText(data: Uint8Array): Promise<string> {
  try {
    // Use a lightweight PDF text extraction approach
    // pdf-parse doesn't work well in Deno, so we do basic extraction
    const text = new TextDecoder("utf-8", { fatal: false }).decode(data);
    
    // Try to extract text streams from PDF
    const textParts: string[] = [];
    const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
    let match;
    
    while ((match = streamRegex.exec(text)) !== null) {
      const streamContent = match[1];
      // Look for text operators: Tj, TJ, ', "
      const tjRegex = /\(([^)]*)\)\s*Tj/g;
      let tjMatch;
      while ((tjMatch = tjRegex.exec(streamContent)) !== null) {
        textParts.push(tjMatch[1]);
      }
      
      // TJ array operator
      const tjArrayRegex = /\[([^\]]*)\]\s*TJ/g;
      let tjArrayMatch;
      while ((tjArrayMatch = tjArrayRegex.exec(streamContent)) !== null) {
        const arrayContent = tjArrayMatch[1];
        const stringRegex = /\(([^)]*)\)/g;
        let strMatch;
        while ((strMatch = stringRegex.exec(arrayContent)) !== null) {
          textParts.push(strMatch[1]);
        }
      }
    }
    
    const extracted = textParts.join(" ").replace(/\\n/g, "\n").replace(/\s+/g, " ").trim();
    
    if (extracted.length > 50) return extracted;
    
    // Fallback: return a note that text extraction was limited
    return "[PDF text extraction was limited. The file has been stored for download.]";
  } catch {
    return "[PDF text extraction failed. The file has been stored for download.]";
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = getServiceSupabase();
    const { file_path, title, mime_type, folder_id, tenant_id } = await req.json();

    if (!file_path || !title) {
      return new Response(
        JSON.stringify({ error: "file_path and title are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("documents")
      .download(file_path);

    if (downloadError || !fileData) {
      return new Response(
        JSON.stringify({ error: `Failed to download file: ${downloadError?.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const arrayBuffer = await fileData.arrayBuffer();
    const uint8 = new Uint8Array(arrayBuffer);
    let extractedText = "";
    let status = "ready";

    try {
      const mt = (mime_type || "").toLowerCase();

      if (
        mt.includes("text/") ||
        mt.includes("csv") ||
        mt.includes("markdown") ||
        title.endsWith(".txt") ||
        title.endsWith(".md") ||
        title.endsWith(".csv")
      ) {
        extractedText = new TextDecoder().decode(uint8);
      } else if (
        mt.includes("wordprocessingml") ||
        mt.includes("msword") ||
        title.endsWith(".docx")
      ) {
        extractedText = await extractDocxText(uint8);
      } else if (
        mt.includes("presentationml") ||
        mt.includes("powerpoint") ||
        title.endsWith(".pptx")
      ) {
        extractedText = await extractPptxText(uint8);
      } else if (mt.includes("pdf") || title.endsWith(".pdf")) {
        extractedText = await extractPdfText(uint8);
      } else {
        extractedText = "";
        status = "failed";
      }
    } catch (err) {
      console.error("Text extraction error:", err);
      extractedText = "";
      status = "failed";
    }

    const tokens = Math.ceil(extractedText.length / 4);

    // Insert document record
    const docInsert: Record<string, any> = {
      title,
      content: extractedText || null,
      doc_type: "upload",
      status,
      tokens,
      file_path,
      mime_type: mime_type || null,
      folder_id: folder_id || null,
    };
    if (tenant_id) docInsert.tenant_id = tenant_id;

    const { data: doc, error: insertError } = await supabase
      .from("knowledge_documents")
      .insert(docInsert)
      .select()
      .single();

    if (insertError) {
      return new Response(
        JSON.stringify({ error: `Failed to insert document: ${insertError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create chunks (split by paragraphs)
    if (doc && extractedText.length > 0) {
      const paragraphs = extractedText
        .split(/\n\n+/)
        .filter((p) => p.trim().length > 20);
      const chunks = paragraphs.map((content, idx) => {
        const chunk: Record<string, any> = {
          document_id: doc.id,
          content: content.trim(),
          chunk_index: idx,
          tokens: Math.ceil(content.length / 4),
        };
        if (tenant_id) chunk.tenant_id = tenant_id;
        return chunk;
      });

      if (chunks.length > 0) {
        const { data: insertedChunks, error: chunkError } = await supabase
          .from("knowledge_chunks")
          .insert(chunks)
          .select("id, content");
        if (chunkError) {
          console.error("Chunk insert error:", chunkError);
        }

        // Generate embeddings for each chunk
        if (insertedChunks && insertedChunks.length > 0) {
          for (const chunk of insertedChunks) {
            try {
              const embedding = await generateEmbedding(chunk.content);
              if (embedding) {
                const { error: embedError } = await supabase
                  .from("knowledge_chunks")
                  .update({ embedding: JSON.stringify(embedding) } as any)
                  .eq("id", chunk.id);
                if (embedError) console.error("Embedding update error for chunk", chunk.id, embedError);
              }
            } catch (err) {
              console.error("Embedding failed for chunk", chunk.id, err);
            }
          }
        }
      }
    }

    return new Response(JSON.stringify({ document: doc }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("knowledge-ingest error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
