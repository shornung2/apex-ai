

# Two Features: Upload Limit Fix + OpenRouter Integration

## 1. Upload Size Limit: 10MB Total

**Current**: 20MB per file, no total limit.
**New**: 10MB total across all context files, max 10 files.

### Changes

**`src/components/SkillForm.tsx`**:
- Change `MAX_SIZE` from `20 * 1024 * 1024` to `10 * 1024 * 1024` (10MB total budget)
- Track cumulative size of all context files
- Before adding files, check if cumulative size + new files would exceed 10MB total
- Show running total in the UI (e.g., "3.2 / 10 MB used")

**`supabase/functions/agent-dispatch/index.ts`**:
- Add context length guard: if `_attached_context` exceeds ~100K characters (~25K tokens), truncate it with a note to the model that context was trimmed
- This prevents blowing through the model's context window or running up excessive token costs

---

## 2. OpenRouter Integration

This is absolutely feasible. OpenRouter's API is OpenAI-compatible (`/api/v1/chat/completions`), so the agent-dispatch function only needs a conditional URL/key swap.

### How It Works

1. User goes to **Settings > API Keys**, toggles "Enable OpenRouter"
2. User enters their OpenRouter API key (stored securely as a backend secret)
3. User selects which OpenRouter models to make available (free-text or from a fetched list)
4. Those models appear in the Skill Builder's model dropdown under an "OpenRouter" section
5. When a skill runs with an OpenRouter model, agent-dispatch routes to OpenRouter's API instead of the Lovable AI gateway

### Changes

**Database** (1 new table):
- `workspace_settings` table with key-value pairs for:
  - `openrouter_enabled` (boolean)
  - `openrouter_models` (JSON array of model IDs + display names)

**Backend secret**:
- `OPENROUTER_API_KEY` stored via the secrets system (encrypted, never exposed to client)

**`src/pages/Settings.tsx`** (API Keys tab):
- Add OpenRouter section with enable toggle
- When enabled, show API key input field (masked) with a save button that stores the key via `add_secret`
- Add a model selector: text input for model IDs (e.g., `anthropic/claude-sonnet-4`) with an "Add Model" button
- Show list of enabled OpenRouter models with remove buttons
- Save model list to `workspace_settings` table

**`src/pages/Capabilities.tsx`** (Skill Builder, Step 2):
- Fetch `workspace_settings` to check if OpenRouter is enabled and get model list
- In the model dropdown, add a third section "OpenRouter" below Standard/Premium, listing the user's configured models
- OpenRouter models get a distinctive badge/color

**`supabase/functions/agent-dispatch/index.ts`**:
- Check if `preferredModel` starts with a known OpenRouter prefix or is not in the built-in `ALLOWED_MODELS` list
- If OpenRouter model: fetch `OPENROUTER_API_KEY` from env, call `https://openrouter.ai/api/v1/chat/completions` with the same message payload
- If built-in model: use existing Lovable AI gateway as-is
- Same SSE streaming logic works for both (OpenRouter is OpenAI-compatible)

### Files Modified

| File | Change |
|---|---|
| `src/components/SkillForm.tsx` | 10MB total limit with running size display |
| `supabase/functions/agent-dispatch/index.ts` | Context truncation guard + OpenRouter routing |
| `src/pages/Settings.tsx` | OpenRouter config UI in API Keys tab |
| `src/pages/Capabilities.tsx` | OpenRouter models in skill builder dropdown |
| New migration | `workspace_settings` table |

