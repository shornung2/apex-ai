
-- Add user_id and scope columns to content_items for personal saves
ALTER TABLE public.content_items 
  ADD COLUMN IF NOT EXISTS user_id uuid,
  ADD COLUMN IF NOT EXISTS scope text NOT NULL DEFAULT 'workspace';

-- Drop existing RLS policies and recreate with scope awareness
DROP POLICY IF EXISTS "tenant_select_content_items" ON public.content_items;
DROP POLICY IF EXISTS "tenant_insert_content_items" ON public.content_items;
DROP POLICY IF EXISTS "tenant_update_content_items" ON public.content_items;
DROP POLICY IF EXISTS "tenant_delete_content_items" ON public.content_items;

-- SELECT: workspace items visible to all tenant members, personal items only to owner
CREATE POLICY "tenant_select_content_items" ON public.content_items
  FOR SELECT TO authenticated
  USING (
    tenant_id = get_my_tenant_id() 
    AND (scope = 'workspace' OR (scope = 'personal' AND user_id = auth.uid()))
  );

-- INSERT: must belong to user's tenant
CREATE POLICY "tenant_insert_content_items" ON public.content_items
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = get_my_tenant_id());

-- UPDATE: workspace items by tenant, personal items only by owner
CREATE POLICY "tenant_update_content_items" ON public.content_items
  FOR UPDATE TO authenticated
  USING (
    tenant_id = get_my_tenant_id()
    AND (scope = 'workspace' OR (scope = 'personal' AND user_id = auth.uid()))
  );

-- DELETE: workspace items by tenant, personal items only by owner
CREATE POLICY "tenant_delete_content_items" ON public.content_items
  FOR DELETE TO authenticated
  USING (
    tenant_id = get_my_tenant_id()
    AND (scope = 'workspace' OR (scope = 'personal' AND user_id = auth.uid()))
  );
