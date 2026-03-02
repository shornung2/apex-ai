
-- Add file_url column to agent_jobs
ALTER TABLE public.agent_jobs ADD COLUMN file_url text;

-- Create decks storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('decks', 'decks', true);

-- Allow authenticated users to read from decks bucket
CREATE POLICY "Anyone can read decks"
ON storage.objects FOR SELECT
USING (bucket_id = 'decks');

-- Allow authenticated users to insert into decks bucket
CREATE POLICY "Authenticated users can upload decks"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'decks');
