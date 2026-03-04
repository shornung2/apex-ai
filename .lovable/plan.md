

# Super Admin Dashboard

## Summary

Create a new `/super-admin` page with four tabs (Tenants, Usage, Audit Log, Quality) for Solutionment staff to manage all customer tenants. Add a guarded sidebar link and backend functions to bypass tenant RLS.

## Database Changes

**Migration**: Create two SECURITY DEFINER functions that check the caller is `super_admin` before returning cross-tenant data:

1. `admin_list_all_tenants()` — returns all tenants with user count per tenant
2. `admin_list_all_agent_jobs(...)` — returns all agent_jobs joined with tenant name, with optional filters (tenant_id, status, date range, search). Used by Audit Log and Quality tabs.
3. `admin_insert_tenant(...)` — inserts a new tenant row (bypasses missing INSERT RLS)
4. `admin_update_tenant(...)` — updates any tenant row (bypasses tenant-scoped UPDATE RLS)
5. `admin_usage_summary()` — returns per-tenant aggregated usage for current month

All functions: `SECURITY DEFINER`, check `(SELECT role FROM user_profiles WHERE id = auth.uid()) = 'super_admin'`, raise exception if not.

No new tables needed. The `agent_jobs` table already has all needed columns.

## Frontend Changes

### 1. New page: `src/pages/SuperAdmin.tsx`

Four tabs using shadcn Tabs:

**Tab 1 — Tenants**: Table via `admin_list_all_tenants()` RPC. Columns: Name, Slug, Plan (badge), Status (badge), Domains, Users count, Jobs this month, Created. Actions: Edit (sheet/slide-in panel to edit name, plan, status, allowed_domains, token_budget_monthly), Suspend/Reactivate toggle. "New Tenant" button opens a dialog.

**Tab 2 — Usage Overview**: Summary cards at top (Total Active Tenants, Total Jobs, Total Tokens, Avg Tokens/Tenant). Table sorted by tokens desc from `admin_usage_summary()` RPC.

**Tab 3 — Audit Log**: All agent_jobs from `admin_list_all_agent_jobs()` RPC. Filters: tenant dropdown, status dropdown, date range, search by title. Columns: Tenant, Job Title, Agent, Department, Status, Tokens, Created At.

**Tab 4 — Quality**: Same RPC filtered for negative feedback (will need a `feedback_rating` column — but since the schema doesn't have one yet, this tab will show jobs with status `failed` as a proxy, or we add `feedback_rating` and `feedback_note` columns).

Actually, the `agent_jobs` table doesn't have `feedback_rating` or `feedback_note` columns. We need a small migration to add them.

**Migration addition**: 
```sql
ALTER TABLE agent_jobs ADD COLUMN IF NOT EXISTS feedback_rating smallint;
ALTER TABLE agent_jobs ADD COLUMN IF NOT EXISTS feedback_note text;
```

### 2. Update `src/components/AppSidebar.tsx`

- Import `Shield` from lucide-react and `useTenant`
- After the bottomItems rendering, conditionally render a "Super Admin" link with amber/yellow styling when `isSuperAdmin` is true

### 3. Update `src/App.tsx`

- Add route `/super-admin` with the new page component
- Wrap in AuthGuard + TenantProvider (already handled by the `/*` catch-all)

### 4. Route guard in `SuperAdmin.tsx`

- Check `isSuperAdmin` from TenantContext. If false, redirect to `/` and show toast "Access denied."

## Files Affected

| File | Action |
|---|---|
| Database migration | Create: RPC functions + feedback columns |
| `src/pages/SuperAdmin.tsx` | Create: full page with 4 tabs |
| `src/components/AppSidebar.tsx` | Edit: add conditional Super Admin link |
| `src/App.tsx` | Edit: add `/super-admin` route |

## Technical Notes

- All cross-tenant data access goes through SECURITY DEFINER RPCs that verify `super_admin` role server-side
- No RLS policy changes needed — RPCs bypass RLS by design
- The Quality tab filters on `feedback_rating = -1` (thumbs down)
- Job detail links open in new tabs via `window.open`

