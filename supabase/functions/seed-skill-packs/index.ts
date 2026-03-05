import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const presalesSkills = [
  { name: "rfp-response-drafter", display_name: "RFP Response Drafter", emoji: "📝", description: "Draft comprehensive RFP responses based on your knowledge base and requirements.", department: "sales", agent_type: "writer" },
  { name: "discovery-prep", display_name: "Discovery Prep", emoji: "🔍", description: "Prepare discovery call agendas, key questions, and research briefs for prospects.", department: "sales", agent_type: "researcher" },
  { name: "competitive-brief", display_name: "Competitive Brief", emoji: "⚔️", description: "Generate competitive analysis briefs comparing your solution against competitors.", department: "sales", agent_type: "researcher" },
  { name: "solution-qualifier", display_name: "Solution Qualifier", emoji: "✅", description: "Qualify opportunities by mapping prospect needs to your solution capabilities.", department: "sales", agent_type: "researcher" },
  { name: "executive-proposal", display_name: "Executive Proposal", emoji: "📊", description: "Create executive-level proposals with business case and ROI analysis.", department: "sales", agent_type: "writer" },
  { name: "poc-planner", display_name: "POC Planner", emoji: "🧪", description: "Plan proof-of-concept engagements with success criteria and timelines.", department: "sales", agent_type: "writer" },
  { name: "technical-qa", display_name: "Technical Q&A", emoji: "💡", description: "Answer technical questions from prospects using your knowledge base.", department: "sales", agent_type: "researcher" },
  { name: "win-theme-builder", display_name: "Win Theme Builder", emoji: "🏆", description: "Develop compelling win themes tailored to each opportunity.", department: "sales", agent_type: "writer" },
  { name: "demo-script", display_name: "Demo Script", emoji: "🎬", description: "Create customized demo scripts based on prospect industry and pain points.", department: "sales", agent_type: "writer" },
  { name: "pricing-strategy", display_name: "Pricing Strategy", emoji: "💰", description: "Develop pricing strategies and packaging recommendations for deals.", department: "sales", agent_type: "researcher" },
  { name: "reference-story", display_name: "Reference Story", emoji: "📖", description: "Build reference stories and case study narratives for prospect conversations.", department: "sales", agent_type: "writer" },
  { name: "objection-handler", display_name: "Objection Handler", emoji: "🛡️", description: "Generate responses to common objections with evidence-based rebuttals.", department: "sales", agent_type: "writer" },
];

const salesSkills = [
  { name: "account-research", display_name: "Account Research", emoji: "🏢", description: "Deep-dive research on target accounts including financials, news, and org structure.", department: "sales", agent_type: "researcher" },
  { name: "personalized-outreach", display_name: "Personalized Outreach", emoji: "✉️", description: "Craft personalized outreach emails and messages for prospects.", department: "sales", agent_type: "writer" },
  { name: "deal-strategy", display_name: "Deal Strategy", emoji: "♟️", description: "Develop deal strategies with stakeholder mapping and action plans.", department: "sales", agent_type: "researcher" },
  { name: "champion-coach", display_name: "Champion Coach", emoji: "🤝", description: "Create coaching plans to enable your internal champion at the prospect.", department: "sales", agent_type: "writer" },
  { name: "meeting-prep-coach", display_name: "Meeting Prep Coach", emoji: "🎯", description: "Pre-meeting coaching, discovery agendas, talk tracks, and objection handling guides.", department: "sales", agent_type: "coach" },
  { name: "win-loss-analysis", display_name: "Win/Loss Analysis", emoji: "📋", description: "Analyze won and lost deals to identify patterns and improvement areas.", department: "sales", agent_type: "researcher" },
  { name: "territory-plan", display_name: "Territory Plan", emoji: "🗺️", description: "Build territory plans with account prioritization and coverage strategies.", department: "sales", agent_type: "writer" },
  { name: "proposal-builder", display_name: "Proposal Builder", emoji: "📄", description: "Generate structured proposals with custom sections and pricing.", department: "sales", agent_type: "writer" },
  { name: "follow-up-email", display_name: "Follow-Up Email", emoji: "📬", description: "Draft follow-up emails after meetings with key takeaways and next steps.", department: "sales", agent_type: "writer" },
  { name: "call-debrief", display_name: "Call Debrief", emoji: "📞", description: "Summarize call notes into structured debriefs with action items.", department: "sales", agent_type: "writer" },
];

const marketingSkills = [
  { name: "thought-leadership", display_name: "Thought Leadership", emoji: "💭", description: "Create thought leadership articles and whitepapers on industry topics.", department: "marketing", agent_type: "writer" },
  { name: "linkedin-post", display_name: "LinkedIn Post", emoji: "💼", description: "Generate engaging LinkedIn posts for executives and company pages.", department: "marketing", agent_type: "writer" },
  { name: "market-intelligence", display_name: "Market Intelligence", emoji: "📡", description: "Research market trends, competitor moves, and industry developments.", department: "marketing", agent_type: "researcher" },
  { name: "campaign-messaging", display_name: "Campaign Messaging", emoji: "📢", description: "Develop campaign messaging frameworks with value props and positioning.", department: "marketing", agent_type: "writer" },
  { name: "seo-brief", display_name: "SEO Brief", emoji: "🔎", description: "Create SEO content briefs with keyword strategy and outline.", department: "marketing", agent_type: "researcher" },
  { name: "email-nurture", display_name: "Email Nurture", emoji: "📧", description: "Write email nurture sequences for different buyer personas and stages.", department: "marketing", agent_type: "writer" },
  { name: "case-study", display_name: "Case Study", emoji: "📚", description: "Draft customer case studies with challenge, solution, and results framework.", department: "marketing", agent_type: "writer" },
  { name: "social-calendar", display_name: "Social Calendar", emoji: "📅", description: "Plan social media content calendars with themes and post ideas.", department: "marketing", agent_type: "writer" },
];

const talentSkills = [
  { name: "career-coaching", display_name: "Career Coach", emoji: "📈", description: "Personalized career development coaching — skill gap analysis, learning paths, coaching conversation guides, and milestone checkpoints for employee growth.", department: "talent", agent_type: "coach" },
];

const packMap: Record<string, typeof presalesSkills> = {
  presales: presalesSkills,
  sales: salesSkills,
  marketing: marketingSkills,
  talent: talentSkills,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify caller
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const { tenant_id, packs } = await req.json();
    if (!tenant_id || !packs || !Array.isArray(packs)) {
      return new Response(JSON.stringify({ error: "Missing tenant_id or packs" }), { status: 400, headers: corsHeaders });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const skillsToInsert = packs.flatMap((pack: string) => {
      const skills = packMap[pack];
      if (!skills) return [];
      return skills.map((s) => ({
        tenant_id,
        name: s.name,
        display_name: s.display_name,
        emoji: s.emoji,
        description: s.description,
        department: s.department,
        agent_type: s.agent_type,
        is_system: true,
        preferred_model: "haiku",
        preferred_lane: "simple_haiku",
        token_budget: 8000,
        timeout_seconds: 120,
        system_prompt: `You are an expert ${s.agent_type} assistant. ${s.description}`,
        prompt_template: `# ${s.display_name}\n\n{{input}}\n\nProvide a thorough, well-structured response.`,
        inputs: JSON.stringify([{ name: "input", label: "Your request", type: "textarea", required: true }]),
        tags: [pack],
        output_format: "markdown",
      }));
    });

    if (skillsToInsert.length === 0) {
      return new Response(JSON.stringify({ seeded: 0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { error } = await adminClient.from("skills").insert(skillsToInsert);
    if (error) {
      console.error("Seed error:", error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ seeded: skillsToInsert.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
