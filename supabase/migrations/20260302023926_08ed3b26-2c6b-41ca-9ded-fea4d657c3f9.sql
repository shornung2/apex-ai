
CREATE TABLE public.telegram_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id BIGINT NOT NULL UNIQUE,
  state TEXT NOT NULL DEFAULT 'idle',
  selected_skill_id UUID,
  collected_inputs JSONB NOT NULL DEFAULT '{}'::jsonb,
  current_input_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.telegram_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to telegram_sessions"
  ON public.telegram_sessions
  FOR ALL
  USING (true)
  WITH CHECK (true);
