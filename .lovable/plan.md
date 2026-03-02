

# Plan: Update App Icons + Fix Telegram Input Bug

## 1. Replace App Icons with New Apex AI Logo

Copy the first uploaded image (transparent background, best for sidebar/favicon) to two locations:

- **Sidebar logo**: Copy to `src/assets/apex-ai-logo.png`, then update `AppSidebar.tsx` to import and use it instead of `logo-dark.jpg` / `logo-light.jpg` (single logo works for both themes since it has a transparent background).
- **Favicon**: Copy to `public/favicon.png`, then update `index.html` to reference `/favicon.png` with `type="image/png"`.

Files modified: `src/components/AppSidebar.tsx`, `index.html`
New files: `src/assets/apex-ai-logo.png`, `public/favicon.png`

## 2. Fix Telegram Bot "Forgetting" Inputs

**Root cause**: The skill inputs stored in the database use `field` as the property name (e.g., `field: "post_topic"`). But the Telegram bot's `SkillInput` interface defines `id` and the code saves answers using `currentInput.id` (line 293). Since `id` is always `undefined`, every answer overwrites the same key, so only the last answer survives.

**Fix**:
- Update the `SkillInput` interface in `telegram-bot/index.ts` to include `field?: string`
- Change line 293 from `collectedInputs[currentInput.id]` to `collectedInputs[currentInput.field || currentInput.id]`
- Similarly update the filter on line 232 and the prompt display on lines 256-264 to use `field || id` consistently
- Also update the `requiredInputs` filter on line 287 to properly match the input key

This is a one-line root-cause fix with a few defensive fallbacks.

**File modified**: `supabase/functions/telegram-bot/index.ts`

## 3. Summary

| Action | File |
|--------|------|
| Copy | uploaded image to `src/assets/apex-ai-logo.png` |
| Copy | uploaded image to `public/favicon.png` |
| Modify | `src/components/AppSidebar.tsx` -- use new logo |
| Modify | `index.html` -- favicon to PNG |
| Modify | `supabase/functions/telegram-bot/index.ts` -- fix `field` vs `id` bug |
| Redeploy | `telegram-bot` edge function |

