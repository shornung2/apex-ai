
-- Usage events table for transparent billing
CREATE TABLE public.usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  tokens_used INTEGER NOT NULL DEFAULT 0,
  model_used TEXT,
  skill_id UUID REFERENCES public.skills(id) ON DELETE SET NULL,
  job_id UUID REFERENCES public.agent_jobs(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Use a validation trigger instead of CHECK constraint
CREATE OR REPLACE FUNCTION public.validate_usage_event_type()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.event_type NOT IN ('agent_job', 'deck_generation', 'knowledge_ingest', 'api_call') THEN
    RAISE EXCEPTION 'Invalid event_type: %. Must be agent_job, deck_generation, knowledge_ingest, or api_call.', NEW.event_type;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_usage_event_type
  BEFORE INSERT OR UPDATE ON public.usage_events
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_usage_event_type();

ALTER TABLE public.usage_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_select_usage" ON public.usage_events
  FOR SELECT TO authenticated
  USING (tenant_id = get_my_tenant_id());

CREATE INDEX idx_usage_events_tenant_date ON public.usage_events(tenant_id, created_at DESC);
CREATE INDEX idx_usage_events_type ON public.usage_events(tenant_id, event_type);
