ALTER TABLE public.workspace_settings DROP CONSTRAINT workspace_settings_key_key;
ALTER TABLE public.workspace_settings ADD CONSTRAINT workspace_settings_tenant_key_unique UNIQUE (tenant_id, key);