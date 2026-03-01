
-- Knowledge documents table
CREATE TABLE public.knowledge_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  doc_type TEXT NOT NULL DEFAULT 'upload' CHECK (doc_type IN ('upload', 'agent_output')),
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'ready', 'failed')),
  tokens INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.knowledge_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to knowledge_documents" ON public.knowledge_documents FOR ALL USING (true) WITH CHECK (true);

-- Knowledge chunks table
CREATE TABLE public.knowledge_chunks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.knowledge_documents(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  chunk_index INT NOT NULL DEFAULT 0,
  tokens INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.knowledge_chunks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to knowledge_chunks" ON public.knowledge_chunks FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX idx_knowledge_chunks_document ON public.knowledge_chunks(document_id);

-- Agent jobs table
CREATE TABLE public.agent_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  skill_id TEXT NOT NULL,
  agent_type TEXT NOT NULL,
  department TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  inputs JSONB NOT NULL DEFAULT '{}',
  output TEXT,
  tokens_used INT DEFAULT 0,
  confidence_score INT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);
ALTER TABLE public.agent_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to agent_jobs" ON public.agent_jobs FOR ALL USING (true) WITH CHECK (true);
ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_jobs;

-- Skills table
CREATE TABLE public.skills (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  department TEXT NOT NULL,
  agent_type TEXT NOT NULL,
  emoji TEXT DEFAULT '⚡',
  inputs JSONB NOT NULL DEFAULT '[]',
  prompt_template TEXT NOT NULL DEFAULT '',
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to skills" ON public.skills FOR ALL USING (true) WITH CHECK (true);

-- Storage bucket for document uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', true);
CREATE POLICY "Allow public read on documents" ON storage.objects FOR SELECT USING (bucket_id = 'documents');
CREATE POLICY "Allow public upload on documents" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'documents');
CREATE POLICY "Allow public delete on documents" ON storage.objects FOR DELETE USING (bucket_id = 'documents');
