

# SolutionIQ Autopilot — Complete Rebuild Plan

## What's Wrong With the Current Build

The current implementation uses a generic "departments" model (Marketing/Sales) with invented agents (Researcher, Content Writer, Lead Scorer, Proposal Writer) and a Skills Marketplace concept that doesn't exist in the PRD. The PRD defines a fundamentally different application:

- **5 specific agents**: Researcher, Strategist, Content, Pulse, and Alex (Concierge) -- not department-grouped generic agents
- **No "Skills Marketplace" page** -- skills are IP-protected environment variables, not a browsable UI
- **No "Departments" pages** -- the app is organized around agents, not departments
- **Different navigation**: Overview, Agents, Knowledge Base, History, Settings
- **Different dashboard**: "What do you need today?" hero with agent shortcuts, token usage bar, real-time activity feed
- **Multi-tenant workspace model** with auth, RLS, and workspace context

This is a near-complete rewrite of the frontend, plus setting up the backend foundation.

---

## Build Phases (Following PRD Phase Sequence)

### Phase 1: Foundation -- Auth, Database, Workspace Context

Since the PRD calls for Supabase auth and a multi-tenant workspace model, we need to enable Lovable Cloud first.

**What gets built:**
- Enable Lovable Cloud (Supabase backend)
- Create all database tables with RLS: `workspaces`, `workspace_settings`, `workspace_members`, `agent_jobs`, `knowledge_documents`, `knowledge_chunks`
- Create the `get_user_workspace_id()` isolation function
- Auth pages: `/login` (email + password + magic link), `/signup`, `/onboarding` (workspace setup)
- `ProtectedRoute` component
- `WorkspaceContext` provider exposing: user, workspace, workspaceId, isAdmin, isLoading
- App router with protected routes

### Phase 2: Dashboard Shell and Agent UI

**Completely replace the current UI:**

**New sidebar navigation** (240px fixed):
- Workspace name + plan badge at top
- Navigation: Overview, Agents, Knowledge Base, History, Settings
- Token usage progress bar at bottom (green/amber/red)
- User avatar + logout at bottom

**Overview page** (`/dashboard`):
- "What do you need today?" hero with one-click shortcuts to each of the 5 agents
- 4 stat cards: Agent Runs Today, Tokens Used, Knowledge Base Size, Avg Confidence Score
- Recent Activity feed (last 10 agent_jobs, real-time via Supabase Realtime)

**Agents page** (`/agents`):
- 5 agent cards in a grid (Researcher, Strategist, Content, Pulse, Alex)
- Each card: emoji icon, name (from workspace branding_config or default), description, capability tags, "Run Agent" button
- Agent names from PRD:
  - Researcher (system: `researcher`) -- Prospect intelligence, company research, ICP scoring
  - Strategist (system: `strategist`) -- Meeting prep, discovery frameworks, objection handling
  - Content (system: `content`) -- Proposals, SOWs, executive summaries, sales materials
  - Pulse (system: `pulse`) -- Pipeline analysis, deal health, forecast commentary
  - Alex (system: `concierge`) -- Natural language routing, orchestration

**Submission forms** (one per agent, opened via side sheet):
- Researcher: Company Name, Website URL, LinkedIn URL, Industry dropdown, Known context textarea, Research depth radio (Quick Brief / Standard / Deep Dive)
- Strategist: Company Name, Meeting Type dropdown, Date/Time, Duration, Stakeholders (dynamic rows), Challenges textarea, Objectives textarea, Sensitivity textarea
- Content: Document Type dropdown, Company/Recipient, Stakeholders (dynamic), Solution components, Investment range, Timeline, Key outcomes textarea, Personalization textarea
- Pulse: Focus area multi-select, Pipeline stage multi-select, Time horizon dropdown, Context textarea

**Job Detail page** (`/jobs/:jobId`):
- Status with animated indicators (queued=gray pulse, running=teal spin, complete=green check, failed=red X, retrying=amber clock)
- Real-time status updates via Supabase Realtime
- Structured output renderer per agent type (collapsible section cards)
- "Save to Knowledge Base", "Copy as Markdown", "Re-run" buttons

**History page** (`/history`):
- Full-width table: Date/Time, Agent, Input Summary, Status, Tokens, Confidence, Actions
- Filters: agent type, status, date range, search
- Pagination (20/page), CSV export

### Phase 3: Edge Functions -- Agent Dispatch and Worker

**Edge functions to create:**
- `agent-dispatch`: Validates request, checks token budget, creates async job, triggers worker, returns job_id immediately
- `agent-worker`: Loads skill from env var, retrieves knowledge chunks, calls AI (Lovable AI gateway initially, designed to swap to Claude), runs quality gate, stores output

**Frontend wiring:**
- `agentClient.ts` with `runAgent()`, `subscribeToJob()` functions
- All submission forms call agent-dispatch via `supabase.functions.invoke()`
- Error handling for token budget exceeded, API key not configured, agent not enabled

### Phase 4: Knowledge Base

- Two-column layout: document library (left 40%) + document viewer/chunk inspector (right 60%)
- Upload zone for PDF, DOCX, TXT (max 50MB)
- Document list with status badges (processing/ready/failed)
- Chunk viewer with type badges, token counts, quality scores
- Semantic search with similarity sensitivity selector (Precise/Balanced/Creative)
- Agent Outputs tab showing auto-saved agent results
- `knowledge-ingest` Edge Function for structure-aware chunking

### Phase 5: Admin Panel and Settings

- Admin-only access guard (role check)
- Settings tabs: General, API Key, Agent Configuration, Usage & Billing, Members
- Vault-based API key storage (never plaintext in DB)
- Usage charts (recharts)
- Member management with role assignment

### Phase 6-8: IP Flywheel, White-Label, Polish

- Auto-save agent outputs to knowledge base
- Branding config UI (logo, colors, custom agent names)
- CSS custom property cascading for white-label colors
- Loading skeletons, error states, empty states
- Mobile responsive layout
- Confirmation dialogs, toast notifications

---

## Data Model Changes

**Remove entirely:**
- Current `mock-data.ts` with its marketing/sales department model, Skills type, Agent type

**Replace with:**
- New types matching PRD schema: `Workspace`, `WorkspaceSettings`, `WorkspaceMember`, `AgentJob`, `KnowledgeDocument`, `KnowledgeChunk`
- Agent types: `researcher | strategist | content | pulse | concierge`
- Job statuses: `queued | running | complete | failed | retrying`

---

## Pages to Remove
- `/departments/:dept` -- no department pages in PRD
- `/skills` -- no skills marketplace; skills are backend env vars

## Pages to Add
- `/login`, `/signup`, `/onboarding`
- `/agents` (the 5-agent card grid with submission forms)
- `/jobs/:jobId` (job detail with real-time status)
- `/history` (filterable job history table)
- `/knowledge` (knowledge base with document library + search)

## Pages to Heavily Rework
- `/` (Dashboard) -- becomes Overview with hero, stat cards, activity feed
- `/settings` -- becomes admin-only with 5 tabs per PRD

---

## Implementation Priority

For this first implementation pass, I will focus on **Phases 1-2** to establish the correct foundation and UI shell:

1. Update the plan file to reflect the PRD
2. Rewrite data types and mock data to match the 5-agent model
3. Rebuild sidebar navigation (Overview, Agents, Knowledge Base, History, Settings)
4. Rebuild Dashboard/Overview page per PRD spec
5. Build Agents page with all 5 agent cards and submission forms
6. Build Job Detail page with status indicators and output renderer
7. Build History page with filters and pagination
8. Build Knowledge Base page shell (UI ready, backend wired later)
9. Rebuild Settings page with proper tabs

Backend (Phases 3+) will follow once the UI shell is validated.

---

## Technical Notes

- All data fetching via React Query (TanStack Query)
- Forms via react-hook-form + zod validation
- Real-time via Supabase Realtime subscriptions
- Date formatting via date-fns
- Charts via Recharts
- shadcn/ui components throughout
- Dark theme maintained with the current color system
- AI initially via Lovable AI gateway (google/gemini-3-flash-preview), architected to swap to Claude later

