
-- Enable pg_cron and pg_net extensions
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Add schedulable column to skills
ALTER TABLE public.skills ADD COLUMN schedulable boolean NOT NULL DEFAULT false;

-- Create scheduled_tasks table
CREATE TABLE public.scheduled_tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  skill_id uuid NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  skill_name text NOT NULL,
  department text NOT NULL,
  agent_type text NOT NULL,
  title text NOT NULL,
  inputs jsonb NOT NULL DEFAULT '{}'::jsonb,
  schedule_type text NOT NULL DEFAULT 'daily',
  cron_expression text NOT NULL,
  next_run_at timestamptz,
  last_run_at timestamptz,
  last_job_id uuid,
  status text NOT NULL DEFAULT 'active',
  run_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.scheduled_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to scheduled_tasks"
ON public.scheduled_tasks FOR ALL
USING (true)
WITH CHECK (true);

-- Add scheduled_task_id to agent_jobs
ALTER TABLE public.agent_jobs ADD COLUMN scheduled_task_id uuid REFERENCES public.scheduled_tasks(id);
