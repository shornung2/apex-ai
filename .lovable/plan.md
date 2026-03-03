

# Build with Alex — AI-Assisted Skill Builder

## Summary

Add a "Build with Alex" mode to the Skill Builder that replaces the right-side Preview panel with an inline Alex chat, specifically tuned for skill creation and prompt engineering. Alex will generate full, comprehensive system prompts and suggest skill configurations. Also update Help content and Telegram bot commands to reflect this new feature.

## Changes

### 1. Edge Function: `supabase/functions/alex-chat/index.ts`

Add a `mode` parameter to the request body. When `mode === "skill-builder"`:
- Use a specialized system prompt focused on prompt engineering and skill architecture
- The system prompt will include detailed instructions on writing exceptional, comprehensive prompts (role definition, output structure, variable usage, edge cases, formatting rules, quality bars)
- Receive `builderState` (name, description, department, agentType, inputs, systemPrompt, preferredModel) as context
- Alex must always write FULL, production-ready prompts — never abbreviated or placeholder content
- Instruct Alex to wrap actionable suggestions in `\`\`\`skill-update` code blocks with JSON: `{ "field": "systemPrompt", "value": "..." }` (also supports fields like `description`, `inputs`, `name`)

The skill-builder system prompt will contain:
- The 5-step skill architecture reference
- Detailed prompt engineering framework (role/persona, task decomposition, output format specification, variable injection with `{{field}}`, quality constraints, edge case handling)
- Instructions to always produce complete, ready-to-use prompts — never outlines or summaries
- Knowledge of available agent types, departments, input field types

### 2. Frontend: `src/pages/Capabilities.tsx`

**New state:**
- `builderMode: "manual" | "alex"` — toggles between Preview panel and Alex chat panel
- `alexMessages`, `alexInput`, `alexLoading` — chat state for the inline Alex

**UI changes:**
- Add a toggle button in the builder header: "Build with Alex" (sparkles icon) / "Manual" 
- When `builderMode === "alex"`, the right-side Preview card becomes an Alex chat panel:
  - Scrollable message area with markdown rendering
  - Input bar at the bottom
  - Each message sent includes the current builder state as context
- Parse assistant messages for `\`\`\`skill-update` blocks → render "Apply" buttons next to each suggestion
- Clicking "Apply" sets the corresponding builder field (e.g., `setBuilderSystemPrompt(value)`)
- Keep the Preview panel accessible by toggling back to "Manual"

**Alex context payload sent with each message:**
```typescript
{ 
  mode: "skill-builder", 
  messages: alexMessages,
  builderState: { name, displayName, description, department, agentType, inputs, systemPrompt, preferredModel }
}
```

### 3. Help Content: `src/pages/Help.tsx`

Update the following sections:

- **Capabilities & Skill Builder**: Add "Build with Alex" subsection explaining the feature, how to activate it, what Alex can do (generate prompts, suggest inputs, refine configurations), and how to apply suggestions
- **Alex AI Assistant**: Add that Alex can now assist directly in the Skill Builder with prompt engineering and skill design
- Update the APP_KNOWLEDGE in `alex-chat/index.ts` to mention "Build with Alex" as a feature

### 4. Telegram Bot: `supabase/functions/telegram-bot/index.ts`

- Update `/help` command text to mention "Build with Alex" as a web-app feature for skill creation
- No functional Telegram changes needed — Build with Alex is a web-only feature

### Files Modified

| File | Change |
|---|---|
| `supabase/functions/alex-chat/index.ts` | Add `mode: "skill-builder"` with specialized prompt engineering system prompt; update APP_KNOWLEDGE |
| `src/pages/Capabilities.tsx` | Add Alex chat panel in builder, toggle, `skill-update` block parsing with Apply buttons |
| `src/pages/Help.tsx` | Document "Build with Alex" in Capabilities and Alex Assistant sections |
| `supabase/functions/telegram-bot/index.ts` | Update `/help` text to mention Build with Alex |

