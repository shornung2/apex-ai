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

Apex AI is a platform that puts AI agents to work across your Sales, Marketing, and Talent departments. Each agent has specialized skills that produce high-quality outputs — research reports, proposals, strategies, articles, onboarding plans, coaching guides, and more.

### How it works
1. **Departments** organize skills by business function (Sales, Marketing, Talent).
2. **Skills** are pre-built or custom AI tasks (e.g. "Company Research", "Proposal Draft", "New Employee Onboarding").
3. **Agents** execute skills — Researcher, Strategist, Content Writer, and Coach.
4. **Jobs** are individual runs of a skill. You fill in the inputs, click Run, and the agent produces an output.

### Navigation
- The **sidebar** on the left gives you access to every area: Overview, Departments (Sales, Marketing, Talent), Capabilities, Tasks, Knowledge Base, Content Library, History, Help, and Settings.
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
    title: "Departments (Sales, Marketing & Talent)",
    content: `Each department contains a curated set of skills organized by agent type.

### The Three Departments

- **Sales** — Revenue-driving skills for prospecting, deal strategy, proposals, meeting preparation, and more. Agents: Coach, Content Writer, Strategist.
- **Marketing** — Market intelligence, content creation, thought leadership, and brand strategy. Agents: Researcher, Strategist, Content Writer.
- **Talent** — Employee onboarding, career coaching, and meeting preparation — powered by Solutionment's Role-Readiness Acceleration methodology. Agents: Coach, Content Writer, Strategist.

### Browsing a Department
1. Click **Sales**, **Marketing**, or **Talent** in the sidebar under "Departments".
2. You'll see skill cards grouped by agent (Researcher, Strategist, Content, Coach).
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

### Viewing Results
- Completed jobs show the full output rendered as Markdown.
- You can **Copy** the output or **Save to Content Library** for later use.`,
  },
  {
    id: "coach-agent",
    title: "Coach Agent & Skills",
    content: `The **Coach** agent is a versatile coaching and preparation engine that powers Meeting Preparation and Career Coaching skills.

### Meeting Prep Coach
Pre-meeting coaching, discovery agendas, talk tracks, and objection handling guides — so every rep shows up sharp, regardless of their experience level. Available in both **Sales** and **Talent** departments.
- Inputs: Prospect/company name, meeting type, attendees, prior meeting notes (file upload), objectives.
- Output: Customized agenda, key questions, talk tracks, objection handling strategies.

### Career Coach
Personalized career development coaching for existing employees.
- Inputs: Employee name, current role, career goals, strengths, development areas, timeframe.
- Output: Personalized development plan, skill gap analysis, recommended learning path, coaching conversation guides, and milestone checkpoints.

### Structured Onboarding System
Employee onboarding is now powered by the dedicated **Onboarding** module in the Talent department. Navigate to **Talent > Onboarding** in the sidebar to access Success Profiles, Programs, Assignments, and the Learner Journey.

### Business Outcomes
- Reduce time-to-productivity by **25–50%** — develop people against the competencies that matter.
- Scale quality as you grow — AI coaching scales infinitely, maintaining consistency across 5 or 500 people.
- Cut early-stage turnover — structured programs with AI support create engagement that prevents 6-month attrition.
- Prove ROI with real data — readiness scores, gap analysis, and benchmarks give leadership quantified evidence.`,
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
- **Routing** — Department (Sales, Marketing, Talent), agent type (Researcher, Strategist, Content, Coach), and preferred model.
- **Inputs** — Define the form fields users fill in (text, textarea, select, radio, multi-select, and **file** for document uploads).
- **System Prompt** — Write the system prompt with variable placeholders like \`{{field_name}}\`. Use the "Insert variable" buttons to quickly add references.
- **Behavior & Options** — Estimated cost, web search toggle, and schedulable toggle.

### Build with Alex
The Skill Builder includes a **"Build with Alex"** mode — an AI-powered assistant specifically tuned for skill creation and prompt engineering.

**How to activate:**
1. Open the Skill Builder (click "New Skill" or edit an existing skill).
2. Click the **"Build with Alex"** button in the builder header.
3. The right-side Preview panel transforms into an Alex chat panel.

**What Alex can do:**
- **Generate complete system prompts** — describe your skill idea in plain language and Alex writes a full, production-ready system prompt.
- **Suggest input fields** — Alex can recommend the right input fields based on your skill's purpose.
- **Refine existing prompts** — paste or load an existing prompt and ask Alex to improve it.
- **Suggest descriptions and names** — Alex can help with skill identity and metadata.

**How to apply suggestions:**
- Alex wraps actionable suggestions in special blocks with **"Apply"** buttons.
- Click "Apply" to instantly populate the corresponding builder field.
- Toggle back to "Preview" mode anytime to see the skill preview.

### OpenRouter Models in Skills
- If OpenRouter is enabled in **Settings > API Keys**, your selected OpenRouter models appear in the Preferred Model dropdown.
- Skills using OpenRouter models are routed through your OpenRouter API key and credits.

### File Input Type
- When adding inputs, you can select **"file"** as the input type for document uploads.
- Users can upload PDF, DOCX, PPTX, TXT, MD, or CSV files.
- The uploaded file's extracted text is injected as the input value.

### Tips
- Use \`{{field_name}}\` in your system prompt to reference input fields.
- Enable "Schedulable" on skills that produce useful output when re-run with the same inputs.
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

### Drag-and-Drop Upload
- Drag files from your desktop directly onto the Knowledge Base page.
- A full-page overlay ("Drop files to upload") appears when files are dragged over.
- Dropped files are uploaded into the currently viewed folder.

### Folder Organization
- Click **New Folder** to create a folder in the current location.
- Click a folder row to navigate into it.
- **Breadcrumb navigation** at the top shows your current path.
- Rename or delete folders from the action buttons on each row.

### How Agents Use the Knowledge Base
- When an agent runs a skill, it searches Knowledge Base chunks for relevant context.
- Key terms from user inputs are matched against document chunks.
- Matching chunks are injected into the agent's system prompt for grounding.
- The more relevant documents you upload, the better your agent outputs.`,
  },
  {
    id: "content-library",
    title: "Content Library",
    content: `The Content Library lets you save, organize, and manage agent-produced outputs with full folder hierarchy, metadata tracking, and bulk operations.

### Layout
- Content is displayed in a **full-width data table** with sortable columns: Title, Department, Skill, Owner, Created date, and Views.
- Click any row to open a **slide-in detail panel** from the right.

### Nested Folders
- Folders support **unlimited nesting**.
- **Breadcrumb navigation** at the top shows your current path.

### Saving Content
- After any agent job completes, click **Save to Content Library** on the Job Detail page.
- Choose a folder (or create a new one) and save.

### Bulk Operations
- **Select multiple items** using checkboxes.
- **Bulk Download**, **Bulk Move**, and **Bulk Delete** are available.

### Search & Filter
- Use the search bar to filter items by title, department, skill name, owner, or content.`,
  },
  {
    id: "history",
    title: "History & Job Detail",
    content: `### History Page
- View all past and current agent jobs in reverse-chronological order.
- Each row shows the job title, agent type, department, status, and timestamp.
- Click any job to open its detail page.
- Use the **kebab menu (⋮)** for **Download PDF**, **Download Word**, or **Delete**.

### Job Detail Page
- **Inputs** — See exactly what was submitted to the agent.
- **Metadata** — Tokens used, confidence score, and duration.
- **Real-time Output** — For running jobs, watch the output stream live.
- **Actions** — Copy output, Save to Content Library, or Save to Knowledge Base.
- **Download .pptx** — For deck generation skills, a download button appears when complete.

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

### System
- View token usage, total runs, success rate, knowledge docs count, active skills, and scheduled tasks.

### Tips
- For administrative functions (agents, API keys, integrations, billing), see the **Workspace Admin** page.`,
  },
  {
    id: "workspace-admin",
    title: "Workspace Admin",
    content: `The Workspace Admin page is available only to **workspace administrators** and **super admins**.

### Team & Workspace
- Manage workspace details, team member roles, and invite new users.

### Agent Configuration
- Enable or disable specific agent types across departments (Researcher, Strategist, Content Writer, Coach).
- **When an agent is disabled**, all skills using that agent type are blocked from execution.
- Useful for controlling which capabilities are available to your team.

### API Keys
- **AI Gateway** — Connected via Lovable AI. Always active.
- **OpenRouter Integration** — Enable and configure additional AI models.

### Integrations
- **Telegram Bot** — Enable or disable the Telegram integration for your workspace.
- Telegram is **disabled by default** for new workspaces.

### Usage & Billing
- **Stat cards** show agent jobs run, decks generated, total tokens, and estimated cost.
- A **daily token usage chart** visualizes your consumption over the last 30 days.
- **Token budget warnings** appear when you approach or exceed your monthly limit.

### Multi-Tenant Access
- Access is determined by your email domain.
- The first user from a new organization is automatically granted the admin role.
- Contact hello@solutionment.com to register your organization.`,
  },
  {
    id: "telegram-bot",
    title: "Telegram Bot Integration",
    content: `Run any Apex AI skill directly from Telegram — same agents, same skills, just a chat interface. You can also chat with Alex, your AI assistant, and view your scheduled tasks.

**Important:** The Telegram integration is **disabled by default**. A workspace administrator must enable it in **Workspace Admin > Integrations** before the bot will respond to commands.

### Setup Guide (Step by Step)

1. **Open Telegram** and search for **@BotFather**.
2. Send the command \`/newbot\` to BotFather.
3. **Choose a name** for your bot (e.g. "My Apex AI Bot").
4. **Choose a username** — must end in "bot". BotFather will give you a **Bot Token**.
5. **Copy the token** and add it to your Apex AI workspace settings.
6. Once deployed, the webhook is registered automatically.
7. **Test it** — open your new bot in Telegram and send \`/start\`.

### Available Commands

- \`/start\` — Welcome message and introduction.
- \`/skills\` — Browse all available skills, grouped by department (Sales, Marketing, Talent).
- \`/run <skill_name>\` — Start running a specific skill by name.
- \`/tasks\` — View your active scheduled tasks.
- \`/cancel\` — Cancel the current skill input collection.
- \`/clear\` — Reset your Alex conversation history.
- \`/help\` — Show the list of available commands.

### Coach Skills on Telegram

Coach agent skills — Meeting Prep and Career Coaching — are fully accessible via Telegram. The bot will walk you through each required input one at a time, then dispatch the Coach agent with your inputs.

### How Running a Skill Works

1. Send \`/skills\` to see all available skills, or \`/run <name>\` if you know the skill name.
2. The bot asks for each required input **one at a time**.
3. Once all inputs are collected, the bot dispatches the job to the agent.
4. The agent's output is sent back as a Telegram message.

### Chatting with Alex on Telegram

- Just **type any message** (not a command) and Alex will respond.
- Alex remembers your recent conversation (last 20 messages) for context.
- Send \`/clear\` to reset your conversation history.

### Tips & Troubleshooting
- **Bot not responding?** Check that the bot token is correct.
- **Getting errors?** Make sure the skill name matches when using \`/run\`.
- **Results too long?** They're automatically split — no action needed.
- **Multiple skills?** You can run skills back-to-back.`,
  },
  {
    id: "alex-assistant",
    title: "Alex AI Assistant",
    content: `Alex is your general-purpose AI assistant, available in the web app, the Skill Builder, and on Telegram.

### What Alex Can Do
- **Answer questions about the platform** — how to create skills, navigate departments, use the Knowledge Base, etc.
- **Build skills with you** — in the Skill Builder's "Build with Alex" mode.
- **Provide grounded answers** — Alex searches your Knowledge Base so responses reflect your organization's own documents.
- **Process file attachments** — upload a document directly in chat and Alex will use its content.
- **General assistance** — answer business questions, brainstorm ideas, draft content.

### Using Alex in the Web App
1. Click the **chat icon** in the bottom-right corner of any page.
2. Type your question and press Send.
3. Alex streams responses in real-time with Markdown formatting.

### Build with Alex (Skill Builder)
1. Open the **Skill Builder**.
2. Click **"Build with Alex"**.
3. Describe your skill idea — Alex writes a complete system prompt and suggests configurations.
4. Click **"Apply"** to populate the builder form.

### File Attachments in Alex Chat
1. Click the **paperclip icon** next to the text input.
2. Select a file — supported formats: PDF, DOCX, PPTX, TXT, MD, CSV (max 10 MB).
3. Type your question and send — Alex receives the document content as context.

### Using Alex on Telegram
- Just **type any message** (not a command) and Alex will respond.
- Send \`/clear\` to reset your conversation history.`,
  },
  {
    id: "scheduled-tasks",
    title: "Scheduled Tasks",
    content: `Automate any eligible skill to run on a recurring schedule — daily, weekly, monthly, or with a custom cron expression.

### Which Skills Can Be Scheduled?

Skills that produce useful output when re-run with the same inputs are marked as "schedulable." Examples include:

- **Research & Intelligence:** Company Research, Contact Research, General Research, Market & Industry Trends, Competitive Battle Card, Market Intelligence Brief, Win/Loss Analysis
- **Content & Marketing:** Thought Leadership Article, LinkedIn / Social Posts, Marketing Copy, SEO Blog Brief
- **Sales:** Account Expansion Map
- **Talent & Coaching:** Career Coach (for periodic development check-ins)

You can also mark any custom skill as schedulable in the Skill Builder.

### Creating a Scheduled Task

1. Go to **Tasks** in the sidebar.
2. Click **New Task**.
3. **Name your task** — give it a memorable name.
4. **Select a Skill** — only schedulable skills appear.
5. **Fill Inputs** — provide the inputs the skill needs.
6. **Set Schedule** — choose frequency and time.
7. **Confirm** — review and create.

### Managing Tasks
- **Pause/Resume** — click the pause icon.
- **Delete** — remove a task entirely.
- **View Last Run** — click to see the most recent output.

### Tips
- All times are in UTC.
- Tasks run hourly — the system checks each hour for due tasks.
- "Once" tasks automatically complete after running.`,
  },
  {
    id: "grounding",
    title: "Agent Grounding & Context",
    content: `All agents in Apex AI are grounded in your organization's knowledge and live web data.

### How Grounding Works
1. **Knowledge Base documents** are chunked into smaller text segments.
2. When an agent runs, key terms from user inputs are searched against chunks.
3. Matching chunks are injected into the agent's system prompt as context.
4. The agent uses this context to produce relevant, organization-specific outputs.

### Live Web Search (Brave Search)
Skills with **web search enabled** fetch live results before generating a response.

### Sources of Context
- **Knowledge Base (RAG)** — Automatic. All uploaded documents are chunked and searchable.
- **Live Web Search** — Automatic for web-search-enabled skills.
- **Additional Context files** — User-attached files during skill execution.
- **File attachments in skills** — Extracted text passed directly as input values.
- **File attachments in Alex Chat** — Injected alongside RAG results.
- **Design System (for decks)** — Brand guidelines from Knowledge Base.

### Best Practices
- **Upload relevant documents** for better agent outputs.
- **Attach meeting transcripts** in Coach skills for targeted prep.
- **Keep documents current** — delete outdated ones and upload newer versions.`,
  },
  {
    id: "skill-packs",
    title: "Skill Packs",
    content: `Skill Packs are curated collections of production-quality skills with expert-written system prompts, structured inputs, and proven output formats.

### The Four Starter Packs

**Presales Excellence** (12 skills)
- RFP Analyzer & Scorer, Discovery Call Prep Coach, Competitive Battle Card, Executive Proposal Draft, Solution Qualification Scorecard, Meeting Follow-Up Email, POC & Pilot Plan, Objection Response Builder, and more.

**Sales Productivity** (10 skills)
- Company Research Brief, Personalized Outreach Email, Deal Strategy Session, Champion Coaching Guide, Meeting Prep Coach, Sales Negotiation Prep, Account Expansion Map, Win/Loss Analysis, and more.

**Marketing & Content** (8 skills)
- Thought Leadership Article, LinkedIn Post Series, Market Intelligence Brief, Campaign Messaging Framework, SEO Blog Brief, Customer Case Study Draft, Email Nurture Sequence, Product Launch Announcement.

**Talent & Coaching** (2 skills)
- 🎯 Meeting Prep Coach — Pre-meeting coaching, agendas, and talk tracks.
- 📈 Career Coach — Personalized development plans, skill gap analysis, learning paths, and coaching conversation guides.
- Employee onboarding is now managed through the dedicated **Onboarding** module (Talent > Onboarding).

### How Packs Are Seeded
- During **onboarding**, you select which packs to install.
- Skills from packs are added as regular skills — you can edit, customize, or delete them.
- **Duplicate detection** prevents the same skill from being added twice.`,
  },
  {
    id: "onboarding",
    title: "Onboarding & Setup",
    content: `When you first sign in, the Onboarding Wizard guides you through setting up your workspace in 4 steps.

### Step 1: Welcome
- See the Apex AI logo and a brief introduction.
- Click **Get Started** to begin.

### Step 2: About Your Team
- Enter your **company name**, select your **industry**, and choose your **primary use case** (Presales, Sales, Marketing, Talent & Coaching, or All).

### Step 3: Skill Packs
- Choose from curated skill packs: **Presales Excellence** (12 skills), **Sales Productivity** (10 skills), **Marketing & Content** (8 skills), and **Talent & Coaching** (3 skills).
- Packs are auto-selected based on your use case, but you can adjust selections.

### Step 4: Upload Document
- Optionally upload a company document to ground your agents in your business context.
- You can **skip this step** and upload documents later via the Knowledge Base.

### After Onboarding
- A **Quick Start banner** appears on the Dashboard suggesting skills to try based on your selected packs.
- Dismiss it anytime by clicking the X.`,
  },
  {
    id: "usage-billing",
    title: "Usage & Billing",
    content: `The Usage & Billing tab in **Workspace Admin** provides detailed visibility into your token consumption and costs.

### Stat Cards
- **Agent Jobs Run** — number of agent jobs executed this month.
- **Decks Generated** — number of PowerPoint decks created this month.
- **Total Tokens** — total tokens consumed across all events this month.
- **Estimated Cost** — calculated from your configured cost-per-1K-tokens rate.

### Usage Trend Chart
- A bar chart showing **daily token usage over the last 30 days**.

### Activity Table
- A detailed log of the 20 most recent usage events.

### Token Budget Warnings
- At **80% usage**: an amber warning banner appears.
- At **100% usage**: a red warning banner appears indicating jobs may be limited.`,
  },
  {
    id: "output-feedback",
    title: "Output Quality Feedback",
    content: `After every completed agent job, you can rate the output quality to help improve Apex AI.

### How It Works
1. Open any completed job from **History** or after running a skill.
2. Below the output, you'll see **"Was this output useful?"** with thumbs up/down buttons.
3. Click **👍** to rate positively.
4. Click **👎** to rate negatively — optionally describe what could be improved.

### Quality Badges on Skills
- Skills with **5+ ratings** display a quality badge showing positive percentage and total ratings.

### How Feedback Is Used
- Helps administrators identify skills needing prompt refinement.
- The **Super Admin Quality** tab shows all negatively-rated jobs for review.`,
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
