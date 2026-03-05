

## Plan: Rename Meeting Prep to Coach, Add Talent Department, New Skills, and Update All References

### Summary

Rename the "Meeting Prep" agent to "Coach" and expand its scope. Add a new "Talent" department. Create two new skills (New Employee Onboarding, Career Coaching). Keep Meeting Prep skill in Sales. Remove Pipeline Review from Sales. Update Help, About page, Telegram bot, and all related code.

### Changes Required

#### 1. Update `src/data/mock-data.ts` — Core type and agent definitions
- Rename `AgentType` value `"meeting-prep"` to `"coach"` (or keep the key as `"coach"`)
- Add `"talent"` to the `Department` type union
- Update the agent definition: rename "Meeting Prep" to "Coach", change emoji to `🏋️`, update description to cover meeting prep, onboarding, and career coaching
- Add `talent` to `departmentDefinitions` with name "Talent", description about coaching, onboarding, and career development
- Update `departmentAgents`: add `talent: ["coach", "content", "strategist"]`, update `sales` to use `"coach"` instead of `"meeting-prep"`
- Update `dbRowToSkill` to map legacy `"meeting-prep"` agent_type values to `"coach"`

#### 2. Update `src/components/AppSidebar.tsx` — Add Talent department to sidebar
- Add `{ title: "Talent", url: "/departments/talent", icon: GraduationCap }` (or similar icon) to `departmentItems`

#### 3. Update `src/pages/Capabilities.tsx` — Agent model defaults
- Change `"meeting-prep"` key to `"coach"` in `AGENT_DEFAULT_MODELS`

#### 4. Update `src/pages/Help.tsx` — Complete rewrite of help content
- Replace all "Meeting Prep" agent references with "Coach"
- Add Talent department to department listings
- Document the three Coach skills: Meeting Prep, New Employee Onboarding, Career Coaching
- Update skill packs section (remove Pipeline Review, add new skills info)
- Update scheduled tasks section
- Update departments section to list Sales, Marketing, and Talent
- Reference the onboarding methodology (Teach Me → Show Me → Let Me Show You, Success Profiles, AI coaching simulations, Check Ride evaluations) from the Solutionment marketing content

#### 5. Update `public/about.html` — About page
- Replace "Meeting Prep" agent references with "Coach"
- Update agent card: rename to Coach, update description to include coaching, onboarding, career development
- Update agent tags to include Onboarding, Career Coaching alongside Meeting Prep
- Add Talent department mention where departments are listed
- Update the use case about Discovery Call to also mention Onboarding and Career Coaching use cases

#### 6. Update `supabase/functions/telegram-bot/index.ts` — Telegram bot
- Update `/start` and `/help` messages to reference Coach agent and Talent department
- Remove Pipeline Review references
- Add mention of Coach skills (Meeting Prep, Onboarding, Career Coaching)
- Update skill packs description in help text

#### 7. Database migration — Add new skills and update existing ones
- Update any existing skills in the DB with `agent_type = 'meeting-prep'` to `'coach'`
- The two new skills (New Employee Onboarding, Career Coaching) will be created by users via the Skill Builder or seeded via skill packs — no migration needed for skill content since skills are tenant-scoped
- Note: Existing tenant skills with `agent_type = 'meeting-prep'` should be migrated to `'coach'` via a DB migration

#### 8. Update `supabase/functions/seed-skill-packs/index.ts`
- Update pipeline-review skill to be excluded or update its department
- Add coach agent_type references where meeting-prep was used

#### 9. Update `src/components/OnboardingWizard.tsx`
- Update Sales Productivity Pack description to remove "pipeline reviews" mention
- Add Talent/Coaching pack or update descriptions

#### 10. Update test files
- `src/components/__tests__/Department.test.tsx` — no changes needed (uses generic dept param)
- `src/components/__tests__/SkillForm.test.tsx` — update `agentType: "meeting-prep"` to `"coach"`

#### 11. Update `public/_redirects`
- Already has `/about /about.html 200` — no changes needed

### New Skill Definitions (for seed or documentation)

**New Employee Onboarding Coach** (`talent` department, `coach` agent):
- Based on Solutionment's Role-Readiness Acceleration methodology
- Inputs: Employee name, role/title, department, start date, success profile/competencies, 90-day objectives, prior experience summary
- Produces: Personalized onboarding plan using Teach Me → Show Me → Let Me Show You framework, week-by-week milestones, AI coaching simulation scenarios, readiness check-ride criteria

**Career Coach** (`talent` department, `coach` agent):
- Inputs: Employee name, current role, career goals, strengths, development areas, timeframe
- Produces: Personalized development plan, skill gap analysis, recommended learning path, coaching conversation guides, milestone checkpoints

**Meeting Prep** stays in both Sales (existing) and Talent departments.

### Technical Notes
- The `agent_type` column in the `skills` and `agent_jobs` tables stores string values. A migration will update `'meeting-prep'` → `'coach'` in both tables.
- The `department` column will need `'talent'` as a valid value — no enum constraint exists, it's free text.
- The `dbRowToSkill` function will map legacy values for backward compatibility.

