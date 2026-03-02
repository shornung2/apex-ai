
-- Create knowledge_folders table
CREATE TABLE public.knowledge_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  parent_id uuid REFERENCES public.knowledge_folders(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.knowledge_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage knowledge_folders"
ON public.knowledge_folders FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- Add folder_id to knowledge_documents
ALTER TABLE public.knowledge_documents
ADD COLUMN folder_id uuid REFERENCES public.knowledge_folders(id) ON DELETE SET NULL;
