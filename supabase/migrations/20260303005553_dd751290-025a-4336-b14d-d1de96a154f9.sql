
-- =============================================
-- 1. FIX RLS: Drop restrictive ALL policies, create permissive per-operation policies
-- =============================================

-- agent_jobs
DROP POLICY IF EXISTS "Authenticated users can do everything on agent_jobs" ON public.agent_jobs;
CREATE POLICY "auth_select_agent_jobs" ON public.agent_jobs FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_agent_jobs" ON public.agent_jobs FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_agent_jobs" ON public.agent_jobs FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete_agent_jobs" ON public.agent_jobs FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- content_folders
DROP POLICY IF EXISTS "Authenticated users can do everything on content_folders" ON public.content_folders;
CREATE POLICY "auth_select_content_folders" ON public.content_folders FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_content_folders" ON public.content_folders FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_content_folders" ON public.content_folders FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete_content_folders" ON public.content_folders FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- content_items
DROP POLICY IF EXISTS "Authenticated users can do everything on content_items" ON public.content_items;
CREATE POLICY "auth_select_content_items" ON public.content_items FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_content_items" ON public.content_items FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_content_items" ON public.content_items FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete_content_items" ON public.content_items FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- knowledge_chunks
DROP POLICY IF EXISTS "Authenticated users can do everything on knowledge_chunks" ON public.knowledge_chunks;
CREATE POLICY "auth_select_knowledge_chunks" ON public.knowledge_chunks FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_knowledge_chunks" ON public.knowledge_chunks FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_knowledge_chunks" ON public.knowledge_chunks FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete_knowledge_chunks" ON public.knowledge_chunks FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- knowledge_documents
DROP POLICY IF EXISTS "Authenticated users can do everything on knowledge_documents" ON public.knowledge_documents;
CREATE POLICY "auth_select_knowledge_documents" ON public.knowledge_documents FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_knowledge_documents" ON public.knowledge_documents FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_knowledge_documents" ON public.knowledge_documents FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete_knowledge_documents" ON public.knowledge_documents FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- knowledge_folders
DROP POLICY IF EXISTS "Authenticated users can manage knowledge_folders" ON public.knowledge_folders;
CREATE POLICY "auth_select_knowledge_folders" ON public.knowledge_folders FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_knowledge_folders" ON public.knowledge_folders FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_knowledge_folders" ON public.knowledge_folders FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete_knowledge_folders" ON public.knowledge_folders FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- scheduled_tasks
DROP POLICY IF EXISTS "Authenticated users can do everything on scheduled_tasks" ON public.scheduled_tasks;
CREATE POLICY "auth_select_scheduled_tasks" ON public.scheduled_tasks FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_scheduled_tasks" ON public.scheduled_tasks FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_scheduled_tasks" ON public.scheduled_tasks FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete_scheduled_tasks" ON public.scheduled_tasks FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- skills
DROP POLICY IF EXISTS "Authenticated users can do everything on skills" ON public.skills;
CREATE POLICY "auth_select_skills" ON public.skills FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_skills" ON public.skills FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_skills" ON public.skills FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete_skills" ON public.skills FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- telegram_sessions
DROP POLICY IF EXISTS "Authenticated users can do everything on telegram_sessions" ON public.telegram_sessions;
CREATE POLICY "auth_select_telegram_sessions" ON public.telegram_sessions FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_telegram_sessions" ON public.telegram_sessions FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_telegram_sessions" ON public.telegram_sessions FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete_telegram_sessions" ON public.telegram_sessions FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- =============================================
-- 2. STORAGE: Make buckets private + add RLS policies
-- =============================================

UPDATE storage.buckets SET public = false WHERE id IN ('documents', 'decks');

-- Storage RLS for authenticated users
CREATE POLICY "auth_select_storage" ON storage.objects FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_storage" ON storage.objects FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_storage" ON storage.objects FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete_storage" ON storage.objects FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);
