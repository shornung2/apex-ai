// Department + Skill-driven architecture

export type Department = "sales" | "marketing";
export type AgentType = "researcher" | "strategist" | "content" | "meeting-prep";
export type JobStatus = "queued" | "running" | "complete" | "failed" | "retrying";

export type SkillInput = {
  name?: string;
  field?: string;
  label: string;
  type: "text" | "textarea" | "select" | "radio" | "multi-select" | "multiselect" | "url" | "file";
  required: boolean;
  placeholder?: string;
  hint?: string;
  options?: string[];
  default?: string | string[];
};

export type Skill = {
  id: string;
  name: string;
  displayName?: string;
  description: string;
  department: Department;
  agentType: AgentType;
  emoji: string;
  inputs: SkillInput[];
  promptTemplate: string;
  systemPrompt?: string;
  version?: string;
  tags?: string[];
  triggerKeywords?: string[];
  preferredModel?: string;
  preferredLane?: string;
  tokenBudget?: number;
  estimatedCost?: number;
  requiredCapabilities?: string[];
  webSearchEnabled?: boolean;
  approvalRequired?: boolean;
  timeoutSeconds?: number;
  outputFormat?: string;
  outputSchema?: Record<string, any>;
  exportFormats?: string[];
  isSystem?: boolean;
  schedulable?: boolean;
};

export type AgentDefinition = {
  type: AgentType;
  name: string;
  emoji: string;
  description: string;
};

export type AgentJob = {
  id: string;
  agentType: AgentType;
  skillId: string;
  department: Department;
  title: string;
  status: JobStatus;
  inputs: Record<string, string>;
  output?: string;
  tokensUsed?: number;
  confidenceScore?: number;
  createdAt: string;
  completedAt?: string;
};

// The 4 core agents (generic execution engines)
export const agentDefinitions: AgentDefinition[] = [
  {
    type: "researcher",
    name: "Researcher",
    emoji: "🔍",
    description: "Deep-dive research and intelligence gathering on companies, contacts, markets, and trends.",
  },
  {
    type: "strategist",
    name: "Strategist",
    emoji: "🧠",
    description: "Strategic analysis, planning, and frameworks tailored to your goals.",
  },
  {
    type: "content",
    name: "Content",
    emoji: "✍️",
    description: "Polished written materials — proposals, emails, social posts, and more.",
  },
  {
    type: "meeting-prep",
    name: "Meeting Prep",
    emoji: "🎯",
    description: "Pre-meeting coaching, agendas, and talk tracks for sales conversations.",
  },
];

// Department metadata
export const departmentDefinitions: Record<Department, { name: string; description: string; emoji: string }> = {
  sales: {
    name: "Sales",
    description: "Revenue-driving skills for prospecting, deal strategy, proposals, and meeting preparation.",
    emoji: "💼",
  },
  marketing: {
    name: "Marketing",
    description: "Market intelligence, content creation, thought leadership, and brand strategy skills.",
    emoji: "📣",
  },
};

// Which agents are available in each department
export const departmentAgents: Record<Department, AgentType[]> = {
  marketing: ["researcher", "strategist", "content"],
  sales: ["meeting-prep", "content", "strategist"],
};

// Helper to normalize DB skill row to Skill type
export function dbRowToSkill(row: any): Skill {
  const inputs = (row.inputs as any[]) || [];
  return {
    id: row.id,
    name: row.name,
    displayName: row.display_name || row.name,
    description: row.description || "",
    department: (row.department || "marketing").toLowerCase() as Department,
    agentType: (row.agent_type || "researcher").toLowerCase().replace(" ", "-") as AgentType,
    emoji: row.emoji || "⚡",
    inputs: inputs.map((inp: any) => ({
      ...inp,
      name: inp.field || inp.name || "",
      type: inp.type === "multiselect" ? "multi-select" : inp.type || "text",
    })),
    promptTemplate: row.prompt_template || "",
    systemPrompt: row.system_prompt || "",
    version: row.version || "1.0.0",
    tags: row.tags || [],
    triggerKeywords: row.trigger_keywords || [],
    preferredModel: row.preferred_model || "haiku",
    preferredLane: row.preferred_lane || "simple_haiku",
    tokenBudget: row.token_budget || 10000,
    estimatedCost: row.estimated_cost_usd ? parseFloat(row.estimated_cost_usd) : undefined,
    requiredCapabilities: row.required_capabilities || [],
    webSearchEnabled: row.web_search_enabled || false,
    approvalRequired: row.approval_required || false,
    timeoutSeconds: row.timeout_seconds || 120,
    outputFormat: row.output_format || "markdown",
    outputSchema: row.output_schema || {},
    exportFormats: row.export_formats || [],
    isSystem: row.is_system || false,
    schedulable: row.schedulable || false,
  };
}

// Mock jobs for UI development
export const mockJobs: AgentJob[] = [
  {
    id: "job-1",
    agentType: "researcher",
    skillId: "mkt-research-company",
    department: "marketing",
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
    skillId: "sales-content-proposal",
    department: "sales",
    title: "Proposal draft: TechFlow integration",
    status: "running",
    inputs: { "Client Company": "TechFlow", "Project Name": "Integration", "Investment Range": "$50k-$80k" },
    tokensUsed: 1200,
    createdAt: "2026-03-01T09:15:00Z",
  },
  {
    id: "job-3",
    agentType: "strategist",
    skillId: "sales-strategy-deal",
    department: "sales",
    title: "Deal strategy: GlobalTech enterprise",
    status: "complete",
    inputs: { "Account Name": "GlobalTech", "Deal Value": "$420k", "Current Stage": "Negotiation" },
    output: "**Deal Strategy — GlobalTech**\n\n- Deal stalled 14 days in negotiation\n- Recommend exec escalation to unblock procurement\n- Champion: Sarah Lin (VP Eng) — schedule alignment call\n- Risk: competing internal build initiative\n- Next step: ROI workshop with CFO",
    tokensUsed: 1850,
    confidenceScore: 88,
    createdAt: "2026-03-01T08:00:00Z",
    completedAt: "2026-03-01T08:12:00Z",
  },
  {
    id: "job-4",
    agentType: "meeting-prep",
    skillId: "sales-meeting-prep",
    department: "sales",
    title: "Meeting prep: CloudSync discovery call",
    status: "queued",
    inputs: { "Company Name": "CloudSync", "Meeting Type": "Discovery Call", "Duration": "45 min" },
    createdAt: "2026-03-01T10:00:00Z",
  },
  {
    id: "job-5",
    agentType: "content",
    skillId: "mkt-content-article",
    department: "marketing",
    title: "Article: Future of AI in Consulting",
    status: "complete",
    inputs: { "Title / Topic": "The Future of AI in Consulting", "Target Length": "1200 words" },
    output: "# The Future of AI in Consulting\n\nArtificial intelligence is reshaping the consulting landscape...\n\n## Key Trends\n1. AI-augmented research and analysis\n2. Automated deliverable generation\n3. Real-time market intelligence\n\n## What This Means for Firms\nConsulting firms that adopt AI will see 30-40% productivity gains...",
    tokensUsed: 3200,
    confidenceScore: 90,
    createdAt: "2026-02-27T16:00:00Z",
    completedAt: "2026-02-27T16:20:00Z",
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
