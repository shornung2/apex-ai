
# Plan: Add Alex AI Assistant Chatbot

## Overview

Add "Alex," a general-purpose AI assistant accessible from both the web app (floating chat widget) and Telegram. Alex is grounded in the Knowledge Base and knows everything about the app via embedded help documentation.

---

## 1. Database Migration

Add `conversation_history` column to `telegram_sessions` for Telegram chat context:

```sql
ALTER TABLE public.telegram_sessions 
ADD COLUMN conversation_history jsonb NOT NULL DEFAULT '[]'::jsonb;
```

---

## 2. New Edge Function: `alex-chat`

**File:** `supabase/functions/alex-chat/index.ts`

- Accepts `{ messages: [{role, content}] }` as POST body
- RAG grounding: extracts search terms from the user message, queries `knowledge_chunks` (top 5 matches via `ilike`), injects as context
- System prompt contains a condensed version of all help guide content (app features, skill builder steps, commands, Telegram setup, etc.) so Alex is an expert on the platform
- Calls Lovable AI gateway (`google/gemini-3-flash-preview`) with streaming
- Returns SSE stream (same pattern as `agent-dispatch`)
- Config: `verify_jwt = false` in `supabase/config.toml`

---

## 3. Web App: Floating Chat Widget

**New file:** `src/components/AlexChat.tsx`

- Floating button in bottom-right corner using the **lightbulb app icon** (`/favicon.jpg`) as the avatar/icon
- Click to expand into a ~400x500px chat panel with:
  - Header with "Alex" title and close button
  - Scrollable message list (user and assistant bubbles)
  - Simple markdown rendering for assistant responses
  - Text input with send button
- Streams responses token-by-token via SSE from `alex-chat`
- Conversation state in React state (resets on reload)
- Uses `position: fixed` with high z-index

**Modify:** `src/components/AppLayout.tsx`
- Import and render `<AlexChat />` inside the layout so it appears on every page

---

## 4. Telegram Integration Update

**Modify:** `supabase/functions/telegram-bot/index.ts`

- Change the "unknown message" handler (lines 539-543): instead of "I didn't understand that," route free-text to `alex-chat` edge function
- Maintain conversation history in `telegram_sessions.conversation_history` (capped at last 20 messages)
- Add `/alex` command as explicit trigger and `/clear` to reset conversation history
- Update `/start` and `/help` messages to mention Alex ("Just type any message to chat with Alex")

---

## 5. Help Page Update

**Modify:** `src/pages/Help.tsx`

Add an "Alex AI Assistant" section to `helpSections` covering:
- What Alex is (general AI assistant grounded in Knowledge Base and app expertise)
- How to use the chat widget (click the lightbulb icon in the bottom-right)
- How to chat with Alex on Telegram (just type any message)
- `/clear` command to reset conversation

---

## Files Summary

| Action | File |
|--------|------|
| Create | `supabase/functions/alex-chat/index.ts` |
| Create | `src/components/AlexChat.tsx` |
| Modify | `supabase/functions/telegram-bot/index.ts` |
| Modify | `src/components/AppLayout.tsx` |
| Modify | `src/pages/Help.tsx` |
| Modify | `supabase/config.toml` |
| Migration | Add `conversation_history` column |

No new secrets needed -- uses existing `LOVABLE_API_KEY`.
