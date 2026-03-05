

## Plan: Build Success Profile List & Builder Pages

### Overview
Build two fully functional pages: a profile list with starter templates, and a multi-section builder with AI generation assist. This involves creating a new edge function for AI generation, a data file for starter templates, and the two page components with supporting sub-components.

### Files to Create

| File | Purpose |
|------|---------|
| `src/data/starter-templates.ts` | 4 hardcoded starter templates |
| `src/components/onboarding/ProfileCard.tsx` | Reusable profile card component |
| `src/components/onboarding/ProfilePreviewCard.tsx` | Live preview card for builder right panel |
| `src/components/onboarding/SkillItemsEditor.tsx` | Tabbed skill/attribute list builder |
| `src/components/onboarding/PhaseTimelineEditor.tsx` | Phase duration + objectives editor |
| `src/components/onboarding/AIGenerateDrawer.tsx` | Drawer with AI generation form |
| `supabase/functions/generate-success-profile/index.ts` | Edge function calling Lovable AI gateway |

### Files to Modify

| File | Change |
|------|--------|
| `src/pages/onboarding/SuccessProfileList.tsx` | Full implementation |
| `src/pages/onboarding/SuccessProfileBuilder.tsx` | Full implementation |

### Implementation Details

**Starter Templates (`src/data/starter-templates.ts`)**: Export an array of 4 `SuccessProfile` objects (Solution Architect, Account Executive, SDR, CSM) with all items, phase configs, elevator pitch topics, and capstone scenarios as specified. These are hardcoded with `isTemplate: true` and static IDs like `template-sa`, `template-ae`, etc.

**Profile List Page**: 
- Fetches custom profiles from `success_profiles` table filtered by `tenant_id`
- Collapsible "Starter Templates" section (collapsed by default) showing the 4 templates with "Use as Starting Point" button
- Grid of custom profile cards with Edit (navigates to `/:id/edit`) and Duplicate (clones to new profile in DB) buttons
- Empty state when no custom profiles exist
- "New Success Profile" button navigates to `/talent/onboarding/profiles/new`

**Profile Builder Page**:
- Left panel: 5 collapsible sections (Role Identity, Skills & Attributes, Phase Timeline, Role-Play Configuration, Build with AI)
- Right panel: Live preview card that updates as the form changes
- Skills & Attributes uses 4 tabs (Hard Skills, Soft Skills, Behavioral, Knowledge Areas) with inline add form and rubric checkbox per item
- Phase Timeline: 3 rows with number input for days + tag-style objectives input
- Save button inserts/updates `success_profiles` table, redirects to list on success
- Edit mode: loads existing profile by ID from DB

**AI Generation Edge Function** (`generate-success-profile`):
- Accepts `{ description: string }` body
- Calls Lovable AI gateway (`google/gemini-3-flash-preview`) with the specified system prompt
- Uses tool calling to extract structured JSON matching the SuccessProfile shape
- Returns parsed JSON to client

**AI Generate Drawer**:
- Textarea for role/company description
- "Generate" button calls the edge function via `supabase.functions.invoke`
- On success, populates all form fields and closes drawer with success toast

**Data flow**: Builder uses React state for the form. On save, maps camelCase fields to snake_case DB columns (`role_name`, `role_description`, `phase_configs`, `elevator_pitch_topic`, `capstone_scenario_description`, `items`, `is_template: false`). Includes `tenant_id` from `useTenant()`.

