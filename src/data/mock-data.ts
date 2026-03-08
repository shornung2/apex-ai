// Department + Skill-driven architecture

export type Department = "sales" | "marketing" | "talent";
export type AgentType = "researcher" | "strategist" | "content" | "coach";
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
    type: "coach",
    name: "Coach",
    emoji: "🏋️",
    description: "Meeting preparation, new employee onboarding, and career coaching — accelerating readiness and performance.",
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
  talent: {
    name: "Talent",
    description: "Employee onboarding and career coaching — accelerating readiness and performance using AI-powered coaching.",
    emoji: "🎓",
  },
};

// Which agents are available in each department
export const departmentAgents: Record<Department, AgentType[]> = {
  marketing: ["researcher", "strategist", "content", "coach"],
  sales: ["researcher", "coach", "content", "strategist"],
  talent: ["researcher", "coach", "content", "strategist"],
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
    agentType: ((raw) => { const v = (raw || "researcher").toLowerCase().replace(" ", "-"); return v === "meeting-prep" ? "coach" : v; })(row.agent_type) as AgentType,
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

