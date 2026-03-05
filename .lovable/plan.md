

## Plan: Build Program Builder, Program List, and Assignment Flow

### Overview
Build the full Program List page, a multi-step Program Builder, an AI-powered checkpoint question generator edge function, and an assignment modal with user lookup and deadline configuration.

### Files to Create

| File | Purpose |
|------|---------|
| `supabase/functions/generate-checkpoint-questions/index.ts` | Edge function to generate checkpoint questions via Lovable AI |
| `src/components/onboarding/AssignUserDialog.tsx` | Multi-step assignment modal (find user, set dates, confirm) |
| `src/components/onboarding/KnowledgeDocPicker.tsx` | Searchable picker for KB documents with chip/tag display |
| `src/components/onboarding/CheckpointQuestionsEditor.tsx` | Question list + inline add form + AI generate button |

### Files to Modify

| File | Change |
|------|--------|
| `src/pages/onboarding/ProgramList.tsx` | Full implementation with program cards, assignment counts, assign button |
| `src/pages/onboarding/ProgramBuilder.tsx` | Full 3-step builder (select profile, details, phase config with KB docs + checkpoints) |

### Implementation Details

**Program List Page**: Fetches programs from `onboarding_programs` joined with `success_profiles` (for role name) and counts active assignments. Card grid showing program name, linked profile role name (clickable link to profile edit), KB doc counts per phase, total checkpoint questions, active assignment count, Edit button, and "Assign to User" button. Empty state with prompt to create first program.

**Program Builder** — 3-step wizard using local state:

- **Step 1**: Fetch tenant's `success_profiles` (non-template). Searchable grid of cards. Selecting one stores the profile ID and data, advances to step 2.
- **Step 2**: Program name (pre-filled as "[Role Name] Onboarding Program"), enforce checkpoint gating toggle. Simple form.
- **Step 3**: Three collapsible phase sections. Each shows phase name, duration, objectives (read-only from selected profile). Two sub-sections per phase:
  - **Knowledge Content**: `KnowledgeDocPicker` queries `knowledge_documents` table, shows searchable list, selected docs as removable chips.
  - **Checkpoint Questions**: `CheckpointQuestionsEditor` with question list, inline add form (question textarea + optional threshold 1-5), delete button, and "Generate Questions with AI" button.

Save builds the `phase_content` JSONB array and inserts/updates `onboarding_programs`.

**Checkpoint Question AI Generation** (`generate-checkpoint-questions`):
- Accepts `{ phase, objectives, documentTitles }` body
- Calls Lovable AI gateway (`google/gemini-3-flash-preview`) with tool calling to return `{ questions: string[] }`
- System prompt instructs generation of 3-5 open-ended checkpoint questions based on phase context
- Returns array of question strings; UI shows them as clickable suggestions

**Assignment Dialog** (`AssignUserDialog`):
- Step 1: Email input queries `user_profiles` table (same tenant). Shows user name/email when found.
- Step 2: Start date picker (defaults today). Three phase deadline date pickers, pre-filled from start date + profile phase durations, editable.
- Step 3: Summary card with user, program, role, timeline. "Assign" button inserts into `onboarding_assignments` with status "active", currentPhase "immerse", phase deadlines, program/user IDs.
- Success toast with user and program name.

### Data Flow

Programs reference `success_profile_id`. The `phase_content` JSONB stores per-phase `assignedKbDocumentIds` and `checkpointQuestions` arrays. Assignments reference `program_id` and `user_id`, storing `phase_deadlines` and `phase_completed_at` as JSONB.

