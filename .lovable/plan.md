

# Skill Builder Settings Audit: What's Used vs. What's Dead

I traced every setting in the 6-step Skill Builder through the entire codebase (agent-dispatch, task-scheduler, telegram-bot, generate-deck, AlexChat, Department page, SkillForm, agent-client). Here's the full audit:

## Settings That ARE Used

| Setting | Where Used |
|---|---|
| **Name / Display Name / Emoji / Description** | Everywhere: library cards, Department page, SkillForm, job titles, Telegram |
| **Department / Agent Type** | Routing, filtering, agent persona selection in agent-dispatch |
| **System Prompt** | agent-dispatch uses it as primary system prompt (falls back to agent persona if empty) |
| **Inputs** | SkillForm renders them; agent-dispatch fills prompt template from them |
| **Preferred Model** | agent-dispatch validates and uses it for AI gateway model selection |
| **Web Search Enabled** | agent-dispatch appends WEB_SEARCH_CAVEAT to system prompt; task-scheduler passes it |
| **Schedulable** | Tasks page filters skills by this flag for scheduling |
| **Estimated Cost** | Displayed on skill cards in library and Department page (display only) |

## Settings That Are PARTIALLY Used or Cosmetic-Only

| Setting | Status | Details |
|---|---|---|
| **Version** | Stored/displayed in summary only | Never read by any backend function. No version comparison logic. Cosmetic. |
| **Tags** | Stored only | Saved to DB, loaded into builder. Never used for filtering, search, or routing anywhere. |
| **Output Format** | Partially used | Only consumed by telegram-bot to detect `pptx` for deck routing. `markdown`/`json`/`html` values have zero effect on agent-dispatch output. |
| **Knowledge Base toggle** | Misleading | Saves to `required_capabilities` array. But agent-dispatch ALWAYS searches knowledge_chunks regardless of this setting. The toggle does nothing. |
| **Estimated Cost** | Display only | Shown on cards. Never validated, never used for billing or budgeting. |

## Settings That Are NOT Used At All

| Setting | Status |
|---|---|
| **Trigger Keywords** | Saved to DB. Never consumed by any function. Not used by AlexChat, Telegram, or any routing logic. |
| **Token Budget** | Saved to DB. agent-dispatch never reads it. No max_tokens parameter is passed to the AI gateway. |
| **Timeout (seconds)** | Saved to DB. Never enforced. No AbortController timeout in agent-dispatch or task-scheduler. |
| **Approval Required** | Saved to DB. No approval workflow exists anywhere. Jobs go straight from running to complete. |
| **Required Capabilities** | Saved to DB (as array with "knowledge_search"). Never checked by agent-dispatch. Knowledge grounding runs unconditionally. |
| **Output Title Template** | Saved to `output_schema.title`. Never used by any function. |
| **Output Sections** | Saved to `output_schema.sections`. Never used by any function. |
| **Export Formats** | Saved to DB. Never used. No export functionality exists. |
| **Prompt Template** | The builder always saves it as empty string (`""`). The system prompt field is used instead. agent-dispatch does read `promptTemplate` and fills `{{variables}}`, but the builder never populates it separately from system prompt. |

## Recommended Plan

### Remove dead settings (clean up UI clutter)
- **Remove from builder**: Trigger Keywords, Token Budget, Timeout, Approval Required, Required Capabilities / Knowledge Base toggle, Output Title Template, Output Sections, Export Formats
- **Remove from builder**: Version (keep in DB, just don't expose it as a user setting)
- These fields remain in the DB schema (no migration needed) but are hidden from the builder UI

### Fix misleading settings
- **Knowledge Base toggle**: Remove it. Knowledge grounding always runs. If we want to make it conditional, that's a separate feature.
- **Output Format**: Keep it, but only show the options that actually do something (markdown is default; pptx triggers deck generation via Telegram). Or just remove it since agent-dispatch always outputs markdown.

### Keep functional settings
These stay as-is: Name, Display Name, Emoji, Description, Department, Agent Type, System Prompt, Inputs, Preferred Model, Web Search, Schedulable, Estimated Cost (display-only but useful), Tags (keep in DB, remove from UI until search/filter uses them)

### Result
The builder goes from ~20 settings across 6 steps to ~12 meaningful settings. Steps 5 (Behavior) and 6 (Output) get dramatically simplified or merged.

## Files Modified

| File | Change |
|---|---|
| `src/pages/Capabilities.tsx` | Remove dead fields from builder UI, simplify Steps 5 and 6 |

No backend changes needed since we're only removing UI for unused fields. DB columns remain intact.

