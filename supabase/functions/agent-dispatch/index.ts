import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AGENT_PERSONAS: Record<string, string> = {
  researcher:
    "You are a research analyst. Produce structured, factual analysis with citations and confidence ratings. Use the provided knowledge base context to ground your findings. Format your output in clean Markdown with headers, bullet points, and bold key terms.",
  strategist:
    "You are a strategic advisor. Produce actionable frameworks, risk assessments, and next-step recommendations. Reference the knowledge base for organizational context. Format your output in clean Markdown.",
  content:
    "You are a professional business writer. Produce polished, on-brand content. Adapt tone and format to the request. Use knowledge base materials for accuracy. Format your output in clean Markdown.",
  "meeting-prep":
    "You are a sales coaching advisor. Produce meeting agendas, discovery questions, objection handling scripts, and talk tracks. Use knowledge base intel on the prospect. Format your output in clean Markdown.",
};

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
    const { skillId, skillName, agentType, department, title, inputs, promptTemplate, systemPrompt } = await req.json();

    // 1. Insert job as queued
    const { data: job, error: insertError } = await supabase
      .from("agent_jobs")
      .insert({
        skill_id: skillId,
        agent_type: agentType,
        department,
        title,
        status: "queued",
        inputs,
      })
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

    // 2. Retrieve knowledge chunks for grounding
    const inputValues = Object.values(inputs).join(" ");
    const searchTerms = inputValues
      .split(/\s+/)
      .filter((t: string) => t.length > 3)
      .slice(0, 10);

    let knowledgeContext = "";
    if (searchTerms.length > 0) {
      const orFilter = searchTerms.map((t: string) => `content.ilike.%${t}%`).join(",");
      const { data: chunks } = await supabase
        .from("knowledge_chunks")
        .select("content")
        .or(orFilter)
        .limit(5);

      if (chunks && chunks.length > 0) {
        knowledgeContext = "\n\n## KNOWLEDGE BASE CONTEXT\nUse the following context to ground your response. If relevant, incorporate it. If not, proceed with your best judgment.\n\n" +
          chunks.map((c: any, i: number) => `[Context ${i + 1}]: ${c.content}`).join("\n\n");
      }
    }

    // 3. Build the prompt
    let filledTemplate = promptTemplate || "";
    for (const [key, value] of Object.entries(inputs)) {
      filledTemplate = filledTemplate.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value as string);
    }

    const systemPromptText = systemPrompt || (AGENT_PERSONAS[agentType] || AGENT_PERSONAS.researcher);
    const finalSystemPrompt = systemPromptText + knowledgeContext;

    // 4. Update status to running
    await supabase.from("agent_jobs").update({ status: "running" }).eq("id", jobId);

    // 5. Call AI gateway with streaming
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: finalSystemPrompt },
          { role: "user", content: filledTemplate },
        ],
        stream: true,
        stream_options: { include_usage: true },
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      await supabase.from("agent_jobs").update({ status: "failed" }).eq("id", jobId);

      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later.", jobId }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits.", jobId }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI gateway error", jobId }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 6. Stream SSE back to client, accumulate output
    const reader = aiResponse.body!.getReader();
    const decoder = new TextDecoder();
    let fullOutput = "";
    let totalTokens = 0;

    const stream = new ReadableStream({
      async start(controller) {
        // Send jobId as first event
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ jobId })}\n\n`));

        let buffer = "";
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });

            let newlineIdx: number;
            while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
              let line = buffer.slice(0, newlineIdx);
              buffer = buffer.slice(newlineIdx + 1);
              if (line.endsWith("\r")) line = line.slice(0, -1);
              if (!line.startsWith("data: ")) continue;
              const jsonStr = line.slice(6).trim();
              if (jsonStr === "[DONE]") continue;

              try {
                const parsed = JSON.parse(jsonStr);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  fullOutput += content;
                  controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ content })}\n\n`));
                }
                if (parsed.usage?.total_tokens) {
                  totalTokens = parsed.usage.total_tokens;
                }
              } catch {
                // partial JSON, skip
              }
            }
          }

          // 7. Update job with final output
          await supabase.from("agent_jobs").update({
            status: "complete",
            output: fullOutput,
            tokens_used: totalTokens || Math.ceil(fullOutput.length / 4),
            completed_at: new Date().toISOString(),
          }).eq("id", jobId);

          controller.enqueue(new TextEncoder().encode(`data: [DONE]\n\n`));
          controller.close();
        } catch (err) {
          console.error("Stream error:", err);
          await supabase.from("agent_jobs").update({ status: "failed" }).eq("id", jobId);
          controller.error(err);
        }
      },
    });

    return new Response(stream, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
    });
  } catch (e) {
    console.error("agent-dispatch error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
