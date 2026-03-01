// Department + Skill-driven architecture

export type Department = "sales" | "marketing";
export type AgentType = "researcher" | "strategist" | "content" | "meeting-prep";
export type JobStatus = "queued" | "running" | "complete" | "failed" | "retrying";

export type SkillInput = {
  name: string;
  label: string;
  type: "text" | "textarea" | "select" | "radio" | "multi-select";
  required: boolean;
  placeholder?: string;
  options?: string[];
};

export type Skill = {
  id: string;
  name: string;
  description: string;
  department: Department;
  agentType: AgentType;
  emoji: string;
  inputs: SkillInput[];
  promptTemplate: string;
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

// ─── SKILLS ──────────────────────────────────────────

export const skills: Skill[] = [
  // ── Marketing → Researcher ──
  {
    id: "mkt-research-company",
    name: "Company Research",
    description: "Deep-dive analysis of a target company — financials, org structure, tech stack, and competitive position.",
    department: "marketing",
    agentType: "researcher",
    emoji: "🏢",
    inputs: [
      { name: "company_name", label: "Company Name", type: "text", required: true, placeholder: "e.g. Acme Corp" },
      { name: "industry", label: "Industry", type: "text", required: false, placeholder: "e.g. SaaS, FinTech" },
      { name: "depth", label: "Research Depth", type: "select", required: true, options: ["Quick Scan", "Standard", "Deep Dive"] },
      { name: "focus_areas", label: "Focus Areas", type: "multi-select", required: false, options: ["Financials", "Leadership", "Tech Stack", "Competitors", "Recent News"] },
    ],
    promptTemplate: "Research {{company_name}} in the {{industry}} industry at {{depth}} level. Focus on: {{focus_areas}}.",
  },
  {
    id: "mkt-research-contact",
    name: "Contact Research",
    description: "Profile a person — role, background, publications, social presence, and communication style.",
    department: "marketing",
    agentType: "researcher",
    emoji: "👤",
    inputs: [
      { name: "contact_name", label: "Full Name", type: "text", required: true, placeholder: "e.g. Jane Smith" },
      { name: "company", label: "Company", type: "text", required: false, placeholder: "e.g. Acme Corp" },
      { name: "role", label: "Known Role/Title", type: "text", required: false, placeholder: "e.g. VP Marketing" },
      { name: "context", label: "Research Context", type: "textarea", required: false, placeholder: "Why are you researching this person?" },
    ],
    promptTemplate: "Research {{contact_name}} at {{company}} ({{role}}). Context: {{context}}.",
  },
  {
    id: "mkt-research-market",
    name: "Market & Industry Trends",
    description: "Analyze market trends, industry dynamics, emerging opportunities, and competitive landscape.",
    department: "marketing",
    agentType: "researcher",
    emoji: "📈",
    inputs: [
      { name: "market", label: "Market / Industry", type: "text", required: true, placeholder: "e.g. Enterprise AI" },
      { name: "geography", label: "Geography", type: "select", required: false, options: ["Global", "North America", "Europe", "APAC", "LATAM"] },
      { name: "time_horizon", label: "Time Horizon", type: "select", required: true, options: ["Current State", "6-month Outlook", "1-year Outlook", "3-year Outlook"] },
      { name: "specific_questions", label: "Specific Questions", type: "textarea", required: false, placeholder: "Any specific angles you want explored?" },
    ],
    promptTemplate: "Analyze market trends for {{market}} in {{geography}} with a {{time_horizon}} perspective. Questions: {{specific_questions}}.",
  },
  {
    id: "mkt-research-general",
    name: "General Research",
    description: "Open-ended research on any topic — flexible and exploratory.",
    department: "marketing",
    agentType: "researcher",
    emoji: "🔎",
    inputs: [
      { name: "topic", label: "Research Topic", type: "text", required: true, placeholder: "What do you want to research?" },
      { name: "details", label: "Details & Context", type: "textarea", required: true, placeholder: "Provide background and what you're looking for..." },
      { name: "output_format", label: "Output Format", type: "select", required: false, options: ["Summary Brief", "Detailed Report", "Bullet Points", "Comparison Table"] },
    ],
    promptTemplate: "Research: {{topic}}. Details: {{details}}. Format: {{output_format}}.",
  },

  // ── Marketing → Strategist ──
  {
    id: "mkt-strategy",
    name: "Marketing Strategy",
    description: "Develop a marketing strategy with positioning, messaging, channels, and go-to-market tactics.",
    department: "marketing",
    agentType: "strategist",
    emoji: "🎯",
    inputs: [
      { name: "objective", label: "Marketing Objective", type: "text", required: true, placeholder: "e.g. Launch new product line" },
      { name: "target_audience", label: "Target Audience", type: "textarea", required: true, placeholder: "Describe your ideal customer..." },
      { name: "channels", label: "Preferred Channels", type: "multi-select", required: false, options: ["LinkedIn", "Email", "Content Marketing", "Events", "Paid Ads", "PR"] },
      { name: "budget_range", label: "Budget Range", type: "select", required: false, options: ["< $10k", "$10k - $50k", "$50k - $100k", "$100k+"] },
      { name: "timeline", label: "Timeline", type: "select", required: true, options: ["1 month", "1 quarter", "6 months", "1 year"] },
    ],
    promptTemplate: "Create marketing strategy for: {{objective}}. Audience: {{target_audience}}. Channels: {{channels}}. Budget: {{budget_range}}. Timeline: {{timeline}}.",
  },

  // ── Marketing → Content ──
  {
    id: "mkt-content-social",
    name: "LinkedIn / Social Posts",
    description: "Craft engaging LinkedIn or social media posts — thought leadership, announcements, or engagement content.",
    department: "marketing",
    agentType: "content",
    emoji: "💬",
    inputs: [
      { name: "topic", label: "Topic / Theme", type: "text", required: true, placeholder: "e.g. AI in consulting" },
      { name: "tone", label: "Tone", type: "select", required: true, options: ["Professional", "Conversational", "Provocative", "Inspirational"] },
      { name: "post_type", label: "Post Type", type: "select", required: true, options: ["Thought Leadership", "Announcement", "Question/Poll", "Story/Narrative", "How-to/Tips"] },
      { name: "key_points", label: "Key Points", type: "textarea", required: false, placeholder: "Main points to convey..." },
      { name: "num_variations", label: "Number of Variations", type: "select", required: false, options: ["1", "2", "3"] },
    ],
    promptTemplate: "Write {{num_variations}} {{post_type}} LinkedIn posts about {{topic}} in a {{tone}} tone. Key points: {{key_points}}.",
  },
  {
    id: "mkt-content-copy",
    name: "Marketing Copy",
    description: "Website copy, ad copy, landing pages, email campaigns, and promotional materials.",
    department: "marketing",
    agentType: "content",
    emoji: "📝",
    inputs: [
      { name: "copy_type", label: "Copy Type", type: "select", required: true, options: ["Website Copy", "Landing Page", "Ad Copy", "Email Campaign", "Brochure"] },
      { name: "product_service", label: "Product / Service", type: "text", required: true, placeholder: "What are you promoting?" },
      { name: "target_audience", label: "Target Audience", type: "text", required: true, placeholder: "Who is this for?" },
      { name: "key_messages", label: "Key Messages", type: "textarea", required: true, placeholder: "Core messages and value props..." },
      { name: "cta", label: "Call to Action", type: "text", required: false, placeholder: "e.g. Book a demo, Learn more" },
    ],
    promptTemplate: "Write {{copy_type}} for {{product_service}} targeting {{target_audience}}. Messages: {{key_messages}}. CTA: {{cta}}.",
  },
  {
    id: "mkt-content-article",
    name: "Thought Leadership Article",
    description: "Long-form articles, blog posts, and thought leadership pieces that establish expertise.",
    department: "marketing",
    agentType: "content",
    emoji: "📰",
    inputs: [
      { name: "title_idea", label: "Title / Topic", type: "text", required: true, placeholder: "e.g. The Future of AI in Enterprise" },
      { name: "angle", label: "Angle / Thesis", type: "textarea", required: true, placeholder: "Your unique perspective or argument..." },
      { name: "word_count", label: "Target Length", type: "select", required: true, options: ["500 words", "800 words", "1200 words", "2000+ words"] },
      { name: "audience", label: "Target Audience", type: "text", required: false, placeholder: "Who should read this?" },
    ],
    promptTemplate: "Write a {{word_count}} thought leadership article: '{{title_idea}}'. Angle: {{angle}}. Audience: {{audience}}.",
  },
  {
    id: "mkt-content-general",
    name: "General Marketing Content",
    description: "Any marketing content not covered by other skills — flexible and open-ended.",
    department: "marketing",
    agentType: "content",
    emoji: "✏️",
    inputs: [
      { name: "content_type", label: "What Do You Need?", type: "text", required: true, placeholder: "e.g. Newsletter intro, case study outline" },
      { name: "details", label: "Details & Instructions", type: "textarea", required: true, placeholder: "Describe what you need in detail..." },
      { name: "tone", label: "Tone", type: "select", required: false, options: ["Professional", "Casual", "Technical", "Persuasive"] },
    ],
    promptTemplate: "Create {{content_type}}: {{details}}. Tone: {{tone}}.",
  },

  // ── Sales → Meeting Prep ──
  {
    id: "sales-meeting-prep",
    name: "Meeting Prep Coach",
    description: "Pre-meeting intelligence, agendas, discovery questions, and talk tracks for sales conversations.",
    department: "sales",
    agentType: "meeting-prep",
    emoji: "🎤",
    inputs: [
      { name: "company_name", label: "Company Name", type: "text", required: true, placeholder: "e.g. Acme Corp" },
      { name: "meeting_type", label: "Meeting Type", type: "select", required: true, options: ["Discovery Call", "Demo", "Negotiation", "QBR", "Executive Briefing"] },
      { name: "attendees", label: "Key Attendees", type: "textarea", required: false, placeholder: "Names and roles of attendees..." },
      { name: "duration", label: "Duration", type: "select", required: true, options: ["15 min", "30 min", "45 min", "60 min"] },
      { name: "objectives", label: "Meeting Objectives", type: "textarea", required: true, placeholder: "What do you want to achieve?" },
      { name: "known_challenges", label: "Known Challenges / Objections", type: "textarea", required: false, placeholder: "Any objections or concerns to prepare for?" },
    ],
    promptTemplate: "Prepare for a {{duration}} {{meeting_type}} with {{company_name}}. Attendees: {{attendees}}. Objectives: {{objectives}}. Challenges: {{known_challenges}}.",
  },

  // ── Sales → Content ──
  {
    id: "sales-content-proposal",
    name: "Proposal",
    description: "Draft a professional proposal with scope, timeline, investment, and terms.",
    department: "sales",
    agentType: "content",
    emoji: "📄",
    inputs: [
      { name: "company_name", label: "Client Company", type: "text", required: true, placeholder: "e.g. Acme Corp" },
      { name: "project_name", label: "Project Name", type: "text", required: true, placeholder: "e.g. Digital Transformation Phase 2" },
      { name: "scope", label: "Scope of Work", type: "textarea", required: true, placeholder: "Describe the project scope..." },
      { name: "investment", label: "Investment Range", type: "text", required: false, placeholder: "e.g. $50k - $80k" },
      { name: "format", label: "Output Format", type: "select", required: true, options: ["Word Document", "PDF", "PowerPoint"] },
      { name: "timeline", label: "Project Timeline", type: "text", required: false, placeholder: "e.g. 12 weeks" },
    ],
    promptTemplate: "Create a {{format}} proposal for {{company_name}}: {{project_name}}. Scope: {{scope}}. Investment: {{investment}}. Timeline: {{timeline}}.",
  },
  {
    id: "sales-content-sow",
    name: "Statement of Work",
    description: "Generate a detailed SOW with deliverables, milestones, responsibilities, and acceptance criteria.",
    department: "sales",
    agentType: "content",
    emoji: "📋",
    inputs: [
      { name: "company_name", label: "Client Company", type: "text", required: true, placeholder: "e.g. Acme Corp" },
      { name: "project_name", label: "Project Name", type: "text", required: true, placeholder: "e.g. CRM Integration" },
      { name: "deliverables", label: "Key Deliverables", type: "textarea", required: true, placeholder: "List the major deliverables..." },
      { name: "assumptions", label: "Assumptions & Dependencies", type: "textarea", required: false, placeholder: "Key assumptions..." },
      { name: "duration", label: "Engagement Duration", type: "text", required: true, placeholder: "e.g. 8 weeks" },
    ],
    promptTemplate: "Create a SOW for {{company_name}}: {{project_name}}. Deliverables: {{deliverables}}. Assumptions: {{assumptions}}. Duration: {{duration}}.",
  },
  {
    id: "sales-content-email",
    name: "Sales Email",
    description: "Craft outreach emails, follow-ups, proposals, and executive communications.",
    department: "sales",
    agentType: "content",
    emoji: "📧",
    inputs: [
      { name: "email_type", label: "Email Type", type: "select", required: true, options: ["Cold Outreach", "Follow-up", "Proposal Cover", "Thank You", "Executive Summary"] },
      { name: "recipient_name", label: "Recipient Name", type: "text", required: true, placeholder: "e.g. John Davis" },
      { name: "recipient_role", label: "Recipient Role", type: "text", required: false, placeholder: "e.g. CTO" },
      { name: "company", label: "Company", type: "text", required: true, placeholder: "e.g. Acme Corp" },
      { name: "context", label: "Context / Key Points", type: "textarea", required: true, placeholder: "What should this email convey?" },
    ],
    promptTemplate: "Write a {{email_type}} email to {{recipient_name}} ({{recipient_role}}) at {{company}}. Context: {{context}}.",
  },

  // ── Sales → Strategist ──
  {
    id: "sales-strategy-deal",
    name: "Deal Strategy",
    description: "Analyze a deal's health, develop win strategy, identify risks, and plan next steps.",
    department: "sales",
    agentType: "strategist",
    emoji: "♟️",
    inputs: [
      { name: "company_name", label: "Account Name", type: "text", required: true, placeholder: "e.g. Acme Corp" },
      { name: "deal_value", label: "Deal Value", type: "text", required: false, placeholder: "e.g. $150k" },
      { name: "stage", label: "Current Stage", type: "select", required: true, options: ["Prospecting", "Discovery", "Proposal", "Negotiation", "Closing"] },
      { name: "competition", label: "Known Competition", type: "text", required: false, placeholder: "e.g. Competitor X, internal build" },
      { name: "challenges", label: "Current Challenges", type: "textarea", required: true, placeholder: "What's blocking progress?" },
      { name: "champion", label: "Internal Champion", type: "text", required: false, placeholder: "Who is your champion?" },
    ],
    promptTemplate: "Develop deal strategy for {{company_name}} ({{deal_value}}, {{stage}}). Competition: {{competition}}. Challenges: {{challenges}}. Champion: {{champion}}.",
  },
  {
    id: "sales-strategy-account",
    name: "Account Strategy",
    description: "Build a strategic account plan — stakeholder mapping, expansion opportunities, and relationship strategy.",
    department: "sales",
    agentType: "strategist",
    emoji: "🗺️",
    inputs: [
      { name: "company_name", label: "Account Name", type: "text", required: true, placeholder: "e.g. Acme Corp" },
      { name: "relationship_status", label: "Relationship Status", type: "select", required: true, options: ["New Prospect", "Active Opportunity", "Existing Client", "At-Risk Client"] },
      { name: "current_engagement", label: "Current Engagement", type: "textarea", required: false, placeholder: "What's the current relationship?" },
      { name: "growth_goals", label: "Growth Goals", type: "textarea", required: true, placeholder: "What do you want to achieve with this account?" },
      { name: "key_stakeholders", label: "Key Stakeholders", type: "textarea", required: false, placeholder: "List known stakeholders and roles..." },
    ],
    promptTemplate: "Build account strategy for {{company_name}} ({{relationship_status}}). Current: {{current_engagement}}. Goals: {{growth_goals}}. Stakeholders: {{key_stakeholders}}.",
  },
];

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
