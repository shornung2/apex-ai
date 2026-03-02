

# Plan: Add Telegram Bot Guide to Help Center

## What Changes

Add a new "Telegram Bot Integration" section to the Help page's `helpSections` array, positioned after the Settings section. This is a single-file edit to `src/pages/Help.tsx`.

## New Section Content

The new accordion section will cover:

### Overview
- What the Telegram bot does -- run any Autopilot skill directly from Telegram chat
- How it connects to the platform (same agents and skills, just a different interface)

### Step-by-Step Setup Guide
1. **Create a Telegram Bot** -- Open Telegram, message @BotFather, send `/newbot`, choose a name and username
2. **Copy the Bot Token** -- BotFather provides a token like `123456:ABC-DEF...`, copy it
3. **Add the Token to Autopilot** -- Where to provide the token in Settings/configuration
4. **Register the Webhook** -- Explain that the webhook is registered automatically on deployment
5. **Test the Bot** -- Send `/start` to your new bot to confirm it's working

### Available Commands
- `/start` -- Welcome message and introduction
- `/skills` -- Browse all available skills grouped by department
- `/run <skill_name>` -- Start running a specific skill
- `/cancel` -- Cancel an in-progress skill input collection
- `/help` -- Show available commands

### How Running a Skill Works
- Step-by-step walkthrough of the conversational flow: select skill, provide inputs one at a time, receive result
- Mention that long outputs are automatically split into multiple messages

### Tips and Troubleshooting
- Bot not responding? Check that the token is correct and webhook is registered
- Results too long? They're automatically split at paragraph boundaries
- Want to start over? Use `/cancel` then try again

## Technical Details

**File to modify:** `src/pages/Help.tsx`
- Add one new object to the `helpSections` array (after the "settings" entry, around line 169)
- No other files need changes
