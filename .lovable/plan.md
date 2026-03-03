

# Rework OpenRouter Integration + Help Updates + Telegram Fix

## Summary

The current OpenRouter setup uses manual model ID text entry. The user wants a proper flow: toggle on → enter API key → browse the full OpenRouter model catalog → select up to 5 models. Plus, the Telegram bot doesn't pass `preferredModel` to agent-dispatch, and Help content is outdated.

## Changes

### 1. Settings: OpenRouter Flow (`src/pages/Settings.tsx`)

**Current**: Toggle + hardcoded "Key configured" badge + manual model ID text inputs.
**New**:
- Toggle on → show API key input field (masked, `sk-or-v1-...`) with a "Save Key" button
- Saving the key: call an edge function that stores it as a backend secret (or use the existing `add_secret` mechanism). For now, store via a small edge function `openrouter-config` that sets the Deno env secret and validates the key by fetching models.
- **Simpler approach**: Since `OPENROUTER_API_KEY` is already stored as a secret, show the key input. On save, call a new edge function `openrouter-config` that: (a) validates the key by hitting `https://openrouter.ai/api/v1/models`, (b) returns the full model list, (c) stores the key as a secret (actually we can't programmatically set secrets from edge functions — so we keep using the `add_secret` tool for initial setup, but let the user update it from Settings by prompting through the platform).
- **Practical approach**: Since we can't set secrets from code, the API key entry will use the existing `add_secret` mechanism (prompt user). BUT for model browsing:
  - Create a new edge function `openrouter-models` that reads `OPENROUTER_API_KEY` from env, calls `https://openrouter.ai/api/v1/models`, and returns the list.
  - Settings page calls this function to fetch available models when OpenRouter is enabled.
  - Display a searchable, scrollable list of models with checkboxes. Max 5 selected.
  - Selected models saved to `workspace_settings` table (as before).
- Remove the manual model ID + display name text inputs entirely.
- Show "Key configured" badge if the fetch succeeds, "Key not configured" if it fails.

### 2. New Edge Function: `openrouter-models`

Simple function:
- Reads `OPENROUTER_API_KEY` from env
- Fetches `https://openrouter.ai/api/v1/models`
- Returns `{ models: [{ id, name }], valid: true }` or `{ valid: false }` if key is missing/invalid
- Frontend uses this to populate the model browser and validate key status

### 3. Capabilities: Model Dropdown (`src/pages/Capabilities.tsx`)

Already mostly correct — just ensure it pulls the models from `workspace_settings` and shows them under the "OpenRouter" section. No changes needed beyond what's already there, since the model list will now be populated from the real OpenRouter catalog.

### 4. Telegram Bot Fix (`supabase/functions/telegram-bot/index.ts`)

Two places where `agent-dispatch` is called (standard dispatch and deck generation) — add `preferredModel: skill.preferred_model` and `webSearchEnabled: skill.web_search_enabled` to both payloads.

### 5. Help Content Updates (`src/pages/Help.tsx`)

Update the following sections:
- **Departments**: Update file size limit from 20MB to 10MB total, mention the "Additional Context" upload zone
- **Capabilities & Skill Builder**: Update to 5-step wizard (not 6), remove references to unused fields, mention OpenRouter model selection, update file size references
- **Settings**: Add OpenRouter configuration documentation (enable, API key, model browser, 5-model limit)
- **Agent Grounding & Context**: Add "Additional Context files" as a source, update size limits
- **Telegram Bot**: Mention that skills use their configured preferred model (including OpenRouter models)
- **Alex Assistant**: Update file size reference from 20MB to match current limits

### Files Modified

| File | Change |
|---|---|
| `supabase/functions/openrouter-models/index.ts` | **New** — fetch models from OpenRouter API |
| `src/pages/Settings.tsx` | Replace manual model entry with searchable model browser (max 5), validate API key status via edge function |
| `supabase/functions/telegram-bot/index.ts` | Pass `preferredModel` and `webSearchEnabled` in dispatch payloads |
| `src/pages/Help.tsx` | Update all outdated sections (context upload limits, OpenRouter, 5-step wizard, Telegram model support) |

### No changes needed
- `src/pages/Capabilities.tsx` — already correctly shows OpenRouter models from workspace_settings
- `supabase/functions/agent-dispatch/index.ts` — already handles OpenRouter routing correctly

