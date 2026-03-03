

# Model Selection for Skills

## Current State

- The skill builder has a "Preferred Model" dropdown with outdated placeholder values (`haiku`, `sonnet`) that map to nothing real
- `agent-dispatch` hardcodes `google/gemini-3-flash-preview` for all jobs, ignoring the `preferred_model` field entirely
- `agent-client.ts` does not pass `preferredModel` or `webSearchEnabled` to dispatch
- The "Lane" dropdown is vestigial and serves no purpose

## Available Models (Lovable AI Gateway)

| Model ID | Display Name | Tier | Best For |
|---|---|---|---|
| `google/gemini-2.5-flash-lite` | Gemini Flash Lite | Standard | Simple tasks, classification |
| `google/gemini-2.5-flash` | Gemini Flash | Standard | Balanced speed/quality |
| `google/gemini-3-flash-preview` | Gemini 3 Flash | Standard | Current default, good all-rounder |
| `google/gemini-2.5-pro` | Gemini Pro | Premium | Deep reasoning, complex analysis |
| `google/gemini-3-pro-preview` | Gemini 3 Pro | Premium | Next-gen deep reasoning |
| `openai/gpt-5-nano` | GPT-5 Nano | Standard | Fast, cost-efficient |
| `openai/gpt-5-mini` | GPT-5 Mini | Standard | Strong balance |
| `openai/gpt-5` | GPT-5 | Premium | Maximum accuracy |
| `openai/gpt-5.2` | GPT-5.2 | Premium | Latest, complex problem-solving |

## Default Model per Agent Type

- **Researcher**: `google/gemini-2.5-pro` (needs deep reasoning for quality research)
- **Strategist**: `google/gemini-3-flash-preview` (good balance for frameworks)
- **Content**: `google/gemini-3-flash-preview` (fast, good prose)
- **Meeting Prep**: `google/gemini-3-flash-preview` (speed matters for prep)

## Changes

### 1. `src/pages/Capabilities.tsx` -- Replace Model Selector

- Remove the "Lane" dropdown (unused, confusing)
- Replace "Preferred Model" dropdown with the real model list above
- Group models by tier: "Standard" and "Premium"
- Show a warning badge/text when a Premium model is selected: "Premium models cost significantly more per run"
- Default the model based on agent type selection (auto-set when agent type changes in step 2)
- Default state changes from `"haiku"` to `"google/gemini-3-flash-preview"`

### 2. `src/lib/agent-client.ts` -- Pass Model to Dispatch

- Add `preferredModel: skill.preferredModel` and `webSearchEnabled: skill.webSearchEnabled` to the dispatch payload

### 3. `supabase/functions/agent-dispatch/index.ts` -- Use Skill's Model

- Accept `preferredModel` from request body
- Use it in the AI gateway call instead of hardcoding `google/gemini-3-flash-preview`
- Fall back to `google/gemini-3-flash-preview` if not provided
- Validate the model is in the allowed list

### 4. `src/data/mock-data.ts` -- No changes needed

The `Skill` type already has `preferredModel?: string`.

### 5. Cleanup

- Remove `preferred_lane` from the save payload (keep the DB column for now, just stop writing to it)
- Update the summary line in step 6 to show the actual model name

## Files Modified

| File | Change |
|---|---|
| `src/pages/Capabilities.tsx` | Replace model/lane dropdowns with real models, premium warning, agent-type defaults |
| `src/lib/agent-client.ts` | Pass `preferredModel` and `webSearchEnabled` in dispatch payload |
| `supabase/functions/agent-dispatch/index.ts` | Use `preferredModel` from request instead of hardcoding |

