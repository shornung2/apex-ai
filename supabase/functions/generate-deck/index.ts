import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Brand constants (Solutionment Design System)
const BRAND = {
  primaryColor: "1E3A5F",   // Deep navy
  accentColor: "00A3E0",    // Sky blue
  secondaryColor: "F5F5F5", // Light gray background
  textDark: "1A1A1A",
  textLight: "FFFFFF",
  fontFace: "Calibri",
  companyName: "Solutionment",
  tagline: "Strategy. Technology. Transformation.",
};

const SLIDE_TOOL_SCHEMA = {
  type: "function" as const,
  function: {
    name: "generate_deck_slides",
    description: "Generate a complete PowerPoint deck as structured slide data. Each slide must have FULL, SUBSTANTIVE content - complete sentences, real talking points, and detailed prose. Never output outlines or placeholder text.",
    parameters: {
      type: "object",
      properties: {
        slides: {
          type: "array",
          items: {
            type: "object",
            properties: {
              layout: {
                type: "string",
                enum: ["title", "section", "content", "two-column", "bullets", "closing"],
              },
              title: { type: "string", description: "Slide title" },
              subtitle: { type: "string", description: "Subtitle (for title/section slides)" },
              body: { type: "string", description: "Full prose body text. Write complete paragraphs, not outlines." },
              bullets: {
                type: "array",
                items: { type: "string" },
                description: "For bullet layout: 4-6 substantive bullets. Each bullet should be 1-2 complete sentences.",
              },
              left_column: { type: "string", description: "Left column content for two-column layout" },
              right_column: { type: "string", description: "Right column content for two-column layout" },
              speaker_notes: { type: "string", description: "Speaker notes for this slide" },
            },
            required: ["layout", "title", "speaker_notes"],
          },
        },
      },
      required: ["slides"],
    },
  },
};

function buildSystemPrompt(deckType: string): string {
  const base = `You are an expert presentation designer and business writer for ${BRAND.companyName}. You create COMPLETE, POLISHED PowerPoint decks - not outlines, not drafts.

CRITICAL RULES:
1. Every slide must contain FULL, SUBSTANTIVE content. Write complete sentences and paragraphs.
2. Bullet points must be 1-2 complete sentences each, not single words or short phrases.
3. Body text should be rich, detailed prose that a presenter can use directly.
4. Speaker notes should contain additional talking points and transitions.
5. Use a mix of layouts for visual variety: content, bullets, two-column, and section headers.
6. The first slide must be layout "title" and the last must be layout "closing".
7. Include section headers between major topic transitions.

BRAND VOICE:
- Professional, confident, outcome-focused
- Emphasize measurable results and client outcomes
- Position ${BRAND.companyName} as a strategic partner, not just a vendor
- Reference real capabilities: AI (Apex AI platform), Academy training, consulting, digital transformation
- Never use em dashes, "lean in", or "it's not about X, it's about Y" constructions

COMPANY CONTEXT:
${BRAND.companyName} is a consulting and technology firm specializing in:
- Apex AI: An AI-powered platform for business automation and intelligence
- Academy: Professional training and upskilling programs
- Consulting: Strategy, technology, and transformation services
- Digital Transformation: End-to-end modernization of business processes`;

  if (deckType === "capabilities") {
    return base + `

DECK TYPE: Capabilities Overview
Structure the deck to showcase ${BRAND.companyName}'s full range of capabilities:
1. Title slide with company name and tagline
2. Executive summary / why ${BRAND.companyName}
3. Our approach / methodology
4. Service pillars (use section headers + detail slides for each):
   - Strategy & Consulting
   - Technology & Digital Transformation  
   - Apex AI Platform
   - Academy & Training
5. Case studies / client outcomes (use specific, believable metrics)
6. Team / expertise highlights
7. Differentiators (why choose us over competitors)
8. Closing with call to action and contact info

Tailor ALL content to the target company and industry provided by the user.`;
  }

  return base + `

DECK TYPE: Proposal
Structure the deck as a tailored business proposal:
1. Title slide with project name and client company
2. Executive summary
3. Understanding the challenge (client's problem/opportunity)
4. Proposed solution overview
5. Detailed approach / methodology (2-3 slides)
6. Team & expertise
7. Timeline & milestones
8. Investment summary
9. Expected outcomes / ROI
10. Next steps
11. Closing with call to action

Write as if presenting directly to the client's leadership team. Be specific, not generic.`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

  if (!lovableApiKey) {
    return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    const { skillId, skillName, agentType, department, title, inputs, deckType, tenantId } = await req.json();

    // 1. Insert job as running
    const jobInsert: Record<string, any> = {
      skill_id: skillId,
      agent_type: agentType,
      department,
      title,
      status: "running",
      inputs,
    };
    if (tenantId) jobInsert.tenant_id = tenantId;

    const { data: job, error: insertError } = await supabase
      .from("agent_jobs")
      .insert(jobInsert)
      .select("id")
      .single();

    if (insertError || !job) {
      console.error("Insert error:", insertError);
      return new Response(JSON.stringify({ error: "Failed to create job" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const jobId = job.id;

    // 2. Fetch brand context from "Design System" knowledge folder
    let brandContext = "";
    const { data: brandFolder } = await supabase
      .from("knowledge_folders")
      .select("id")
      .eq("name", "Design System")
      .limit(1)
      .single();

    if (brandFolder) {
      const { data: brandDocs } = await supabase
        .from("knowledge_documents")
        .select("id")
        .eq("folder_id", brandFolder.id);

      if (brandDocs && brandDocs.length > 0) {
        const docIds = brandDocs.map((d: any) => d.id);
        const { data: brandChunks } = await supabase
          .from("knowledge_chunks")
          .select("content")
          .in("document_id", docIds)
          .order("chunk_index")
          .limit(15);

        if (brandChunks && brandChunks.length > 0) {
          const useful = brandChunks.filter((c: any) => !c.content.includes("extraction was limited"));
          if (useful.length > 0) {
            brandContext = "\n\nBRAND & DESIGN SYSTEM GUIDELINES (from Knowledge Base):\n" +
              useful.map((c: any) => c.content).join("\n\n");
          }
        }
      }
    }

    // 3. Fetch knowledge context for grounding
    const inputValues = Object.values(inputs).join(" ");
    const searchTerms = inputValues.split(/\s+/).filter((t: string) => t.length > 3).slice(0, 10);
    let knowledgeContext = "";
    if (searchTerms.length > 0) {
      const orFilter = searchTerms.map((t: string) => `content.ilike.%${t}%`).join(",");
      const { data: chunks } = await supabase
        .from("knowledge_chunks")
        .select("content")
        .or(orFilter)
        .limit(5);
      if (chunks && chunks.length > 0) {
        knowledgeContext = "\n\nKNOWLEDGE BASE CONTEXT:\n" +
          chunks.map((c: any, i: number) => `[${i + 1}]: ${c.content}`).join("\n\n");
      }
    }

    // 4. Build user prompt from inputs
    const slideCount = inputs["Number of Slides"] || inputs["number_of_slides"] || "12";
    let userPrompt = `Create a ${slideCount}-slide ${deckType === "capabilities" ? "Capabilities Overview" : "Proposal"} deck.\n\n`;
    for (const [key, value] of Object.entries(inputs)) {
      if (value) userPrompt += `**${key}:** ${value}\n`;
    }
    userPrompt += knowledgeContext;

    // 5. Call AI with tool calling for structured output
    const systemPrompt = buildSystemPrompt(deckType || "capabilities") + brandContext;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [SLIDE_TOOL_SCHEMA],
        tool_choice: { type: "function", function: { name: "generate_deck_slides" } },
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      await supabase.from("agent_jobs").update({ status: "failed" }).eq("id", jobId);

      const status = aiResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later.", jobId }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits.", jobId }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI generation failed", jobId }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResult = await aiResponse.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      console.error("No tool call in response:", JSON.stringify(aiResult).slice(0, 500));
      await supabase.from("agent_jobs").update({ status: "failed" }).eq("id", jobId);
      return new Response(JSON.stringify({ error: "AI did not return structured slide data", jobId }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const slidesData = JSON.parse(toolCall.function.arguments);
    const slides = slidesData.slides || [];

    // 5. Build PPTX with PptxGenJS
    const PptxGenJS = (await import("https://esm.sh/pptxgenjs@3.12.0")).default;
    const pptx = new PptxGenJS();
    pptx.layout = "LAYOUT_WIDE";
    pptx.author = BRAND.companyName;
    pptx.company = BRAND.companyName;
    pptx.title = title;

    for (const slide of slides) {
      const pptSlide = pptx.addSlide();

      // Add speaker notes
      if (slide.speaker_notes) {
        pptSlide.addNotes(slide.speaker_notes);
      }

      switch (slide.layout) {
        case "title": {
          pptSlide.background = { color: BRAND.primaryColor };
          pptSlide.addText(slide.title, {
            x: 0.8, y: 1.8, w: 11.5, h: 1.5,
            fontSize: 36, fontFace: BRAND.fontFace, color: BRAND.textLight,
            bold: true, align: "center",
          });
          if (slide.subtitle) {
            pptSlide.addText(slide.subtitle, {
              x: 0.8, y: 3.4, w: 11.5, h: 0.8,
              fontSize: 18, fontFace: BRAND.fontFace, color: BRAND.accentColor,
              align: "center",
            });
          }
          pptSlide.addText(new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }), {
            x: 0.8, y: 4.5, w: 11.5, h: 0.5,
            fontSize: 12, fontFace: BRAND.fontFace, color: BRAND.textLight,
            align: "center", italic: true,
          });
          break;
        }

        case "section": {
          pptSlide.background = { color: BRAND.accentColor };
          pptSlide.addText(slide.title, {
            x: 0.8, y: 2.0, w: 11.5, h: 1.5,
            fontSize: 32, fontFace: BRAND.fontFace, color: BRAND.textLight,
            bold: true, align: "center",
          });
          if (slide.subtitle) {
            pptSlide.addText(slide.subtitle, {
              x: 1.5, y: 3.6, w: 10, h: 0.8,
              fontSize: 16, fontFace: BRAND.fontFace, color: BRAND.textLight,
              align: "center",
            });
          }
          break;
        }

        case "content": {
          // Title bar
          pptSlide.addShape("rect" as any, {
            x: 0, y: 0, w: 13.33, h: 1.2,
            fill: { color: BRAND.primaryColor },
          });
          pptSlide.addText(slide.title, {
            x: 0.6, y: 0.15, w: 12, h: 0.9,
            fontSize: 22, fontFace: BRAND.fontFace, color: BRAND.textLight, bold: true,
          });
          // Body
          pptSlide.addText(slide.body || "", {
            x: 0.6, y: 1.6, w: 12, h: 5.2,
            fontSize: 14, fontFace: BRAND.fontFace, color: BRAND.textDark,
            valign: "top", lineSpacing: 22,
          });
          break;
        }

        case "bullets": {
          // Title bar
          pptSlide.addShape("rect" as any, {
            x: 0, y: 0, w: 13.33, h: 1.2,
            fill: { color: BRAND.primaryColor },
          });
          pptSlide.addText(slide.title, {
            x: 0.6, y: 0.15, w: 12, h: 0.9,
            fontSize: 22, fontFace: BRAND.fontFace, color: BRAND.textLight, bold: true,
          });
          // Bullets
          const bulletItems = (slide.bullets || []).map((b: string) => ({
            text: b,
            options: { bullet: { code: "2022" }, fontSize: 14, color: BRAND.textDark, lineSpacing: 26 },
          }));
          pptSlide.addText(bulletItems, {
            x: 0.8, y: 1.6, w: 11.5, h: 5.2,
            fontFace: BRAND.fontFace, valign: "top",
          });
          break;
        }

        case "two-column": {
          // Title bar
          pptSlide.addShape("rect" as any, {
            x: 0, y: 0, w: 13.33, h: 1.2,
            fill: { color: BRAND.primaryColor },
          });
          pptSlide.addText(slide.title, {
            x: 0.6, y: 0.15, w: 12, h: 0.9,
            fontSize: 22, fontFace: BRAND.fontFace, color: BRAND.textLight, bold: true,
          });
          // Left column
          pptSlide.addText(slide.left_column || "", {
            x: 0.6, y: 1.6, w: 5.8, h: 5.2,
            fontSize: 13, fontFace: BRAND.fontFace, color: BRAND.textDark,
            valign: "top", lineSpacing: 20,
          });
          // Divider
          pptSlide.addShape("rect" as any, {
            x: 6.55, y: 1.6, w: 0.03, h: 5.0,
            fill: { color: BRAND.accentColor },
          });
          // Right column
          pptSlide.addText(slide.right_column || "", {
            x: 6.9, y: 1.6, w: 5.8, h: 5.2,
            fontSize: 13, fontFace: BRAND.fontFace, color: BRAND.textDark,
            valign: "top", lineSpacing: 20,
          });
          break;
        }

        case "closing": {
          pptSlide.background = { color: BRAND.primaryColor };
          pptSlide.addText(slide.title, {
            x: 0.8, y: 1.5, w: 11.5, h: 1.2,
            fontSize: 30, fontFace: BRAND.fontFace, color: BRAND.textLight,
            bold: true, align: "center",
          });
          if (slide.body) {
            pptSlide.addText(slide.body, {
              x: 1.5, y: 3.0, w: 10, h: 2.0,
              fontSize: 16, fontFace: BRAND.fontFace, color: BRAND.accentColor,
              align: "center", lineSpacing: 24,
            });
          }
          pptSlide.addText(BRAND.tagline, {
            x: 0.8, y: 5.5, w: 11.5, h: 0.5,
            fontSize: 12, fontFace: BRAND.fontFace, color: BRAND.textLight,
            align: "center", italic: true,
          });
          break;
        }

        default: {
          // Fallback: content layout
          pptSlide.addText(slide.title, {
            x: 0.6, y: 0.3, w: 12, h: 0.8,
            fontSize: 22, fontFace: BRAND.fontFace, color: BRAND.primaryColor, bold: true,
          });
          pptSlide.addText(slide.body || "", {
            x: 0.6, y: 1.4, w: 12, h: 5.4,
            fontSize: 14, fontFace: BRAND.fontFace, color: BRAND.textDark,
            valign: "top",
          });
        }
      }
    }

    // 6. Export as base64 and upload
    const pptxBase64 = await pptx.write({ outputType: "base64" });
    const pptxBuffer = Uint8Array.from(atob(pptxBase64 as string), (c) => c.charCodeAt(0));

    const fileName = `${jobId}.pptx`;
    const { error: uploadError } = await supabase.storage
      .from("decks")
      .upload(fileName, pptxBuffer, {
        contentType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      await supabase.from("agent_jobs").update({ status: "failed" }).eq("id", jobId);
      return new Response(JSON.stringify({ error: "Failed to upload deck", jobId }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: publicUrl } = supabase.storage.from("decks").getPublicUrl(fileName);
    const fileUrl = publicUrl.publicUrl;

    // 7. Build markdown summary
    let markdownSummary = `# ${title}\n\n**${slides.length} slides** generated\n\n---\n\n`;
    for (let i = 0; i < slides.length; i++) {
      const s = slides[i];
      markdownSummary += `### Slide ${i + 1}: ${s.title}\n`;
      markdownSummary += `*Layout: ${s.layout}*\n\n`;
      if (s.body) markdownSummary += `${s.body}\n\n`;
      if (s.bullets?.length) markdownSummary += s.bullets.map((b: string) => `- ${b}`).join("\n") + "\n\n";
      if (s.left_column) markdownSummary += `**Left:** ${s.left_column}\n\n**Right:** ${s.right_column}\n\n`;
      markdownSummary += "---\n\n";
    }

    // 8. Update job
    const tokensUsed = aiResult.usage?.total_tokens || Math.ceil(JSON.stringify(slides).length / 4);
    await supabase.from("agent_jobs").update({
      status: "complete",
      output: markdownSummary,
      file_url: fileUrl,
      tokens_used: tokensUsed,
      completed_at: new Date().toISOString(),
    }).eq("id", jobId);

    // 9. Insert usage event
    try {
      await supabase.from("usage_events").insert({
        tenant_id: tenantId,
        event_type: "deck_generation",
        tokens_used: tokensUsed,
        model_used: "google/gemini-2.5-pro",
        skill_id: skillId || null,
        job_id: jobId,
      });
    } catch (ue) {
      console.error("Usage event insert failed:", ue);
    }

    return new Response(JSON.stringify({ jobId, fileUrl, slideCount: slides.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("generate-deck error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
