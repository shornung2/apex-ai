

# Fix: Wire User Inputs Into the AI User Message

## Problem

The skills' system prompts ARE correctly loaded and sent to the AI agent. However, the **user's form inputs are not reaching the AI model** as the user message.

Here's what happens:
1. User fills out the skill form (e.g., Company Name = "City Wide", Meeting Type = "Discovery")
2. Frontend sends `systemPrompt` (correct) and `promptTemplate` (empty string) to the edge function
3. Edge function tries to fill `{{variables}}` in the prompt template, but since it's empty, the user message to the AI is an empty string
4. The AI receives a detailed system prompt but no user message with the actual inputs

This means the AI is generating output based solely on the system prompt instructions, without knowing what the user actually typed.

## Root Cause

All 15 seeded skills have `prompt_template = ""` because the skill JSONs use `system_prompt` (step 4) for instructions but don't include a separate prompt template with `{{variable}}` placeholders. The edge function needs to auto-construct a user message from the inputs when no explicit template exists.

## Fix

**File: `supabase/functions/agent-dispatch/index.ts`**

After line 92, when `filledTemplate` is empty (no prompt template defined), auto-build a user message from the inputs:

```text
If filledTemplate is empty:
  Build a structured user message like:
  "## Task Inputs\n\n"
  For each key/value in inputs:
    "**{label}:** {value}\n"
```

This ensures the AI always receives the user's actual data, whether or not a prompt template is defined. When a template IS defined, the existing `{{variable}}` replacement logic still works.

## Verification

After this fix:
- The system prompt (skill-specific instructions) continues to be sent as the system message
- The user's form inputs are sent as the user message, formatted clearly
- The AI has full context: what to do (system prompt) and what to do it with (user inputs)

## File Changes

**Modify:** `supabase/functions/agent-dispatch/index.ts` -- Add fallback user message construction from inputs when promptTemplate is empty

No other files need changes. The frontend is already sending all the right data; the edge function just needs to use the inputs when there's no template.
