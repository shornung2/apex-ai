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
- The **sidebar** on the left gives you access to every area: Overview, Departments, Capabilities, Knowledge Base, Content Library, History, Help, and Settings.
- Click any department to see its available skills and run them.
- Use the **Overview** dashboard for a quick snapshot of activity and token usage.`,
  },
  {
    id: "dashboard",
    title: "Dashboard / Overview",
    content: `The Overview page is your command center.

### What you'll see
- **Agent Runs Today** — number of jobs dispatched today.
- **Tokens Used** — total tokens consumed vs. your budget.
- **Knowledge Base Size** — number of documents stored.
- **Average Confidence** — mean confidence score across completed jobs.
- **Recent Activity** — a live feed of the latest jobs with status indicators (queued, running, complete, failed).

### Tips
- Click any job in the activity feed to view its full detail page.
- The token usage bar in the sidebar gives you an at-a-glance budget view.`,
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

1. **Basics** — Name, description, emoji, department, and agent type.
2. **Inputs** — Define the form fields users fill in (text, textarea, select, etc.).
3. **Prompts** — Write the system prompt and prompt template with variable placeholders like \`{{Company Name}}\`.
4. **Model & Budget** — Choose the preferred AI model, token budget, and timeout.
5. **Output** — Set the output format (markdown, JSON), export formats, and output schema.
6. **Review** — Preview everything and save.

### Tips
- Use \`{{field_name}}\` in your prompt template to reference input fields.
- Start with a lower token budget and increase if outputs are getting cut off.
- Tags and trigger keywords help organize and search skills.`,
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
    content: `Run any Autopilot skill directly from Telegram — same agents, same skills, just a chat interface.

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
- \`/cancel\` — Cancel the current skill input collection and return to idle.
- \`/help\` — Show the list of available commands.

### How Running a Skill Works

1. Send \`/skills\` to see all available skills, or \`/run <name>\` if you know the skill name.
2. The bot will ask for each required input **one at a time** — just reply with your answer.
3. Once all inputs are collected, the bot dispatches the job to the agent.
4. The agent's output is sent back as a Telegram message, formatted in HTML.
5. If the result is longer than Telegram's 4096-character limit, it's automatically **split into multiple messages** at paragraph boundaries.

### Tips & Troubleshooting

- **Bot not responding?** Double-check that the bot token is correct and the webhook was registered successfully.
- **Getting errors?** Make sure the skill name matches exactly when using \`/run\`.
- **Results too long?** They're automatically split — no action needed on your part.
- **Want to start over?** Send \`/cancel\` to reset, then try again.
- **Multiple skills?** You can run skills back-to-back — just start a new \`/run\` after receiving results.`,
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
