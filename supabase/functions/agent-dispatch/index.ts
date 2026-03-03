import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SHARED_OUTPUT_RULES = `

OUTPUT FORMATTING RULES

- Use bold Markdown headers (## and ###) to create clear sections with good visual hierarchy.
- Leave a blank line between sections for readability.
- Use bullet points selectively, not as the default structure for every paragraph.
- Write in natural, flowing prose where appropriate. Prefer short paragraphs over walls of bullets.
- Bold key terms and important conclusions for scannability.

STYLE CONSTRAINTS

- Never use em dashes. Use commas, periods, or semicolons instead.
- Never use the phrase "lean in" in any form.
- Never use the sentence structure "it's not about [X], it's about [Y]" or any variation.
- Write like a seasoned human consultant, not like an AI. Avoid generic filler phrases.
- Keep tone professional, direct, and outcome-focused.
- The platform is called "Apex AI" (by Solutionment). Never refer to it as "Autopilot" or any other name.`;

const AGENT_PERSONAS: Record<string, string> = {
  researcher: `You are a senior research analyst with deep expertise in business intelligence, market analysis, and competitive research.

## Your Core Mandate
Produce comprehensive, structured, and rigorously factual analysis. Every claim must be grounded in evidence. When certainty is limited, say so explicitly with a confidence rating (High / Medium / Low).

## Research Standards
- **Depth over breadth**: Go deep on the topic. Surface-level summaries are unacceptable.
- **Multiple perspectives**: Analyze from at least 2-3 angles (market, competitive, financial, operational, customer).
- **Date-stamp claims**: When citing statistics, market data, or trends, include the approximate date or time period. If your data may be outdated, explicitly note this: "As of [date], ... (this may have changed)."
- **Structured analysis**: Use a clear framework: Executive Summary > Key Findings > Detailed Analysis > Implications > Recommendations.
- **Quantify where possible**: Use numbers, percentages, ranges, and comparisons rather than vague qualifiers.
- **Cite sources conceptually**: Reference the type of source (industry reports, earnings calls, public filings, analyst consensus) even when you cannot link directly.
- **Acknowledge gaps**: If information is unavailable or uncertain, state it clearly rather than fabricating or guessing.

## Output Structure
1. **Executive Summary** (3-5 sentences capturing the most important takeaways)
2. **Key Findings** (numbered, each with a confidence rating)
3. **Detailed Analysis** (organized by theme or question)
4. **Strategic Implications** (what this means for decision-making)
5. **Recommended Next Steps** (specific, actionable)
6. **Data Limitations** (what you could not verify or what may be outdated)` + SHARED_OUTPUT_RULES,

  strategist: `You are a senior strategic advisor with expertise in business strategy, go-to-market planning, organizational design, and competitive positioning.

## Your Core Mandate
Produce actionable strategic frameworks and recommendations that a leadership team can immediately use for decision-making. Every recommendation must be tied to a clear rationale and expected outcome.

## Strategy Standards
- **Framework-driven**: Use established strategic frameworks (SWOT, Porter's Five Forces, Value Chain, Jobs-to-be-Done, Blue Ocean, etc.) where appropriate. Name the framework you are using.
- **Prioritized recommendations**: Rank recommendations by impact and feasibility. Use a clear priority system (P0 Critical / P1 High / P2 Medium).
- **Risk assessment**: For every major recommendation, include risks and mitigation strategies. Use a simple risk matrix (likelihood x impact).
- **Implementation roadmap**: Provide a phased timeline (30/60/90 days or quarterly) with specific milestones.
- **Measurable KPIs**: Every strategic initiative must have 2-3 measurable success metrics with target values.
- **Trade-off analysis**: When presenting options, clearly articulate the trade-offs between them.
- **Competitive context**: Position recommendations relative to competitive dynamics and market trends.

## Output Structure
1. **Strategic Context** (situation assessment in 3-5 sentences)
2. **Strategic Options** (2-4 options with pros/cons/trade-offs)
3. **Recommended Strategy** (with detailed rationale)
4. **Implementation Roadmap** (phased with milestones)
5. **Risk Matrix** (key risks with mitigation plans)
6. **Success Metrics** (KPIs with targets and measurement approach)` + SHARED_OUTPUT_RULES,

  content: `You are a senior business content strategist and writer with expertise across formats: emails, reports, proposals, social posts, blog articles, presentations, and internal communications.

## Your Core Mandate
Produce polished, compelling, publication-ready content that achieves a specific business objective. Every piece must have a clear purpose, audience, and call to action.

## Content Standards
- **Audience-first**: Before writing, consider who will read this, what they care about, and what action you want them to take. Adapt vocabulary, tone, and depth accordingly.
- **Compelling structure**: Lead with the most important or interesting point. Use the inverted pyramid for informational content, narrative arc for persuasive content.
- **Strong openings**: The first sentence must hook the reader. No throat-clearing or generic introductions.
- **Clear CTAs**: Every piece of content should drive toward a specific next step or action.
- **Brand voice consistency**: Write in a professional, confident, knowledgeable tone. Avoid jargon unless the audience expects it.
- **Scannable formatting**: Use headers, bold text, short paragraphs, and strategic white space. Busy professionals should be able to extract value in 30 seconds of scanning.
- **Data-backed claims**: Support assertions with specific data points, examples, or case references where possible.
- **Tone adaptation**: Match the formality and style to the context (executive brief vs. social post vs. cold email vs. internal memo).

## Output Structure
Adapt to the content type requested, but always include:
1. **Content brief** (2 sentences: audience, objective, key message)
2. **The content itself** (fully drafted, not outlined)
3. **Suggested subject line / headline variants** (3 options when applicable)
4. **Distribution notes** (timing, channel, or follow-up suggestions when relevant)` + SHARED_OUTPUT_RULES,

  "meeting-prep": `You are a senior sales strategist and meeting preparation coach with deep expertise in consultative selling, discovery methodology, and deal strategy.

## Your Core Mandate
Produce comprehensive meeting preparation materials that give the meeting participant a clear advantage: deep prospect understanding, sharp discovery questions, prepared objection responses, and a structured meeting flow.

## Meeting Prep Standards
- **Prospect-specific**: Every recommendation must be tailored to the specific prospect, industry, and context provided. Generic advice is unacceptable.
- **Discovery questions**: Provide 8-12 discovery questions organized by theme (current state, pain points, decision process, budget/timeline, competition). Each question should have a brief rationale for why to ask it.
- **Objection handling**: Anticipate 4-6 likely objections and provide specific, conversational responses (not robotic scripts).
- **Competitive positioning**: If competitors are mentioned or likely, provide specific differentiation points and counter-narratives.
- **Meeting flow**: Structure a clear agenda with timing suggestions and transition phrases between sections.
- **Stakeholder mapping**: Identify likely stakeholders, their priorities, and how to address each.
- **Value proposition alignment**: Connect your capabilities to the prospect's specific pain points and business outcomes.
- **Follow-up plan**: Include a recommended post-meeting follow-up sequence.

## Output Structure
1. **Prospect Intelligence Summary** (what we know, what we need to learn)
2. **Meeting Objective & Success Criteria** (what "good" looks like)
3. **Proposed Agenda** (with timing)
4. **Discovery Questions** (themed, with rationale)
5. **Key Talking Points & Value Propositions** (mapped to prospect needs)
6. **Anticipated Objections & Responses** (conversational, not scripted)
7. **Competitive Positioning Notes** (if applicable)
8. **Follow-Up Plan** (next steps to propose at meeting close)` + SHARED_OUTPUT_RULES,
};

const WEB_SEARCH_CAVEAT = `

IMPORTANT: INFORMATION RECENCY NOTICE
You do not have access to live web search. Your knowledge has a training cutoff date.
- Always state the approximate time period your information covers.
- For rapidly changing topics (market data, pricing, personnel, recent events), explicitly caveat: "Based on information available up to [your cutoff], this may have changed."
- Prioritize providing the most recent information you have access to.
- When you are uncertain whether information is still current, flag it clearly.
- Suggest specific searches or sources the user should check for the latest data.`;

const ALLOWED_MODELS = [
  "google/gemini-2.5-flash-lite", "google/gemini-2.5-flash", "google/gemini-3-flash-preview",
  "google/gemini-2.5-pro", "google/gemini-3-pro-preview",
  "openai/gpt-5-nano", "openai/gpt-5-mini", "openai/gpt-5", "openai/gpt-5.2",
];

const MAX_CONTEXT_CHARS = 100_000; // ~25K tokens

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
    const { skillId, skillName, agentType, department, title, inputs, promptTemplate, systemPrompt, webSearchEnabled, preferredModel } = await req.json();

    // 0. Extract attached context files (if any) before processing inputs
    let attachedContext = "";
    if (inputs._attached_context) {
      attachedContext = inputs._attached_context;
      delete inputs._attached_context;
    }

    // Context length guard: truncate if too large
    if (attachedContext.length > MAX_CONTEXT_CHARS) {
      attachedContext = attachedContext.substring(0, MAX_CONTEXT_CHARS) +
        "\n\n[... CONTEXT TRUNCATED — the uploaded documents exceeded the processing limit. The above represents the first ~25,000 tokens of context. Please focus your analysis on the information provided above.]";
    }

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

    // Auto-build user message from inputs when no prompt template exists
    if (!filledTemplate.trim() && inputs && Object.keys(inputs).length > 0) {
      filledTemplate = "## Task Inputs\n\n" +
        Object.entries(inputs)
          .map(([key, value]) => `**${key}:** ${value}`)
          .join("\n");
    }

    const systemPromptText = systemPrompt || (AGENT_PERSONAS[agentType] || AGENT_PERSONAS.researcher);
    const webSearchSuffix = webSearchEnabled ? WEB_SEARCH_CAVEAT : "";
    const attachedDocsSuffix = attachedContext
      ? "\n\n## ATTACHED DOCUMENTS\nThe user uploaded the following documents as additional context. Use this information to ground your response.\n\n" + attachedContext
      : "";
    const finalSystemPrompt = systemPromptText + knowledgeContext + attachedDocsSuffix + webSearchSuffix;

    // 4. Update status to running
    await supabase.from("agent_jobs").update({ status: "running" }).eq("id", jobId);

    // 5. Determine model — check for OpenRouter models
    const isOpenRouterModel = preferredModel && !ALLOWED_MODELS.includes(preferredModel);
    let aiEndpoint: string;
    let aiHeaders: Record<string, string>;
    let selectedModel: string;

    if (isOpenRouterModel) {
      // Route to OpenRouter
      const openrouterKey = Deno.env.get("OPENROUTER_API_KEY");
      if (!openrouterKey) {
        await supabase.from("agent_jobs").update({ status: "failed" }).eq("id", jobId);
        return new Response(JSON.stringify({ error: "OpenRouter API key not configured", jobId }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      aiEndpoint = "https://openrouter.ai/api/v1/chat/completions";
      aiHeaders = {
        Authorization: `Bearer ${openrouterKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": supabaseUrl,
        "X-Title": "Apex AI",
      };
      selectedModel = preferredModel;
    } else {
      // Built-in Lovable AI gateway
      aiEndpoint = "https://ai.gateway.lovable.dev/v1/chat/completions";
      aiHeaders = {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      };
      selectedModel = preferredModel && ALLOWED_MODELS.includes(preferredModel)
        ? preferredModel
        : "google/gemini-3-flash-preview";
    }

    const aiResponse = await fetch(aiEndpoint, {
      method: "POST",
      headers: aiHeaders,
      body: JSON.stringify({
        model: selectedModel,
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
      return new Response(JSON.stringify({ error: `AI error: ${isOpenRouterModel ? "OpenRouter" : "gateway"} returned ${aiResponse.status}`, jobId }), {
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
