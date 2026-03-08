

# Tenant-Scoped Access Control Audit & Personal Content Library

## Current State Assessment

**What's working correctly:**
- RLS policies on all tables use `get_my_tenant_id()` — data isolation is enforced at the database level
- `TenantContext` provides `isAdmin`, `isSuperAdmin`, `userRole` flags
- Workspace Admin page is behind `isAdmin` check in sidebar
- Super Admin page is behind `isSuperAdmin` check in sidebar
- All workspace data (skills, jobs, knowledge, content, tasks) is tenant-scoped via RLS

**Issues Found:**

1. **No route-level guards on admin pages** — WorkspaceAdmin and SuperAdmin pages are hidden from the sidebar but accessible by URL. Anyone can navigate to `/workspace-admin` or `/super-admin` directly.

2. **Capabilities page lacks admin gating** — The Skill Builder (create/edit/delete skills) is available to all members. Regular members should be able to *use* skills but not *build/edit/delete* them.

3. **No personal content library** — Content Library is workspace-scoped only. Need a user-level space for personal saves/notes.

## Plan

### 1. Add Route-Level Access Guards

Add an `<AdminGuard>` wrapper component that redirects non-admin users away from protected routes. Apply it to:
- `/workspace-admin` — requires `isAdmin`
- `/super-admin` — requires `isSuperAdmin`

**Files:** Create `src/components/AdminGuard.tsx`, update `src/App.tsx`

### 2. Scope Capabilities Page by Role

- All users: can *view* and *run* skills
- Admins only: can *create*, *edit*, *delete* skills via the Skill Builder tab

In `Capabilities.tsx`, hide the "Skill Builder" tab and related CRUD buttons for non-admin users. The skill *list* and *run* functionality remain available to everyone.

**File:** `src/pages/Capabilities.tsx`

### 3. Add Personal Content Library ("My Saves")

**Naming strategy** to avoid confusion:
- Existing workspace content library stays as **"Content Library"** (workspace-level, shared)
- New personal library: **"My Saves"** (user-level, private)

**Database changes:**
- Add `user_id` column (nullable) to `content_items` table
- Add `scope` column (`workspace` | `personal`, default `workspace`) to `content_items`
- Add RLS policy: personal items visible only to their owner
- Update existing RLS select policy to include `scope = 'personal' AND user_id = auth.uid()`

**Frontend changes:**
- New page `src/pages/MySaves.tsx` — similar UI to ContentLibrary but filtered to `scope = 'personal'` and `user_id = current user`
- Add "My Saves" nav item to sidebar (under Tools, with a `Bookmark` icon)
- Add "Save to My Saves" action in job detail view and Content Library item detail
- New route `/my-saves`

**Files:** Migration SQL, `src/pages/MySaves.tsx`, `src/components/AppSidebar.tsx`, `src/App.tsx`, update `src/pages/ContentLibrary.tsx` header to clarify "Workspace Content Library"

### 4. Content Library Scoping Clarification

- Rename Content Library header from "Content Library" to **"Workspace Library"**
- Subtitle: "Shared content produced by agents across your workspace"
- My Saves subtitle: "Your personal saved content and notes"

## Summary of Changes

| Change | Files |
|--------|-------|
| AdminGuard component | New: `AdminGuard.tsx`, Edit: `App.tsx` |
| Route protection | `App.tsx` |
| Capabilities role scoping | `Capabilities.tsx` |
| Personal content DB schema | New migration |
| My Saves page | New: `MySaves.tsx` |
| Sidebar + routing | `AppSidebar.tsx`, `App.tsx` |
| Content Library rename | `ContentLibrary.tsx` |

