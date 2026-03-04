-- Allow admins to update their own tenant's name
CREATE POLICY "admins_update_tenant"
ON public.tenants
FOR UPDATE
TO authenticated
USING (id = get_my_tenant_id())
WITH CHECK (id = get_my_tenant_id());