import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify JWT and get user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Look up caller's tenant_id and role
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: profile, error: profileError } = await adminClient
      .from("user_profiles")
      .select("tenant_id, role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: "Profile not found" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!["admin", "super_admin"].includes(profile.role)) {
      return new Response(JSON.stringify({ error: "Admin or super_admin role required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { packSlugs } = await req.json();
    if (!packSlugs || !Array.isArray(packSlugs) || packSlugs.length === 0) {
      return new Response(JSON.stringify({ error: "packSlugs array required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tenantId = profile.tenant_id;
    let seeded = 0;
    let skipped = 0;
    const processedPacks: string[] = [];

    // Get existing skill names for this tenant to check duplicates
    const { data: existingSkills } = await adminClient
      .from("skills")
      .select("name")
      .eq("tenant_id", tenantId);

    const existingNames = new Set((existingSkills || []).map((s: { name: string }) => s.name));

    for (const slug of packSlugs) {
      // Find the pack
      const { data: pack } = await adminClient
        .from("skill_packs")
        .select("id, slug")
        .eq("slug", slug)
        .eq("is_active", true)
        .single();

      if (!pack) {
        console.log(`Pack not found or inactive: ${slug}`);
        continue;
      }

      // Fetch templates for this pack
      const { data: templates, error: templatesError } = await adminClient
        .from("skill_pack_templates")
        .select("skill_template, display_order")
        .eq("pack_id", pack.id)
        .order("display_order");

      if (templatesError || !templates || templates.length === 0) {
        console.log(`No templates found for pack: ${slug}`);
        continue;
      }

      const skillsToInsert = [];

      for (const tmpl of templates) {
        const template = tmpl.skill_template as Record<string, unknown>;
        const skillName = template.name as string;

        if (existingNames.has(skillName)) {
          skipped++;
          continue;
        }

        skillsToInsert.push({
          tenant_id: tenantId,
          name: template.name,
          display_name: template.display_name,
          emoji: template.emoji || "⚡",
          description: template.description,
          department: template.department,
          agent_type: template.agent_type,
          inputs: template.inputs || [],
          system_prompt: template.system_prompt || "",
          prompt_template: template.prompt_template || `# ${template.display_name}\n\n{{input}}\n\nProvide a thorough, well-structured response.`,
          preferred_model: template.preferred_model || "haiku",
          preferred_lane: template.preferred_lane || "simple_haiku",
          token_budget: template.token_budget || 10000,
          timeout_seconds: template.timeout_seconds || 120,
          output_format: template.output_format || "markdown",
          tags: template.tags || [],
          is_system: false,
        });

        existingNames.add(skillName);
      }

      if (skillsToInsert.length > 0) {
        const { error: insertError } = await adminClient
          .from("skills")
          .insert(skillsToInsert);

        if (insertError) {
          console.error(`Error inserting skills for pack ${slug}:`, insertError);
          return new Response(JSON.stringify({ error: insertError.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        seeded += skillsToInsert.length;
      }

      processedPacks.push(slug);
    }

    return new Response(
      JSON.stringify({ seeded, skipped, packs: processedPacks }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("seed-skill-pack error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
