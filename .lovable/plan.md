

# Multi-Tenancy Foundation for Apex AI — COMPLETED

## Summary

Converted the platform from a single-workspace internal tool to a multi-tenant SaaS foundation. All data tables are now scoped by `tenant_id` with RLS policies enforcing tenant isolation.

## What was done

### Database Migration
1. ✅ Created `tenants` table with plan/status/allowed_domains
2. ✅ Created `user_profiles` table with role, tenant_id, RLS
3. ✅ Created `get_my_tenant_id()` SECURITY DEFINER function (avoids RLS recursion)
4. ✅ Created `get_tenant_for_domain()` SECURITY DEFINER function (for auto-provisioning)
5. ✅ Seeded default 'Solutionment' tenant
6. ✅ Added `tenant_id` to all 9 data tables (skills, agent_jobs, knowledge_documents, knowledge_chunks, knowledge_folders, content_folders, content_items, scheduled_tasks, workspace_settings)
7. ✅ Backfilled all existing data to Solutionment tenant
8. ✅ Replaced all `auth_*` RLS policies with `tenant_*` policies using `get_my_tenant_id()`
9. ✅ Added indexes on `tenant_id` for all tables

### Frontend Changes
- ✅ Created `src/hooks/use-tenant.ts` — caches user profile (tenant_id, role, full_name)
- ✅ Updated `AuthGuard` to auto-provision user_profiles on sign-in via domain matching
- ✅ Added `tenant_id` to all insert/upsert calls in: Capabilities, Knowledge, ContentLibrary, Tasks, Settings, SaveToLibraryDialog, JobDetail, Department
- ✅ Updated `agent-client.ts` (runSkill, runDeckSkill) to pass tenantId

### Edge Functions
- ✅ `agent-dispatch` — accepts tenantId, includes in job insert
- ✅ `generate-deck` — accepts tenantId, includes in job insert
- ✅ `knowledge-ingest` — accepts tenant_id, includes in document and chunk inserts
- ✅ `task-scheduler` — passes task.tenant_id to agent-dispatch

## Architecture Notes
- `telegram_sessions` excluded from tenant scoping (Telegram chat_id based)
- `get_my_tenant_id()` is SECURITY DEFINER to avoid RLS recursion on user_profiles/tenants
- Edge functions use service_role key (bypass RLS) but still scope by tenant_id
- New users are auto-provisioned to a tenant based on email domain matching
