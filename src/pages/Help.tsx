import { useState } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Search } from "lucide-react";

const helpSections = [
  {
    id: "getting-started",
    title: "Getting Started",
    content: `**Welcome to Apex AI — your AI-powered business platform by Solutionment.**

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

### Tips
- Click any job in the activity feed to view its full detail page.
- The token usage bar in the sidebar gives you an at-a-glance budget view.
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

### File Attachments in Skills
- Skills like **Meeting Prep Coach** include a file upload field for prior meeting transcripts or notes.
- Uploaded files are processed server-side — text is extracted and used as additional context for the agent.
- Supported formats: PDF, DOCX, PPTX, TXT, MD, CSV (max 20MB).
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
- Click any skill to view its details or run it.

### Skill Builder (6-Step Wizard)
Create custom skills with the guided wizard:

1. **Identity** — Name, display name, description, emoji, and version.
2. **Routing** — Department, agent type, tags, trigger keywords, preferred model, and lane.
3. **Inputs** — Define the form fields users fill in (text, textarea, select, radio, multi-select, and **file** for document uploads).
4. **System Prompt** — Write the system prompt with variable placeholders like \`{{field_name}}\`.
5. **Behavior** — Token budget, estimated cost, timeout, web search toggle, knowledge base toggle, approval required toggle, and **Schedulable** toggle (mark a skill as eligible for scheduled automation via Tasks).
6. **Output** — Set the output format (markdown, JSON, HTML, **pptx**), output title template, sections, and export formats.

### File Input Type
- When adding inputs in Step 3, you can now select **"file"** as the input type.
- This renders a file attachment button in the skill form.
- Users can upload PDF, DOCX, PPTX, TXT, MD, or CSV files.
- The uploaded file's extracted text is injected as the input value, flowing into your \`{{field_name}}\` template variable.

### Tips
- Use \`{{field_name}}\` in your system prompt to reference input fields.
- Start with a lower token budget and increase if outputs are getting cut off.
- Tags and trigger keywords help organize and search skills.
- Enable "Schedulable" on skills that produce useful output when re-run with the same inputs (e.g. market research, social media content).`,
  },
  {
    id: "knowledge-base",
    title: "Knowledge Base",
    content: `The Knowledge Base stores documents that agents reference during execution. It supports multi-format file uploads, folder organization, and drag-and-drop management.

### Uploading Documents
1. Go to **Knowledge Base** in the sidebar.
2. Click **Upload Files** or drag files directly onto the page.
3. Supported formats: **PDF, DOCX, PPTX, TXT, MD, CSV** (max 20MB per file).
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
    content: `The Settings page lets you configure your workspace.

### Appearance
- Toggle between **Light** and **Dark** mode.
- Your preference is saved and persists across sessions.

### Workspace Configuration
- View your workspace name and current plan.
- Manage API keys and integrations (if applicable).

### Agent Toggles
- Enable or disable specific agent types across departments.
- Useful for controlling which capabilities are available to your team.

### Tips
- If you're approaching your token budget, consider adjusting token budgets on individual skills in the Skill Builder.`,
  },
  {
    id: "telegram-bot",
    title: "Telegram Bot Integration",
    content: `Run any Apex AI skill directly from Telegram — same agents, same skills, just a chat interface. You can also chat with Alex, your AI assistant, and view your scheduled tasks.

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
- **Multiple skills?** You can run skills back-to-back — just start a new \`/run\` after receiving results.`,
  },
  {
    id: "alex-assistant",
    title: "Alex AI Assistant",
    content: `Alex is your general-purpose AI assistant, available in the web app and on Telegram.

### What Alex Can Do

- **Answer questions about the platform** — how to create skills, navigate departments, use the Knowledge Base, etc.
- **Help with the Skill Builder** — guide you through creating custom skills step by step.
- **Provide grounded answers** — Alex searches your Knowledge Base so responses reflect your organization's own documents.
- **Process file attachments** — upload a document directly in chat and Alex will use its content to answer your questions.
- **General assistance** — answer business questions, brainstorm ideas, draft content, and more.

### Using Alex in the Web App

1. Click the **chat icon** in the bottom-right corner of any page.
2. A chat panel opens — type your question and press Send.
3. Alex streams responses in real-time with Markdown formatting.
4. The conversation resets when you reload the page.

### File Attachments in Alex Chat

1. Click the **paperclip icon** (📎) next to the text input.
2. Select a file — supported formats: PDF, DOCX, PPTX, TXT, MD, CSV (max 20MB).
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
- On Telegram, use \`/clear\` if Alex's responses seem off-track.`,
  },
  {
    id: "scheduled-tasks",
    title: "Scheduled Tasks",
    content: `Automate any eligible skill to run on a recurring schedule — daily, weekly, monthly, or with a custom cron expression.

### Which Skills Can Be Scheduled?

Skills that produce useful output when re-run with the same inputs are marked as "schedulable." Examples include Company Research, Market Trends, Social Media Posts, and Blog Articles. You can also mark custom skills as schedulable in the Skill Builder (Step 5: Behavior).

### Creating a Scheduled Task

1. Go to **Tasks** in the sidebar (or click "View all" on the Dashboard's Scheduled Tasks card).
2. Click **New Task**.
3. **Select a Skill** — only schedulable skills appear.
4. **Fill Inputs** — provide the inputs the skill needs (same form as running it manually).
5. **Set Schedule** — choose frequency (Once, Daily, Weekly, Monthly, Custom) and time.
6. **Name & Confirm** — give your task a memorable name like "Morning Coffee" or "Daily Briefing," then confirm to create it.

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
    content: `All agents in Apex AI are grounded in your organization's knowledge. Here's how it works end-to-end.

### How Grounding Works

1. **Knowledge Base documents** are chunked into smaller text segments and stored in the database.
2. When an agent runs a skill, the system extracts key terms from user inputs.
3. Those terms are searched against all knowledge chunks using text matching.
4. The top matching chunks are injected into the agent's system prompt as context.
5. The agent uses this context to produce more relevant, organization-specific outputs.

### Sources of Context

Agents can receive context from multiple sources simultaneously:

- **Knowledge Base (RAG)** — Automatic. All uploaded documents (PDF, DOCX, PPTX, TXT, etc.) are chunked and searchable. Folder structure does not affect grounding.
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
- **Upload brand guidelines as .docx** — for best text extraction in deck generation.`,
  },
];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

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
              <AccordionItem key={section.id} value={section.id} className="glass-card rounded-lg border px-4">
                <AccordionTrigger className="text-sm font-medium hover:no-underline">
                  {section.title}
                </AccordionTrigger>
                <AccordionContent>
                  <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-line">
                    {section.content.split("\n").map((line, i) => {
                      if (line.startsWith("### ")) return <h3 key={i} className="text-sm font-semibold mt-4 mb-1">{line.replace("### ", "")}</h3>;
                      if (line.startsWith("**") && line.endsWith("**")) return <p key={i} className="font-semibold mt-2">{line.replace(/\*\*/g, "")}</p>;
                      if (line.startsWith("- ")) return <li key={i} className="ml-4 list-disc text-sm text-muted-foreground">{line.replace("- ", "")}</li>;
                      if (/^\d+\.\s/.test(line)) return <li key={i} className="ml-4 list-decimal text-sm text-muted-foreground">{line.replace(/^\d+\.\s/, "")}</li>;
                      if (line.trim() === "") return <br key={i} />;
                      return <p key={i} className="text-sm text-muted-foreground">{line}</p>;
                    })}
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
