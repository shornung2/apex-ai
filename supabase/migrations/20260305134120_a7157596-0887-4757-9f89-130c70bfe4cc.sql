-- Migrate agent_type from 'meeting-prep' to 'coach' in skills and agent_jobs
UPDATE public.skills SET agent_type = 'coach' WHERE agent_type = 'meeting-prep';
UPDATE public.agent_jobs SET agent_type = 'coach' WHERE agent_type = 'meeting-prep';
UPDATE public.scheduled_tasks SET agent_type = 'coach' WHERE agent_type = 'meeting-prep';
UPDATE public.content_items SET agent_type = 'coach' WHERE agent_type = 'meeting-prep';