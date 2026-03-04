
-- Create a SECURITY DEFINER function to look up tenant by email domain
-- This is callable before a user_profile exists (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_tenant_for_domain(_domain TEXT)
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.tenants WHERE _domain = ANY(allowed_domains) LIMIT 1
$$;
