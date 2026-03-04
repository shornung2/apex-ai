

# Onboarding Wizard for New Tenants

## Summary

Create a full-screen onboarding wizard (4 steps) that renders when `onboardingComplete` is false. Includes a new `seed-skill-packs` edge function to provision starter skills, and a dismissible Quick Start banner on the Dashboard.

## Database Changes

None needed for the wizard itself. The `onboarding_complete` column already exists on `user_profiles`. Workspace settings keys (`company_name`, `industry`, `primary_use_case`) will be upserted into the existing `workspace_settings` table.

## New Edge Function: `seed-skill-packs`

Create `supabase/functions/seed-skill-packs/index.ts`:

- Accepts `{ tenant_id, packs: string[] }` where packs are `"presales"`, `"sales"`, `"marketing"`
- Validates the caller is authenticated and belongs to the tenant
- For each selected pack, inserts a predefined set of skills into the `skills` table with `is_system = true` and the correct `tenant_id`
- Returns `{ seeded: number }` (total skills inserted)
- Skills are defined inline in the function as arrays of skill objects with appropriate names, descriptions, departments, agent types, prompt templates, etc.

### Skill Pack Contents (summary):

**Presales (12 skills)**: RFP Response Drafter, Discovery Prep, Competitive Brief, Solution Qualifier, Executive Proposal, POC Planner, Technical Q&A, Win Theme Builder, Demo Script, Pricing Strategy, Reference Story, Objection Handler

**Sales (10 skills)**: Account Research, Personalized Outreach, Deal Strategy, Champion Coach, Pipeline Review, Win/Loss Analysis, Territory Plan, Proposal Builder, Follow-Up Email, Call Debrief

**Marketing (8 skills)**: Thought Leadership, LinkedIn Post, Market Intelligence, Campaign Messaging, SEO Brief, Email Nurture, Case Study, Social Calendar

Each skill has minimal but functional prompt templates. All use `preferred_model: 'haiku'` and sensible defaults.

## New Component: `OnboardingWizard`

Create `src/components/OnboardingWizard.tsx`:

- Full-screen fixed overlay (`z-50`, dark semi-transparent background)
- Centered card with max-width ~640px
- 4-step progress indicator (circles + connecting lines, filled = complete/current)
- Uses `useTenant()` for tenantId/tenantName

### Step 1 — Welcome
- Logo, headline, subheadline, "Get Started" button

### Step 2 — About Your Team
- Company name (pre-filled from `tenantName`), Industry select, Primary use case radio group
- On Next: upsert 3 rows into `workspace_settings` (keys: `company_name`, `industry`, `primary_use_case`)

### Step 3 — Skill Packs
- 3 selectable cards (multi-select with checkboxes)
- Auto-selected based on Step 2's use case choice
- User can toggle selections

### Step 4 — Upload Document
- Reuse the file upload logic from Knowledge page (upload to storage, call `knowledge-ingest`)
- "Skip this step" link prominently shown
- On upload success: green checkmark with filename

### On Complete:
1. Call `seed-skill-packs` edge function with selected packs
2. `UPDATE user_profiles SET onboarding_complete = true WHERE id = userId`
3. Close overlay
4. Toast: "Your workspace is ready. You have {n} new skills — try one now!"
5. Set a localStorage flag `show_quick_start = true`

## Update `AppLayout.tsx`

- Import `useTenant` and `OnboardingWizard`
- If `!onboardingComplete && !isLoading`, render `<OnboardingWizard />` as a sibling to the layout (full-screen overlay on top)

## Quick Start Banner on Dashboard

- In `Dashboard.tsx`, add a dismissible banner at the top (above hero)
- Show when `localStorage.getItem('show_quick_start') === 'true'`
- Display 3 suggested skill names from the seeded packs
- Dismiss removes from localStorage
- Links to the relevant department page

## Files Affected

| File | Action |
|---|---|
| `src/components/OnboardingWizard.tsx` | Create |
| `src/components/AppLayout.tsx` | Edit: render wizard overlay when onboarding incomplete |
| `src/pages/Dashboard.tsx` | Edit: add Quick Start banner |
| `supabase/functions/seed-skill-packs/index.ts` | Create |
| `supabase/config.toml` | Edit: add seed-skill-packs function config |

## Technical Notes

- The wizard is an overlay, not a route — no navigation changes needed
- File upload in Step 4 replicates the Knowledge page's upload pattern (storage upload + `knowledge-ingest` invocation)
- The seed function uses the service role key to bypass RLS for bulk skill insertion
- Skills seeded with `is_system = true` so they can be distinguished from user-created skills

