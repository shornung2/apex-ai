-- ============================================================
-- SolutionIQ Autopilot — Skills Library Seed Data
-- Generated from six-step Skill Builder definitions
-- Run once per workspace to seed the skill library
-- ============================================================

-- Assumes a skills table with this schema:
-- CREATE TABLE skills (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   name TEXT UNIQUE NOT NULL,
--   display_name TEXT NOT NULL,
--   version TEXT NOT NULL DEFAULT '1.0.0',
--   description TEXT,
--   department TEXT,
--   agent_type TEXT,
--   system_prompt TEXT,
--   inputs JSONB,
--   tags TEXT[],
--   trigger_keywords TEXT[],
--   preferred_model TEXT DEFAULT 'haiku',
--   preferred_lane TEXT DEFAULT 'simple_haiku',
--   token_budget INTEGER DEFAULT 10000,
--   estimated_cost_usd DECIMAL(10,4),
--   required_capabilities TEXT[],
--   web_search_enabled BOOLEAN DEFAULT false,
--   approval_required BOOLEAN DEFAULT false,
--   is_active BOOLEAN DEFAULT true,
--   created_at TIMESTAMPTZ DEFAULT NOW(),
--   updated_at TIMESTAMPTZ DEFAULT NOW()
-- );

-- ── MARKETING DEPARTMENT ──────────────────────────────────

INSERT INTO skills (name, display_name, version, description, department, agent_type, preferred_model, preferred_lane, token_budget, estimated_cost_usd, web_search_enabled, approval_required, tags, trigger_keywords)
VALUES (
  'company_research',
  'Company Research',
  '1.0.0',
  'Deep-dive analysis of a target company — financials, org structure, tech stack, and competitive position.',
  'Marketing',
  'Researcher',
  'sonnet',
  'research_sonnet',
  25000,
  0.25,
  true,
  false,
  ARRAY['research', 'company', 'firmographics', 'competitive-intelligence'],
  ARRAY['research company', 'company profile', 'company overview', 'analyze company', 'company background', 'look up company', 'company intel']
) ON CONFLICT (name) DO UPDATE SET
  updated_at = NOW(),
  version = EXCLUDED.version;

INSERT INTO skills (name, display_name, version, description, department, agent_type, preferred_model, preferred_lane, token_budget, estimated_cost_usd, web_search_enabled, approval_required, tags, trigger_keywords)
VALUES (
  'contact_research',
  'Contact Research',
  '1.0.0',
  'Profile a person — role, background, publications, social presence, and communication style.',
  'Marketing',
  'Researcher',
  'sonnet',
  'research_sonnet',
  15000,
  0.15,
  true,
  false,
  ARRAY['research', 'contact', 'person', 'prospect', 'LinkedIn'],
  ARRAY['research person', 'contact profile', 'who is', 'profile this contact', 'background check', 'LinkedIn research']
) ON CONFLICT (name) DO UPDATE SET
  updated_at = NOW(),
  version = EXCLUDED.version;

INSERT INTO skills (name, display_name, version, description, department, agent_type, preferred_model, preferred_lane, token_budget, estimated_cost_usd, web_search_enabled, approval_required, tags, trigger_keywords)
VALUES (
  'market_industry_trends',
  'Market & Industry Trends',
  '1.0.0',
  'Analyze market trends, industry dynamics, emerging opportunities, and competitive landscape.',
  'Marketing',
  'Researcher',
  'sonnet',
  'research_sonnet',
  30000,
  0.30,
  true,
  false,
  ARRAY['research', 'market', 'industry', 'trends', 'competitive-landscape'],
  ARRAY['market trends', 'industry analysis', 'market research', 'industry overview', 'competitive landscape', 'emerging trends']
) ON CONFLICT (name) DO UPDATE SET
  updated_at = NOW(),
  version = EXCLUDED.version;

INSERT INTO skills (name, display_name, version, description, department, agent_type, preferred_model, preferred_lane, token_budget, estimated_cost_usd, web_search_enabled, approval_required, tags, trigger_keywords)
VALUES (
  'general_research',
  'General Research',
  '1.0.0',
  'Open-ended research on any topic — flexible and exploratory.',
  'Marketing',
  'Researcher',
  'sonnet',
  'research_sonnet',
  20000,
  0.20,
  true,
  false,
  ARRAY['research', 'general', 'flexible', 'exploratory'],
  ARRAY['research', 'look up', 'find information', 'tell me about', 'what is', 'investigate', 'explore']
) ON CONFLICT (name) DO UPDATE SET
  updated_at = NOW(),
  version = EXCLUDED.version;

INSERT INTO skills (name, display_name, version, description, department, agent_type, preferred_model, preferred_lane, token_budget, estimated_cost_usd, web_search_enabled, approval_required, tags, trigger_keywords)
VALUES (
  'marketing_strategy',
  'Marketing Strategy',
  '1.0.0',
  'Develop a marketing strategy with positioning, messaging, channels, and go-to-market tactics.',
  'Marketing',
  'Strategist',
  'sonnet',
  'agentic_sonnet',
  35000,
  0.40,
  true,
  true,
  ARRAY['strategy', 'marketing', 'positioning', 'gtm', 'messaging'],
  ARRAY['marketing strategy', 'go to market', 'GTM', 'positioning strategy', 'marketing plan', 'campaign strategy']
) ON CONFLICT (name) DO UPDATE SET
  updated_at = NOW(),
  version = EXCLUDED.version;

INSERT INTO skills (name, display_name, version, description, department, agent_type, preferred_model, preferred_lane, token_budget, estimated_cost_usd, web_search_enabled, approval_required, tags, trigger_keywords)
VALUES (
  'linkedin_social_posts',
  'LinkedIn / Social Posts',
  '1.0.0',
  'Craft engaging LinkedIn or social media posts — thought leadership, announcements, or engagement content.',
  'Marketing',
  'Content',
  'haiku',
  'simple_haiku',
  8000,
  0.02,
  false,
  false,
  ARRAY['content', 'social-media', 'LinkedIn', 'thought-leadership', 'posts'],
  ARRAY['write LinkedIn post', 'social media post', 'LinkedIn content', 'draft post', 'thought leadership post', 'announcement post']
) ON CONFLICT (name) DO UPDATE SET
  updated_at = NOW(),
  version = EXCLUDED.version;

INSERT INTO skills (name, display_name, version, description, department, agent_type, preferred_model, preferred_lane, token_budget, estimated_cost_usd, web_search_enabled, approval_required, tags, trigger_keywords)
VALUES (
  'marketing_copy',
  'Marketing Copy',
  '1.0.0',
  'Website copy, ad copy, landing pages, email campaigns, and promotional materials.',
  'Marketing',
  'Content',
  'haiku',
  'simple_haiku',
  10000,
  0.03,
  false,
  false,
  ARRAY['content', 'copywriting', 'website', 'email', 'ads', 'landing-page'],
  ARRAY['write copy', 'website copy', 'landing page', 'ad copy', 'email campaign', 'marketing copy', 'conversion copy']
) ON CONFLICT (name) DO UPDATE SET
  updated_at = NOW(),
  version = EXCLUDED.version;

INSERT INTO skills (name, display_name, version, description, department, agent_type, preferred_model, preferred_lane, token_budget, estimated_cost_usd, web_search_enabled, approval_required, tags, trigger_keywords)
VALUES (
  'thought_leadership_article',
  'Thought Leadership Article',
  '1.0.0',
  'Long-form articles, blog posts, and thought leadership pieces that establish expertise.',
  'Marketing',
  'Content',
  'sonnet',
  'agentic_sonnet',
  40000,
  0.45,
  true,
  true,
  ARRAY['content', 'thought-leadership', 'article', 'blog', 'long-form'],
  ARRAY['write article', 'thought leadership', 'blog post', 'long form content', 'write a piece', 'publish article', 'expert article']
) ON CONFLICT (name) DO UPDATE SET
  updated_at = NOW(),
  version = EXCLUDED.version;

INSERT INTO skills (name, display_name, version, description, department, agent_type, preferred_model, preferred_lane, token_budget, estimated_cost_usd, web_search_enabled, approval_required, tags, trigger_keywords)
VALUES (
  'general_marketing_content',
  'General Marketing Content',
  '1.0.0',
  'Any marketing content not covered by other skills — flexible and open-ended.',
  'Marketing',
  'Content',
  'haiku',
  'simple_haiku',
  8000,
  0.02,
  false,
  false,
  ARRAY['content', 'marketing', 'flexible', 'general'],
  ARRAY['create content', 'write marketing', 'marketing materials', 'content for', 'draft marketing', 'event description', 'bio', 'FAQ']
) ON CONFLICT (name) DO UPDATE SET
  updated_at = NOW(),
  version = EXCLUDED.version;

-- ── SALES DEPARTMENT ──────────────────────────────────────

INSERT INTO skills (name, display_name, version, description, department, agent_type, preferred_model, preferred_lane, token_budget, estimated_cost_usd, web_search_enabled, approval_required, tags, trigger_keywords)
VALUES (
  'meeting_prep_coach',
  'Meeting Prep Coach',
  '1.0.0',
  'Pre-meeting intelligence, agendas, discovery questions, and talk tracks for sales conversations.',
  'Sales',
  'Meeting Prep',
  'sonnet',
  'research_sonnet',
  25000,
  0.25,
  true,
  false,
  ARRAY['sales', 'meeting-prep', 'discovery', 'talk-track', 'agenda'],
  ARRAY['meeting prep', 'prep for meeting', 'before my meeting', 'discovery questions', 'talk track', 'meeting agenda', 'prepare for call']
) ON CONFLICT (name) DO UPDATE SET
  updated_at = NOW(),
  version = EXCLUDED.version;

INSERT INTO skills (name, display_name, version, description, department, agent_type, preferred_model, preferred_lane, token_budget, estimated_cost_usd, web_search_enabled, approval_required, tags, trigger_keywords)
VALUES (
  'proposal',
  'Proposal',
  '1.0.0',
  'Draft a professional proposal with scope, timeline, investment, and terms.',
  'Sales',
  'Content',
  'sonnet',
  'agentic_sonnet',
  30000,
  0.35,
  false,
  true,
  ARRAY['sales', 'proposal', 'scope', 'investment', 'terms'],
  ARRAY['write proposal', 'create proposal', 'draft proposal', 'proposal for', 'business proposal', 'engagement proposal']
) ON CONFLICT (name) DO UPDATE SET
  updated_at = NOW(),
  version = EXCLUDED.version;

INSERT INTO skills (name, display_name, version, description, department, agent_type, preferred_model, preferred_lane, token_budget, estimated_cost_usd, web_search_enabled, approval_required, tags, trigger_keywords)
VALUES (
  'statement_of_work',
  'Statement of Work',
  '1.0.0',
  'Generate a detailed SOW with deliverables, milestones, responsibilities, and acceptance criteria.',
  'Sales',
  'Content',
  'sonnet',
  'agentic_sonnet',
  25000,
  0.30,
  false,
  true,
  ARRAY['sales', 'SOW', 'deliverables', 'milestones', 'contract'],
  ARRAY['statement of work', 'SOW', 'write SOW', 'scope of work', 'project scope', 'deliverables document']
) ON CONFLICT (name) DO UPDATE SET
  updated_at = NOW(),
  version = EXCLUDED.version;

INSERT INTO skills (name, display_name, version, description, department, agent_type, preferred_model, preferred_lane, token_budget, estimated_cost_usd, web_search_enabled, approval_required, tags, trigger_keywords)
VALUES (
  'sales_email',
  'Sales Email',
  '1.0.0',
  'Craft outreach emails, follow-ups, proposals, and executive communications.',
  'Sales',
  'Content',
  'haiku',
  'simple_haiku',
  6000,
  0.01,
  false,
  false,
  ARRAY['sales', 'email', 'outreach', 'follow-up', 'executive-communication'],
  ARRAY['sales email', 'outreach email', 'follow-up email', 'write email', 'cold email', 'email to', 'draft email', 'executive email']
) ON CONFLICT (name) DO UPDATE SET
  updated_at = NOW(),
  version = EXCLUDED.version;

INSERT INTO skills (name, display_name, version, description, department, agent_type, preferred_model, preferred_lane, token_budget, estimated_cost_usd, web_search_enabled, approval_required, tags, trigger_keywords)
VALUES (
  'deal_strategy',
  'Deal Strategy',
  '1.0.0',
  'Analyze a deal''s health, develop win strategy, identify risks, and plan next steps.',
  'Sales',
  'Strategist',
  'sonnet',
  'agentic_sonnet',
  20000,
  0.22,
  false,
  false,
  ARRAY['sales', 'strategy', 'deal', 'opportunity', 'win-planning'],
  ARRAY['deal strategy', 'win strategy', 'opportunity review', 'how do I win this deal', 'deal review', 'deal health', 'pipeline review']
) ON CONFLICT (name) DO UPDATE SET
  updated_at = NOW(),
  version = EXCLUDED.version;

INSERT INTO skills (name, display_name, version, description, department, agent_type, preferred_model, preferred_lane, token_budget, estimated_cost_usd, web_search_enabled, approval_required, tags, trigger_keywords)
VALUES (
  'account_strategy',
  'Account Strategy',
  '1.0.0',
  'Build a strategic account plan — stakeholder mapping, expansion opportunities, and relationship strategy.',
  'Sales',
  'Strategist',
  'sonnet',
  'agentic_sonnet',
  30000,
  0.35,
  true,
  false,
  ARRAY['sales', 'strategy', 'account-planning', 'stakeholder-mapping', 'expansion'],
  ARRAY['account strategy', 'account plan', 'account planning', 'stakeholder map', 'grow this account', 'expand the account', 'relationship strategy']
) ON CONFLICT (name) DO UPDATE SET
  updated_at = NOW(),
  version = EXCLUDED.version;

-- ── Update updated_at trigger (if not already exists) ────
-- CREATE OR REPLACE FUNCTION update_updated_at_column()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   NEW.updated_at = NOW();
--   RETURN NEW;
-- END;
-- $$ language 'plpgsql';
--
-- CREATE TRIGGER update_skills_updated_at BEFORE UPDATE ON skills
--   FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Verify seed
SELECT name, display_name, department, agent_type, preferred_model, estimated_cost_usd
FROM skills
ORDER BY department, agent_type, name;
