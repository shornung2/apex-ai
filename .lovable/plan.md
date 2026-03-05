

## Plan: Build Checkpoint Session Page

### Overview
Build the full checkpoint session experience at `/talent/onboarding/my-journey/checkpoint/:phase` — a focused, one-question-at-a-time interface where learners answer free-response questions and receive AI-evaluated scores and feedback.

### Files to Create

| File | Purpose |
|------|---------|
| `supabase/functions/evaluate-checkpoint/index.ts` | Edge function to evaluate learner responses via Lovable AI gateway |

### Files to Modify

| File | Change |
|------|--------|
| `src/pages/onboarding/CheckpointSession.tsx` | Full rewrite — checkpoint session UI |

### Implementation Details

**Data Loading**: Same pattern as LearnerJourney — get current user, active assignment, program (with success_profiles join), then load existing `onboarding_checkpoint_responses` for this assignment + phase.

**UI — One Question at a Time**:
- Header: "[Phase] Knowledge Checkpoint" with progress "X of Y answered"
- Question card with Previous/Next navigation arrows
- Unanswered: textarea (6 rows) + "Submit Answer" button
- Answered: read-only response, score as 5 filled/unfilled stars, "Coach Feedback" callout box, "✓ Answered" badge
- Empty state if no questions configured

**Submit Flow**:
1. Show "Coach is reviewing your answer..." loading state
2. Call `evaluate-checkpoint` edge function
3. Save response to `onboarding_checkpoint_responses`
4. Display score + feedback inline
5. If gating enforced and score < threshold, show constructive callout
6. Auto-advance to next unanswered question after 2s delay

**Completion State**: When all answered — summary screen with average score, per-question breakdown, "Review Answers" and "Return to My Journey" buttons.

**Retake**: If all questions already answered on load, show read-only mode with "Retake Checkpoint" button that deletes existing responses for this phase/assignment and resets to answering mode.

**Edge Function** (`evaluate-checkpoint`):
- Accepts `{ question, userResponse, roleName, phase, objectives }`
- Calls Lovable AI gateway (`google/gemini-3-flash-preview`) with tool calling to extract `{ score: number, feedback: string }`
- System prompt: onboarding coach evaluating knowledge on 1-5 scale
- Handles 429/402 errors

### No Database Changes Needed
All tables and RLS policies already exist.

