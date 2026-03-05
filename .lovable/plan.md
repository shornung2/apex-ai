

## Plan: Reorganize Onboarding Admin into Workspace Admin + Conditional Sidebar

### Overview
Move the three admin-facing onboarding surfaces (Success Profiles, Programs, Assignments) into the Workspace Admin page as new tabs. Make the sidebar "Onboarding" section conditional — only shown to users who have an active assignment, displaying just "My Journey". Add an "Assign Program" button to the Assignments tab.

### Files to Modify

| File | Change |
|------|--------|
| `src/components/AppSidebar.tsx` | Remove Success Profiles, Programs, Assignments from sidebar. Make Onboarding section conditional based on whether current user has an active assignment. |
| `src/pages/WorkspaceAdmin.tsx` | Add three new tabs: "Success Profiles", "Programs", "Onboarding" (assignments). Embed the existing page components or inline the content. |
| `src/pages/onboarding/AdminDashboard.tsx` | Add a prominent "Assign Program" button that opens a dialog where admin selects a program first, then assigns users. Add validation: only 1 active assignment per user. |
| `src/contexts/TenantContext.tsx` | Add `hasActiveAssignment: boolean` to context, queried from `onboarding_assignments` for the current user. |
| `src/App.tsx` | Keep routes as-is (they still work), but the sidebar controls visibility. |

### Implementation Details

**TenantContext Enhancement**: Add a second query to check if the current user has any active/paused assignment in `onboarding_assignments`. Expose `hasActiveAssignment: boolean` on the context.

**Sidebar Changes**:
- Remove the entire "Onboarding" collapsible section with its 4 items (Success Profiles, Programs, Assignments, My Journey)
- Add a new conditional section: if `hasActiveAssignment` is true, show an "Onboarding" group with just "My Journey" link
- Admin items (Success Profiles, Programs, Assignments) move to Workspace Admin

**Workspace Admin Tabs**: Add 3 new tabs to the existing tab bar:
- "Profiles" — renders `SuccessProfileList` inline (or a lightweight wrapper that embeds it)
- "Programs" — renders `ProgramList` inline
- "Onboarding" — renders `AdminDashboard` inline

Since these are full page components, we'll render them directly inside the tab content areas. The existing route-based pages will still work for direct navigation and sub-routes (e.g., `/talent/onboarding/profiles/new`).

**Assignment Flow Enhancement** (AdminDashboard):
- Add "Assign to Program" button at the top of the page
- Opens a new dialog: Step 1 — select a program from a dropdown. Step 2 — reuses the existing `AssignUserDialog` flow (find user, set dates, confirm)
- Before assigning, check if the user already has an active assignment. If so, show a warning: "This user already has an active onboarding program. Only one active program can be assigned at a time."
- This prevents duplicate active assignments

**Improvement Recommendations** (included in implementation):
1. **Duplicate assignment guard**: Query `onboarding_assignments` for the selected user before confirming — block if `status = 'active'` already exists
2. **Invalidate sidebar state**: After assigning, invalidate the `hasActiveAssignment` query so the learner's sidebar updates on their next load

### No Database Changes Needed
All tables and RLS policies already exist.

