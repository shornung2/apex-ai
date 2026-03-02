
-- Drop open RLS policies and replace with authenticated-only

DROP POLICY IF EXISTS "Allow all access to agent_jobs" ON public.agent_jobs;
CREATE POLICY "Authenticated users can do everything on agent_jobs"
ON public.agent_jobs FOR ALL TO authenticated
USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to content_folders" ON public.content_folders;
CREATE POLICY "Authenticated users can do everything on content_folders"
ON public.content_folders FOR ALL TO authenticated
USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to content_items" ON public.content_items;
CREATE POLICY "Authenticated users can do everything on content_items"
ON public.content_items FOR ALL TO authenticated
USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to knowledge_chunks" ON public.knowledge_chunks;
CREATE POLICY "Authenticated users can do everything on knowledge_chunks"
ON public.knowledge_chunks FOR ALL TO authenticated
USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to knowledge_documents" ON public.knowledge_documents;
CREATE POLICY "Authenticated users can do everything on knowledge_documents"
ON public.knowledge_documents FOR ALL TO authenticated
USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to scheduled_tasks" ON public.scheduled_tasks;
CREATE POLICY "Authenticated users can do everything on scheduled_tasks"
ON public.scheduled_tasks FOR ALL TO authenticated
USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to skills" ON public.skills;
CREATE POLICY "Authenticated users can do everything on skills"
ON public.skills FOR ALL TO authenticated
USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to telegram_sessions" ON public.telegram_sessions;
CREATE POLICY "Authenticated users can do everything on telegram_sessions"
ON public.telegram_sessions FOR ALL TO authenticated
USING (true) WITH CHECK (true);
