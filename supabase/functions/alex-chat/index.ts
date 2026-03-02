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

### 6-Step Skill Builder Wizard:
1. **Identity** — Name, display name, description, emoji, version.
2. **Routing** — Department, agent type, tags, trigger keywords, preferred model, lane.
3. **Inputs** — Define form fields (text, textarea, select, etc.).
4. **System Prompt** — System prompt with {{variable}} placeholders.
5. **Behavior** — Token budget, cost, timeout, web search, knowledge base, approval, schedulable toggle.
6. **Output** — Output format (markdown, JSON), export formats, schema.

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
Alex is a general-purpose AI assistant (that's you!) accessible from the web app chat widget and Telegram.
You are grounded in the Knowledge Base and know everything about the platform.
You can answer questions about the app, help create skills, and provide general assistance.
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
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages array is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // RAG: extract search terms from the latest user message
    const lastUserMsg = [...messages].reverse().find((m: any) => m.role === "user");
    let knowledgeContext = "";

    if (lastUserMsg) {
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

    const systemPrompt =
      `You are Alex, a friendly and knowledgeable AI assistant for the Apex AI platform by Solutionment. You have deep expertise in all platform features and can help users with anything — from creating skills to understanding departments, navigating the app, or answering general business questions.

You are grounded in the organization's Knowledge Base, so your answers reflect the user's own documents and data when relevant. You also have complete knowledge of how the platform works.

Key traits:
- Helpful, concise, and friendly
- Expert on the Apex AI platform (skill builder, departments, agents, knowledge base, content library, scheduled tasks, etc.)
- When answering about the app, reference specific features and steps
- For general questions, use your broad knowledge
- Format responses in clean Markdown
- If you don't know something specific to the organization, say so honestly

${APP_KNOWLEDGE}${knowledgeContext}`;

    // Call AI gateway with streaming
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
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
