

## Plan: Rebuild Onboarding Coach from Scratch

### Step 1 — Remove Existing Onboarding Functionality

**Database**: Run a DELETE query via insert tool to remove the `new-employee-onboarding` skill from the `skills` table for all tenants.

**`supabase/functions/seed-skill-packs/index.ts`**: Remove the `new-employee-onboarding` entry from the `talentSkills` array (line 48). Keep `career-coaching`.

**`src/pages/Department.tsx`**: Update `COACHING_SKILL_NAMES` (line 26) to only include `"career-coaching"`. Remove the `new-employee-onboarding` branch from the session title logic (line 135).

**`src/pages/Help.tsx`**: Remove references to "New Employee Onboarding Coach" from help content sections (coach agent description, skill catalog, telegram docs, scheduling docs). Replace with a brief note about the new Onboarding system.

**`src/pages/JobDetail.tsx`**: Check for and remove any onboarding-specific "Continue session" logic (if it references onboarding by name).

**Do NOT touch**: Career Coach, Coach agent, Talent department, Meeting Prep.

### Step 2 — Add New Types

Create `src/types/onboarding.ts` with all the types specified: `OnboardingPhase`, `SuccessProfileSkillItem`, `PhaseConfig`, `SuccessProfile`, `OnboardingProgram`, `OnboardingAssignment`, `NotebookEntryType`, `NotebookEntry`, `CheckpointResponse`, `RolePlaySessionType`, `RolePlaySession`.

### Step 3 — Create Supabase Tables

Run a single database migration creating 6 tables, all with `tenant_id` and RLS policies matching existing pattern (`get_my_tenant_id()`):

| Table | Key JSONB Columns |
|-------|-------------------|
| `success_profiles` | `items`, `phase_configs` |
| `onboarding_programs` | `phase_content` |
| `onboarding_assignments` | `phase_deadlines`, `phase_completed_at` |
| `onboarding_notebook_entries` | (none) |
| `onboarding_checkpoint_responses` | (none) |
| `onboarding_roleplay_sessions` | `conversation_history`, `rubric_scores` |

All use restrictive RLS policies for SELECT/INSERT/UPDATE/DELETE scoped by `tenant_id = get_my_tenant_id()`.

### Step 4 — Add Routing and Navigation

**Create 8 stub page files** in `src/pages/onboarding/`:
- `SuccessProfileList.tsx`
- `SuccessProfileBuilder.tsx`
- `ProgramList.tsx`
- `ProgramBuilder.tsx`
- `AdminDashboard.tsx`
- `LearnerJourney.tsx`
- `LearnerNotebook.tsx`
- `CheckpointSession.tsx`
- `RolePlaySessionPage.tsx`

Each renders a simple heading with the page name.

**`src/App.tsx`**: Add routes under `/talent/onboarding/*`.

**`src/components/AppSidebar.tsx`**: Add an "Onboarding" collapsible group under the Departments section (or after Talent) with sub-links:
- Success Profiles → `/talent/onboarding/profiles`
- Programs → `/talent/onboarding/programs`
- Assignments → `/talent/onboarding/assignments`
- My Journey → `/talent/onboarding/my-journey`

### Files to Create/Modify

| File | Action |
|------|--------|
| `src/types/onboarding.ts` | Create (all types) |
| `supabase/migrations/` (new) | Create 6 tables + RLS |
| `src/pages/onboarding/*.tsx` (9 files) | Create stubs |
| `src/App.tsx` | Add onboarding routes |
| `src/components/AppSidebar.tsx` | Add Onboarding nav section |
| `src/pages/Department.tsx` | Remove onboarding from coaching skills |
| `supabase/functions/seed-skill-packs/index.ts` | Remove onboarding seed entry |
| `src/pages/Help.tsx` | Update help content |
| DB data (via insert tool) | DELETE skill rows for `new-employee-onboarding` |

