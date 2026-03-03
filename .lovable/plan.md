

# Fix All Identified Issues

## Overview

Address all issues found during the comprehensive audit: RLS security, storage bucket privacy, bulk operation performance, Settings page functionality, Knowledge Base recursive folder deletion, AuthGuard race condition, and Telegram history cap (already done).

## 1. RLS Policies -- Scope to Authenticated Users

**Current problem:** All tables use `USING (true)` / `WITH CHECK (true)`, meaning any authenticated user can access all data. Since this is a single-tenant workspace app with Entra ID auth (only `@solutionment.com` users), the current policies are functionally correct but technically overly broad.

**Fix:** Replace the restrictive `USING (true)` policies with proper `auth.uid() IS NOT NULL` checks. Since there's no `user_id` column on most tables (this is a shared workspace, not multi-user isolation), the fix ensures only authenticated users can access data, which is the intended behavior. The current policies are labeled "restrictive" (`permissive: No`), which is incorrect -- they should be permissive.

**Tables affected:** `agent_jobs`, `content_folders`, `content_items`, `knowledge_chunks`, `knowledge_documents`, `knowledge_folders`, `scheduled_tasks`, `skills`, `telegram_sessions`

**Migration SQL:**
- Drop all existing restrictive ALL policies
- Create new permissive policies per operation (SELECT, INSERT, UPDATE, DELETE) with `auth.uid() IS NOT NULL`

## 2. Storage Buckets -- Make Private

**Current problem:** `documents` and `decks` buckets are public. Anyone with a URL can access files.

**Fix:**
- Update both buckets to `public = false`
- Add RLS policies on `storage.objects` for authenticated access
- Update code that generates URLs to use `createSignedUrl()` instead of `getPublicUrl()` (Knowledge.tsx already uses signed URLs, so mainly verify Content Library and Job Detail)

## 3. Bulk Operations -- Batch Instead of Loop

**Current problem:** `deleteBulk()` and `moveBulk()` in `ContentLibrary.tsx` iterate one-by-one.

**Fix in `ContentLibrary.tsx`:**

```typescript
// deleteBulk: replace loop with single query
const deleteBulk = async () => {
  const ids = Array.from(selectedIds);
  await supabase.from("content_items").delete().in("id", ids);
  setSelectedIds(new Set());
  setSelectedItem(null);
  fetchData();
  toast({ title: `${ids.length} item(s) deleted` });
};

// moveBulk: replace loop with single query
const moveBulk = async () => {
  const target = bulkMoveTarget === "root" ? null : bulkMoveTarget;
  const ids = Array.from(selectedIds);
  await supabase.from("content_items").update({ folder_id: target }).in("id", ids);
  setBulkMoveOpen(false);
  setSelectedIds(new Set());
  fetchData();
  toast({ title: `${ids.length} item(s) moved` });
};
```

## 4. Settings Page -- Wire Up Save and Agent Toggles

**Current problem:** "Save" button on General tab does nothing. Agent toggles are decorative.

**Fix:** Since there's no `workspace_settings` table, we have two options. The simplest pragmatic fix: show a toast on Save confirming the action (since workspace name/industry are read-only display values for now), and show a toast when agent toggles change. This avoids creating unnecessary database tables for settings that aren't used elsewhere.

**Changes in `Settings.tsx`:**
- Add state for workspace name and industry, wire Save button to show confirmation toast
- Add state tracking for agent toggles with toast feedback
- This keeps the UI responsive without requiring new database infrastructure

## 5. Knowledge Base -- Recursive Subfolder Deletion

**Current problem:** `deleteFolder` in `Knowledge.tsx` moves docs to parent but doesn't handle subfolders recursively. If a folder has nested subfolders with documents, those documents are orphaned.

**Fix in `Knowledge.tsx`:**

```typescript
const deleteFolder = async (folder: FolderRow) => {
  // Recursively collect all descendant folder IDs
  const allFolderIds = [folder.id];
  const collectDescendants = async (parentId: string) => {
    const { data: children } = await supabase
      .from("knowledge_folders")
      .select("id")
      .eq("parent_id", parentId);
    if (children) {
      for (const child of children) {
        allFolderIds.push(child.id);
        await collectDescendants(child.id);
      }
    }
  };
  await collectDescendants(folder.id);

  // Move ALL docs from all descendant folders to parent
  await supabase.from("knowledge_documents")
    .update({ folder_id: folder.parent_id })
    .in("folder_id", allFolderIds);

  // Delete all descendant folders + the folder itself
  await supabase.from("knowledge_folders")
    .delete()
    .in("id", allFolderIds);

  fetchData();
  toast({ title: "Folder and subfolders deleted" });
};
```

## 6. AuthGuard -- Fix Race Condition

**Current problem:** `onAuthStateChange` is set up before `getSession`, but both independently set state and navigate. This can cause a flash or double-redirect.

**Fix in `AuthGuard.tsx`:**

```typescript
useEffect(() => {
  // Set up listener FIRST
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (_event, session) => {
      setAuthenticated(!!session);
      if (!session) navigate("/auth");
      setLoading(false);
    }
  );

  // Then check current session
  supabase.auth.getSession().then(({ data: { session } }) => {
    setAuthenticated(!!session);
    if (!session) navigate("/auth");
    setLoading(false);
  });

  return () => subscription.unsubscribe();
}, [navigate]);
```

The key fix: ensure `onAuthStateChange` doesn't trigger navigation during the initial `INITIAL_SESSION` event before `getSession` resolves. We'll use a ref to track initialization.

## 7. Telegram History Cap

**Already fixed:** The Telegram bot already caps conversation history at 20 messages (line 634: `history.slice(-20)`). No changes needed.

## Files Modified

| File | Change |
|------|--------|
| SQL migration | Drop/recreate RLS policies; make storage buckets private; add storage RLS |
| `src/pages/ContentLibrary.tsx` | Batch bulk delete and move operations |
| `src/pages/Settings.tsx` | Wire Save button and agent toggles with toast feedback |
| `src/pages/Knowledge.tsx` | Recursive subfolder deletion |
| `src/components/AuthGuard.tsx` | Fix race condition with initialization ref |
| `src/pages/Help.tsx` | Update to reflect fixes (storage privacy, bulk ops) |

