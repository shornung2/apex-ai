
-- Success Profiles
CREATE TABLE public.success_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  role_name text NOT NULL,
  role_description text NOT NULL DEFAULT '',
  department text NOT NULL DEFAULT '',
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  phase_configs jsonb NOT NULL DEFAULT '[]'::jsonb,
  elevator_pitch_topic text NOT NULL DEFAULT '',
  capstone_scenario_description text NOT NULL DEFAULT '',
  is_template boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.success_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_select_success_profiles" ON public.success_profiles FOR SELECT TO authenticated USING (tenant_id = get_my_tenant_id());
CREATE POLICY "tenant_insert_success_profiles" ON public.success_profiles FOR INSERT TO authenticated WITH CHECK (tenant_id = get_my_tenant_id());
CREATE POLICY "tenant_update_success_profiles" ON public.success_profiles FOR UPDATE TO authenticated USING (tenant_id = get_my_tenant_id());
CREATE POLICY "tenant_delete_success_profiles" ON public.success_profiles FOR DELETE TO authenticated USING (tenant_id = get_my_tenant_id());

-- Onboarding Programs
CREATE TABLE public.onboarding_programs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  success_profile_id uuid NOT NULL REFERENCES public.success_profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  phase_content jsonb NOT NULL DEFAULT '[]'::jsonb,
  enforce_checkpoint_gating boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.onboarding_programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_select_onboarding_programs" ON public.onboarding_programs FOR SELECT TO authenticated USING (tenant_id = get_my_tenant_id());
CREATE POLICY "tenant_insert_onboarding_programs" ON public.onboarding_programs FOR INSERT TO authenticated WITH CHECK (tenant_id = get_my_tenant_id());
CREATE POLICY "tenant_update_onboarding_programs" ON public.onboarding_programs FOR UPDATE TO authenticated USING (tenant_id = get_my_tenant_id());
CREATE POLICY "tenant_delete_onboarding_programs" ON public.onboarding_programs FOR DELETE TO authenticated USING (tenant_id = get_my_tenant_id());

-- Onboarding Assignments
CREATE TABLE public.onboarding_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  program_id uuid NOT NULL REFERENCES public.onboarding_programs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  user_display_name text NOT NULL DEFAULT '',
  user_email text NOT NULL DEFAULT '',
  current_phase text NOT NULL DEFAULT 'immerse',
  started_at timestamptz NOT NULL DEFAULT now(),
  phase_deadlines jsonb NOT NULL DEFAULT '[]'::jsonb,
  phase_completed_at jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'active'
);

ALTER TABLE public.onboarding_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_select_onboarding_assignments" ON public.onboarding_assignments FOR SELECT TO authenticated USING (tenant_id = get_my_tenant_id());
CREATE POLICY "tenant_insert_onboarding_assignments" ON public.onboarding_assignments FOR INSERT TO authenticated WITH CHECK (tenant_id = get_my_tenant_id());
CREATE POLICY "tenant_update_onboarding_assignments" ON public.onboarding_assignments FOR UPDATE TO authenticated USING (tenant_id = get_my_tenant_id());
CREATE POLICY "tenant_delete_onboarding_assignments" ON public.onboarding_assignments FOR DELETE TO authenticated USING (tenant_id = get_my_tenant_id());

-- Notebook Entries
CREATE TABLE public.onboarding_notebook_entries (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id uuid NOT NULL REFERENCES public.onboarding_assignments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  phase text NOT NULL,
  entry_type text NOT NULL DEFAULT 'observation',
  content text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.onboarding_notebook_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_select_onboarding_notebook_entries" ON public.onboarding_notebook_entries FOR SELECT TO authenticated USING (tenant_id = get_my_tenant_id());
CREATE POLICY "tenant_insert_onboarding_notebook_entries" ON public.onboarding_notebook_entries FOR INSERT TO authenticated WITH CHECK (tenant_id = get_my_tenant_id());
CREATE POLICY "tenant_update_onboarding_notebook_entries" ON public.onboarding_notebook_entries FOR UPDATE TO authenticated USING (tenant_id = get_my_tenant_id());
CREATE POLICY "tenant_delete_onboarding_notebook_entries" ON public.onboarding_notebook_entries FOR DELETE TO authenticated USING (tenant_id = get_my_tenant_id());

-- Checkpoint Responses
CREATE TABLE public.onboarding_checkpoint_responses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id uuid NOT NULL REFERENCES public.onboarding_assignments(id) ON DELETE CASCADE,
  program_id uuid NOT NULL REFERENCES public.onboarding_programs(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  phase text NOT NULL,
  question_id text NOT NULL,
  question text NOT NULL,
  user_response text NOT NULL DEFAULT '',
  agent_score integer NOT NULL DEFAULT 0,
  agent_feedback text NOT NULL DEFAULT '',
  evaluated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.onboarding_checkpoint_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_select_onboarding_checkpoint_responses" ON public.onboarding_checkpoint_responses FOR SELECT TO authenticated USING (tenant_id = get_my_tenant_id());
CREATE POLICY "tenant_insert_onboarding_checkpoint_responses" ON public.onboarding_checkpoint_responses FOR INSERT TO authenticated WITH CHECK (tenant_id = get_my_tenant_id());
CREATE POLICY "tenant_update_onboarding_checkpoint_responses" ON public.onboarding_checkpoint_responses FOR UPDATE TO authenticated USING (tenant_id = get_my_tenant_id());
CREATE POLICY "tenant_delete_onboarding_checkpoint_responses" ON public.onboarding_checkpoint_responses FOR DELETE TO authenticated USING (tenant_id = get_my_tenant_id());

-- Role-Play Sessions
CREATE TABLE public.onboarding_roleplay_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id uuid NOT NULL REFERENCES public.onboarding_assignments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  session_type text NOT NULL DEFAULT 'elevator_pitch',
  conversation_history jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_complete boolean NOT NULL DEFAULT false,
  overall_score integer,
  rubric_scores jsonb,
  summary_feedback text,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE public.onboarding_roleplay_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_select_onboarding_roleplay_sessions" ON public.onboarding_roleplay_sessions FOR SELECT TO authenticated USING (tenant_id = get_my_tenant_id());
CREATE POLICY "tenant_insert_onboarding_roleplay_sessions" ON public.onboarding_roleplay_sessions FOR INSERT TO authenticated WITH CHECK (tenant_id = get_my_tenant_id());
CREATE POLICY "tenant_update_onboarding_roleplay_sessions" ON public.onboarding_roleplay_sessions FOR UPDATE TO authenticated USING (tenant_id = get_my_tenant_id());
CREATE POLICY "tenant_delete_onboarding_roleplay_sessions" ON public.onboarding_roleplay_sessions FOR DELETE TO authenticated USING (tenant_id = get_my_tenant_id());
