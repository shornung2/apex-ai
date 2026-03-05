

## Investigation Results

The job ran for 52 seconds and consumed 10,822 tokens, meaning the AI **did complete successfully**. The failure is a race condition in the stream cleanup logic.

### Root Cause

In `agent-dispatch/index.ts`, the streaming flow is:
1. AI streams response, output accumulated
2. Job updated to `status: "complete"` (line 521-526)
3. Coaching session updated (line 543-557)
4. `[DONE]` event enqueued, stream closed (line 560-561)

If the client disconnects at any point during steps 2-4 (common after 52 seconds), the `controller.enqueue()` call at line 560 throws "The stream controller cannot close or enqueue". This lands in the catch block (line 562-565) which **overwrites the job status back to "failed"**, even though the AI output was already saved as "complete".

The embedding 400 error is a secondary issue (non-fatal, falls back to keyword search) but should also be investigated.

### Fix: `agent-dispatch/index.ts`

1. Track whether the job has been finalized with a `jobFinalized` flag
2. Set the flag to `true` after the successful `status: "complete"` update (line 526)
3. In the catch block (line 562-565), only update status to `"failed"` if `!jobFinalized`
4. Wrap the final `[DONE]` enqueue and `controller.close()` in a try-catch so stream cleanup errors don't trigger the main catch

### Career Coach Skill

The career coach uses the same `agent-dispatch` function, so it has the **exact same vulnerability**. The fix addresses both skills.

### Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/agent-dispatch/index.ts` | Add `jobFinalized` guard to prevent completed jobs from being marked failed on stream disconnect |

