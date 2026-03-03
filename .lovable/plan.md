

# Add Cost & Description Info to OpenRouter Model Browser

## What Changes

### 1. Edge Function: `supabase/functions/openrouter-models/index.ts`

OpenRouter's `/api/v1/models` API already returns `pricing.prompt`, `pricing.completion` (cost per token as strings), and `description` for each model. We just need to pass them through:

```typescript
const models = (data.data || []).map((m: any) => ({
  id: m.id,
  name: m.name || m.id,
  description: m.description || "",
  promptPrice: m.pricing?.prompt || null,    // cost per token (string)
  completionPrice: m.pricing?.completion || null,
  contextLength: m.context_length || null,
}));
```

### 2. Settings UI: `src/pages/Settings.tsx`

- Extend the `OpenRouterModel` interface to include `description`, `promptPrice`, `completionPrice`, `contextLength`
- In the model browser list, show for each model:
  - Model name and ID (already shown)
  - One-line truncated description
  - Cost: convert per-token prices to "per 1M tokens" (multiply by 1,000,000) and display as `$X.XX in / $Y.YY out`
  - Context length as a small badge (e.g., "128K ctx")
- Keep the layout compact — description on a second line, cost/context as small badges

### Files Modified

| File | Change |
|---|---|
| `supabase/functions/openrouter-models/index.ts` | Pass through `description`, `pricing`, `context_length` |
| `src/pages/Settings.tsx` | Extend interface, render cost/description in model browser rows |

