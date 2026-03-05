

## Plan: Build Role-Play Session Experience

### Overview
Build the immersive role-play session page at `/talent/onboarding/my-journey/roleplay/:sessionType` with three views: pre-session briefing, streaming chat interface, and score screen. Also create a new edge function for role-play chat and scoring.

### Files to Create

| File | Purpose |
|------|---------|
| `supabase/functions/roleplay-chat/index.ts` | Edge function handling both streaming chat and session scoring via Lovable AI gateway |

### Files to Modify

| File | Change |
|------|--------|
| `src/pages/onboarding/RolePlaySessionPage.tsx` | Full rewrite with briefing, chat, and score views |
| `supabase/config.toml` | Add `roleplay-chat` function config |

### Implementation Details

**Edge Function (`roleplay-chat`)**: Two modes via a `mode` field in the request body:

1. **`chat` mode**: Accepts `{ mode: "chat", messages, systemPrompt }`. Streams the response back via SSE using the Lovable AI gateway (`google/gemini-3-flash-preview`). Returns the stream directly to the client for token-by-token rendering.

2. **`score` mode**: Accepts `{ mode: "score", conversationHistory, roleName, sessionType, rubricItems }`. Non-streaming call with tool calling to extract structured `{ overallScore, rubricScores, summaryFeedback }`. Uses the scoring system prompt from the spec.

**Page (`RolePlaySessionPage.tsx`)**: Three-phase UI managed by a `view` state (`briefing` | `chat` | `score` | `review`):

**Briefing View**:
- Load active assignment, program, success profile, and previous roleplay sessions for this sessionType
- Show session type title, icon, description text per spec
- Prominent callout box with elevator pitch topic or capstone scenario
- Previous sessions list with date, score, and "Review" button (opens read-only chat transcript)
- "Start New Session" button

**Chat View**:
- Full-screen layout: slim header bar with session type label, role badge, elapsed timer (counting up), "End Session & Get Score" button
- Chat area with ScrollArea: Coach messages (left, styled with avatar) and user messages (right)
- On session start: create initial system prompt dynamically from Success Profile data (role name, description, rubric items, pitch topic / capstone scenario), send to edge function in `chat` mode to get Coach's opening message
- Streaming: use SSE parsing (same pattern as documented) to render Coach responses token-by-token
- Input: textarea with Enter to send (Shift+Enter for newline), Send button
- Full conversation history sent with each request
- "End Session" or typing "done" triggers scoring flow

**Scoring Flow**:
1. Freeze input, show "Coach is scoring your session..." overlay
2. Call edge function in `score` mode with full transcript and rubric items
3. Save `onboarding_roleplay_sessions` record with conversation_history, overall_score, rubric_scores, summary_feedback, is_complete=true, completed_at
4. Transition to score view

**Score View**:
- Large overall score with descriptive label (Needs Development / Getting There / Ready / Exceptional)
- Rubric breakdown cards: label, score as visual dots (1-5), feedback text
- Summary feedback box
- "Practice Again" and "Return to My Journey" buttons

**Review Mode**: When clicking "Review" on a previous session from briefing, show the chat transcript in read-only mode with the score screen below.

**System Prompt Construction**: Built dynamically per spec — includes role context, rubric items (filtered to `isRolePlayRubricItem: true` from success profile items), session-type-specific instructions, and coaching guidelines.

**Timer**: Simple `useEffect` with `setInterval` counting seconds from session start, formatted as `M:SS`.

### No Database Changes Needed
All tables (`onboarding_roleplay_sessions`, `onboarding_assignments`, etc.) already exist with appropriate columns and RLS policies.

