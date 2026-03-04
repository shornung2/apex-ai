

# Multi-Tenancy Foundation for Apex AI

## Summary

Run a single large database migration that creates the tenants/user_profiles tables, adds `tenant_id` to all 8 data tables, backfills existing data to a default Solutionment tenant, and replaces all RLS policies with tenant-scoped versions. Then update the frontend code to include `tenant_id` in all inserts/queries.

## Database Migration

A single migration containing the 6 steps you specified:

1. **Create `tenants` table** with plan/status checks, RLS policy via `get_my_tenant_id()`
2. **Create `user_profiles` table** with role check, self-referencing RLS (with `SECURITY DEFINER` helper to avoid recursion)
3. **Create `get_my_tenant_id()` function** — `SECURITY DEFINER`, stable
4. **Seed Solutionment tenant** — `('Solutionment', 'solutionment', '{solutionment.com}', 'enterprise', 'active')`
5. **Add `tenant_id`** to all 8 tables (skills, agent_jobs, knowledge_documents, knowledge_chunks, content_folders, content_items, scheduled_tasks, workspace_settings) — nullable add, backfill, then NOT NULL + indexes
6. **Replace RLS policies** — drop all existing `auth_*` policies, create `tenant_*` policies using `get_my_tenant_id()` for all 8 tables

### RLS Recursion Note

The `profiles_select_own` policy references `user_profiles` itself. To avoid infinite recursion, the sub-select `(SELECT tenant_id FROM public.user_profiles WHERE id = auth.uid())` will be replaced with `public.get_my_tenant_id()` which is `SECURITY DEFINER` and bypasses RLS.

Similarly, `tenants_select` will use `get_my_tenant_id()` instead of a direct sub-query on `user_profiles`.

## Frontend Code Changes

After the migration, update all code that inserts or queries tenant-scoped tables to include `tenant_id`:

### Files to update:

| File | Change |
|---|---|
| `src/pages/Capabilities.tsx` | Include `tenant_id` from user profile when saving/creating skills |
| `src/pages/Knowledge.tsx` | Include `tenant_id` on document/folder inserts |
| `src/pages/ContentLibrary.tsx` | Include `tenant_id` on content_items/content_folders inserts |
| `src/pages/Tasks.tsx` | Include `tenant_id` on scheduled_tasks inserts |
| `src/pages/Dashboard.tsx` | No change needed — selects are filtered by RLS automatically |
| `src/pages/History.tsx` | No change needed — selects filtered by RLS |
| `src/pages/Settings.tsx` | Include `tenant_id` on workspace_settings inserts |
| `src/lib/agent-client.ts` | Include `tenant_id` when creating agent_jobs |
| Edge functions (`agent-dispatch`, `task-scheduler`, etc.) | Use service_role key so they bypass RLS; ensure they set `tenant_id` from the calling user's profile |

### Tenant ID retrieval pattern

Create a shared hook `src/hooks/use-tenant.ts`:

```typescript
// Fetches and caches the current user's tenant_id from user_profiles
const { data: profile } = useQuery({
  queryKey: ["my-profile"],
  queryFn: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase.from("user_profiles").select("tenant_id, role, full_name").eq("id", user.id).single();
    return data;
  }
});
```

All pages that perform inserts will use `profile.tenant_id`.

### Auth flow update

In `src/components/AuthGuard.tsx` or a post-login hook: after sign-in, check if `user_profiles` row exists. If not, auto-create one by looking up the tenant via `allowed_domains` matching the user's email domain. This replaces explicit tenant assignment.

## Technical Details

- The `profiles_select_own` policy allows users to see all profiles within their tenant (for team features later), but only update their own
- `get_my_tenant_id()` is `SECURITY DEFINER` to avoid RLS recursion — it reads `user_profiles` without being subject to the table's own policies
- Indexes on `tenant_id` ensure query performance at scale
- Edge functions using `service_role` key are unaffected by RLS but should still scope queries by `tenant_id` for correctness
- The `telegram_sessions` table is excluded from tenant scoping since it uses `chat_id` (Telegram-specific) rather than org-scoped data

