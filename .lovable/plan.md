

## Plan: Build Learner Onboarding Notebook

### Overview
Implement the full notebook page at `/talent/onboarding/my-journey/notebook` with entry CRUD, filtering by type and phase, and PDF export. One file to rewrite: `src/pages/onboarding/LearnerNotebook.tsx`.

### Files to Modify

| File | Change |
|------|--------|
| `src/pages/onboarding/LearnerNotebook.tsx` | Full implementation |

### No Database Changes Needed
All tables (`onboarding_notebook_entries`, `onboarding_assignments`, `onboarding_programs`, `success_profiles`) already exist with appropriate RLS policies.

### Implementation Details

**Data Loading**: Get current user, then active assignment, then program + profile (same pattern as LearnerJourney). Load all notebook entries for the assignment ordered by `created_at` desc.

**Layout**:
1. Header with role/program subtitle and "Export PDF" button
2. Filter bar: entry type tabs (All/Observations/Questions/Insights/Key Learnings) + phase filter dropdown
3. New entry composer card pinned at top: 4 toggle pill buttons for type, textarea, read-only phase badge, "Save Entry" button
4. Filtered entry list with edit/delete actions

**Entry Cards**: Type icon + color-coded label, phase badge, full content, relative timestamp (using `date-fns` `formatDistanceToNow`), inline edit mode, delete with AlertDialog confirmation.

**CRUD**: 
- Insert: `onboarding_notebook_entries` with assignment_id, user_id, tenant_id, phase (current), entry_type, content
- Update: content and entry_type, set updated_at
- Delete: by id

**PDF Export**: Use `jsPDF` (already installed) to generate a structured PDF with cover section, privacy note, and entries grouped by phase then by entry type. Trigger browser download.

**Privacy**: No admin views created. Only the authenticated user's own entries are accessible via RLS (tenant-scoped, but user_id filtering in queries ensures privacy).

