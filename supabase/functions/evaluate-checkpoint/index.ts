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
    const { question, userResponse, roleName, phase, objectives } = await req.json();
    if (!question || !userResponse) {
      return new Response(JSON.stringify({ error: "question and userResponse are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are an expert onboarding coach evaluating a new employee's knowledge checkpoint response. You will be given the question, the learner's role context (from their Success Profile), and their response.

Evaluate the response on a scale of 1-5:
1 = Little to no understanding demonstrated
2 = Basic awareness but significant gaps
3 = Adequate understanding with some gaps
4 = Strong understanding, minor gaps
5 = Excellent — could confidently explain this to a customer or colleague

Provide 2-4 sentences of feedback explaining the score, what was strong, what was missing or could be deeper. Be specific, constructive, and encouraging.`;

    const userMessage = `Role: ${roleName || "New Employee"}
Phase: ${phase || "immerse"}
Phase objectives: ${objectives?.join(", ") || "General onboarding objectives"}

Question: ${question}

Learner's response: ${userResponse}

Evaluate this response.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_evaluation",
              description: "Return the evaluation score and feedback for the learner's checkpoint response.",
              parameters: {
                type: "object",
                properties: {
                  score: {
                    type: "number",
                    description: "Score from 1-5",
                  },
                  feedback: {
                    type: "string",
                    description: "2-4 sentences of constructive feedback",
                  },
                },
                required: ["score", "feedback"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_evaluation" } },
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

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in response");

    const evaluation = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(evaluation), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("evaluate-checkpoint error:", e);
    return new Response(JSON.stringify({ error: e.message || "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
