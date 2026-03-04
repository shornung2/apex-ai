
CREATE OR REPLACE FUNCTION public.validate_feedback_rating()
RETURNS trigger LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.feedback_rating IS NOT NULL AND NEW.feedback_rating NOT IN (1, -1) THEN
    RAISE EXCEPTION 'feedback_rating must be 1 or -1';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_feedback_rating
BEFORE INSERT OR UPDATE ON public.agent_jobs
FOR EACH ROW EXECUTE FUNCTION public.validate_feedback_rating();
