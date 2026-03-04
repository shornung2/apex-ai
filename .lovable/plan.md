

# TenantContext Migration Plan

## Summary

Convert the existing `useTenant` hook into a React Context so tenant data is fetched once at the app root and shared across all components without redundant queries. Add richer tenant metadata (name, plan, status) and role-based flags. Add a loading spinner while tenant context resolves.

## What Changes

### 1. Create `src/contexts/TenantContext.tsx`
- Query `user_profiles` joined with `tenants` for `auth.uid()`:
  ```sql
  user_profiles.select("tenant_id, role, full_name, email, onboarding_complete, tenants(name, plan, status)")
  ```
- Store: `tenantId`, `tenantName`, `tenantPlan`, `tenantStatus`, `userRole`, `onboardingComplete`
- Derived: `isAdmin` (admin or super_admin), `isSuperAdmin` (super_admin only)
- If no profile row exists, set `isLoading = false` and all values to `null`
- Export `TenantProvider` component and `useTenant()` hook (replaces the existing hook)

### 2. Wire into App
- In `src/App.tsx`, wrap the `AuthGuard` children with `<TenantProvider>`
- While `isLoading` is true, render a full-screen centered spinner (Loader2 icon) instead of app content
- Place the provider inside `AuthGuard` so it only runs when authenticated

### 3. Delete old hook
- Remove `src/hooks/use-tenant.ts`
- Update all imports of `useTenant` across the codebase to point to `@/contexts/TenantContext`

### 4. Files with import changes (no logic changes needed)
All these files already use `const { tenantId } = useTenant()` — just update the import path:
- `src/pages/Capabilities.tsx`
- `src/pages/Knowledge.tsx`
- `src/pages/ContentLibrary.tsx`
- `src/pages/Tasks.tsx`
- `src/pages/Settings.tsx`
- `src/pages/Department.tsx`
- `src/pages/JobDetail.tsx`
- `src/components/SaveToLibraryDialog.tsx`

### 5. Edge functions — no changes needed
All edge functions (`agent-dispatch`, `generate-deck`, `knowledge-ingest`, `task-scheduler`, `alex-chat`) already receive and use `tenantId` correctly. No changes required.

## Technical Details

- The context uses a single `useQuery` call with `staleTime: 5min` to avoid refetching
- The `tenants` table has a foreign key relationship from `user_profiles.tenant_id` to `tenants.id`, so the Supabase join syntax works
- No database migration needed — the schema already supports this query
- The `profiles_select_own` RLS policy allows reading your own profile, and `tenants_select` allows reading your own tenant row, so the joined query works under RLS

