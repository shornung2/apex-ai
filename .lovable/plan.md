

# Plan: Telegram Bot Integration for Autopilot

## Overview

Create a Telegram bot webhook edge function that lets users run any Autopilot skill/agent directly from Telegram. The bot will support listing available skills, selecting one, providing inputs conversationally, and streaming back the result.

## Architecture

```text
Telegram User --> Telegram API --> /telegram-bot (Edge Function) --> /agent-dispatch (existing)
                                        |
                                        v
                                   Supabase DB
                                (skills, agent_jobs, telegram_sessions)
```

## What You'll Need

A **Telegram Bot Token** from @BotFather on Telegram. You'll create a bot, get the token, and provide it to Lovable as a secret.

---

## Database Changes

**New table: `telegram_sessions`** -- tracks conversational state per Telegram chat so the bot can collect inputs step-by-step.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid (PK) | Session ID |
| chat_id | bigint, unique | Telegram chat ID |
| state | text | Current state: `idle`, `selecting_skill`, `collecting_inputs` |
| selected_skill_id | uuid, nullable | The skill being configured |
| collected_inputs | jsonb | Inputs gathered so far |
| current_input_index | integer | Which input field we're asking for |
| created_at | timestamptz | Created timestamp |
| updated_at | timestamptz | Last updated |

RLS: Open access (no auth on this project currently).

---

## Edge Function: `telegram-bot`

A single webhook endpoint that Telegram calls for every message.

### Bot Commands

| Command | Action |
|---------|--------|
| `/start` | Welcome message explaining the bot |
| `/skills` | List all available skills grouped by department |
| `/run <skill_name>` | Start running a specific skill -- begins collecting inputs |
| `/cancel` | Cancel current skill execution |
| `/help` | Show available commands |

### Conversational Flow

1. User sends `/skills` -- bot queries the `skills` table and returns a formatted list with inline keyboard buttons
2. User taps a skill (or sends `/run skill-name`) -- bot looks up the skill, stores it in `telegram_sessions`, and asks for the first required input
3. Bot asks for each input one at a time (showing the label, placeholder, and hint from the skill definition)
4. Once all inputs are collected, bot calls the existing `agent-dispatch` edge function internally (server-to-server, not via public URL)
5. Bot sends the result back to the user as a Telegram message (splitting long responses into multiple messages if needed, since Telegram has a 4096-char limit)

### Key Implementation Details

- **Webhook registration**: A `/telegram-bot?action=set-webhook` GET endpoint to register the webhook URL with Telegram's API
- **Inline keyboards**: For skill selection, department filtering, and confirmation prompts
- **Markdown formatting**: Telegram supports MarkdownV2 -- results will be formatted accordingly
- **Long response handling**: Split output into chunks of ~4000 chars at paragraph boundaries
- **Error handling**: Graceful error messages sent back to the Telegram chat if agent execution fails

---

## Files to Create

1. **`supabase/functions/telegram-bot/index.ts`** -- Main webhook handler with:
   - Command parsing (`/start`, `/skills`, `/run`, `/cancel`, `/help`)
   - Session management (step-by-step input collection)
   - Internal call to `agent-dispatch` for execution
   - Telegram message sending with markdown formatting
   - Webhook setup endpoint

## Files to Modify

None -- this is a self-contained addition. The existing `agent-dispatch` function is reused as-is via internal HTTP call.

## Secret Required

- **`TELEGRAM_BOT_TOKEN`** -- obtained from Telegram's @BotFather

## Setup Steps (for the user)

1. Open Telegram and message @BotFather
2. Send `/newbot` and follow the prompts to name your bot
3. Copy the bot token provided by BotFather
4. Provide the token when prompted by Lovable
5. After deployment, the webhook will be registered automatically

