export type Skill = {
  id: string;
  name: string;
  description: string;
  icon: string;
  department: "marketing" | "sales" | "both";
  type: "Research" | "Content" | "Analysis" | "Outreach";
  complexity: "Basic" | "Advanced" | "Expert";
  source: "Solutionment IP" | "Standard";
  inputs: string[];
  sampleOutput: string;
};

export type Agent = {
  id: string;
  name: string;
  description: string;
  department: "marketing" | "sales";
  status: "online" | "busy" | "offline";
  skills: string[];
  avatar: string;
};

export type TaskStatus = "queued" | "running" | "needs_review" | "completed" | "failed";

export type AgentTask = {
  id: string;
  agentId: string;
  skillId: string;
  title: string;
  status: TaskStatus;
  department: "marketing" | "sales";
  inputs: Record<string, string>;
  output?: string;
  createdAt: string;
  completedAt?: string;
};

export const skills: Skill[] = [
  {
    id: "company-research",
    name: "Company/Market Research",
    description: "Deep-dive research on companies, competitors, and market landscapes. Produces structured reports with key findings.",
    icon: "🔍",
    department: "both",
    type: "Research",
    complexity: "Advanced",
    source: "Solutionment IP",
    inputs: ["Company Name", "Industry", "Research Focus"],
    sampleOutput: "Structured market analysis report with competitive landscape, key metrics, and strategic insights.",
  },
  {
    id: "content-generation",
    name: "Content Generation",
    description: "Generate blog posts, social media copy, email campaigns, and other marketing content tailored to your brand voice.",
    icon: "✍️",
    department: "marketing",
    type: "Content",
    complexity: "Basic",
    source: "Standard",
    inputs: ["Content Type", "Topic", "Tone", "Target Audience"],
    sampleOutput: "Polished blog post or social copy ready for review and publishing.",
  },
  {
    id: "lead-scoring",
    name: "Lead Research & Scoring",
    description: "Research and score leads based on fit, intent signals, and engagement data. Prioritizes your pipeline automatically.",
    icon: "🎯",
    department: "sales",
    type: "Analysis",
    complexity: "Expert",
    source: "Solutionment IP",
    inputs: ["Lead Name", "Company", "Source", "Engagement Data"],
    sampleOutput: "Lead score (1-100) with qualification rationale and recommended next steps.",
  },
  {
    id: "proposal-drafting",
    name: "Proposal/SOW Drafting",
    description: "Draft professional proposals and statements of work based on client requirements and your service offerings.",
    icon: "📄",
    department: "sales",
    type: "Outreach",
    complexity: "Expert",
    source: "Solutionment IP",
    inputs: ["Client Name", "Project Scope", "Budget Range", "Timeline"],
    sampleOutput: "Complete proposal document with scope, deliverables, timeline, and pricing.",
  },
];

export const agents: Agent[] = [
  {
    id: "mkt-researcher",
    name: "Researcher",
    description: "Conducts deep market and competitive research to inform strategy.",
    department: "marketing",
    status: "online",
    skills: ["company-research"],
    avatar: "🔬",
  },
  {
    id: "mkt-writer",
    name: "Content Writer",
    description: "Creates compelling content across all marketing channels.",
    department: "marketing",
    status: "busy",
    skills: ["content-generation"],
    avatar: "✏️",
  },
  {
    id: "sales-scorer",
    name: "Lead Scorer",
    description: "Analyzes and prioritizes leads based on fit and intent signals.",
    department: "sales",
    status: "online",
    skills: ["lead-scoring", "company-research"],
    avatar: "📊",
  },
  {
    id: "sales-drafter",
    name: "Proposal Writer",
    description: "Drafts professional proposals and SOWs tailored to client needs.",
    department: "sales",
    status: "offline",
    skills: ["proposal-drafting"],
    avatar: "📝",
  },
];

export const mockTasks: AgentTask[] = [
  {
    id: "task-1",
    agentId: "mkt-researcher",
    skillId: "company-research",
    title: "Market analysis for Acme Corp",
    status: "completed",
    department: "marketing",
    inputs: { "Company Name": "Acme Corp", Industry: "SaaS", "Research Focus": "Competitive landscape" },
    output: "## Acme Corp Market Analysis\n\n**Industry Position**: Mid-market SaaS leader in project management...\n\n**Key Competitors**: Asana, Monday.com, ClickUp\n\n**Growth Rate**: 45% YoY",
    createdAt: "2026-02-28T14:30:00Z",
    completedAt: "2026-02-28T14:35:00Z",
  },
  {
    id: "task-2",
    agentId: "mkt-writer",
    skillId: "content-generation",
    title: "Blog post: AI in Sales Automation",
    status: "running",
    department: "marketing",
    inputs: { "Content Type": "Blog Post", Topic: "AI in Sales Automation", Tone: "Professional", "Target Audience": "Sales Leaders" },
    createdAt: "2026-03-01T09:15:00Z",
  },
  {
    id: "task-3",
    agentId: "sales-scorer",
    skillId: "lead-scoring",
    title: "Score leads from WebSummit batch",
    status: "needs_review",
    department: "sales",
    inputs: { "Lead Name": "Batch Import", Source: "WebSummit 2026", "Engagement Data": "Booth visit + demo request" },
    output: "**12 leads scored**\n\n- 3 Hot (Score > 80)\n- 5 Warm (Score 50-80)\n- 4 Cold (Score < 50)\n\nTop lead: Sarah Chen, VP Sales @ TechFlow — Score: 94",
    createdAt: "2026-03-01T08:00:00Z",
    completedAt: "2026-03-01T08:12:00Z",
  },
  {
    id: "task-4",
    agentId: "sales-drafter",
    skillId: "proposal-drafting",
    title: "SOW for GlobalTech integration project",
    status: "queued",
    department: "sales",
    inputs: { "Client Name": "GlobalTech", "Project Scope": "API Integration", "Budget Range": "$50k-$80k", Timeline: "Q2 2026" },
    createdAt: "2026-03-01T10:00:00Z",
  },
  {
    id: "task-5",
    agentId: "mkt-researcher",
    skillId: "company-research",
    title: "Competitor deep-dive: CloudSync",
    status: "failed",
    department: "marketing",
    inputs: { "Company Name": "CloudSync", Industry: "Cloud Infrastructure", "Research Focus": "Product features" },
    createdAt: "2026-02-27T16:00:00Z",
  },
];

export const dashboardMetrics = {
  activeAgents: 3,
  tasksToday: 12,
  tasksInQueue: 4,
  successRate: 94,
};
