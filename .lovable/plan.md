

## Plan: Build Admin Onboarding Dashboard

### Overview
Full rewrite of `src/pages/onboarding/AdminDashboard.tsx` — an admin cockpit showing all onboarding assignments with stats, filtering, a detail drawer, and program actions. No notebook data exposed.

### Files to Modify

| File | Change |
|------|--------|
| `src/pages/onboarding/AdminDashboard.tsx` | Full rewrite |

### No Database Changes Needed
All tables and RLS policies already exist.

### Implementation Details

**Data Loading**: Query `onboarding_assignments` for the tenant, then batch-load related data:
- `onboarding_programs` + `success_profiles` (for role/program names)
- `onboarding_checkpoint_responses` (scores per assignment/phase)
- `onboarding_roleplay_sessions` (best scores per assignment/session type)

**Layout**:
1. Header with dynamic subtitle ("N active programs, N learners in progress")
2. Four stat cards: Active, Completed, At Risk (overdue deadline + incomplete phase), Avg Checkpoint Score
3. Filter bar: program dropdown, phase filter, status filter (All/Active/At Risk/Completed), search by name/email
4. Two tabs: "Active & At Risk" and "Completed"
5. Table with columns per spec (learner, role, program, phase badge, deadline, checkpoint score, elevator/capstone scores, status, actions)

**At Risk Logic**: `status === "active"` AND current phase deadline is in the past AND that phase is not in `phase_completed_at`.

**Detail Drawer** (Sheet component, right side): Opens on "View Detail" click. Sections:
- Learner info (name, email, role, program, start date)
- Phase timeline (3 rows: phase name, deadline, completion date, checkpoint avg)
- Checkpoint detail: questions + scores + agent feedback grouped by phase. No learner response text.
- Role-play performance: session counts, best scores, "Review Best Session" button opening a read-only conversation modal
- Program actions: "Mark as Complete" (update status), "Pause Program" (set status to "paused"), "Reassign Program" (reuses `AssignUserDialog` with the same program)

**Reassign**: Opens the existing `AssignUserDialog` pre-filled with the same program. Creates a new assignment (no overwrite).

**Mark Complete / Pause**: Direct mutations updating `onboarding_assignments.status`.

**Review Best Session Modal**: A Dialog showing the conversation history from the highest-scored roleplay session in a chat-style read-only format.

