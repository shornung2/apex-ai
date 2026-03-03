

# Fix Scheduled Task "Failed" Status + Improve Research Quality

## Two Root Causes

### 1. Jobs marked "failed" despite having output
In `task-scheduler/index.ts` (line 100), after extracting the `jobId` from the first SSE chunk, `reader.cancel()` is called. This aborts the HTTP connection to `agent-dispatch`, which catches the abort at line 222 and sets `status: "failed"` on the job. The AI had already started generating, so partial output exists, but the status is wrong.

**Fix:** Consume the entire stream instead of canceling it. The task-scheduler runs server-side with no user waiting, so reading to completion is fine. After the stream ends, `agent-dispatch` will properly set `status: "complete"`.

### 2. Poor research quality / outdated information
The `web_search_enabled` flag exists on skills but is never used by `agent-dispatch`. The Lovable AI Gateway is OpenAI-compatible and does not support Gemini-native Google Search grounding (`tools: [{ google_search: {} }]`). Real-time web search is not available through this gateway.

**Fix:** Since we cannot add live web search, the fix is to significantly improve the agent persona prompts for all four agent types. The current prompts are terse one-liners. Expanding them with detailed instructions on quality, depth, structure, and honest uncertainty will dramatically improve output across the board.

## Changes

### File 1: `supabase/functions/task-scheduler/index.ts`
- Remove `reader.cancel()` (line 100)
- Replace with a loop that drains the entire stream to completion
- Still extract `jobId` from the first event for linking
- This ensures `agent-dispatch` reaches its finalization code and sets `status: "complete"`

### File 2: `supabase/functions/agent-dispatch/index.ts`
- Expand all four `AGENT_PERSONAS` with detailed, high-quality instructions:
  - **Researcher**: Emphasize depth, multiple perspectives, confidence ratings, date-stamping claims, acknowledging when data may be outdated, structured analysis with executive summary
  - **Strategist**: Emphasize frameworks, risk matrices, prioritized recommendations, implementation timelines, measurable KPIs
  - **Content**: Emphasize audience awareness, tone adaptation, compelling structure, CTAs, brand voice consistency
  - **Meeting Prep**: Emphasize prospect-specific discovery questions, objection handling with responses, competitive positioning, meeting flow structure
- Accept optional `webSearchEnabled` parameter from the request body (future-proofing for when search becomes available)
- When `webSearchEnabled` is true, append a prompt section instructing the model to clearly caveat any potentially outdated information and provide the most recent data it has access to
- Pass `webSearchEnabled` through from `task-scheduler` when dispatching

### File 3: `supabase/functions/task-scheduler/index.ts` (additional)
- Read `skill.web_search_enabled` (already fetched) and pass it as `webSearchEnabled` in the dispatch payload

## Files Modified

| File | Change |
|------|--------|
| `supabase/functions/task-scheduler/index.ts` | Drain full stream; pass `webSearchEnabled` |
| `supabase/functions/agent-dispatch/index.ts` | Expand all 4 agent personas; accept `webSearchEnabled` flag |

