

# Apex AI Platform Audit: Issues Found & Recommended Fixes

## Issues Identified

### 1. Remaining Lovable Branding in `index.html` (HIGH)
**Location:** `index.html` lines 12-18
**Issue:** OpenGraph description says "Lovable Generated Project", OG image points to lovable.dev, Twitter card references @Lovable and lovable.dev image.
**Fix:** Update OG description to "Apex AI by Solutionment — The AI Operating System for Revenue Teams", replace OG/Twitter images with Apex AI branding (or `/favicon.png`), change Twitter site to Solutionment's handle or remove it.

### 2. Lovable References in User-Facing Text (MEDIUM)
**Location:** `src/pages/WorkspaceAdmin.tsx` line 351, `src/pages/Help.tsx` line 294
**Issue:** "Connected via Lovable AI" shown to users in the API Keys section and Help content.
**Fix:** Change to "Connected via Apex AI Gateway" or simply "AI Gateway — Active".

### 3. Missing SPA Fallback in `_redirects` (HIGH)
**Location:** `public/_redirects`
**Issue:** The file only has rules for `/about` and `/brochure`. There is NO SPA fallback rule (`/* /index.html 200`). This means any direct navigation to React routes (e.g., `/departments/sales`, `/help`, `/settings`) will return a 404 on production/Netlify.
**Fix:** Add `/* /index.html 200` as the LAST line in `_redirects`.

### 4. Settings Page Doesn't Persist Workspace Name/Industry (LOW)
**Location:** `src/pages/Settings.tsx` lines 39-40, 94
**Issue:** `workspaceName` and `industry` are hardcoded defaults ("Solutionment", "Technology Consulting"). The Save button only shows a toast — it doesn't actually write to the database.
**Fix:** Load values from `workspace_settings` on mount and upsert on save.

### 5. Skill Builder Missing "file" Input Type Option (MEDIUM)
**Location:** `src/pages/Capabilities.tsx` lines 27-34
**Issue:** The `inputTypes` array for the Skill Builder doesn't include `{ value: "file", label: "File Upload" }`, even though the Help docs and SkillForm support it. Users cannot create skills with file inputs via the builder UI.
**Fix:** Add `{ value: "file", label: "File Upload" }` to the `inputTypes` array.

### 6. Department Page Agent Description Inconsistency (LOW)
**Location:** `src/pages/Help.tsx` lines 57-59
**Issue:** Help docs say Sales has "Agents: Coach, Content Writer, Strategist" (missing Researcher). The code (`departmentAgents`) now has all 4 agents for all departments, but the help text is inconsistent.
**Fix:** Update Help text to list all 4 agents for each department.

### 7. `workspace_settings` Upsert Uses `onConflict: "key"` Without Tenant Scoping (MEDIUM)
**Location:** `src/pages/WorkspaceAdmin.tsx` lines 245, 258, 266, 273
**Issue:** The upsert uses `onConflict: "key"` but `workspace_settings` likely needs `onConflict: "tenant_id,key"` since it's a multi-tenant table. If the unique constraint is only on `key`, one tenant's settings could overwrite another's.
**Fix:** Verify the unique constraint on `workspace_settings` and adjust the upsert accordingly to use the composite key.

### 8. AuthGuard Race Condition with `onAuthStateChange` (LOW)
**Location:** `src/components/AuthGuard.tsx` lines 61-63
**Issue:** The `onAuthStateChange` listener is set up before `initialized.current` is set to `true`, meaning early auth state changes are silently dropped. This is intentional to prevent premature redirects, but if a sign-out happens during initialization, it could be missed.
**Fix:** Minor — current behavior is acceptable but could be documented.

### 9. Capabilities Page `displayName` Search Not Included (LOW)
**Location:** `src/pages/Capabilities.tsx` line 367
**Issue:** Search only checks `s.name` and `s.description`, not `s.displayName`. Users searching by the visible display name (e.g., "Company Research") won't find skills if the internal name differs.
**Fix:** Add `!(s.displayName || "").toLowerCase().includes(search.toLowerCase())` to the filter.

### 10. `agent-client.ts` Uses Anon Key for Auth (NOTE)
**Location:** `src/lib/agent-client.ts` lines 23, 109
**Issue:** Uses `VITE_SUPABASE_PUBLISHABLE_KEY` for Authorization header instead of the user's session token. This means edge functions receive the anon key, not the user's JWT, which limits per-user authorization on the backend.
**Fix:** Get the session token via `supabase.auth.getSession()` and use it in the Authorization header.

---

## Summary of Recommended Fixes

| # | Severity | Issue | File(s) |
|---|----------|-------|---------|
| 1 | HIGH | Lovable branding in OG/Twitter meta tags | `index.html` |
| 2 | MEDIUM | "Lovable AI" text visible to users | `WorkspaceAdmin.tsx`, `Help.tsx` |
| 3 | HIGH | Missing SPA fallback in _redirects | `public/_redirects` |
| 4 | LOW | Settings don't persist to database | `Settings.tsx` |
| 5 | MEDIUM | Missing "file" input type in Skill Builder | `Capabilities.tsx` |
| 6 | LOW | Help docs list wrong agents per department | `Help.tsx` |
| 7 | MEDIUM | Upsert onConflict may not be tenant-scoped | `WorkspaceAdmin.tsx` |
| 8 | LOW | Auth initialization race condition | `AuthGuard.tsx` |
| 9 | LOW | Search doesn't include displayName | `Capabilities.tsx` |
| 10 | NOTE | Anon key used instead of user JWT | `agent-client.ts` |

### Implementation Priority
1. Fix `_redirects` SPA fallback (breaks production routing)
2. Remove all Lovable branding from `index.html` and user-facing text
3. Add "file" input type to Skill Builder
4. Fix search to include displayName
5. Update Help docs agent lists
6. Address settings persistence and upsert scoping as follow-ups

