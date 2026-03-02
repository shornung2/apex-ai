ALTER TABLE public.telegram_sessions 
ADD COLUMN conversation_history jsonb NOT NULL DEFAULT '[]'::jsonb;