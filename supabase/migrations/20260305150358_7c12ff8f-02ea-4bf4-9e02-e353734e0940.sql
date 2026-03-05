
CREATE TABLE public.coaching_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.skills(id),
  skill_name TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  session_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.coaching_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_select_coaching_sessions" ON public.coaching_sessions
  FOR SELECT TO authenticated USING (tenant_id = get_my_tenant_id());

CREATE POLICY "tenant_insert_coaching_sessions" ON public.coaching_sessions
  FOR INSERT TO authenticated WITH CHECK (tenant_id = get_my_tenant_id());

CREATE POLICY "tenant_update_coaching_sessions" ON public.coaching_sessions
  FOR UPDATE TO authenticated USING (tenant_id = get_my_tenant_id());

CREATE POLICY "tenant_delete_coaching_sessions" ON public.coaching_sessions
  FOR DELETE TO authenticated USING (tenant_id = get_my_tenant_id());

ALTER PUBLICATION supabase_realtime ADD TABLE public.coaching_sessions;
