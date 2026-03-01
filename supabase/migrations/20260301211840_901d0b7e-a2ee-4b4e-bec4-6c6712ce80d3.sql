
-- Add new columns to skills table for the six-step skill builder
ALTER TABLE public.skills
  ADD COLUMN IF NOT EXISTS display_name text,
  ADD COLUMN IF NOT EXISTS version text NOT NULL DEFAULT '1.0.0',
  ADD COLUMN IF NOT EXISTS system_prompt text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS trigger_keywords text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS preferred_model text NOT NULL DEFAULT 'haiku',
  ADD COLUMN IF NOT EXISTS preferred_lane text NOT NULL DEFAULT 'simple_haiku',
  ADD COLUMN IF NOT EXISTS token_budget integer NOT NULL DEFAULT 10000,
  ADD COLUMN IF NOT EXISTS estimated_cost_usd decimal(10,4),
  ADD COLUMN IF NOT EXISTS required_capabilities text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS web_search_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS approval_required boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS timeout_seconds integer NOT NULL DEFAULT 120,
  ADD COLUMN IF NOT EXISTS output_format text NOT NULL DEFAULT 'markdown',
  ADD COLUMN IF NOT EXISTS output_schema jsonb NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS export_formats text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Add unique constraint on name for ON CONFLICT in seed
ALTER TABLE public.skills ADD CONSTRAINT skills_name_unique UNIQUE (name);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_skills_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_skills_updated_at
  BEFORE UPDATE ON public.skills
  FOR EACH ROW
  EXECUTE FUNCTION public.update_skills_updated_at();
