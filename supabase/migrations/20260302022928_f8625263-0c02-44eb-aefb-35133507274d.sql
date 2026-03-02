
-- Create content_folders table
CREATE TABLE public.content_folders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES public.content_folders(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.content_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to content_folders"
  ON public.content_folders FOR ALL
  USING (true) WITH CHECK (true);

-- Create content_items table
CREATE TABLE public.content_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  folder_id UUID REFERENCES public.content_folders(id) ON DELETE SET NULL,
  agent_type TEXT,
  skill_id TEXT,
  skill_name TEXT,
  department TEXT,
  job_id UUID,
  owner TEXT NOT NULL DEFAULT 'system',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.content_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to content_items"
  ON public.content_items FOR ALL
  USING (true) WITH CHECK (true);

-- Enable realtime for content_items
ALTER PUBLICATION supabase_realtime ADD TABLE public.content_items;
