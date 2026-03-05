import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are an expert talent and workforce development strategist with deep experience designing Success Profiles for B2B technology and services companies. A user will describe a role and their company context. Your job is to generate a comprehensive, realistic Success Profile.

Include at minimum: 5 hard skills, 4 soft skills, 4 behavioral attributes, 5 knowledge areas. Mark 4-6 items as isRolePlayRubricItem: true — choose the items most relevant to evaluating readiness in a role-play setting. Make phase objectives specific and action-oriented (e.g. 'Can explain the top 3 ICP pain points in their own words' not 'Understand ICP'). Make the capstone scenario realistic, specific, and challenging.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { description } = await req.json();
    if (!description) {
      return new Response(JSON.stringify({ error: "description is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: description },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_success_profile",
              description: "Create a structured Success Profile for a role.",
              parameters: {
                type: "object",
                properties: {
                  roleName: { type: "string" },
                  roleDescription: { type: "string" },
                  department: { type: "string" },
                  items: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        category: { type: "string", enum: ["hard_skill", "soft_skill", "behavioral", "knowledge_area"] },
                        label: { type: "string" },
                        description: { type: "string" },
                        isRolePlayRubricItem: { type: "boolean" },
                      },
                      required: ["id", "category", "label", "description", "isRolePlayRubricItem"],
                      additionalProperties: false,
                    },
                  },
                  phaseConfigs: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        phase: { type: "string", enum: ["immerse", "observe", "demonstrate"] },
                        durationDays: { type: "number" },
                        objectives: { type: "array", items: { type: "string" } },
                      },
                      required: ["phase", "durationDays", "objectives"],
                      additionalProperties: false,
                    },
                  },
                  elevatorPitchTopic: { type: "string" },
                  capstoneScenarioDescription: { type: "string" },
                },
                required: ["roleName", "roleDescription", "department", "items", "phaseConfigs", "elevatorPitchTopic", "capstoneScenarioDescription"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "create_success_profile" } },
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits in Settings." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", status, t);
      throw new Error(`AI gateway error: ${status}`);
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in response");

    const profile = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ profile }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-success-profile error:", e);
    return new Response(JSON.stringify({ error: e.message || "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
