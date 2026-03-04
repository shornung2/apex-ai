import { useState } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Search } from "lucide-react";

const helpSections = [
  {
    id: "getting-started",
    title: "Getting Started",
    content: `**Welcome to Apex AI — your multi-tenant AI-powered business platform by Solutionment.**

Apex AI is a platform that puts AI agents to work across your Sales and Marketing departments. Each agent has specialized skills that produce high-quality outputs — research reports, proposals, strategies, articles, and more.

### How it works
1. **Departments** organize skills by business function (Sales, Marketing).
2. **Skills** are pre-built or custom AI tasks (e.g. "Company Research", "Proposal Draft").
3. **Agents** execute skills — Researcher, Strategist, Content Writer, and Meeting Prep.
4. **Jobs** are individual runs of a skill. You fill in the inputs, click Run, and the agent produces an output.

### Navigation
- The **sidebar** on the left gives you access to every area: Overview, Departments, Capabilities, Tasks, Knowledge Base, Content Library, History, Help, and Settings.
- Click any department to see its available skills and run them.
- Use the **Overview** dashboard for a quick snapshot of activity, token usage, and upcoming scheduled tasks.`,
  },
  {
    id: "dashboard",
    title: "Dashboard / Overview",
    content: `The Overview page is your command center.

### What you'll see
- **Total Runs** — total number of agent jobs dispatched.
- **Tokens Used** — total tokens consumed across all completed jobs.
- **Knowledge Base** — number of documents stored.
- **Scheduled Tasks** — up to 3 upcoming scheduled tasks with next run times, plus a "View all" link to the Tasks page.
- **Recent Activity** — a live feed of the latest jobs with status indicators (queued, running, complete, failed).
- **Quick Start Banner** — after completing onboarding, a banner appears suggesting skills to try based on the packs you selected. Dismiss it by clicking the X.

### Tips
- Click any job in the activity feed to view its full detail page.
- Click "View all" on the Scheduled Tasks card to manage your automated tasks.`,
  },
  {
    id: "departments",
    title: "Departments (Sales & Marketing)",
    content: `Each department contains a curated set of skills organized by agent type.

### Browsing a Department
1. Click **Sales** or **Marketing** in the sidebar under "Departments".
2. You'll see skill cards grouped by agent (Researcher, Strategist, Content, Meeting Prep).
3. Each card shows the skill name, emoji, description, and tags.

### Running a Skill
1. Click a skill card to open the input form.
2. Fill in all required fields (marked with an asterisk).
3. Some skills support **file attachments** — click the paperclip icon to upload a document (PDF, DOCX, PPTX, TXT, MD, CSV). The file is automatically processed and its content is injected into the agent's prompt for grounding.
4. Click **Run Agent** to dispatch the job.
5. You'll be taken to the Job Detail page where you can watch the output stream in real-time.

### Additional Context Files
- When running a skill, you can attach **Additional Context** files via the upload zone below the main inputs.
- Multiple files can be attached (max 10 files, **10 MB total** cumulative limit).
- A progress bar shows how much of the 10 MB budget is used.
- Supported formats: PDF, DOCX, PPTX, TXT, MD, CSV.
- The extracted content flows through the same grounding pipeline as Knowledge Base documents.

### File Attachments in Skills
- Skills like **Meeting Prep Coach** include a file upload field for prior meeting transcripts or notes.
- Uploaded files are processed server-side — text is extracted and used as additional context for the agent.
- Supported formats: PDF, DOCX, PPTX, TXT, MD, CSV (max 10 MB total across all context files).
- The extracted content flows through the same grounding pipeline as Knowledge Base documents.

### Viewing Results
- Completed jobs show the full output rendered as Markdown.
- You can **Copy** the output or **Save to Content Library** for later use.`,
  },
  {
    id: "deck-generation",
    title: "PowerPoint Deck Generation",
    content: `Apex AI can generate branded PowerPoint (.pptx) decks using AI — currently supporting **Capabilities Overview** and **Proposal** deck types in the Sales department.

### How to Generate a Deck
1. Go to the **Sales** department.
2. Select a deck skill (e.g. "Capabilities Overview" or "Proposal").
3. Fill in the required inputs — company name, number of slides, key topics, etc.
4. Click **Run Agent** to start generation.
5. When complete, the Job Detail page will show a **Download .pptx** button.

### What Gets Generated
- A multi-slide branded PowerPoint file with structured content.
- Each slide includes a title, subtitle, and bullet-point body content.
- The AI uses your Knowledge Base for context and grounding.

### Brand Context from Design System
- The generator automatically pulls brand guidelines from your **Design System** folder in the Knowledge Base.
- Upload your brand guide (colors, fonts, logo usage, tone of voice) as a .docx or .txt file to the "Design System" folder.
- These guidelines are injected into the AI prompt so decks reflect your brand identity.
- If no Design System folder or documents exist, built-in default styling is used.

### Tips
- For best results, upload your brand guidelines as a Word document (.docx) — text extraction is more reliable than PDF.
- The more context in your Knowledge Base about your company, the better the deck content.
- You can also generate decks via the **Telegram bot** — skills with PowerPoint output are automatically routed to the deck generator.`,
  },
  {
    id: "capabilities",
    title: "Capabilities & Skill Builder",
    content: `The Capabilities page is your skill library and builder.

### Skill Library
- Browse all skills across departments in one view.
- Filter by department, agent type, or search by name.
- **Drag to reorder** — grab any skill card and drag it to rearrange the order. Your custom order is saved automatically and remembered across sessions.
- Click any skill to view its details or run it.

### Skill Builder
Create custom skills using a streamlined single-page form with collapsible sections:

- **Identity** — Name, display name, description, emoji.
- **Routing** — Department, agent type, and preferred model. The model dropdown includes Standard models, Premium models, and any **OpenRouter models** you've enabled in Settings.
- **Inputs** — Define the form fields users fill in (text, textarea, select, radio, multi-select, and **file** for document uploads).
- **System Prompt** — Write the system prompt with variable placeholders like \`{{field_name}}\`. Use the "Insert variable" buttons to quickly add references.
- **Behavior & Options** — Estimated cost, web search toggle, and schedulable toggle.

All sections are collapsible — expand or collapse any section to focus on what you're working on. No need to step through a wizard; jump directly to any section.

### Build with Alex
The Skill Builder includes a **"Build with Alex"** mode — an AI-powered assistant specifically tuned for skill creation and prompt engineering.

**How to activate:**
1. Open the Skill Builder (click "New Skill" or edit an existing skill).
2. Click the **"Build with Alex"** button in the builder header.
3. The right-side Preview panel transforms into an Alex chat panel.

**What Alex can do:**
- **Generate complete system prompts** — describe your skill idea in plain language and Alex writes a full, production-ready system prompt with role definitions, step-by-step instructions, output format specifications, and edge case handling.
- **Suggest input fields** — Alex can recommend the right input fields (types, labels, placeholders, hints) based on your skill's purpose.
- **Refine existing prompts** — paste or load an existing prompt and ask Alex to improve it.
- **Suggest descriptions and names** — Alex can help with skill identity and metadata.

**How to apply suggestions:**
- Alex wraps actionable suggestions in special blocks with **"Apply"** buttons.
- Click "Apply" to instantly populate the corresponding builder field (system prompt, inputs, description, etc.).
- You can review and further edit the applied content in the builder form.
- Toggle back to "Preview" mode anytime to see the skill preview.

### OpenRouter Models in Skills
- If OpenRouter is enabled in **Settings > API Keys**, your selected OpenRouter models appear in the Preferred Model dropdown under a dedicated "🔗 OpenRouter" section.
- Skills using OpenRouter models are routed through your OpenRouter API key and credits.
- OpenRouter models are displayed with a 🔗 badge in the Skill Library.

### File Input Type
- When adding inputs in the **Inputs** section, you can select **"file"** as the input type.
- This renders a file attachment button in the skill form.
- Users can upload PDF, DOCX, PPTX, TXT, MD, or CSV files.
- The uploaded file's extracted text is injected as the input value, flowing into your \`{{field_name}}\` template variable.

### Tips
- Use \`{{field_name}}\` in your system prompt to reference input fields.
- Tags and trigger keywords help organize and search skills.
- Enable "Schedulable" on skills that produce useful output when re-run with the same inputs (e.g. market research, social media content).
- You can select up to 5 OpenRouter models in Settings for use across all skills.
- **Try "Build with Alex"** for your first skill — it dramatically reduces the effort of writing a strong system prompt.`,
  },
  {
    id: "knowledge-base",
    title: "Knowledge Base",
    content: `The Knowledge Base stores documents that agents reference during execution. It supports multi-format file uploads, folder organization, and drag-and-drop management.

### Uploading Documents
1. Go to **Knowledge Base** in the sidebar.
2. Click **Upload Files** or drag files directly onto the page.
3. Supported formats: **PDF, DOCX, PPTX, TXT, MD, CSV** (max 10 MB per file).
4. Files are uploaded to storage, processed server-side, and automatically chunked and indexed.
5. For PDFs, Word docs, and PowerPoint files, text is extracted on the server — no browser plugins needed.

### Drag-and-Drop Upload
- Drag files from your desktop directly onto the Knowledge Base page.
- A full-page overlay ("Drop files to upload") appears when files are dragged over.
- Dropped files are uploaded into the currently viewed folder.

### Folder Organization
- Click **New Folder** to create a folder in the current location.
- Click a folder row to navigate into it.
- **Breadcrumb navigation** at the top shows your current path (Root > Folder > Subfolder).
- Rename or delete folders from the action buttons on each row.
- Deleting a folder moves its documents to the parent folder.

### Drag-and-Drop File Reorganization
- **Drag any document row** and drop it onto a folder to move it.
- Folders highlight when a file is dragged over them.
- You can also drop files onto breadcrumb items to move them up the hierarchy.

### File Actions
- **Open** — Opens the file in a new browser tab (browser handles PDF, DOCX, etc. natively).
- **Download** — Downloads the original file to your computer.
- **Rename** — Click the pencil icon to rename inline.
- **Delete** — Removes the document, its chunks, and the storage file. A confirmation dialog prevents accidental deletion.

### How Agents Use the Knowledge Base
- When an agent runs a skill, it searches Knowledge Base chunks for relevant context.
- Key terms from user inputs are matched against document chunks using text search.
- Matching chunks are injected into the agent's system prompt for grounding.
- This works identically for all file types — PDF, DOCX, PPTX, TXT, etc.
- Folder structure is purely organizational — it does not affect grounding. Chunks reference documents regardless of folder location.
- The more relevant documents you upload, the better your agent outputs.`,
  },
  {
    id: "content-library",
    title: "Content Library",
    content: `The Content Library lets you save, organize, and manage agent-produced outputs with full folder hierarchy, metadata tracking, and bulk operations.

### Layout
- Content is displayed in a **full-width data table** with sortable columns: Title, Department, Skill, Owner, Created date, and Views.
- Click any row to open a **slide-in detail panel** from the right showing the full content preview and metadata.
- The detail panel closes by clicking the X or clicking outside.

### Nested Folders
- Folders support **unlimited nesting** — create folders inside folders for deep organization.
- **Breadcrumb navigation** at the top shows your current path (All Content > Folder > Subfolder).
- Click any breadcrumb to jump back up the hierarchy.
- Each folder shows a badge with the total item count (including nested subfolders).

### Folder Operations
- **Create Folder** — Click "New Folder" to create inside the current folder.
- **Rename Folder** — Use the kebab menu (⋮) on any folder to rename it.
- **Move Folder** — Move a folder to a different parent via the kebab menu.
- **Delete Folder** — Deletes the folder and moves its contents (items and subfolders) to the parent folder. A confirmation dialog prevents accidental deletion.

### Saving Content
- After any agent job completes, click **Save to Content Library** on the Job Detail page.
- Choose a folder (or create a new one) and save.

### Content Item Operations
- **View** — Click any row to open the detail panel with full Markdown preview and metadata.
- **Rename** — Rename items from the kebab menu or the detail panel.
- **Move** — Move items to a different folder via the kebab menu or detail panel.
- **Download** — Download as a Markdown file.
- **Copy** — Copy the raw content to clipboard from the detail panel.
- **Delete** — Remove items with a confirmation dialog.

### Metadata & Tracking
- Each item tracks: creator (owner), creation date, last updated date, originating department, agent type, skill name, and **view count**.
- The view count increments each time you open an item's detail panel.
- Sort by any column — click a column header to toggle ascending/descending.

### Bulk Operations
- **Select multiple items** using the checkboxes in the table.
- **Bulk Download** — Download all selected items as Markdown files.
- **Bulk Move** — Move all selected items to a chosen folder.
- **Bulk Delete** — Delete all selected items with confirmation.

### Search & Filter
- Use the search bar to filter items by title, department, skill name, owner, or content.
- Search applies within the currently viewed folder.`,
  },
  {
    id: "history",
    title: "History & Job Detail",
    content: `### History Page
- View all past and current agent jobs in reverse-chronological order.
- Each row shows the job title, agent type, department, status, and timestamp.
- Click any job to open its detail page.
- Use the **kebab menu (⋮)** on each row for additional actions:
  - **Download PDF** — export the completed job output as a formatted PDF file.
  - **Download Word** — export the completed job output as a .docx Word document with headings and bold formatting preserved.
  - **Delete** — permanently remove the job record (with confirmation dialog).
- Download options are only available for completed jobs with output.

### Job Detail Page
- **Inputs** — See exactly what was submitted to the agent.
- **Metadata** — Tokens used, confidence score, and duration.
- **Real-time Output** — For running jobs, watch the output stream live.
- **Actions** — Copy output to clipboard, Save to Content Library, or Save to Knowledge Base.
- **Download .pptx** — For deck generation skills, a download button appears when the job completes with a file URL.

### Status Indicators
- 🕐 **Queued** — Waiting to be picked up.
- 🔵 **Running** — Agent is actively working.
- ✅ **Complete** — Output is ready.
- ❌ **Failed** — Something went wrong.
- ⚠️ **Retrying** — Attempting again after a failure.`,
  },
  {
    id: "settings",
    title: "Settings",
    content: `The Settings page contains personal preferences and system overview — available to all users.

### General
- Set your workspace name and industry.

### Appearance
- Toggle between **Light**, **Dark**, and **System** mode.
- Your preference is saved and persists across sessions.

### System
- View token usage, total runs, success rate, knowledge docs count, active skills, and scheduled tasks.
- A quick overview of your workspace health at a glance.

### Tips
- For administrative functions (agents, API keys, integrations, billing), see the **Workspace Admin** page — available only to workspace administrators and super admins.`,
  },
  {
    id: "workspace-admin",
    title: "Workspace Admin",
    content: `The Workspace Admin page is available only to **workspace administrators** and **super admins**. It appears in the sidebar between Settings and Super Admin. Non-admin users cannot see or access this page.

### Team & Workspace
- At the top of the page, manage workspace details, team member roles, and invite new users.

### Agent Configuration
- Enable or disable specific agent types across departments.
- **When an agent is disabled**, all skills using that agent type are blocked from execution — in the web app, via Telegram, and through the API.
- The agent-dispatch service returns a 403 error if a disabled agent is requested.
- Useful for controlling which capabilities are available to your team.
- Agent toggle states are persisted to workspace settings and take effect immediately.

### API Keys
- **AI Gateway** — Connected via Lovable AI. Always active.
- **OpenRouter Integration:**
1. Go to **Workspace Admin > API Keys**.
2. Toggle **OpenRouter** on.
3. If your API key is already stored, you'll see "Key configured" and the full OpenRouter model catalog will load.
4. **Browse models** — scroll through the searchable list of all available OpenRouter models.
5. **Select up to 5 models** — click any model to enable it. Selected models appear at the top with a checkmark.
6. Selected models immediately become available in the Skill Builder's Preferred Model dropdown.
7. To change your API key, contact your administrator to update the backend secret.

### Integrations
- **Telegram Bot** — Enable or disable the Telegram integration for your workspace.
- Telegram is **disabled by default** for new workspaces.
- When disabled, the Telegram bot responds to all messages with a notice directing users to contact their administrator.
- When enabled, full setup instructions are shown in the panel.
- See the **Telegram Bot Integration** section for detailed setup steps.

### Usage & Billing
- **Stat cards** show agent jobs run, decks generated, total tokens, and estimated cost.
- A **daily token usage chart** visualizes your consumption over the last 30 days.
- The **activity table** lists recent usage events with event type, skill, tokens, and model used.
- **Token budget warnings** appear when you approach (80%) or exceed (100%) your monthly token limit.

### Multi-Tenant Access
- Apex AI supports multiple organizations. Access is determined by your email domain — each organization registers its allowed domains.
- The first user from a new organization is automatically granted the admin role.
- Contact hello@solutionment.com to register your organization.`,
  },
  {
    id: "telegram-bot",
    title: "Telegram Bot Integration",
    content: `Run any Apex AI skill directly from Telegram — same agents, same skills, just a chat interface. You can also chat with Alex, your AI assistant, and view your scheduled tasks.

**Important:** The Telegram integration is **disabled by default**. A workspace administrator must enable it in **Workspace Admin > Integrations** before the bot will respond to commands.

### Setup Guide (Step by Step)

1. **Open Telegram** and search for **@BotFather** (the official Telegram bot for creating bots).
2. Send the command \`/newbot\` to BotFather.
3. **Choose a name** for your bot (e.g. "My Apex AI Bot") — this is the display name.
4. **Choose a username** — must end in "bot" (e.g. \`my_apex_ai_bot\`). BotFather will confirm creation and give you a **Bot Token** like \`123456789:ABCdefGHI-jklMNOpqrSTUvwxYZ\`.
5. **Copy the token** and add it to your Apex AI workspace settings as the Telegram Bot Token.
6. Once deployed, the webhook is registered automatically — no manual configuration needed.
7. **Test it** — open your new bot in Telegram and send \`/start\`. You should see a welcome message.

### Available Commands

- \`/start\` — Welcome message and introduction to the bot.
- \`/skills\` — Browse all available skills, grouped by department (Sales, Marketing).
- \`/run <skill_name>\` — Start running a specific skill by name.
- \`/tasks\` — View your active scheduled tasks with next run times.
- \`/cancel\` — Cancel the current skill input collection and return to idle.
- \`/clear\` — Reset your Alex conversation history.
- \`/help\` — Show the list of available commands.

### How Running a Skill Works

1. Send \`/skills\` to see all available skills, or \`/run <name>\` if you know the skill name.
2. The bot will ask for each required input **one at a time** — just reply with your answer.
3. Once all inputs are collected, the bot dispatches the job to the agent.
4. The agent's output is sent back as a Telegram message, formatted in HTML.
5. If the result is longer than Telegram's 4096-character limit, it's automatically **split into multiple messages** at paragraph boundaries.

### PowerPoint Deck Generation via Telegram

- Skills with **pptx output format** (e.g. Capabilities Overview, Proposal) are automatically detected and routed to the deck generator.
- Once the deck is generated, the bot sends you a **download link** for the .pptx file.
- The same brand context from the Design System folder is applied.

### Chatting with Alex on Telegram

- Just **type any message** (not a command) and Alex will respond.
- Alex is grounded in your **Knowledge Base** — responses reflect your organization's documents.
- Alex remembers your recent conversation (last 20 messages) for context.
- Send \`/clear\` to reset your conversation history.

### Tips & Troubleshooting

- **Bot not responding?** Double-check that the bot token is correct and the webhook was registered successfully.
- **Getting errors?** Make sure the skill name matches exactly when using \`/run\`.
- **Results too long?** They're automatically split — no action needed on your part.
- **Want to start over?** Send \`/cancel\` to reset, then try again.
- **Multiple skills?** You can run skills back-to-back — just start a new \`/run\` after receiving results.
- **OpenRouter models:** Skills configured with an OpenRouter model will use that model when executed via Telegram. The bot passes the skill's preferred model and web search settings to the agent.`,
  },
  {
    id: "alex-assistant",
    title: "Alex AI Assistant",
    content: `Alex is your general-purpose AI assistant, available in the web app, the Skill Builder, and on Telegram.

### What Alex Can Do

- **Answer questions about the platform** — how to create skills, navigate departments, use the Knowledge Base, etc.
- **Build skills with you** — in the Skill Builder's "Build with Alex" mode, Alex generates complete system prompts, suggests inputs, and helps refine configurations. See the "Build with Alex" section under Capabilities & Skill Builder.
- **Provide grounded answers** — Alex searches your Knowledge Base so responses reflect your organization's own documents.
- **Process file attachments** — upload a document directly in chat and Alex will use its content to answer your questions.
- **General assistance** — answer business questions, brainstorm ideas, draft content, and more.

### Using Alex in the Web App

1. Click the **chat icon** in the bottom-right corner of any page.
2. A chat panel opens — type your question and press Send.
3. Alex streams responses in real-time with Markdown formatting.
4. The conversation resets when you reload the page.

### Build with Alex (Skill Builder)

1. Open the **Skill Builder** (Capabilities > New Skill or edit an existing skill).
2. Click **"Build with Alex"** in the builder header.
3. Describe your skill idea in the chat — Alex will generate a complete system prompt and suggest configurations.
4. Click the **"Apply"** buttons on Alex's suggestions to populate the builder form.
5. Toggle back to **"Preview"** to review the skill configuration.

This mode uses a specialized prompt engineering AI that understands skill architecture, variable injection ({{field_name}}), output formatting, and best practices for writing comprehensive AI prompts.

### File Attachments in Alex Chat

1. Click the **paperclip icon** next to the text input.
2. Select a file — supported formats: PDF, DOCX, PPTX, TXT, MD, CSV (max 10 MB).
3. The file is uploaded, processed server-side, and its extracted text appears as a chip above the input.
4. Type your question and send — Alex receives the document content as additional context alongside Knowledge Base grounding.
5. This is ideal for asking questions about a specific document, summarizing content, or extracting insights.
6. Click the **X** on the chip to remove the attachment before sending.

### Using Alex on Telegram

- Just **type any message** (not a command) and Alex will respond.
- Alex remembers your recent conversation (last 20 messages) for context.
- Send \`/clear\` to reset your conversation history with Alex.
- You can switch between chatting with Alex and running skills anytime.

### Tips

- Ask Alex "How do I create a custom skill?" for a step-by-step walkthrough.
- Upload documents to the Knowledge Base first — Alex will use them to give more relevant answers.
- Use the paperclip button to attach a document and ask specific questions about it.
- In the Skill Builder, try asking Alex: "Create a skill that researches competitors and produces a SWOT analysis."
- On Telegram, use \`/clear\` if Alex's responses seem off-track.`,
  },
  {
    id: "scheduled-tasks",
    title: "Scheduled Tasks",
    content: `Automate any eligible skill to run on a recurring schedule — daily, weekly, monthly, or with a custom cron expression.

### Which Skills Can Be Scheduled?

Skills that produce useful output when re-run with the same inputs are marked as "schedulable." The following skills are schedulable out of the box:

- **Research & Intelligence:** Company Research, Contact Research, General Research, Market & Industry Trends, Competitive Battle Card, Market Intelligence Brief, Win/Loss Analysis
- **Content & Marketing:** Thought Leadership Article, LinkedIn / Social Posts, Marketing Copy, General Marketing Content, Marketing Strategy, SEO Blog Brief
- **Sales:** Pipeline Review Prep, Account Expansion Map

You can also mark any custom skill as schedulable in the Skill Builder's **Behavior & Options** section.

### Creating a Scheduled Task

1. Go to **Tasks** in the sidebar (or click "View all" on the Dashboard's Scheduled Tasks card).
2. Click **New Task**.
3. **Name your task** — give it a memorable name like "Morning Coffee" or "Daily Briefing."
4. **Select a Skill** — only schedulable skills appear. You must enter a name before selecting.
5. **Fill Inputs** — provide the inputs the skill needs (same form as running it manually).
6. **Set Schedule** — choose frequency (Once, Daily, Weekly, Monthly, Custom) and time.
7. **Confirm** — review the summary and create.

### Managing Tasks

- **Pause/Resume** — click the pause icon to temporarily stop a task.
- **Delete** — remove a task entirely.
- **View Last Run** — click to see the output of the most recent execution.
- Each task card shows its schedule, status, next run time, and total run count.

### Dashboard Integration

The Overview dashboard shows up to 3 upcoming scheduled tasks with their next run times. Click "View all" to go to the full Tasks page.

### Tips

- All times are in UTC.
- Tasks run hourly — the system checks each hour for due tasks.
- "Once" tasks automatically move to "Completed" after running.
- Paused tasks are skipped until resumed.`,
  },
  {
    id: "grounding",
    title: "Agent Grounding & Context",
    content: `All agents in Apex AI are grounded in your organization's knowledge and live web data. Here's how it works end-to-end.

### How Grounding Works

1. **Knowledge Base documents** are chunked into smaller text segments and stored in the database.
2. When an agent runs a skill, the system extracts key terms from user inputs.
3. Those terms are searched against all knowledge chunks using text matching.
4. The top matching chunks are injected into the agent's system prompt as context.
5. The agent uses this context to produce more relevant, organization-specific outputs.

### Live Web Search (Brave Search)

Skills with **web search enabled** automatically fetch live results from the web before the agent generates its response:

- The system sends a search query derived from your inputs to the **Brave Search API**.
- Up to **10 recent web results** (filtered to the past week) are retrieved with titles, descriptions, and source URLs.
- These results are injected into the agent's system prompt as **LIVE WEB SEARCH RESULTS**, giving the model current, real-world context.
- The agent is instructed to cite sources where appropriate.
- If web search is unavailable (e.g. API key not configured), the system falls back gracefully to a recency caveat informing the model of its training cutoff.

**Skills that use live web search include:** Morning Coffee, Company Research Brief, Competitive Battle Card, Market Intelligence Brief, Win/Loss Analysis, SEO Blog Brief, LinkedIn Post Series, and any custom skill with web search enabled.

### Sources of Context

Agents can receive context from multiple sources simultaneously:

- **Knowledge Base (RAG)** — Automatic. All uploaded documents (PDF, DOCX, PPTX, TXT, etc.) are chunked and searchable. Folder structure does not affect grounding.
- **Live Web Search** — Automatic for web-search-enabled skills. Current web results are fetched and injected as grounding context.
- **Additional Context files** — When running a skill, users can attach extra files via the "Additional Context" upload zone (max 10 files, 10 MB total). These are extracted and injected into the agent's prompt.
- **File attachments in skills** — When a user uploads a file to a skill form (e.g. meeting transcripts), the extracted text is passed directly as an input value in the prompt template.
- **File attachments in Alex Chat** — When a user attaches a file while chatting with Alex, the content is injected into the system prompt alongside RAG results.
- **Built-in platform knowledge** — Alex has embedded knowledge about all Apex AI features and navigation.
- **Design System (for decks)** — The PowerPoint generator pulls brand guidelines from the "Design System" Knowledge Base folder automatically.

### Best Practices

- **Upload relevant documents** — the more context agents have, the better the outputs.
- **Use specific file names** — helps you identify documents later.
- **Attach meeting transcripts** — use the file upload in Meeting Prep Coach for targeted prep.
- **Keep documents current** — delete outdated documents and upload newer versions.
- **All file types work equally** — PDF, DOCX, PPTX, TXT, MD, and CSV are all extracted and chunked identically.
- **Upload brand guidelines as .docx** — for best text extraction in deck generation.
- **Web search skills work best with specific inputs** — the more specific your inputs, the better the search results and grounding.`,
  },
  {
    id: "skill-packs",
    title: "Skill Packs",
    content: `Skill Packs are curated collections of production-quality skills with expert-written system prompts, structured inputs, and proven output formats.

### What Are Skill Packs?
- Each pack contains **8 skills** with complete, production-ready definitions — not templates, but fully-configured skills with detailed system prompts, input fields with placeholders and hints, and structured output formats.
- Packs are designed by domain experts and cover the most common workflows in presales, sales, and marketing.

### The Three Starter Packs

**Presales Excellence** (8 skills)
- 📋 RFP Analyzer & Scorer — Score RFP opportunities with a weighted Go/No-Go rubric
- 🔍 Discovery Call Prep Coach — Build pre-call hypotheses and themed question sets
- ⚔️ Competitive Battle Card — Strategic battle cards with trap questions and landmines
- 📝 Executive Proposal Draft — Polished executive proposals with business case framing
- ✅ Solution Qualification Scorecard — Multi-dimensional deal qualification scoring
- ✉️ Meeting Follow-Up Email — Specific, strategic follow-up emails by meeting type
- 🧪 POC & Pilot Plan — Complete POC plans with success criteria and risk registers
- 🛡️ Objection Response Builder — Multi-layered objection handling strategies

**Sales Productivity** (8 skills)
- 🔬 Company Research Brief — Deep-dive account intelligence with sales insights
- 📬 Personalized Outreach Email — Three-variant outreach emails with follow-up sequences
- ♟️ Deal Strategy Session — Structured deal coaching with stakeholder mapping
- 🏆 Champion Coaching Guide — Enable your internal champion to win internally
- 📈 Pipeline Review Prep — Deal health assessments and forecast analysis
- 🤝 Sales Negotiation Prep — BATNA analysis and concession strategies
- 🗺️ Account Expansion Map — Whitespace analysis and growth planning
- 📊 Win/Loss Analysis — Root cause analysis with pattern identification

**Marketing & Content** (8 skills)
- 💭 Thought Leadership Article — Authoritative articles with original perspectives
- 💼 LinkedIn Post Series — Multi-format post series with engagement optimization
- 📡 Market Intelligence Brief — Trend analysis and competitive landscape mapping
- 📢 Campaign Messaging Framework — Value props, persona messaging, and creative direction
- 🔎 SEO Blog Brief — Keyword strategy, competitive analysis, and content outlines
- 📚 Customer Case Study Draft — Challenge-solution-results storytelling
- 📧 Email Nurture Sequence — Multi-touch sequences with conversion optimization
- 🚀 Product Launch Announcement — Full launch content packages across channels

### How Packs Are Seeded
- During **onboarding**, you select which packs to install. Selected packs are automatically seeded into your workspace.
- **Admins** can seed additional packs at any time via the platform API.
- Skills from packs are added as regular skills — you can edit, customize, or delete them like any other skill.
- **Duplicate detection** prevents the same skill from being added twice.`,
  },
  {
    id: "onboarding",
    title: "Onboarding & Setup",
    content: `When you first sign in, the Onboarding Wizard guides you through setting up your workspace in 4 steps.

### Step 1: Welcome
- See the Apex AI logo and a brief introduction to the platform.
- Click **Get Started** to begin.

### Step 2: About Your Team
- Enter your **company name**, select your **industry**, and choose your **primary use case** (Presales, Sales, Marketing, or All).
- This information personalizes your workspace and pre-selects relevant skill packs.

### Step 3: Skill Packs
- Choose from curated skill packs: **Presales Excellence** (8 skills), **Sales Productivity** (8 skills), and **Marketing & Content** (8 skills).
- Each pack contains production-quality skills with expert-written system prompts — not basic templates.
- Packs are auto-selected based on your use case, but you can adjust selections.
- Selected packs are seeded into your workspace when you finish.

### Step 4: Upload Document
- Optionally upload a company document (overview, product guide, playbook) to ground your agents in your business context.
- Supported formats: PDF, Word, PowerPoint, Text, CSV (max 10 MB).
- You can **skip this step** and upload documents later via the Knowledge Base.

### After Onboarding
- A **Quick Start banner** appears on the Dashboard suggesting skills to try based on your selected packs.
- Dismiss it anytime by clicking the X.`,
  },
  {
    id: "usage-billing",
    title: "Usage & Billing",
    content: `The Usage & Billing tab in **Workspace Admin** provides detailed visibility into your token consumption and costs. This tab is only accessible to workspace administrators and super admins.

### Stat Cards
- **Agent Jobs Run** — number of agent jobs executed this month.
- **Decks Generated** — number of PowerPoint decks created this month.
- **Total Tokens** — total tokens consumed across all events this month.
- **Estimated Cost** — calculated from your configured cost-per-1K-tokens rate.

### Usage Trend Chart
- A bar chart showing **daily token usage over the last 30 days**.
- Hover over any bar to see the exact token count for that day.

### Activity Table
- A detailed log of the 20 most recent usage events.
- Shows date/time, event type, skill name, tokens used, and AI model.

### Token Budget Warnings
- If your organization has a monthly token budget configured:
  - At **80% usage**: an amber warning banner appears.
  - At **100% usage**: a red warning banner appears indicating jobs may be limited.
- Contact your administrator to increase the budget if needed.`,
  },
  {
    id: "output-feedback",
    title: "Output Quality Feedback",
    content: `After every completed agent job, you can rate the output quality to help improve Apex AI.

### How It Works
1. Open any completed job from the **History** page or after running a skill.
2. Below the output, you'll see **"Was this output useful?"** with thumbs up and thumbs down buttons.
3. Click **👍** to rate positively — your feedback is saved immediately.
4. Click **👎** to rate negatively — a text box appears where you can optionally describe what could be improved.
5. Click **Submit Feedback** to save your note, or leave it blank.

### Quality Badges on Skills
- Skills that have received **5 or more ratings** display a quality badge on their card.
- The badge shows the percentage of positive ratings and total rating count (e.g. "⭐ 85% positive (20 ratings)").
- Badges appear on skill cards in both **Department** pages and the **Capabilities** skill library.

### How Feedback Is Used
- Feedback data helps administrators identify skills that may need prompt refinement.
- The **Super Admin Quality** tab shows all negatively-rated jobs with feedback notes for review.
- Over time, feedback drives continuous improvement of AI skill performance.`,
  },
];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

function renderInline(text: string) {
  // Parse **bold**, `code`, and {{variables}} into JSX
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*)|(`(.+?)`)|(\{\{(.+?)\}\})/g;
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    if (match[2]) {
      parts.push(<span key={key++} className="font-semibold text-foreground">{match[2]}</span>);
    } else if (match[4]) {
      parts.push(<code key={key++} className="px-1.5 py-0.5 rounded bg-muted text-primary text-xs font-mono">{match[4]}</code>);
    } else if (match[6]) {
      parts.push(<code key={key++} className="px-1.5 py-0.5 rounded bg-muted text-primary text-xs font-mono">{`{{${match[6]}}}`}</code>);
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts.length > 0 ? parts : text;
}

function renderContent(content: string) {
  return content.split("\n").map((line, i) => {
    const trimmed = line.trim();
    if (trimmed === "") return null;
    if (trimmed.startsWith("### ")) {
      return (
        <h3 key={i} className="text-sm font-semibold text-foreground mt-5 mb-2 tracking-tight">
          {trimmed.replace("### ", "")}
        </h3>
      );
    }
    if (trimmed.startsWith("- ")) {
      return (
        <li key={i} className="ml-5 list-disc text-sm text-foreground/80 leading-relaxed">
          {renderInline(trimmed.replace("- ", ""))}
        </li>
      );
    }
    if (/^\d+\.\s/.test(trimmed)) {
      return (
        <li key={i} className="ml-5 list-decimal text-sm text-foreground/80 leading-relaxed">
          {renderInline(trimmed.replace(/^\d+\.\s/, ""))}
        </li>
      );
    }
    return (
      <p key={i} className="text-sm text-foreground/80 leading-relaxed">
        {renderInline(trimmed)}
      </p>
    );
  });
}

export default function Help() {
  const [search, setSearch] = useState("");

  const filtered = helpSections.filter(
    (s) =>
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-4xl">
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold tracking-tight">Help & User Guides</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Everything you need to know about using Apex AI.
        </p>
      </motion.div>

      <motion.div variants={item} className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search guides..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </motion.div>

      <motion.div variants={item}>
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            No guides match your search.
          </p>
        ) : (
          <Accordion type="multiple" className="space-y-2">
            {filtered.map((section) => (
              <AccordionItem key={section.id} value={section.id} className="glass-card rounded-lg border px-5 py-1">
                <AccordionTrigger className="text-sm font-semibold text-foreground hover:no-underline">
                  {section.title}
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-1 pb-2">
                    {renderContent(section.content)}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </motion.div>
    </motion.div>
  );
}
