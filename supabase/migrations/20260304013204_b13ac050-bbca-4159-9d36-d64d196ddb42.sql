
-- Add feedback columns to agent_jobs
ALTER TABLE public.agent_jobs ADD COLUMN IF NOT EXISTS feedback_rating smallint;
ALTER TABLE public.agent_jobs ADD COLUMN IF NOT EXISTS feedback_note text;

-- 1. admin_list_all_tenants: returns all tenants with user count
CREATE OR REPLACE FUNCTION public.admin_list_all_tenants()
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  plan text,
  status text,
  allowed_domains text[],
  token_budget_monthly int,
  created_at timestamptz,
  user_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF (SELECT role FROM public.user_profiles WHERE user_profiles.id = auth.uid()) != 'super_admin' THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  RETURN QUERY
    SELECT t.id, t.name, t.slug, t.plan, t.status, t.allowed_domains, t.token_budget_monthly, t.created_at,
           COALESCE(cnt.c, 0) as user_count
    FROM public.tenants t
    LEFT JOIN (SELECT up.tenant_id, COUNT(*)::bigint as c FROM public.user_profiles up WHERE up.status = 'active' GROUP BY up.tenant_id) cnt ON cnt.tenant_id = t.id
    ORDER BY t.created_at DESC;
END;
$$;

-- 2. admin_list_all_agent_jobs: cross-tenant job listing with filters
CREATE OR REPLACE FUNCTION public.admin_list_all_agent_jobs(
  _tenant_id uuid DEFAULT NULL,
  _status text DEFAULT NULL,
  _date_from timestamptz DEFAULT NULL,
  _date_to timestamptz DEFAULT NULL,
  _search text DEFAULT NULL,
  _feedback_rating smallint DEFAULT NULL,
  _limit int DEFAULT 100,
  _offset int DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  tenant_id uuid,
  tenant_name text,
  title text,
  agent_type text,
  department text,
  status text,
  tokens_used int,
  skill_id text,
  feedback_rating smallint,
  feedback_note text,
  created_at timestamptz,
  completed_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF (SELECT role FROM public.user_profiles WHERE user_profiles.id = auth.uid()) != 'super_admin' THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  RETURN QUERY
    SELECT j.id, j.tenant_id, t.name as tenant_name, j.title, j.agent_type, j.department, j.status,
           j.tokens_used, j.skill_id, j.feedback_rating, j.feedback_note, j.created_at, j.completed_at
    FROM public.agent_jobs j
    JOIN public.tenants t ON t.id = j.tenant_id
    WHERE (_tenant_id IS NULL OR j.tenant_id = _tenant_id)
      AND (_status IS NULL OR j.status = _status)
      AND (_date_from IS NULL OR j.created_at >= _date_from)
      AND (_date_to IS NULL OR j.created_at <= _date_to)
      AND (_search IS NULL OR j.title ILIKE '%' || _search || '%')
      AND (_feedback_rating IS NULL OR j.feedback_rating = _feedback_rating)
    ORDER BY j.created_at DESC
    LIMIT _limit OFFSET _offset;
END;
$$;

-- 3. admin_insert_tenant: create a new tenant
CREATE OR REPLACE FUNCTION public.admin_insert_tenant(
  _name text,
  _slug text,
  _plan text DEFAULT 'starter',
  _allowed_domains text[] DEFAULT '{}'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _id uuid;
BEGIN
  IF (SELECT role FROM public.user_profiles WHERE user_profiles.id = auth.uid()) != 'super_admin' THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  INSERT INTO public.tenants (name, slug, plan, allowed_domains)
  VALUES (_name, _slug, _plan, _allowed_domains)
  RETURNING tenants.id INTO _id;
  
  INSERT INTO public.workspace_settings (tenant_id, key, value)
  VALUES (_id, 'general', '{}');
  
  RETURN _id;
END;
$$;

-- 4. admin_update_tenant: update any tenant
CREATE OR REPLACE FUNCTION public.admin_update_tenant(
  _id uuid,
  _name text DEFAULT NULL,
  _plan text DEFAULT NULL,
  _status text DEFAULT NULL,
  _allowed_domains text[] DEFAULT NULL,
  _token_budget_monthly int DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF (SELECT role FROM public.user_profiles WHERE user_profiles.id = auth.uid()) != 'super_admin' THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  UPDATE public.tenants SET
    name = COALESCE(_name, tenants.name),
    plan = COALESCE(_plan, tenants.plan),
    status = COALESCE(_status, tenants.status),
    allowed_domains = COALESCE(_allowed_domains, tenants.allowed_domains),
    token_budget_monthly = COALESCE(_token_budget_monthly, tenants.token_budget_monthly),
    updated_at = NOW()
  WHERE tenants.id = _id;
END;
$$;

-- 5. admin_usage_summary: per-tenant usage for current month
CREATE OR REPLACE FUNCTION public.admin_usage_summary()
RETURNS TABLE (
  tenant_id uuid,
  tenant_name text,
  plan text,
  jobs_this_month bigint,
  tokens_this_month bigint,
  last_active timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF (SELECT role FROM public.user_profiles WHERE user_profiles.id = auth.uid()) != 'super_admin' THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  RETURN QUERY
    SELECT t.id as tenant_id, t.name as tenant_name, t.plan,
           COUNT(j.id)::bigint as jobs_this_month,
           COALESCE(SUM(j.tokens_used), 0)::bigint as tokens_this_month,
           MAX(j.created_at) as last_active
    FROM public.tenants t
    LEFT JOIN public.agent_jobs j ON j.tenant_id = t.id
      AND j.created_at >= date_trunc('month', NOW())
    GROUP BY t.id, t.name, t.plan
    ORDER BY tokens_this_month DESC;
END;
$$;
