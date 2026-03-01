// Agent type definitions matching PRD
export type AgentType = "researcher" | "strategist" | "content" | "pulse" | "concierge";
export type JobStatus = "queued" | "running" | "complete" | "failed" | "retrying";

export type AgentDefinition = {
  type: AgentType;
  name: string;
  emoji: string;
  description: string;
  capabilities: string[];
};

export type AgentJob = {
  id: string;
  agentType: AgentType;
  title: string;
  status: JobStatus;
  inputs: Record<string, string>;
  output?: string;
  tokensUsed?: number;
  confidenceScore?: number;
  createdAt: string;
  completedAt?: string;
};

// The 5 agents from the PRD
export const agentDefinitions: AgentDefinition[] = [
  {
    type: "researcher",
    name: "Researcher",
    emoji: "🔍",
    description: "Prospect intelligence, company research, and ICP scoring. Deep-dive analysis on any target company or market.",
    capabilities: ["Company Research", "Market Analysis", "ICP Scoring", "Competitive Intel"],
  },
  {
    type: "strategist",
    name: "Strategist",
    emoji: "🧠",
    description: "Meeting preparation, discovery frameworks, and objection handling. Your strategic pre-meeting copilot.",
    capabilities: ["Meeting Prep", "Discovery Frameworks", "Objection Handling", "Deal Strategy"],
  },
  {
    type: "content",
    name: "Content",
    emoji: "✍️",
    description: "Proposals, SOWs, executive summaries, and sales materials. Polished documents tailored to your brand.",
    capabilities: ["Proposals", "SOWs", "Executive Summaries", "Sales Decks"],
  },
  {
    type: "pulse",
    name: "Pulse",
    emoji: "📊",
    description: "Pipeline analysis, deal health monitoring, and forecast commentary. Real-time revenue intelligence.",
    capabilities: ["Pipeline Analysis", "Deal Health", "Forecast", "Revenue Insights"],
  },
  {
    type: "concierge",
    name: "Alex",
    emoji: "🤖",
    description: "Natural language routing and orchestration. Ask anything and Alex will dispatch the right agent.",
    capabilities: ["Natural Language", "Multi-Agent Routing", "Orchestration", "Smart Dispatch"],
  },
];

// Mock jobs for UI development
export const mockJobs: AgentJob[] = [
  {
    id: "job-1",
    agentType: "researcher",
    title: "Company deep-dive: Acme Corp",
    status: "complete",
    inputs: { "Company Name": "Acme Corp", "Industry": "SaaS", "Research Depth": "Deep Dive" },
    output: "## Acme Corp Analysis\n\n**Industry Position**: Mid-market SaaS leader in project management\n\n**Key Competitors**: Asana, Monday.com, ClickUp\n\n**Growth Rate**: 45% YoY\n\n**ICP Score**: 87/100 — Strong fit for enterprise consulting services.",
    tokensUsed: 2340,
    confidenceScore: 92,
    createdAt: "2026-02-28T14:30:00Z",
    completedAt: "2026-02-28T14:35:00Z",
  },
  {
    id: "job-2",
    agentType: "content",
    title: "Proposal draft: TechFlow integration",
    status: "running",
    inputs: { "Document Type": "Proposal", "Company": "TechFlow", "Investment Range": "$50k-$80k" },
    tokensUsed: 1200,
    createdAt: "2026-03-01T09:15:00Z",
  },
  {
    id: "job-3",
    agentType: "pulse",
    title: "Q1 pipeline health check",
    status: "complete",
    inputs: { "Focus Area": "Deal Health", "Pipeline Stage": "Negotiation", "Time Horizon": "This Quarter" },
    output: "**Pipeline Summary — Q1 2026**\n\n- 12 deals in negotiation stage\n- 3 at risk (stalled >14 days)\n- Weighted forecast: $420k\n- Win probability: 68%\n\nTop concern: GlobalTech deal slipping — recommend exec escalation.",
    tokensUsed: 1850,
    confidenceScore: 88,
    createdAt: "2026-03-01T08:00:00Z",
    completedAt: "2026-03-01T08:12:00Z",
  },
  {
    id: "job-4",
    agentType: "strategist",
    title: "Meeting prep: CloudSync discovery call",
    status: "queued",
    inputs: { "Company Name": "CloudSync", "Meeting Type": "Discovery Call", "Duration": "45 min" },
    createdAt: "2026-03-01T10:00:00Z",
  },
  {
    id: "job-5",
    agentType: "researcher",
    title: "Competitor analysis: CloudSync",
    status: "failed",
    inputs: { "Company Name": "CloudSync", "Industry": "Cloud Infrastructure", "Research Depth": "Standard" },
    createdAt: "2026-02-27T16:00:00Z",
  },
  {
    id: "job-6",
    agentType: "concierge",
    title: "Route: 'What do we know about DataVault?'",
    status: "complete",
    inputs: { "Query": "What do we know about DataVault Inc?" },
    output: "Routed to **Researcher** agent. Found 2 existing knowledge base documents. Generated a new company brief combining stored knowledge with fresh research.",
    tokensUsed: 450,
    confidenceScore: 95,
    createdAt: "2026-03-01T07:30:00Z",
    completedAt: "2026-03-01T07:31:00Z",
  },
];

// Dashboard metrics
export const dashboardMetrics = {
  agentRunsToday: 14,
  tokensUsed: 12450,
  tokenBudget: 50000,
  knowledgeBaseSize: 23,
  avgConfidence: 91,
};
