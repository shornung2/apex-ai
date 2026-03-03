

# Add Multi-File Context Upload to Skill Execution

## What This Does
Adds an "Additional Context" file upload zone to every skill's run form (SkillForm). Users can attach up to 10 files (Word, PowerPoint, PDF, text, Excel, Markdown) that get ingested and passed as grounding context to the agent, without needing a dedicated "file" input defined in the skill.

## How It Works

### 1. `src/components/SkillForm.tsx` -- Add context files section

- Add a new section below all skill inputs and above the Run button: "Additional Context (optional)"
- Multi-file upload (up to 10 files, max 20MB each)
- Accepted formats: `.pdf,.docx,.pptx,.txt,.md,.csv,.xlsx`
- Each file uploads to storage → calls `knowledge-ingest` → extracts text
- All extracted texts concatenated into a hidden field `_attached_context`
- Show file list with upload progress, file names, and remove buttons
- Disable Run button while any file is uploading

### 2. `supabase/functions/agent-dispatch/index.ts` -- Use attached context

- Check for `_attached_context` in `inputs`
- If present, append it to the system prompt as an "ATTACHED DOCUMENTS" section (similar to existing knowledge base context)
- Remove it from the regular inputs so it doesn't pollute the user message / template variables

### Files Modified

| File | Change |
|---|---|
| `src/components/SkillForm.tsx` | Add multi-file upload section with progress tracking |
| `supabase/functions/agent-dispatch/index.ts` | Extract `_attached_context` from inputs and inject into system prompt |

