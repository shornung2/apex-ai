-- Create skill_packs table
CREATE TABLE public.skill_packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  target_segment TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create skill_pack_templates table
CREATE TABLE public.skill_pack_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id UUID NOT NULL REFERENCES public.skill_packs(id) ON DELETE CASCADE,
  skill_template JSONB NOT NULL,
  display_order INT DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.skill_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_pack_templates ENABLE ROW LEVEL SECURITY;

-- Read-only policies for authenticated users
CREATE POLICY "packs_readable" ON public.skill_packs FOR SELECT TO authenticated USING (true);
CREATE POLICY "templates_readable" ON public.skill_pack_templates FOR SELECT TO authenticated USING (true);