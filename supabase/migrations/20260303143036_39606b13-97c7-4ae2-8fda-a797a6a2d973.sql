
CREATE TABLE public.workspace_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.workspace_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_select_workspace_settings" ON public.workspace_settings
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

CREATE POLICY "auth_insert_workspace_settings" ON public.workspace_settings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "auth_update_workspace_settings" ON public.workspace_settings
  FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);

CREATE POLICY "auth_delete_workspace_settings" ON public.workspace_settings
  FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- Seed default settings
INSERT INTO public.workspace_settings (key, value) VALUES
  ('openrouter_enabled', 'false'::jsonb),
  ('openrouter_models', '[]'::jsonb);
