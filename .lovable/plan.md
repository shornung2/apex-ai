

# Skill Pack Infrastructure, Production Seed, and Documentation Update

## Summary

Create the `skill_packs` and `skill_pack_templates` tables, replace the old `seed-skill-packs` edge function with a new `seed-skill-pack` function that reads from the templates table, seed the 3 packs (24 total skills) with full production-quality definitions from the uploaded MD file, add the 13 non-overlapping skills to the Solutionment tenant, write tests, and update Help + Telegram.

## Part A: Database — Two New Tables

Migration to create:

```sql
CREATE TABLE public.skill_packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  target_segment TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.skill_pack_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id UUID NOT NULL REFERENCES public.skill_packs(id) ON DELETE CASCADE,
  skill_template JSONB NOT NULL,
  display_order INT DEFAULT 0
);

ALTER TABLE public.skill_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_pack_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "packs_readable" ON public.skill_packs FOR SELECT TO authenticated USING (true);
CREATE POLICY "templates_readable" ON public.skill_pack_templates FOR SELECT TO authenticated USING (true);
```

## Part B: New Edge Function — `seed-skill-pack`

Replace the existing `supabase/functions/seed-skill-packs/index.ts` with a new `supabase/functions/seed-skill-pack/index.ts` that:

- Accepts `{ packSlugs: string[] }`
- Verifies JWT, looks up caller's `tenant_id` and `role` from `user_profiles`
- Requires `admin` or `super_admin` role
- For each slug: fetches `skill_pack_templates` rows for that pack
- For each template: checks if a skill with the same `name` already exists for this tenant — skips duplicates
- Inserts into `skills` with `tenant_id`, `is_system = false`, all fields from the template JSONB
- Returns `{ seeded, skipped, packs }`

Add to `supabase/config.toml`:
```
[functions.seed-skill-pack]
verify_jwt = true
```

## Part C: Seed the 3 Packs with Production Templates

Use the database insert tool to populate `skill_packs` (3 rows) and `skill_pack_templates` (24 rows) with the full production-quality skill definitions from the uploaded MD file.

### Pack 1: Presales Excellence (8 skills)
1. RFP Analyzer & Scorer — researcher, 9 inputs, ~250-line system prompt
2. Discovery Call Prep Coach — meeting-prep, 5 inputs
3. Competitive Battle Card — researcher, 5 inputs
4. Executive Proposal Draft — content, 7 inputs
5. Solution Qualification Scorecard — strategist, 6 inputs
6. Meeting Follow-Up Email — content, 6 inputs
7. POC & Pilot Plan — strategist, 7 inputs
8. Objection Response Builder — strategist, 5 inputs

### Pack 2: Sales Productivity (8 skills)
1. Company Research Brief — researcher, 5 inputs
2. Personalized Outreach Email — content, 6 inputs
3. Deal Strategy Session — strategist, 6 inputs
4. Champion Coaching Guide — strategist, 6 inputs
5. Pipeline Review Prep — meeting-prep, 5 inputs
6. Sales Negotiation Prep — strategist, 6 inputs
7. Account Expansion Map — strategist, 6 inputs
8. Win/Loss Analysis — researcher, 6 inputs

### Pack 3: Marketing & Content (8 skills)
1. Thought Leadership Article — content, 6 inputs
2. LinkedIn Post Series — content, 6 inputs
3. Market Intelligence Brief — researcher, 5 inputs
4. Campaign Messaging Framework — strategist, 6 inputs
5. SEO Blog Brief — strategist, 5 inputs
6. Customer Case Study Draft — content, 7 inputs
7. Email Nurture Sequence — content, 6 inputs
8. Product Launch Announcement — content, 6 inputs

Each template JSONB contains: `name`, `display_name`, `emoji`, `description`, `department`, `agent_type`, `inputs` (full input definitions with labels, types, placeholders, hints, options), `system_prompt` (full production prompt), `preferred_model`, `token_budget`, `timeout_seconds`, `output_format`, `tags`.

## Part D: Add New Skills to Solutionment

Existing Solutionment skills (17 total) overlap with many pack skills. The following 13 skills are genuinely new and will be inserted directly into the `skills` table for the Solutionment tenant:

**From Presales Excellence (5 new):**
- RFP Analyzer & Scorer (researcher) — no overlap
- Competitive Battle Card (researcher) — no overlap
- Solution Qualification Scorecard (strategist) — no overlap
- POC & Pilot Plan (strategist) — no overlap
- Objection Response Builder (strategist) — no overlap

**From Sales Productivity (4 new):**
- Champion Coaching Guide (strategist) — no overlap
- Pipeline Review Prep (meeting-prep) — no overlap
- Sales Negotiation Prep (strategist) — no overlap
- Win/Loss Analysis (researcher) — no overlap

**From Marketing & Content (4 new):**
- SEO Blog Brief (strategist) — no overlap
- Customer Case Study Draft (content) — no overlap
- Email Nurture Sequence (content) — no overlap
- Product Launch Announcement (content) — no overlap

**Skipped (11 overlapping):** Discovery Call Prep Coach (≈ Meeting Prep Coach), Executive Proposal Draft (≈ Proposal), Meeting Follow-Up Email (≈ Sales Email), Company Research Brief (≈ Company Research), Personalized Outreach Email (≈ Sales Email), Deal Strategy Session (≈ Deal Strategy), Account Expansion Map (≈ Account Strategy), Thought Leadership Article (exists), LinkedIn Post Series (≈ LinkedIn/Social Posts), Market Intelligence Brief (≈ Market & Industry Trends), Campaign Messaging Framework (≈ Marketing Strategy).

## Part E: Tests

Create an edge function test `supabase/functions/seed-skill-pack/index.test.ts` that:
- Tests unauthenticated requests are rejected
- Tests that seeding works with valid pack slugs
- Tests duplicate skip behavior

## Part F: Help Center Update

Add a new section **"Skill Packs"** to `src/pages/Help.tsx` describing:
- What skill packs are (curated sets of production-quality skills)
- The 3 starter packs and their contents
- How packs are seeded during onboarding
- How admins can seed packs later via the API

Update the **Onboarding & Setup** section to mention the new production-quality prompts.

## Part G: Telegram Bot Update

Update `/help` and `/start` in `supabase/functions/telegram-bot/index.ts` to mention:
- Skill Packs with 24 production-quality skills across 3 packs
- Updated skill counts

## Files Affected

| File | Action |
|---|---|
| Database migration | Create: `skill_packs` + `skill_pack_templates` tables |
| Database insert | Seed 3 packs + 24 templates |
| Database insert | Add 13 new skills to Solutionment tenant |
| `supabase/functions/seed-skill-pack/index.ts` | Create: new edge function |
| `supabase/functions/seed-skill-packs/index.ts` | Keep (legacy, could deprecate later) |
| `supabase/config.toml` | Add `seed-skill-pack` entry |
| `supabase/functions/seed-skill-pack/index.test.ts` | Create: edge function test |
| `src/pages/Help.tsx` | Edit: add Skill Packs section |
| `supabase/functions/telegram-bot/index.ts` | Edit: update help/start text |

