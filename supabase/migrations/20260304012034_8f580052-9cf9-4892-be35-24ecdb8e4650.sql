
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to knowledge_chunks
ALTER TABLE public.knowledge_chunks ADD COLUMN IF NOT EXISTS embedding vector(768);

-- Create IVFFlat index for cosine similarity
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_embedding 
ON public.knowledge_chunks USING ivfflat (embedding vector_cosine_ops) 
WITH (lists = 100);

-- Create the match function for semantic search
CREATE OR REPLACE FUNCTION public.match_knowledge_chunks(
  query_embedding vector(768),
  match_tenant_id uuid,
  match_count int DEFAULT 5,
  similarity_threshold float DEFAULT 0.65
)
RETURNS TABLE (content text, document_id uuid, chunk_id uuid, similarity float)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    kc.content,
    kc.document_id,
    kc.id as chunk_id,
    (1 - (kc.embedding <=> query_embedding))::float as similarity
  FROM public.knowledge_chunks kc
  WHERE kc.tenant_id = match_tenant_id
    AND kc.embedding IS NOT NULL
    AND 1 - (kc.embedding <=> query_embedding) > similarity_threshold
  ORDER BY kc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
