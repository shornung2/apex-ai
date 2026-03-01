

# Wire Up Agent Execution Pipeline

## Overview

Build the complete backend infrastructure so that when a user fills out a skill form and clicks "Run", the system dispatches the job, calls AI (grounded in Knowledge Base content), streams the result back, and stores everything persistently.

---

## Phase 1: Database Tables

Create the following tables with RLS policies:

**`knowledge_documents`** -- uploaded docs and agent outputs
- id (uuid, PK), title, content (text), doc_type ("upload" | "agent_output"), status ("processing" | "ready" | "failed"), tokens (int), created_at

**`knowledge_chunks`** -- chunked content for grounding
- id (uuid, PK), document_id (FK -> knowledge_documents), content (text), chunk_index (int), tokens (int), created_at

**`agent_jobs`** -- every skill execution
- id (uuid, PK), skill_id (text), agent_type (text), department (text), title (text), status (text, default "queued"), inputs (jsonb), output (text), tokens_used (int), confidence_score (int), created_at, completed_at
- Enable realtime on this table for live status updates

**`skills`** -- user-created skills from the Skill Builder
- id (uuid, PK), name, description, department (text), agent_type (text), emoji, inputs (jsonb), prompt_template (text), is_system (bool, default false), created_at

All tables will have RLS enabled. Initially policies will allow all authenticated users full access (auth will be added in a follow-up phase). For now, anon read/write will be permitted to keep the app functional without login.

---

## Phase 2: Edge Function -- `agent-dispatch`

**Path:** `supabase/functions/agent-dispatch/index.ts`

Receives a skill execution request from the frontend:
```text
POST { skillId, skillName, agentType, department, title, inputs, promptTemplate }
```

Steps:
1. Insert a new row into `agent_jobs` with status "queued"
2. Retrieve relevant knowledge chunks by searching `knowledge_chunks` for content related to the input values (simple text matching initially -- semantic search later)
3. Build the full prompt:
   - System prompt sets agent persona based on `agentType` (Researcher = analytical, Strategist = strategic, Content = writer, Meeting Prep = coach)
   - Inject matched knowledge chunks as grounding context
   - Fill the skill's `promptTemplate` with the user's input values
4. Update job status to "running"
5. Call Lovable AI gateway (google/gemini-3-flash-preview) with streaming
6. Stream the response back to the client as SSE
7. On completion: update `agent_jobs` with output, tokens_used, status "complete", completed_at
8. On error: update status to "failed"

---

## Phase 3: Frontend Wiring

### Agent client utility (`src/lib/agent-client.ts`)
- `runSkill(skill, inputs)` -- calls agent-dispatch edge function, returns a readable stream
- `subscribeToJob(jobId, callback)` -- subscribes to realtime changes on `agent_jobs` for live status

### Update `SkillForm.tsx` / `Department.tsx`
- On form submit: call `runSkill()`, create a job, navigate to `/jobs/:jobId`
- Show toast: "Job submitted -- redirecting to results..."

### Update `JobDetail.tsx`
- Fetch job from `agent_jobs` table instead of mock data
- Subscribe to realtime updates for status changes
- Stream output rendering: show tokens as they arrive using the SSE stream
- "Save to KB" button: inserts the output into `knowledge_documents` as type "agent_output"
- "Re-run" button: re-submits the same skill + inputs

### Update `History.tsx`
- Fetch from `agent_jobs` table with filters and pagination
- Replace mock data with real queries

### Update `Dashboard.tsx`
- Stat cards query real counts from `agent_jobs` and `knowledge_documents`
- Recent activity from `agent_jobs` ordered by created_at desc, limit 5

### Update `Capabilities.tsx` -- Skill Builder persistence
- "Save Skill" button inserts into the `skills` table
- Skill Library fetches from both hardcoded skills AND database skills (merged)
- Delete/edit support for user-created skills (is_system = false)

### Update `Knowledge.tsx`
- Upload functionality using Supabase storage (create a `documents` bucket)
- Document list from `knowledge_documents` table
- Basic content viewer when clicking a document

---

## Phase 4: Agent Persona System Prompts

Each agent type gets a tailored system prompt that defines its behavior:

- **Researcher**: "You are a research analyst. Produce structured, factual analysis with citations and confidence ratings. Use the provided knowledge base context to ground your findings."
- **Strategist**: "You are a strategic advisor. Produce actionable frameworks, risk assessments, and next-step recommendations. Reference the knowledge base for organizational context."
- **Content**: "You are a professional business writer. Produce polished, on-brand content. Adapt tone and format to the request. Use knowledge base materials for accuracy."
- **Meeting Prep**: "You are a sales coaching advisor. Produce meeting agendas, discovery questions, objection handling scripts, and talk tracks. Use knowledge base intel on the prospect."

All prompts include: "Use the following knowledge base context to ground your response. If the context is relevant, incorporate it. If not, proceed with your best judgment."

---

## Knowledge Grounding Flow

```text
User submits skill form
        |
        v
agent-dispatch receives inputs
        |
        v
Extract key terms from inputs (company names, topics, etc.)
        |
        v
Query knowledge_chunks WHERE content ILIKE any key term
        |
        v
Inject top 5 matching chunks into system prompt as "CONTEXT"
        |
        v
Fill promptTemplate with input values -> user message
        |
        v
Call AI with [system + context, user message]
        |
        v
Stream response -> store in agent_jobs
```

---

## File Changes Summary

**Create:**
- `supabase/functions/agent-dispatch/index.ts` -- main execution edge function
- `src/lib/agent-client.ts` -- frontend agent API utilities

**Modify:**
- `src/pages/Department.tsx` -- wire form submit to agent-dispatch
- `src/pages/JobDetail.tsx` -- fetch from DB, realtime, streaming output
- `src/pages/History.tsx` -- query agent_jobs table
- `src/pages/Dashboard.tsx` -- real metrics from DB
- `src/pages/Capabilities.tsx` -- persist skills to DB
- `src/pages/Knowledge.tsx` -- upload + fetch documents
- `src/components/SkillForm.tsx` -- loading/streaming state

**Database migrations:**
- Create `knowledge_documents`, `knowledge_chunks`, `agent_jobs`, `skills` tables
- Create storage bucket `documents`
- Enable realtime on `agent_jobs`

