
# Populate Skills Library, Click-to-Edit, Six-Step Builder, and Performance Fixes

## Overview

Four workstreams in one implementation:
1. Populate all 15 skills with full six-step data from the uploaded JSON files
2. Click-to-edit skill cards in the Capabilities library
3. Rebuild the Skill Builder as a six-step wizard
4. Fix SSE streaming performance and token accuracy

---

## 1. Database Schema Update + Skill Population

The uploaded skill JSONs have fields not in the current `skills` table schema. We need to add columns to support the full six-step structure, then seed all 15 skills.

**Migration -- add columns to `skills` table:**

| New Column | Type | Default |
|---|---|---|
| display_name | text | null |
| version | text | '1.0.0' |
| system_prompt | text | '' |
| tags | text[] | '{}' |
| trigger_keywords | text[] | '{}' |
| preferred_model | text | 'haiku' |
| preferred_lane | text | 'simple_haiku' |
| token_budget | integer | 10000 |
| estimated_cost_usd | decimal(10,4) | null |
| required_capabilities | text[] | '{}' |
| web_search_enabled | boolean | false |
| approval_required | boolean | false |
| timeout_seconds | integer | 120 |
| output_format | text | 'markdown' |
| output_schema | jsonb | '{}' |
| export_formats | text[] | '{}' |
| updated_at | timestamptz | now() |

The existing `prompt_template` column currently holds a fill-in template like "Research {{company_name}}...". The new `system_prompt` column holds the full agent instructions from step_4. The `prompt_template` will continue to be auto-generated from inputs when not explicitly set.

**Seed all 15 skills** using the SQL seed data, inserting the system prompts from each JSON file. Each skill gets `is_system = true`. The seed uses the full six-step data: identity, routing, inputs (as JSONB), system_prompt, behavior config, and output config.

**Update `SkillInput` type** in `mock-data.ts` to add optional `hint`, `default`, and `url` type support (matching the JSON structure with `field` mapping to `name`).

**Update `Skill` type** to include all new optional fields: `systemPrompt`, `tags`, `triggerKeywords`, `tokenBudget`, `estimatedCost`, `webSearchEnabled`, `approvalRequired`, `outputSchema`, `exportFormats`, `requiredCapabilities`, `timeoutSeconds`, `preferredModel`, `preferredLane`.

**Remove hardcoded skills array** from `mock-data.ts` -- skills will be fetched from the database exclusively.

---

## 2. Click-to-Edit Skill Cards

**In `Capabilities.tsx`:**
- Change `Tabs` from `defaultValue` to controlled `value` + `onValueChange`
- Add `editingSkillId` state
- When a skill card is clicked in the Library: populate all builder state from that skill, switch to the "builder" tab
- Show "Update Skill" instead of "Save Skill" when editing
- For database skills, update the existing record via `supabase.from("skills").update(...)`
- Add a "Cancel / New Skill" button to reset the form

---

## 3. Six-Step Skill Builder Wizard

Replace the current flat form with a stepped wizard matching the uploaded JSON structure:

| Step | Name | Fields |
|---|---|---|
| 1 | Identity | Name, emoji, display name, version, description |
| 2 | Routing | Department, Agent type, tags, trigger keywords, preferred model, preferred lane |
| 3 | Inputs | Dynamic field builder with name, type, required, placeholder, hint, default, options |
| 4 | System Prompt | Large markdown textarea for the skill's core AI instructions |
| 5 | Behavior | Token budget, estimated cost, timeout, capabilities toggles (web search, knowledge search, memory), approval required |
| 6 | Output | Output format, title template, sections list, export formats, shareable toggle |

**Implementation details:**
- Add `builderStep` state (1-6)
- Step indicator bar at top with numbered circles and connecting lines
- Next/Back buttons at bottom
- Per-step validation: Step 1 requires name; Step 2 requires department + agent; Step 3 requires at least 1 input; Step 4 requires system prompt
- Step 6 shows summary and Save/Update button
- Preview panel on the right continues to update live
- New state fields for all six-step data

---

## 4. Performance Fix -- SSE Streaming

**Root cause:** When user clicks "Run" on Department page, `runSkill()` starts an SSE fetch with no abort mechanism. After navigation to `/jobs/:id`, the stream keeps running in the background, causing browser hang.

**Fix in `src/lib/agent-client.ts`:**
- Return an `AbortController` from `runSkill()` so callers can cancel
- Add `signal` to the fetch call

**Fix in `src/pages/Department.tsx`:**
- Create `AbortController` before calling `runSkill()`
- In `onJobId` callback, call `controller.abort()` after navigating away

**Token accuracy fix in `supabase/functions/agent-dispatch/index.ts`:**
- Add `stream_options: { include_usage: true }` to the AI gateway request body for accurate token counts

**Update edge function to use skill's `system_prompt`:**
- Instead of generic agent persona strings, use the skill's dedicated `system_prompt` from the database when available
- Fall back to agent persona if no skill-specific system prompt exists

---

## 5. Update Department Page to Fetch from Database

Since skills will now live in the database instead of hardcoded mock data:
- `Department.tsx` fetches skills from the `skills` table filtered by department
- Falls back gracefully if no skills exist yet

---

## 6. Update Agent Dispatch Edge Function

- Accept optional `systemPrompt` field from the frontend (the skill's step_4 system prompt)
- When present, use it as the primary system prompt instead of the generic agent persona
- Still inject knowledge base context as before
- Still fall back to agent persona if no skill system prompt provided

---

## Files Changed

**Database:**
- Migration: ALTER TABLE skills ADD COLUMN for all new six-step fields
- Seed: INSERT 15 skills with full data from uploaded JSONs

**Create/Modify:**
- `src/data/mock-data.ts` -- Extended types, remove hardcoded skills array, keep agent/department definitions
- `src/pages/Capabilities.tsx` -- Six-step wizard, click-to-edit, controlled tabs, fetch skills from DB
- `src/pages/Department.tsx` -- Fetch skills from DB, abort stream on navigation
- `src/lib/agent-client.ts` -- AbortController support, pass systemPrompt
- `supabase/functions/agent-dispatch/index.ts` -- stream_options for tokens, accept skill system_prompt

---

## Sequencing

1. Database migration (add columns)
2. Seed 15 skills
3. Update mock-data.ts types (remove hardcoded skills)
4. Update agent-client.ts (AbortController + systemPrompt passthrough)
5. Update agent-dispatch edge function (stream_options + skill system prompt)
6. Update Department.tsx (fetch from DB + abort)
7. Rebuild Capabilities.tsx (six-step wizard + click-to-edit + fetch from DB)
