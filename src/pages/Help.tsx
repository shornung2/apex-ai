import { useState } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Search } from "lucide-react";

const helpSections = [
  {
    id: "getting-started",
    title: "Getting Started",
    content: `**Welcome to Autopilot — your AI Operating System.**

Autopilot is a platform that puts AI agents to work across your Sales and Marketing departments. Each agent has specialized skills that produce high-quality outputs — research reports, proposals, strategies, articles, and more.

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
3. Click **Run Agent** to dispatch the job.
4. You'll be taken to the Job Detail page where you can watch the output stream in real-time.

### Viewing Results
- Completed jobs show the full output rendered as Markdown.
- You can **Copy** the output or **Save to Content Library** for later use.`,
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
3. **Inputs** — Define the form fields users fill in (text, textarea, select, radio, multi-select).
4. **System Prompt** — Write the system prompt with variable placeholders like \`{{field_name}}\`.
5. **Behavior** — Token budget, estimated cost, timeout, web search toggle, knowledge base toggle, approval required toggle, and **Schedulable** toggle (mark a skill as eligible for scheduled automation via Tasks).
6. **Output** — Set the output format (markdown, JSON, HTML), output title template, sections, and export formats.

### Tips
- Use \`{{field_name}}\` in your system prompt to reference input fields.
- Start with a lower token budget and increase if outputs are getting cut off.
- Tags and trigger keywords help organize and search skills.
- Enable "Schedulable" on skills that produce useful output when re-run with the same inputs (e.g. market research, social media content).`,
  },
  {
    id: "knowledge-base",
    title: "Knowledge Base",
    content: `The Knowledge Base stores documents that agents can reference during execution.

### Uploading Documents
1. Go to **Knowledge Base** in the sidebar.
2. Click **Upload Document**.
3. Select a file — supported formats include text, PDF, and Markdown.
4. The document will be processed, chunked, and indexed automatically.

### Viewing Content
- Click any document to see its full content and metadata (type, token count, status).
- Documents show their processing status: processing, ready, or error.

### How Agents Use the Knowledge Base
- When a skill has web search disabled, agents can draw on Knowledge Base content for context.
- The more relevant documents you upload, the better your agent outputs.`,
  },
  {
    id: "content-library",
    title: "Content Library",
    content: `The Content Library lets you save, organize, and manage agent-produced outputs.

### Folders
- Create folders to organize content by project, client, or topic.
- Rename or delete folders from the folder panel.
- Nested folders are supported.

### Saving Content
- After any agent job completes, click **Save to Content Library** on the Job Detail page.
- Choose a folder (or create a new one) and save.

### Managing Content
- **Search** — Filter items by title, agent type, skill, or department.
- **Select & Download** — Check multiple items and download them as Markdown files.
- **Delete** — Remove individual items or bulk-delete selected items.
- Each item shows its date, owner, originating agent, skill, and department.

### Content Viewer
- Click any item to see a full Markdown preview with all metadata.`,
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
    content: `Run any Autopilot skill directly from Telegram — same agents, same skills, just a chat interface. You can also chat with Alex, your AI assistant, and view your scheduled tasks.

### Setup Guide (Step by Step)

1. **Open Telegram** and search for **@BotFather** (the official Telegram bot for creating bots).
2. Send the command \`/newbot\` to BotFather.
3. **Choose a name** for your bot (e.g. "My Autopilot Bot") — this is the display name.
4. **Choose a username** — must end in "bot" (e.g. \`my_autopilot_bot\`). BotFather will confirm creation and give you a **Bot Token** like \`123456789:ABCdefGHI-jklMNOpqrSTUvwxYZ\`.
5. **Copy the token** and add it to your Autopilot workspace settings as the Telegram Bot Token.
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

### Chatting with Alex

- Just **type any message** (not a command) and Alex will respond.
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
- **General assistance** — answer business questions, brainstorm ideas, draft content, and more.

### Using Alex in the Web App

1. Click the **lightbulb icon** in the bottom-right corner of any page.
2. A chat panel opens — type your question and press Send.
3. Alex streams responses in real-time with Markdown formatting.
4. The conversation resets when you reload the page.

### Using Alex on Telegram

- Just **type any message** (not a command) and Alex will respond.
- Alex remembers your recent conversation (last 20 messages) for context.
- Send \`/clear\` to reset your conversation history with Alex.
- You can switch between chatting with Alex and running skills anytime.

### Tips

- Ask Alex "How do I create a custom skill?" for a step-by-step walkthrough.
- Upload documents to the Knowledge Base first — Alex will use them to give more relevant answers.
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
6. **Name & Confirm** — give it a name and create.

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
          Everything you need to know about using Autopilot.
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
