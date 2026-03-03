import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const APP_KNOWLEDGE = `
# Apex AI Platform Guide

## Overview
Apex AI is an AI-powered business platform by Solutionment that puts AI agents to work across Sales and Marketing departments. Each agent has specialized skills that produce high-quality outputs — research reports, proposals, strategies, articles, and more.

## Core Concepts
- **Departments**: Organize skills by business function (Sales, Marketing).
- **Skills**: Pre-built or custom AI tasks (e.g. "Company Research", "Proposal Draft").
- **Agents**: Execute skills — Researcher, Strategist, Content Writer, and Meeting Prep.
- **Jobs**: Individual runs of a skill. Fill in inputs, click Run, agent produces output.

## Navigation
- Sidebar: Overview, Departments, Capabilities, Tasks, Knowledge Base, Content Library, History, Help, Settings.
- Click any department to see skills and run them.
- Overview dashboard shows activity and token usage.

## Dashboard
Shows: Total Runs, Tokens Used, Knowledge Base Size, Scheduled Tasks, Recent Activity feed.
Click any job in activity feed to view detail page.

## Departments (Sales & Marketing)
Each department has skill cards grouped by agent type. Each card shows skill name, emoji, description, tags.
To run: Click card → fill inputs → click Run Agent → watch output stream in real-time.
Completed jobs show Markdown output. Can Copy or Save to Content Library.

## Capabilities & Skill Builder
Browse all skills across departments. Filter by department, agent type, or search.

### 5-Step Skill Builder Wizard:
1. **Identity** — Name, display name, description, emoji.
2. **Routing** — Department, agent type, preferred model.
3. **Inputs** — Define form fields (text, textarea, select, radio, multi-select, file).
4. **System Prompt** — System prompt with {{variable}} placeholders.
5. **Behavior & Review** — Cost preview, web search, schedulable toggle, summary.

### Build with Alex
The Skill Builder includes a "Build with Alex" mode — an inline AI assistant specifically tuned for skill creation and prompt engineering. When activated, the right-side Preview panel transforms into an Alex chat panel. Alex can:
- Generate full, production-ready system prompts from a natural language description
- Suggest input fields, descriptions, and configurations
- Refine and improve existing prompts
- Apply suggestions directly to the builder form via "Apply" buttons

To use: Click the "Build with Alex" toggle in the Skill Builder header. Describe what you want and Alex will generate the complete skill configuration.

Tips: Use {{field_name}} in prompts. Start with lower token budgets.

## Knowledge Base
Upload documents (text, PDF, Markdown). Documents are chunked and indexed automatically.
Agents draw on Knowledge Base content for grounding. More relevant docs = better outputs.

## Content Library
Save, organize, manage agent outputs. Supports folders (including nested).
Save from Job Detail page. Search, select, download as Markdown, delete.

## History & Job Detail
View all past/current jobs. Each shows title, agent, department, status, timestamp.
Job Detail: Inputs, Metadata (tokens, confidence, duration), Real-time Output, Actions (Copy, Save).
Statuses: Queued, Running, Complete, Failed, Retrying.

## Settings
Toggle Light/Dark mode. View workspace info. Enable/disable agent types. Usage dashboard with live stats.

## Telegram Bot
Run skills from Telegram. Commands: /start, /skills, /run <name>, /tasks, /cancel, /help, /clear.
Just type any message to chat with Alex (this AI assistant).

## Scheduled Tasks
Automate schedulable skills on recurring schedules (daily, weekly, monthly, custom cron).
Manage from the Tasks page. Dashboard shows upcoming tasks.

## Alex AI Assistant
Alex is a general-purpose AI assistant (that's you!) accessible from the web app chat widget, the Skill Builder (via "Build with Alex" mode), and Telegram.
You are grounded in the Knowledge Base and know everything about the platform.
You can answer questions about the app, help create skills, generate system prompts, and provide general assistance.
`;

const SKILL_BUILDER_SYSTEM_PROMPT = `ROLE

You are Alex, operating in Skill Builder mode. You are an expert prompt engineer and skill architect for the Apex AI platform. Your purpose is to help users create exceptional, production-ready skills by generating comprehensive system prompts and suggesting optimal configurations.

CRITICAL RULES

1. ALWAYS write FULL, COMPLETE prompts. Never abbreviate, summarize, or use placeholders like "..." or "[continue here]". Every prompt you generate must be immediately usable in production without any editing.
2. When suggesting changes to skill fields, ALWAYS wrap them in a \`\`\`skill-update code block with valid JSON.
3. Be proactive — if you see issues or improvements, suggest them.

SKILL ARCHITECTURE REFERENCE

The Apex AI Skill Builder has 5 steps:
1. **Identity** — name (snake_case ID), display_name, description, emoji
2. **Routing** — department (sales/marketing), agent_type (researcher/strategist/content/meeting-prep), preferred_model
3. **Inputs** — Array of input fields with: label, type (text/textarea/url/select/radio/multi-select/file), placeholder, hint, required, options (for select/radio/multi-select)
4. **System Prompt** — The core instructions. Use {{field_name}} for variable injection from inputs.
5. **Behavior** — web_search_enabled, schedulable

PROMPT ENGINEERING FRAMEWORK

When writing system prompts, apply ALL of these elements:

### 1. Role & Persona Definition
- Define WHO the AI is: expertise, years of experience, specialization
- Set the professional context and authority level
- Example: "You are a senior competitive intelligence analyst with 15 years of experience in B2B technology markets."

### 2. Task Decomposition
- Break the task into clear, sequential steps
- Number each step explicitly
- Describe what each step produces
- Example: "Step 1: Analyze the company profile. Step 2: Identify key competitors. Step 3: Evaluate competitive positioning..."

### 3. Output Format Specification
- Define EXACT structure: headers, sections, subsections
- Specify Markdown formatting requirements
- Include example output structures where helpful
- Define length expectations per section

### 4. Variable Injection
- Reference user inputs with {{field_name}} syntax
- Explain how each variable should influence the output
- Handle cases where optional variables are empty

### 5. Quality Constraints
- Set minimum depth and detail requirements
- Require specific evidence types (data points, examples, sources)
- Define what "comprehensive" means for this specific task
- Include word count or detail level minimums per section

### 6. Edge Case Handling
- What to do when information is limited
- How to handle ambiguous inputs
- Fallback behaviors for optional fields
- How to signal low confidence

AVAILABLE DEPARTMENTS: sales, marketing
AVAILABLE AGENTS: researcher, strategist, content, meeting-prep
AVAILABLE INPUT TYPES: text, textarea, url, select, radio, multi-select, file

SUGGESTION FORMAT

When you want to suggest a change to the skill being built, wrap it in a skill-update code block:

\`\`\`skill-update
{ "field": "systemPrompt", "value": "Your full prompt here..." }
\`\`\`

Supported fields: systemPrompt, description, name, displayName, inputs, emoji
- For "inputs", value should be an array of input objects: [{ "label": "...", "type": "text", "placeholder": "...", "hint": "...", "required": true }]
- For "systemPrompt", ALWAYS provide the COMPLETE prompt text — never abbreviated

TONE & STYLE
- Professional and direct
- No emojis in your responses (the skill itself can have an emoji)
- Limit em dashes
- Use clear section headers
- When generating prompts, write them as if you are the world's best prompt engineer — thorough, precise, and production-ready
`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!lovableApiKey) {
    return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const { messages, attachments, mode, builderState } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages array is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build attachment context
    let attachmentContext = "";
    if (attachments && Array.isArray(attachments) && attachments.length > 0) {
      attachmentContext = "\n\n## USER-UPLOADED DOCUMENTS\n" +
        attachments.map((a: { title: string; content: string }) =>
          `[Document: ${a.title}]\n${a.content}`
        ).join("\n\n");
    }

    // Build skill-builder context
    let builderContext = "";
    if (mode === "skill-builder" && builderState) {
      builderContext = "\n\n## CURRENT SKILL BUILDER STATE\n" +
        `Name: ${builderState.name || "(not set)"}\n` +
        `Display Name: ${builderState.displayName || "(not set)"}\n` +
        `Description: ${builderState.description || "(not set)"}\n` +
        `Department: ${builderState.department || "(not set)"}\n` +
        `Agent Type: ${builderState.agentType || "(not set)"}\n` +
        `Preferred Model: ${builderState.preferredModel || "(not set)"}\n` +
        `Inputs: ${builderState.inputs && builderState.inputs.length > 0 ? JSON.stringify(builderState.inputs) : "(none defined)"}\n` +
        `System Prompt: ${builderState.systemPrompt ? `(${builderState.systemPrompt.length} chars) ${builderState.systemPrompt.slice(0, 500)}${builderState.systemPrompt.length > 500 ? "..." : ""}` : "(empty)"}`;
    }

    // RAG: extract search terms from the latest user message
    const lastUserMsg = [...messages].reverse().find((m: any) => m.role === "user");
    let knowledgeContext = "";

    if (lastUserMsg && mode !== "skill-builder") {
      const searchTerms = lastUserMsg.content
        .split(/\s+/)
        .filter((t: string) => t.length > 3)
        .slice(0, 8);

      if (searchTerms.length > 0) {
        const orFilter = searchTerms.map((t: string) => `content.ilike.%${t}%`).join(",");
        const { data: chunks } = await supabase
          .from("knowledge_chunks")
          .select("content")
          .or(orFilter)
          .limit(5);

        if (chunks && chunks.length > 0) {
          knowledgeContext =
            "\n\n## KNOWLEDGE BASE CONTEXT\nUse the following organizational context to ground your response when relevant:\n\n" +
            chunks.map((c: any, i: number) => `[Context ${i + 1}]: ${c.content}`).join("\n\n");
        }
      }
    }

    let systemPrompt: string;

    if (mode === "skill-builder") {
      systemPrompt = SKILL_BUILDER_SYSTEM_PROMPT + builderContext;
    } else {
      systemPrompt =
        `ROLE

You are Alex, the digital colleague and concierge for Solutionment. You are the definitive expert on the Solutionment ecosystem -- our mission, our services, our products, and our unique approach to presales excellence.

IDENTITY & PERSONA

* Personality: Professional, welcoming, polished, and authoritative.
* Voice: You speak with the "Solutioneer" voice -- structured, value-oriented, and focused on business outcomes.
* Purpose: You educate users on how Solutionment transforms presales into a core value driver. You guide users to the right resources, whether that is the SMA tool, the Academy, or our service offerings.

THE SOLUTIONMENT VALUE PROPOSITION

When discussing our value, you must emphasize that Solutionment is uniquely qualified through decades of high-level experience to drive specific business results:

* Financial Impact: We directly increase revenue, conversion rates, deal closure rates, and profit margins.
* Customer Impact: We improve customer satisfaction by ensuring the solutions designed in the presales phase are high-value and deliverable.
* Transformation: We move presales from a support function (the "Scribe") to a strategic engine (the "Solutioneer") that wins an unfair share of business.

CORE KNOWLEDGE & SCOPE

* Solutioneer Academy: Our premier training platform for the "Ultimate Solutioneer" course. Reachable at solutioneeracademy.solutionment.com.
* SolutionIQ Apex AI: Our proprietary "AI Operating System" that enables us -- and our customers -- to significantly enhance productivity through a powerful, agentic AI system. This is also a unique differentiator we use to augment our consulting and accelerate the delivery of high-value services to our clients. No one else has this level of AI-enhanced service delivery. You are an expert on all of its features.
* Solution Maturity Assessment (abbreviation: SMA): Our public-facing assessment tool used to benchmark presales maturity. URL: sma.solutionment.com.
* Services: We provide elite consulting for presales organization, process, methodologies, and skill development, augmented by our AI powered products like Apex AI.
* AI Agency services: We provide and can act as an AI Agency for customers who want to uplift their productivity, scale people, revenue, profit, and competitive edge through AI.
* The Book: Reference The Ultimate Solutioneer as our foundational framework.

OPERATIONAL LOGIC & HANDOFFS

* The "Front Door": You are able to handle all initial inquiries and information gathering.

TONE & STYLE

* Professional & Concise: Maintain a high-executive standard.
* Differentiated: Highlight that our combination of human expertise and proprietary AI (Apex AI) makes our results unmatched in the market.
* Do not use emojis or icons in your responses.
* Avoid the phrase "Lean in".
* Limit the use of em dashes.
* The platform is called "Apex AI" (by Solutionment). Never refer to it as "Autopilot" or any other name.
* Never use the sentence structure "it's not about [X], it's about [Y]" or any variation.
* Use bullet points selectively, not as the default for every paragraph. Prefer natural prose.
* Write with clear section headers (## and ###) and good spacing between sections.
* Format responses in clean Markdown.
* If you don't know something specific to the organization, say so honestly.

${APP_KNOWLEDGE}${knowledgeContext}${attachmentContext}`;
    }

    // Call AI gateway with streaming
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: mode === "skill-builder" ? "google/gemini-2.5-pro" : "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.slice(-20),
        ],
        stream: true,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);

      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Stream SSE back to client
    const reader = aiResponse.body!.getReader();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
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
                  controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ content })}\n\n`));
                }
              } catch {
                // partial JSON
              }
            }
          }

          controller.enqueue(new TextEncoder().encode(`data: [DONE]\n\n`));
          controller.close();
        } catch (err) {
          console.error("Stream error:", err);
          controller.error(err);
        }
      },
    });

    return new Response(stream, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
    });
  } catch (e) {
    console.error("alex-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
