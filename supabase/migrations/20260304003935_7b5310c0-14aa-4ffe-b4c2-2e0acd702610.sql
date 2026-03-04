
-- STEP 1: Create tenants table
CREATE TABLE public.tenants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  allowed_domains TEXT[] NOT NULL DEFAULT '{}',
  plan TEXT NOT NULL DEFAULT 'starter' CHECK (plan IN ('starter', 'managed', 'enterprise')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'trial')),
  token_budget_monthly INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- STEP 2: Create user_profiles table
CREATE TABLE public.user_profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('super_admin', 'admin', 'member')),
  onboarding_complete BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- STEP 3: Create helper function (SECURITY DEFINER to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.get_my_tenant_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM public.user_profiles WHERE id = auth.uid()
$$;

-- STEP 4: Enable RLS on new tables
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Tenants: users can read their own tenant row
CREATE POLICY "tenants_select" ON public.tenants FOR SELECT TO authenticated
  USING (id = public.get_my_tenant_id());

-- User profiles: users can see all profiles in their tenant, update only their own
CREATE POLICY "profiles_select_own" ON public.user_profiles FOR SELECT TO authenticated
  USING (tenant_id = public.get_my_tenant_id());

CREATE POLICY "profiles_update_own" ON public.user_profiles FOR UPDATE TO authenticated
  USING (id = auth.uid());

-- Allow insert for auto-provisioning (user can only insert their own row)
CREATE POLICY "profiles_insert_own" ON public.user_profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

-- STEP 5: Seed default Solutionment tenant
INSERT INTO public.tenants (name, slug, allowed_domains, plan, status)
VALUES ('Solutionment', 'solutionment', '{solutionment.com}', 'enterprise', 'active');

-- STEP 6: Add tenant_id to all 8 data tables, backfill, set NOT NULL
DO $$
DECLARE solutionment_tenant_id UUID;
BEGIN
  SELECT id INTO solutionment_tenant_id FROM public.tenants WHERE slug = 'solutionment';

  -- Add columns
  ALTER TABLE public.skills ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
  ALTER TABLE public.agent_jobs ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
  ALTER TABLE public.knowledge_documents ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
  ALTER TABLE public.knowledge_chunks ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
  ALTER TABLE public.content_folders ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
  ALTER TABLE public.content_items ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
  ALTER TABLE public.scheduled_tasks ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
  ALTER TABLE public.workspace_settings ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

  -- Backfill
  UPDATE public.skills SET tenant_id = solutionment_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.agent_jobs SET tenant_id = solutionment_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.knowledge_documents SET tenant_id = solutionment_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.knowledge_chunks SET tenant_id = solutionment_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.content_folders SET tenant_id = solutionment_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.content_items SET tenant_id = solutionment_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.scheduled_tasks SET tenant_id = solutionment_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.workspace_settings SET tenant_id = solutionment_tenant_id WHERE tenant_id IS NULL;

  -- Set NOT NULL
  ALTER TABLE public.skills ALTER COLUMN tenant_id SET NOT NULL;
  ALTER TABLE public.agent_jobs ALTER COLUMN tenant_id SET NOT NULL;
  ALTER TABLE public.knowledge_documents ALTER COLUMN tenant_id SET NOT NULL;
  ALTER TABLE public.knowledge_chunks ALTER COLUMN tenant_id SET NOT NULL;
  ALTER TABLE public.content_folders ALTER COLUMN tenant_id SET NOT NULL;
  ALTER TABLE public.content_items ALTER COLUMN tenant_id SET NOT NULL;
  ALTER TABLE public.scheduled_tasks ALTER COLUMN tenant_id SET NOT NULL;
  ALTER TABLE public.workspace_settings ALTER COLUMN tenant_id SET NOT NULL;
END $$;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_skills_tenant ON public.skills(tenant_id);
CREATE INDEX IF NOT EXISTS idx_agent_jobs_tenant ON public.agent_jobs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_tenant ON public.knowledge_documents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_tenant ON public.knowledge_chunks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_content_folders_tenant ON public.content_folders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_content_items_tenant ON public.content_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_tenant ON public.scheduled_tasks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_workspace_settings_tenant ON public.workspace_settings(tenant_id);

-- STEP 7: Drop old RLS policies and create tenant-scoped ones

-- SKILLS
DROP POLICY IF EXISTS "auth_select_skills" ON public.skills;
DROP POLICY IF EXISTS "auth_insert_skills" ON public.skills;
DROP POLICY IF EXISTS "auth_update_skills" ON public.skills;
DROP POLICY IF EXISTS "auth_delete_skills" ON public.skills;
CREATE POLICY "tenant_select_skills" ON public.skills FOR SELECT TO authenticated USING (tenant_id = public.get_my_tenant_id());
CREATE POLICY "tenant_insert_skills" ON public.skills FOR INSERT TO authenticated WITH CHECK (tenant_id = public.get_my_tenant_id());
CREATE POLICY "tenant_update_skills" ON public.skills FOR UPDATE TO authenticated USING (tenant_id = public.get_my_tenant_id());
CREATE POLICY "tenant_delete_skills" ON public.skills FOR DELETE TO authenticated USING (tenant_id = public.get_my_tenant_id());

-- AGENT_JOBS
DROP POLICY IF EXISTS "auth_select_agent_jobs" ON public.agent_jobs;
DROP POLICY IF EXISTS "auth_insert_agent_jobs" ON public.agent_jobs;
DROP POLICY IF EXISTS "auth_update_agent_jobs" ON public.agent_jobs;
DROP POLICY IF EXISTS "auth_delete_agent_jobs" ON public.agent_jobs;
CREATE POLICY "tenant_select_agent_jobs" ON public.agent_jobs FOR SELECT TO authenticated USING (tenant_id = public.get_my_tenant_id());
CREATE POLICY "tenant_insert_agent_jobs" ON public.agent_jobs FOR INSERT TO authenticated WITH CHECK (tenant_id = public.get_my_tenant_id());
CREATE POLICY "tenant_update_agent_jobs" ON public.agent_jobs FOR UPDATE TO authenticated USING (tenant_id = public.get_my_tenant_id());
CREATE POLICY "tenant_delete_agent_jobs" ON public.agent_jobs FOR DELETE TO authenticated USING (tenant_id = public.get_my_tenant_id());

-- KNOWLEDGE_DOCUMENTS
DROP POLICY IF EXISTS "auth_select_knowledge_documents" ON public.knowledge_documents;
DROP POLICY IF EXISTS "auth_insert_knowledge_documents" ON public.knowledge_documents;
DROP POLICY IF EXISTS "auth_update_knowledge_documents" ON public.knowledge_documents;
DROP POLICY IF EXISTS "auth_delete_knowledge_documents" ON public.knowledge_documents;
CREATE POLICY "tenant_select_knowledge_documents" ON public.knowledge_documents FOR SELECT TO authenticated USING (tenant_id = public.get_my_tenant_id());
CREATE POLICY "tenant_insert_knowledge_documents" ON public.knowledge_documents FOR INSERT TO authenticated WITH CHECK (tenant_id = public.get_my_tenant_id());
CREATE POLICY "tenant_update_knowledge_documents" ON public.knowledge_documents FOR UPDATE TO authenticated USING (tenant_id = public.get_my_tenant_id());
CREATE POLICY "tenant_delete_knowledge_documents" ON public.knowledge_documents FOR DELETE TO authenticated USING (tenant_id = public.get_my_tenant_id());

-- KNOWLEDGE_CHUNKS
DROP POLICY IF EXISTS "auth_select_knowledge_chunks" ON public.knowledge_chunks;
DROP POLICY IF EXISTS "auth_insert_knowledge_chunks" ON public.knowledge_chunks;
DROP POLICY IF EXISTS "auth_update_knowledge_chunks" ON public.knowledge_chunks;
DROP POLICY IF EXISTS "auth_delete_knowledge_chunks" ON public.knowledge_chunks;
CREATE POLICY "tenant_select_knowledge_chunks" ON public.knowledge_chunks FOR SELECT TO authenticated USING (tenant_id = public.get_my_tenant_id());
CREATE POLICY "tenant_insert_knowledge_chunks" ON public.knowledge_chunks FOR INSERT TO authenticated WITH CHECK (tenant_id = public.get_my_tenant_id());
CREATE POLICY "tenant_update_knowledge_chunks" ON public.knowledge_chunks FOR UPDATE TO authenticated USING (tenant_id = public.get_my_tenant_id());
CREATE POLICY "tenant_delete_knowledge_chunks" ON public.knowledge_chunks FOR DELETE TO authenticated USING (tenant_id = public.get_my_tenant_id());

-- CONTENT_FOLDERS
DROP POLICY IF EXISTS "auth_select_content_folders" ON public.content_folders;
DROP POLICY IF EXISTS "auth_insert_content_folders" ON public.content_folders;
DROP POLICY IF EXISTS "auth_update_content_folders" ON public.content_folders;
DROP POLICY IF EXISTS "auth_delete_content_folders" ON public.content_folders;
CREATE POLICY "tenant_select_content_folders" ON public.content_folders FOR SELECT TO authenticated USING (tenant_id = public.get_my_tenant_id());
CREATE POLICY "tenant_insert_content_folders" ON public.content_folders FOR INSERT TO authenticated WITH CHECK (tenant_id = public.get_my_tenant_id());
CREATE POLICY "tenant_update_content_folders" ON public.content_folders FOR UPDATE TO authenticated USING (tenant_id = public.get_my_tenant_id());
CREATE POLICY "tenant_delete_content_folders" ON public.content_folders FOR DELETE TO authenticated USING (tenant_id = public.get_my_tenant_id());

-- CONTENT_ITEMS
DROP POLICY IF EXISTS "auth_select_content_items" ON public.content_items;
DROP POLICY IF EXISTS "auth_insert_content_items" ON public.content_items;
DROP POLICY IF EXISTS "auth_update_content_items" ON public.content_items;
DROP POLICY IF EXISTS "auth_delete_content_items" ON public.content_items;
CREATE POLICY "tenant_select_content_items" ON public.content_items FOR SELECT TO authenticated USING (tenant_id = public.get_my_tenant_id());
CREATE POLICY "tenant_insert_content_items" ON public.content_items FOR INSERT TO authenticated WITH CHECK (tenant_id = public.get_my_tenant_id());
CREATE POLICY "tenant_update_content_items" ON public.content_items FOR UPDATE TO authenticated USING (tenant_id = public.get_my_tenant_id());
CREATE POLICY "tenant_delete_content_items" ON public.content_items FOR DELETE TO authenticated USING (tenant_id = public.get_my_tenant_id());

-- SCHEDULED_TASKS
DROP POLICY IF EXISTS "auth_select_scheduled_tasks" ON public.scheduled_tasks;
DROP POLICY IF EXISTS "auth_insert_scheduled_tasks" ON public.scheduled_tasks;
DROP POLICY IF EXISTS "auth_update_scheduled_tasks" ON public.scheduled_tasks;
DROP POLICY IF EXISTS "auth_delete_scheduled_tasks" ON public.scheduled_tasks;
CREATE POLICY "tenant_select_scheduled_tasks" ON public.scheduled_tasks FOR SELECT TO authenticated USING (tenant_id = public.get_my_tenant_id());
CREATE POLICY "tenant_insert_scheduled_tasks" ON public.scheduled_tasks FOR INSERT TO authenticated WITH CHECK (tenant_id = public.get_my_tenant_id());
CREATE POLICY "tenant_update_scheduled_tasks" ON public.scheduled_tasks FOR UPDATE TO authenticated USING (tenant_id = public.get_my_tenant_id());
CREATE POLICY "tenant_delete_scheduled_tasks" ON public.scheduled_tasks FOR DELETE TO authenticated USING (tenant_id = public.get_my_tenant_id());

-- WORKSPACE_SETTINGS
DROP POLICY IF EXISTS "auth_select_workspace_settings" ON public.workspace_settings;
DROP POLICY IF EXISTS "auth_insert_workspace_settings" ON public.workspace_settings;
DROP POLICY IF EXISTS "auth_update_workspace_settings" ON public.workspace_settings;
DROP POLICY IF EXISTS "auth_delete_workspace_settings" ON public.workspace_settings;
CREATE POLICY "tenant_select_workspace_settings" ON public.workspace_settings FOR SELECT TO authenticated USING (tenant_id = public.get_my_tenant_id());
CREATE POLICY "tenant_insert_workspace_settings" ON public.workspace_settings FOR INSERT TO authenticated WITH CHECK (tenant_id = public.get_my_tenant_id());
CREATE POLICY "tenant_update_workspace_settings" ON public.workspace_settings FOR UPDATE TO authenticated USING (tenant_id = public.get_my_tenant_id());
CREATE POLICY "tenant_delete_workspace_settings" ON public.workspace_settings FOR DELETE TO authenticated USING (tenant_id = public.get_my_tenant_id());

-- Also add knowledge_folders to tenant scoping
ALTER TABLE public.knowledge_folders ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
DO $$
DECLARE solutionment_tenant_id UUID;
BEGIN
  SELECT id INTO solutionment_tenant_id FROM public.tenants WHERE slug = 'solutionment';
  UPDATE public.knowledge_folders SET tenant_id = solutionment_tenant_id WHERE tenant_id IS NULL;
  ALTER TABLE public.knowledge_folders ALTER COLUMN tenant_id SET NOT NULL;
END $$;
CREATE INDEX IF NOT EXISTS idx_knowledge_folders_tenant ON public.knowledge_folders(tenant_id);

DROP POLICY IF EXISTS "auth_select_knowledge_folders" ON public.knowledge_folders;
DROP POLICY IF EXISTS "auth_insert_knowledge_folders" ON public.knowledge_folders;
DROP POLICY IF EXISTS "auth_update_knowledge_folders" ON public.knowledge_folders;
DROP POLICY IF EXISTS "auth_delete_knowledge_folders" ON public.knowledge_folders;
CREATE POLICY "tenant_select_knowledge_folders" ON public.knowledge_folders FOR SELECT TO authenticated USING (tenant_id = public.get_my_tenant_id());
CREATE POLICY "tenant_insert_knowledge_folders" ON public.knowledge_folders FOR INSERT TO authenticated WITH CHECK (tenant_id = public.get_my_tenant_id());
CREATE POLICY "tenant_update_knowledge_folders" ON public.knowledge_folders FOR UPDATE TO authenticated USING (tenant_id = public.get_my_tenant_id());
CREATE POLICY "tenant_delete_knowledge_folders" ON public.knowledge_folders FOR DELETE TO authenticated USING (tenant_id = public.get_my_tenant_id());
