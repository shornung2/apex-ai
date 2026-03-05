import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { mode } = body;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (mode === "chat") {
      const { messages, systemPrompt } = body;
      if (!messages || !systemPrompt) {
        return new Response(JSON.stringify({ error: "messages and systemPrompt are required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [{ role: "system", content: systemPrompt }, ...messages],
          stream: true,
        }),
      });

      if (!response.ok) {
        const status = response.status;
        if (status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (status === 402) {
          return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits in Settings." }), {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const t = await response.text();
        console.error("AI gateway error:", status, t);
        throw new Error(`AI gateway error: ${status}`);
      }

      return new Response(response.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    if (mode === "score") {
      const { conversationHistory, roleName, sessionType, rubricItems } = body;
      if (!conversationHistory || !rubricItems) {
        return new Response(JSON.stringify({ error: "conversationHistory and rubricItems are required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const sessionLabel = sessionType === "elevator_pitch" ? "Elevator Pitch" : "Capstone Scenario Preparation";
      const rubricList = rubricItems
        .map((r: { id: string; label: string; description: string }) => `- ${r.label}: ${r.description}`)
        .join("\n");

      const transcript = conversationHistory
        .map((m: { role: string; content: string }) =>
          `${m.role === "assistant" ? "Coach" : "Learner"}: ${m.content}`
        )
        .join("\n\n");

      const scoringSystemPrompt = `You are an expert onboarding evaluator. You have just observed a role-play simulation between a Coach and a new employee. Your job is to score their performance.

ROLE: ${roleName || "New Employee"}
SESSION TYPE: ${sessionLabel}

SCORING RUBRIC — score each item 1-5:
${rubricList}

1 = Not demonstrated
2 = Weak — significant gaps
3 = Adequate — met the bar with some gaps
4 = Strong — clearly ready
5 = Exceptional — above expectations`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: scoringSystemPrompt },
            { role: "user", content: `Here is the complete conversation transcript:\n\n${transcript}\n\nScore this session.` },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "return_session_score",
                description: "Return the structured scoring result for the role-play session.",
                parameters: {
                  type: "object",
                  properties: {
                    overallScore: {
                      type: "number",
                      description: "Overall score 1-5, weighted average of rubric scores",
                    },
                    rubricScores: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          rubricItemId: { type: "string" },
                          label: { type: "string" },
                          score: { type: "number", description: "1-5" },
                          feedback: { type: "string", description: "1-2 sentences" },
                        },
                        required: ["rubricItemId", "label", "score", "feedback"],
                        additionalProperties: false,
                      },
                    },
                    summaryFeedback: {
                      type: "string",
                      description: "3-5 sentences: strengths, areas for improvement, one actionable suggestion",
                    },
                  },
                  required: ["overallScore", "rubricScores", "summaryFeedback"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "return_session_score" } },
        }),
      });

      if (!response.ok) {
        const status = response.status;
        if (status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (status === 402) {
          return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const t = await response.text();
        console.error("AI gateway scoring error:", status, t);
        throw new Error(`AI gateway error: ${status}`);
      }

      const result = await response.json();
      const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
      if (!toolCall) throw new Error("No tool call in scoring response");

      const scoring = JSON.parse(toolCall.function.arguments);

      return new Response(JSON.stringify(scoring), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid mode. Use 'chat' or 'score'." }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("roleplay-chat error:", e);
    return new Response(JSON.stringify({ error: e.message || "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
