

# Autopilot — AI Operating System for Business

## Vision
A dark, sleek, modern SaaS platform where AI agents organized by department (Sales, Marketing) execute business tasks powered by configurable "skills." Built first for Solutionment, then sold as a managed service.

---

## Pages & Navigation

### Collapsible Sidebar Navigation (dark theme, icon-collapsible)
- **Command Center** (Dashboard)
- **Departments** (expandable: Marketing, Sales)
- **Skills Marketplace**
- **Agent Activity Feed**
- **Settings / Admin**

---

## 1. Command Center (Dashboard)
The home screen — a real-time overview of everything happening in Autopilot.

- **Key metrics cards**: Active agents, tasks completed today, tasks in queue, success rate
- **Recent activity timeline**: Live feed of agent actions with status badges (running, completed, failed, needs review)
- **Department summary widgets**: Quick-glance cards for Marketing & Sales showing active tasks and top skills used
- **Quick-launch bar**: Start a new task or chat with an agent directly from the dashboard

---

## 2. Departments — Marketing & Sales
Each department page shows its available agents and recent work.

- **Agent cards**: Each agent (e.g., "Researcher," "Content Writer," "Lead Scorer") displayed as a card with name, description, status indicator, and quick-launch button
- **Department-specific metrics**: Tasks run, avg completion time, success rate
- **Recent outputs**: Latest deliverables from that department's agents

---

## 3. Skills Marketplace
Browse, configure, and manage the skills that power agents.

- **Skill cards in a grid**: Each skill shows name, description, department tags, complexity badge, and whether it's Solutionment IP or out-of-the-box
- **Skill detail panel** (slide-over): Full description, required inputs, sample output, which agents use this skill
- **Categories & filters**: Filter by department, skill type (Research, Content, Analysis, Outreach), and source (Solutionment IP vs. Standard)
- **Initial skills**:
  - 🔍 Company/Market Research
  - ✍️ Content Generation (blog posts, social copy, emails)
  - 🎯 Lead Research & Scoring
  - 📄 Proposal/SOW Drafting

---

## 4. Agent Activity Feed
Monitor all running and completed agent tasks.

- **Filterable task list**: Filter by department, agent, status, date range
- **Task detail view**: Skill used, inputs, status, progress, and output
- **Status badges**: Queued → Running → Needs Review → Completed / Failed
- **Approve/reject actions**: Human-in-the-loop for tasks marked "Needs Review"
- **Output viewer**: Rich display of agent outputs (formatted markdown, tables)

---

## 5. Hybrid Agent Interaction (Powered by Lovable AI)

### Form-Based Task Launch
- Select a skill → fill structured inputs → click "Run"
- Clean wizard-like form with validation
- Agent executes via Lovable AI (Gemini) edge function, with streaming results

### Conversational Chat
- Chat panel to converse with a department agent
- Real-time streaming responses via Lovable AI gateway with markdown rendering
- Agent uses skills behind the scenes based on conversation context
- Chat history preserved per conversation

### AI Backend
- Lovable Cloud edge functions calling the Lovable AI gateway (google/gemini-3-flash-preview)
- Each skill maps to a tailored system prompt sent to the AI
- Streaming SSE responses rendered token-by-token in the chat UI
- Designed so Claude can be swapped in later as the agentic backend

---

## 6. Settings / Admin
- **Organization profile**: Company name, logo, branding
- **API keys & integrations**: Manage external service connections
- **Skill management**: Enable/disable skills, configure custom skills
- **User preferences**: Notifications, theme, default department

---

## Design System
- **Dark & sleek aesthetic** inspired by Linear/Vercel
- Dark background (#0a0a0f range), subtle borders, electric blue/purple accent gradients
- Clean typography, generous spacing, smooth animations
- Glassmorphism-style cards with subtle transparency
- Fully responsive: desktop and tablet

---

## Technical Architecture
- **Frontend**: React + TypeScript + Tailwind + shadcn/ui (dark mode)
- **Backend**: Lovable Cloud (Supabase) — database, edge functions, secrets
- **AI**: Lovable AI gateway (google/gemini-3-flash-preview) via streaming edge functions — real AI responses from day one
- **Data**: Skills, agents, tasks, conversations, and activity stored in Supabase tables
- **Auth**: Deferred — will be added when ready to sell as SaaS

