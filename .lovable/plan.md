

# Plan: UI Fixes + App Testing + Recommendations

## 1. UI Changes

### 1a. Remove "Apex AI" text from sidebar logo
In `src/components/AppSidebar.tsx` (lines 108-113), remove the "Apex AI" paragraph but keep "by Solutionment":
```
Before:
  <p className="text-xs font-medium text-muted-foreground">Apex AI</p>
  <p className="text-[11px] text-muted-foreground">by Solutionment</p>

After:
  <p className="text-[11px] text-muted-foreground">by Solutionment</p>
```

### 1b. Update Alex chat icon to use new logo
In `src/components/AlexChat.tsx`, replace all 3 occurrences of `/favicon.jpg` with `/favicon.png` (the new Apex AI icon):
- Line 120: floating button image
- Line 129: chat header image
- Line 143: welcome screen image

---

## 2. Test Plan and Issues Found

After thorough code review of all pages, edge functions, and data layer, here are the issues identified:

### Issue 1: AlexChat still references old `/favicon.jpg`
- **Severity**: Medium
- **Location**: `src/components/AlexChat.tsx` lines 120, 129, 143
- **Problem**: Three `<img>` tags still reference `/favicon.jpg` (old icon) instead of the new `/favicon.png`
- **Fix**: Part of 1b above

### Issue 2: No RLS policies visible -- public data exposure risk
- **Severity**: High (security)
- **Problem**: Tables like `skills`, `agent_jobs`, `knowledge_documents`, `scheduled_tasks`, `content_items`, `content_folders` likely have no RLS or fully open RLS since there's no authentication. All data is accessible to any anonymous user with the anon key.
- **Impact**: Anyone with the project URL could read/write/delete all data
- **Recommendation**: Implement authentication and proper RLS policies (addressed in recommendations)

### Issue 3: `prose-invert` always applied in Knowledge Base viewer
- **Severity**: Low
- **Location**: `src/pages/Knowledge.tsx` line 192
- **Problem**: `prose-invert` is hardcoded, so in light mode the markdown text will be white-on-white (invisible)
- **Fix**: Change to `prose dark:prose-invert`

### Issue 4: `prose-invert` always applied in Job Detail output
- **Severity**: Low
- **Location**: `src/pages/JobDetail.tsx` line 211
- **Problem**: Same as above -- hardcoded `prose-invert` breaks light mode
- **Fix**: Change to `prose dark:prose-invert`

### Issue 5: Settings "Save" button on General tab is non-functional
- **Severity**: Low
- **Location**: `src/pages/Settings.tsx` line 102
- **Problem**: The Save button and input fields are presentational only -- no save handler is connected
- **Impact**: Users may think they can save workspace settings but nothing happens

### Issue 6: Agent Switches in Settings do nothing
- **Severity**: Low
- **Location**: `src/pages/Settings.tsx` lines 156-167
- **Problem**: The Switch toggles for agents are decorative -- no state or handler
- **Impact**: Misleading UI

### Issue 7: Telegram bot `SkillInput.id` may be undefined
- **Severity**: Medium (already partially fixed)
- **Location**: `supabase/functions/telegram-bot/index.ts` line 294
- **Problem**: Previous fix addressed `collectedInputs` key, but the `id` field on the `SkillInput` interface is declared as required (`id: string`) while the database may not always provide it. If `field` is also missing, inputs could still be stored under `undefined`.
- **Recommendation**: Add defensive fallback: `currentInput.field || currentInput.id || currentInput.label`

### Issue 8: No error boundary in the app
- **Severity**: Medium
- **Problem**: If any page component throws, the entire app crashes with a white screen
- **Recommendation**: Add a React error boundary

---

## 3. Fixes to Implement

| # | Fix | File |
|---|-----|------|
| 1 | Remove "Apex AI" text under logo | `src/components/AppSidebar.tsx` |
| 2 | Update Alex chat icon to `/favicon.png` | `src/components/AlexChat.tsx` |
| 3 | Fix `prose-invert` in Knowledge Base | `src/pages/Knowledge.tsx` |
| 4 | Fix `prose-invert` in Job Detail | `src/pages/JobDetail.tsx` |
| 5 | Add label fallback in Telegram bot | `supabase/functions/telegram-bot/index.ts` |

---

## 4. Recommendations to Improve the App

1. **Add Authentication** -- This is the highest priority. Without auth, all database tables are publicly accessible. Implement email/password signup and login, then add RLS policies scoped to authenticated users.

2. **Error Boundary** -- Add a global React error boundary to catch rendering crashes and show a friendly fallback UI instead of a blank screen.

3. **Pagination on History Page** -- Currently limited to 100 jobs. Add cursor-based pagination or infinite scroll for users with many runs.

4. **Skill Deletion Confirmation** -- The delete button in Capabilities triggers immediately with no confirmation dialog. Add an AlertDialog to prevent accidental deletions.

5. **Knowledge Base: Support PDF/DOCX** -- Currently only accepts `.txt`, `.md`, `.csv` files. Consider adding PDF parsing via an edge function for broader document support.

6. **Realtime Job Updates on Dashboard** -- The dashboard fetches data once on mount. Add realtime subscription to `agent_jobs` so the Recent Activity feed updates live without refresh.

7. **Mobile Responsiveness** -- Several pages (Content Library, History table) may not render well on small screens. Test and optimize the layout for mobile viewports.

8. **Export Content as PDF** -- Content Library currently only supports Markdown download. Add PDF export option for more professional deliverables.

9. **Task Execution Engine** -- The `task-scheduler` edge function exists but scheduled tasks need an external cron trigger (e.g., pg_cron or external scheduler) to actually execute. Verify this is wired up.

10. **Dark/Light Mode Consistency** -- Several components use hardcoded dark-mode classes. Do a sweep to ensure all UI works correctly in both themes.

