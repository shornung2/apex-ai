

## Plan: Build Learner Journey View

### Overview
Build a rich, guided learner-facing page at `/talent/onboarding/my-journey` that shows the new hire's onboarding progress, current phase tasks, assigned reading, and role-play sessions. This is one large page component with no new database changes needed.

### Files to Create

| File | Purpose |
|------|---------|
| `src/pages/onboarding/LearnerJourney.tsx` | Full rewrite — main journey page |

### Files to Modify
None beyond the journey page itself. All routes already exist.

### Implementation Details

**Data Loading**: On mount, get current user via `supabase.auth.getUser()`, then query `onboarding_assignments` where `user_id = user.id` and `status = 'active'`. If none found, show empty state. If found, fetch the linked `onboarding_programs` (with `success_profiles` join) by `program_id`, plus `onboarding_notebook_entries`, `onboarding_checkpoint_responses`, and `onboarding_roleplay_sessions` filtered by `assignment_id`.

**Layout Structure**:

1. **Welcome Header**: "Welcome, [first name]" with program name and start date subtitle. Generous spacing, larger text.

2. **Phase Progress Stepper**: Horizontal 3-step stepper (Immerse → Observe → Demonstrate). Each step shows phase name, icon/color (blue/amber/green), deadline ("Due [date]" or "Overdue" in red), checkmark + completion date for completed phases. Clicking a completed phase shows a popover with checkpoint avg score and notebook entry count.

3. **Current Phase Panel**: A prominent card containing:
   - Phase name with icon and color
   - Objectives list from the Success Profile's phaseConfig ("By the end of this phase, you should be able to:")
   - **Assigned Reading**: List of KB docs from program's phaseContent for this phase, queried by ID from `knowledge_documents`. Each shows title + "View" link (navigates to `/knowledge` or opens doc).
   - **Phase Tasks**: Phase-specific task cards:
     - Immerse: Checkpoint task only
     - Observe: "Record observation" (link to notebook), "3 notebook entries" progress, checkpoint task
     - Demonstrate: Elevator Pitch card (shows topic, session count, best score, "Enter Practice Session" button), Capstone Prep card (shows scenario brief, practice count, best score, "Practice the Capstone" button)
   - Task completion indicators pulled from DB data (checkpoint responses exist? notebook entry count? roleplay sessions with scores?)

4. **Sidebar/Bottom Strip**: Days remaining in phase (or "Phase overdue"), quick link to Notebook, overall completion % (phases completed / 3).

5. **Phase Advancement Banner**: Shown when all tasks in current phase are complete. If `enforceCheckpointGating` is true, verify all checkpoint questions answered with scores >= threshold. Banner has "Mark Phase Complete & Advance" button that updates `current_phase` and `phase_completed_at` in `onboarding_assignments`.

6. **Completion Screen**: When all 3 phases done, update status to "completed" and show congratulations with summary stats (checkpoint scores, notebook count, roleplay best scores).

### Technical Notes

- Use `useTenant()` for tenant context but get user ID from `supabase.auth.getUser()` for the assignment query
- All DB queries use existing tables with RLS — no migration needed
- Phase deadlines and completed dates come from JSONB fields on the assignment
- KB doc titles fetched separately via `knowledge_documents` table filtered by IDs from `phaseContent.assignedKbDocumentIds`
- Checkpoint completion determined by counting `onboarding_checkpoint_responses` matching the assignment + phase vs total questions in the program's phaseContent
- Roleplay stats from `onboarding_roleplay_sessions` filtered by assignment + session type
- Use Tooltip/Popover from existing UI components for completed phase summaries
- Use framer-motion for subtle entrance animations to give the "companion" feel
- Responsive: sidebar becomes bottom strip on mobile via `use-mobile` hook

