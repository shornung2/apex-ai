# SolutionIQ Autopilot — Skills Library
## 15 Pre-Built Skills Using the Six-Step Skill Builder Format

---

## Overview

This package contains 15 fully defined skills for the SolutionIQ Autopilot Capabilities library, organized by department and agent type. Each skill was built using the **Six-Step Skill Builder approach**:

| Step | What It Defines |
|------|----------------|
| **Step 1 — Identity** | Name, display name, version, description, icon, department, agent type |
| **Step 2 — Routing** | Tags, preferred model/lane, trigger keywords for auto-routing |
| **Step 3 — Inputs** | All input fields with types, labels, required/optional, hints |
| **Step 4 — System Prompt** | The core instructions that power the skill's AI behavior |
| **Step 5 — Behavior** | Token budget, cost, capabilities needed, approval settings |
| **Step 6 — Output** | Output format, schema, export options |

---

## Skills Inventory

### Marketing Department

| File | Skill | Agent Type | Model | Est. Cost |
|------|-------|------------|-------|-----------|
| 01_company_research.json | Company Research | Researcher | Sonnet | $0.25 |
| 02_contact_research.json | Contact Research | Researcher | Sonnet | $0.15 |
| 03_market_industry_trends.json | Market & Industry Trends | Researcher | Sonnet | $0.30 |
| 04_general_research.json | General Research | Researcher | Sonnet | $0.20 |
| 05_marketing_strategy.json | Marketing Strategy | Strategist | Sonnet | $0.40 |
| 06_linkedin_social_posts.json | LinkedIn / Social Posts | Content | Haiku | $0.02 |
| 07_marketing_copy.json | Marketing Copy | Content | Haiku | $0.03 |
| 08_thought_leadership_article.json | Thought Leadership Article | Content | Sonnet | $0.45 |
| 09_general_marketing_content.json | General Marketing Content | Content | Haiku | $0.02 |

### Sales Department

| File | Skill | Agent Type | Model | Est. Cost |
|------|-------|------------|-------|-----------|
| 10_meeting_prep_coach.json | Meeting Prep Coach | Meeting Prep | Sonnet | $0.25 |
| 11_proposal.json | Proposal | Content | Sonnet | $0.35 |
| 12_statement_of_work.json | Statement of Work | Content | Sonnet | $0.30 |
| 13_sales_email.json | Sales Email | Content | Haiku | $0.01 |
| 14_deal_strategy.json | Deal Strategy | Strategist | Sonnet | $0.22 |
| 15_account_strategy.json | Account Strategy | Strategist | Sonnet | $0.35 |

---

## Model / Lane Reference

| Lane | Model | When Used | Est. Cost |
|------|-------|-----------|-----------|
| `simple_haiku` | Claude Haiku | Short content, emails, social posts | Lowest |
| `research_sonnet` | Claude Sonnet | Research tasks with web search | Medium |
| `agentic_sonnet` | Claude Sonnet | Complex multi-step reasoning | Medium-High |

---

## How to Use

### Option 1: Seed Supabase Database
Run `00_supabase_seed.sql` in your Supabase SQL editor. This inserts all 15 skills into your `skills` table with full metadata. Includes `ON CONFLICT` handling — safe to re-run.

### Option 2: Import Individual JSON Files
Each `.json` file is a self-contained skill definition structured by the six steps. Import into your skills management system, API, or use as reference for the Lovable Skill Builder UI.

### Option 3: Use as Lovable Skill Builder Reference
When building skills through the Skill Builder UI in Autopilot, use these JSON files as the data to fill in each step of the wizard.

---

## Skills With Approval Required

These skills require human review before output is delivered (high-stakes or long-form content):

- **Marketing Strategy** — Strategic direction decisions
- **Thought Leadership Article** — Published content
- **Proposal** — Client-facing commercial document
- **Statement of Work** — Binding scope and terms

---

## Extending the Library

To add new skills, follow the same six-step JSON structure. Minimum viable skill requires Steps 1-4 (identity, routing, inputs, system prompt). Steps 5-6 add operational configuration.

Suggested future skills:
- **Competitive Battlecard** (Sales, Researcher)
- **Case Study** (Marketing, Content)
- **Email Sequence** (Sales, Content)
- **RFP Response** (Sales, Content)
- **Executive Briefing Document** (Sales, Strategist)
- **Onboarding Plan** (Delivery, Strategist)
- **QBR Presentation** (Delivery, Content)

---

*Generated for SolutionIQ Autopilot v1.x | Solutionment, Inc.*
