

# App Audit: Inconsistencies, Friction Points & Improvements

## Issues Found

### 1. Hardcoded TOKEN_BUDGET in Settings page
`src/pages/Settings.tsx` line 19 has `const TOKEN_BUDGET = 50_000` hardcoded, but the actual tenant budget comes from `tenants.token_budget_monthly`. The Settings page ignores the real budget and always shows 50k. Meanwhile, `WorkspaceAdmin.tsx` correctly fetches the tenant's real budget. This is misleading.

**Fix:** Fetch the tenant's `token_budget_monthly` from the database and use it instead of the hardcoded constant.

### 2. Missing "Save to My Saves" button on JobDetail page
The JobDetail output section (line 237) only has one `SaveToLibraryDialog` with no `scope` prop (defaults to `"workspace"`). There is no way to save directly to My Saves from a job result, despite the Help docs claiming both options are available.

**Fix:** Add a second `SaveToLibraryDialog` with `scope="personal"` next to the existing one.

### 3. Settings page allows all users to edit workspace name/industry
The "General" tab in Settings lets any member change the workspace name and industry. These are workspace-level settings that should be admin-only.

**Fix:** Gate the save button and input editability behind `isAdmin` from `useTenant()`. Show read-only for non-admins.

### 4. "Save to KB" button not gated by role
On JobDetail (line 234), any user can save outputs to the Knowledge Base. Since the Knowledge Base is a shared workspace resource, this should arguably be admin-controlled or at least follow the same pattern as other workspace resources.

**Fix:** Consider making this admin-only, or add a workspace setting to control it (lower priority).

### 5. Sidebar label inconsistency: "Workspace Library" vs code
The sidebar in `AppSidebar.tsx` shows "Workspace Library" for the content library route, which is correct. However, the breadcrumb inside `ContentLibrary.tsx` line 289 says "All Content" at root level. Should say "Workspace Library" for consistency.

**Fix:** Change breadcrumb root label from "All Content" to "Workspace Library".

### 6. Empty state messaging inconsistency
- Dashboard empty state: "No agent runs yet. Go to a department and run a skill!"
- My Saves empty state: "Save content from agent outputs to access it here"
- Content Library has no empty state for items when there are folders but no items in current folder — it just shows nothing.

**Fix:** Add an empty state to ContentLibrary when currentItems is empty (there is a conditional but it's missing — the table just renders with no rows).

### 7. No loading state on MySaves page
`MySaves.tsx` has no loading indicator. Data fetches silently. ContentLibrary also lacks a loading state.

**Fix:** Add a loading spinner similar to Dashboard and other pages.

### 8. Workspace name shown nowhere in the UI
Users can set a workspace name in Settings, but it's never displayed in the header, sidebar, or anywhere visible. This creates confusion about which workspace you're in, especially for super admins.

**Fix:** Display the workspace name in the sidebar header below the logo, or in the top header bar.

### 9. AuthGuard loading state inconsistency
`AuthGuard.tsx` shows "Loading..." as plain text, while `TenantContext.tsx` shows a proper spinner. These should match for a consistent experience.

**Fix:** Use the same `Loader2` spinner in AuthGuard.

## Summary of Changes

| # | Issue | Files | Priority |
|---|-------|-------|----------|
| 1 | Hardcoded token budget in Settings | `Settings.tsx` | High |
| 2 | Missing "Save to My Saves" on JobDetail | `JobDetail.tsx` | High |
| 3 | Non-admin can edit workspace settings | `Settings.tsx` | High |
| 4 | Breadcrumb says "All Content" not "Workspace Library" | `ContentLibrary.tsx` | Medium |
| 5 | No loading state on MySaves/ContentLibrary | `MySaves.tsx`, `ContentLibrary.tsx` | Medium |
| 6 | Display workspace name in sidebar | `AppSidebar.tsx` | Medium |
| 7 | AuthGuard loading style mismatch | `AuthGuard.tsx` | Low |
| 8 | Empty state for ContentLibrary items | `ContentLibrary.tsx` | Low |

