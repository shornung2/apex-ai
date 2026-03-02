

# Plan: Rename to "Apex AI" + Real Usage Data in Settings

## Overview

Rename every occurrence of "Autopilot" to **"Apex AI"** across the entire application -- UI, Help system, Telegram bot, Alex assistant, HTML metadata, and theme storage key. Also replace the Settings Usage tab placeholder with live data queried from the database.

---

## 1. Global Rename: "Autopilot" to "Apex AI"

Every file containing "Autopilot" or "AI Operating System" will be updated:

| File | Changes |
|------|---------|
| `index.html` | Title: "Apex AI", meta description: "Apex AI by Solutionment", og:title |
| `src/App.tsx` | Theme storage key: `"autopilot-theme"` to `"apex-ai-theme"` |
| `src/components/AppSidebar.tsx` | Logo alt text: "Apex AI", subtitle: "Apex AI" instead of "AI Operating System", keep "by Solutionment" |
| `src/components/AlexChat.tsx` | Welcome text: "Ask me anything about Apex AI..." |
| `src/pages/Help.tsx` | All ~15 occurrences of "Autopilot" in help content replaced with "Apex AI"; footer text updated |
| `supabase/functions/alex-chat/index.ts` | APP_KNOWLEDGE block: all "Autopilot" references to "Apex AI"; system prompt updated |
| `supabase/functions/telegram-bot/index.ts` | Bot welcome, help text, skill-not-found messages, task messages -- all "Autopilot" to "Apex AI" |

---

## 2. Settings Usage Tab -- Real Data

Replace the placeholder text in the Usage tab with a live dashboard querying real data from the database:

### Data Sources
- **Total Runs**: `SELECT count(*) FROM agent_jobs`
- **Tokens Used**: `SELECT sum(tokens_used) FROM agent_jobs WHERE status = 'complete'`
- **Token Budget**: 50,000 (matches sidebar)
- **Knowledge Docs**: `SELECT count(*) FROM knowledge_documents`
- **Active Skills**: `SELECT count(*) FROM skills`
- **Scheduled Tasks**: `SELECT count(*) FROM scheduled_tasks WHERE status = 'active'`
- **Success Rate**: computed from complete vs total jobs

### UI Layout
The Usage tab will show:
1. **Token Usage** -- progress bar with used/budget, matching the sidebar style
2. **Stats Grid** -- 4 metric cards: Total Runs, Success Rate, Knowledge Docs, Active Skills
3. **Scheduled Tasks** -- count of active automated tasks
4. All data fetched on mount via `useEffect` with a loading skeleton

---

## Files Summary

| Action | File |
|--------|------|
| Modify | `index.html` -- title and meta tags |
| Modify | `src/App.tsx` -- theme storage key |
| Modify | `src/components/AppSidebar.tsx` -- logo alt, subtitle |
| Modify | `src/components/AlexChat.tsx` -- welcome text |
| Modify | `src/pages/Help.tsx` -- all help content |
| Modify | `src/pages/Settings.tsx` -- Usage tab with live data |
| Modify | `supabase/functions/alex-chat/index.ts` -- APP_KNOWLEDGE and system prompt |
| Modify | `supabase/functions/telegram-bot/index.ts` -- all user-facing messages |

No database changes needed. No new files.

