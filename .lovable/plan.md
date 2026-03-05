

## Plan: World-Class Onboarding and Career Coach Skills with Conversation Memory

### Summary

Transform the two Talent department skills into rich, multi-session coaching experiences with persistent memory. This requires a new database table for session continuity, updates to the agent-dispatch edge function to load conversation history, updated skill definitions in the database with comprehensive inputs and system prompts, and UI changes to support session awareness.

---

### 1. New Database Table: `coaching_sessions`

Create a table to persist conversation threads across sessions for onboarding and career coaching.

```
coaching_sessions
  id            uuid PK
  tenant_id     uuid (RLS scoped)
  user_id       uuid (references auth.users)
  skill_id      uuid (references skills)
  skill_name    text
  title         text (e.g. "Onboarding: Jane Smith - Sales Engineer")
  status        text (active / completed / paused)
  session_data  jsonb (structured progress: phase, milestones completed, goals, etc.)
  messages      jsonb[] (array of {role, content, timestamp} for conversation history)
  created_at    timestamptz
  updated_at    timestamptz
```

RLS: tenant-scoped using `get_my_tenant_id()` for all CRUD.

Enable realtime so the UI can subscribe to updates.

---

### 2. Update `agent-dispatch` Edge Function

When a skill execution includes a `sessionId` in the inputs:
- Load the coaching session's prior `messages` and `session_data` from the DB
- Inject conversation history into the AI messages array (not just system prompt) so the model has full conversational context
- After completion, append the new user message and assistant response to the session's `messages` array and update `session_data` with any progress markers
- If no `sessionId` is provided but the skill is a coaching/onboarding skill, create a new session automatically

Key changes to the dispatch flow:
- Before building the AI messages, check for `inputs._session_id`
- If present, load prior messages and prepend them to the conversation
- After streaming completes, update the session record with the new exchange
- Strip `_session_id` from the stored job inputs (similar to `_attached_context`)

---

### 3. Update Skill Definitions in Database

**New Employee Onboarding Coach** - update the existing DB record with:

**Inputs:**
- Employee Name (text, required)
- Role / Title (text, required)
- Department (select: Sales, Marketing, Talent, Engineering, Operations, Other)
- Start Date (text, required)
- Manager Name (text)
- Success Profile / Key Competencies (textarea, required - "What does success look like in this role at 30/60/90 days?")
- Prior Experience Summary (textarea - relevant background)
- 90-Day Objectives (textarea, required)
- Onboarding Phase (select: Orientation, Teach Me, Show Me, Let Me Show You, Capstone Role Play, Ongoing)

**System Prompt:** A comprehensive prompt that:
- Implements the "Teach Me, Show Me, Let Me Show You" three-phase methodology
- Phase 1 (Teach Me): Foundational knowledge transfer covering company capabilities, services, products, culture, differentiators, value propositions, and market positioning. Draws heavily from the knowledge base.
- Phase 2 (Show Me): Guided demonstrations, worked examples, scenario walkthroughs. The coach walks through real situations showing how knowledge applies.
- Phase 3 (Let Me Show You): The employee demonstrates mastery through practice exercises, knowledge checks, and skill demonstrations.
- Capstone: A structured role-play exercise where the employee presents and defends their understanding of company capabilities, differentiators, services, products, and culture in a simulated client/stakeholder meeting. The coach plays the role of a skeptical but fair evaluator.
- Uses Success Profiles to tailor the experience
- Tracks progress across sessions with explicit milestone markers
- References the knowledge base extensively for company-specific grounding
- Generates week-by-week milestones and readiness check-ride criteria

**Career Coach** - update the existing DB record with:

**Inputs:**
- Employee Name (text, required)
- Current Role / Title (text, required)
- Department (text, required)
- Career Aspirations / Goals (textarea, required)
- Current Strengths (textarea)
- Development Areas / Gaps (textarea, required)
- Timeframe for Goals (select: 3 months, 6 months, 1 year, 2+ years)
- Industry / Domain (text - for web search relevance)
- Coaching Focus (multi-select: Skill Development, Leadership Growth, Career Transition, Performance Improvement, Work-Life Balance)

**System Prompt:** A comprehensive prompt that:
- Implements the GROW model (Goal, Reality, Options, Will) as the primary coaching framework, established by Sir John Whitmore and widely recognized as the gold standard in executive coaching
- Supplements with elements from Marshall Goldsmith's stakeholder-centered coaching methodology
- Understands company-specific career paths, role expectations, and development resources from the knowledge base
- Incorporates industry-relevant trends, certifications, and skill demands via web search
- Creates personalized development plans with SMART goals
- Provides coaching conversation guides and reflection exercises
- Tracks progress against milestones across sessions
- Offers 360-style self-assessment prompts

**Web search enabled:** Yes (for industry-relevant career development information)

---

### 4. UI Changes: Session Continuity

**Department page (`Department.tsx`):**
- When a coaching/onboarding skill is selected, check for existing active sessions for the current user
- If active sessions exist, show a choice: "Continue existing session" or "Start new session"
- Display session metadata (last activity date, current phase/progress)

**SkillForm component:**
- Add a hidden `_session_id` field that gets populated when continuing a session
- When continuing, pre-populate some inputs from the session data and show a "Session context" indicator

**JobDetail page:**
- After a coaching job completes, show a "Continue this coaching session" button that links back to the skill with the session context

---

### 5. Files to Create/Modify

| File | Change |
|------|--------|
| `supabase/migrations/` (new) | Create `coaching_sessions` table with RLS |
| `supabase/functions/agent-dispatch/index.ts` | Add session loading/saving logic, add `coach` persona |
| `src/pages/Department.tsx` | Add session picker for coaching skills |
| `src/components/SkillForm.tsx` | Support `_session_id` hidden field |
| `src/pages/JobDetail.tsx` | Add "Continue session" button for coaching jobs |
| DB data update | Update the two existing talent skills with new inputs, system prompts, and web_search_enabled |

### 6. Agent Persona Update

Add a dedicated `coach` persona in `agent-dispatch` AGENT_PERSONAS that covers both onboarding and career coaching use cases, emphasizing:
- Conversational, supportive but challenging coaching style
- Session-aware behavior (referencing prior conversations)
- Progress tracking and milestone acknowledgment
- The "Teach Me, Show Me, Let Me Show You" methodology for onboarding
- The GROW model for career coaching
- Role-play facilitation capabilities

---

### Technical Notes

- Session history is injected as prior conversation messages (not system prompt text) to leverage the model's native conversational memory
- Sessions are capped at a reasonable message count (e.g., last 20 exchanges) to stay within token limits, with older context summarized
- The `session_data` JSONB field stores structured progress (current phase, completed milestones, assessment scores) that persists independently of message history
- Web search for career coach uses the existing Brave Search integration already in agent-dispatch

