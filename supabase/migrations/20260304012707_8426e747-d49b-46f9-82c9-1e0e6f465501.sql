ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';

-- Add a validation trigger instead of CHECK constraint
CREATE OR REPLACE FUNCTION public.validate_user_profile_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status NOT IN ('active', 'removed') THEN
    RAISE EXCEPTION 'Invalid status: %. Must be active or removed.', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_user_profile_status
  BEFORE INSERT OR UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_user_profile_status();