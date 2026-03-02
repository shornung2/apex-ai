

# Plan: Standardize Agent Output Quality Across All Agents

## Problem

The four agent personas in `agent-dispatch` have minimal formatting instructions. Alex's prompt is mostly good but missing one style rule. All agents need consistent, enforced output standards to produce professional, human-sounding content.

## Changes

### 1. Add shared formatting block to `agent-dispatch` (`supabase/functions/agent-dispatch/index.ts`)

Append a shared output quality block to all four `AGENT_PERSONAS` values (researcher, strategist, content, meeting-prep). This block will contain:

```text
OUTPUT FORMATTING RULES

- Use bold Markdown headers (## and ###) to create clear sections with good visual hierarchy.
- Leave a blank line between sections for readability.
- Use bullet points selectively, not as the default structure for every paragraph.
- Write in natural, flowing prose where appropriate. Prefer short paragraphs over walls of bullets.
- Bold key terms and important conclusions for scannability.

STYLE CONSTRAINTS

- Never use em dashes. Use commas, periods, or semicolons instead.
- Never use the phrase "lean in" in any form.
- Never use the sentence structure "it's not about [X], it's about [Y]" or any variation.
- Write like a seasoned human consultant, not like an AI. Avoid generic filler phrases.
- Keep tone professional, direct, and outcome-focused.
```

Each persona keeps its unique role description and simply gets this shared block appended.

### 2. Update Alex's system prompt in `alex-chat` (`supabase/functions/alex-chat/index.ts`)

Add the missing rule to the existing TONE & STYLE section (line ~182):

```
* Never use the sentence structure "it's not about [X], it's about [Y]" or any variation.
* Use bullet points selectively, not as the default for every paragraph. Prefer natural prose.
* Write with clear section headers (## and ###) and good spacing between sections.
```

### 3. Deploy both edge functions

Deploy `agent-dispatch` and `alex-chat` so the updated prompts take effect immediately.

## Files Modified

| File | Change |
|------|--------|
| `supabase/functions/agent-dispatch/index.ts` | Add formatting + style constraints to all 4 AGENT_PERSONAS |
| `supabase/functions/alex-chat/index.ts` | Add 3 missing style rules to TONE & STYLE section |

## What stays the same

- **Telegram bot**: No changes needed. It calls `alex-chat` for chat and `agent-dispatch` for skills, so it inherits all prompt updates automatically.
- **Frontend rendering**: Already uses ReactMarkdown with proper prose styling everywhere (AlexChat, JobDetail, ContentLibrary). No changes needed.
- **Grounding pipeline**: Untouched. Only system prompt text is modified.

