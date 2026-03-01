
# Restructure: Department + Skill-Driven Architecture

## Core Concept Change

The current app treats agents as standalone entities with hardcoded forms. The correct architecture is:

- **Agents are generic execution engines** (Researcher, Strategist, Content, Meeting Prep)
- **Skills are prompt templates** (like Claude's skills) that tell an agent what to do and what inputs to collect
- **Departments** (Sales, Marketing) organize which agent+skill combinations are available
- **A Skill Builder** lets users/admins create new skills to expand the system

This is a fundamental restructure of the data model, navigation, and page architecture.

---

## What Changes

### 1. Data Model Rewrite (`src/data/mock-data.ts`)

**Remove**: `pulse`, `concierge` agent types. Remove per-agent hardcoded capabilities.

**New types**:

```text
Department: "sales" | "marketing"

AgentType: "researcher" | "strategist" | "content" | "meeting-prep"

Skill: {
  id, name, description, department, agentType,
  inputs: SkillInput[],  // dynamic form fields
  promptTemplate: string // the skill.md content
}

SkillInput: {
  name, label, type ("text"|"textarea"|"select"|"radio"|"multi-select"),
  required, placeholder, options?
}
```

**Department-Agent-Skill mapping**:

Marketing:
- Researcher: Company Research, Contact/Person Research, Market/Industry Trends, General Research
- Strategist: Marketing Strategy
- Content: LinkedIn/Social Posts, Marketing Copy, Thought Leadership Articles, General Marketing Content

Sales:
- Meeting Prep: Meeting Prep Coach (new agent, replaces the old strategist meeting prep form)
- Content: Proposal (Word/PDF/PPT), SOW, Sales Email
- Strategist: Deal Strategy, Account Strategy

**Mock skills** with realistic input definitions for each skill above.

### 2. Navigation Restructure (`AppSidebar.tsx`)

Current: Overview, **Agents**, Knowledge Base, History, Settings

New:
```text
Overview
Departments (collapsible group)
  - Sales        -> /departments/sales
  - Marketing    -> /departments/marketing
Capabilities     -> /capabilities
Knowledge Base   -> /knowledge
History          -> /history
Settings         -> /settings
```

### 3. New Department Page (`/departments/:dept`)

Replaces the flat Agents grid. Shows:
- Department name and description header
- Agent sections within the department (e.g., "Researcher", "Content")
- Under each agent: skill cards showing available skills
- Clicking a skill opens a side sheet with a **dynamically generated form** based on `skill.inputs`
- No more hardcoded per-agent form components

### 4. Dynamic Skill Form Component

A single `SkillForm.tsx` component that renders form fields from a skill's `inputs[]` array:
- `text` -> Input
- `textarea` -> Textarea  
- `select` -> Select dropdown
- `radio` -> RadioGroup
- `multi-select` -> Checkbox group

This replaces all 5 hardcoded form files (`ResearcherForm.tsx`, `StrategistForm.tsx`, etc.).

### 5. New Capabilities Page (`/capabilities`)

Two sections:
- **Skill Library**: Browse all skills, filter by department/agent, search by name. Each skill shows name, description, department badge, agent badge, input count.
- **Skill Builder**: A form to create/edit a skill:
  - Name, Description, Department (select), Agent Type (select)
  - Dynamic input builder: add/remove/reorder form fields with name, label, type, required toggle, options (for select/radio)
  - Prompt template editor (textarea with markdown support)
  - Preview panel showing what the rendered form will look like

### 6. Dashboard Updates

- Remove Pulse and Concierge agent shortcuts from the hero
- Replace agent shortcuts with department shortcuts (Sales, Marketing) or top skills
- Update mock jobs to remove pulse/concierge references
- Update activity feed to show department context

### 7. File Cleanup

**Delete**:
- `src/components/agent-forms/PulseForm.tsx`
- `src/components/agent-forms/ConciergeForm.tsx`
- `src/components/agent-forms/ResearcherForm.tsx`
- `src/components/agent-forms/StrategistForm.tsx`
- `src/components/agent-forms/ContentForm.tsx`
- `src/pages/Agents.tsx`

**Create**:
- `src/components/SkillForm.tsx` (dynamic form renderer)
- `src/components/SkillBuilder.tsx` (skill creation/editing UI)
- `src/pages/Department.tsx` (department view with agent sections + skill cards)
- `src/pages/Capabilities.tsx` (skill library + builder)

**Modify**:
- `src/data/mock-data.ts` (complete rewrite)
- `src/components/AppSidebar.tsx` (new nav structure)
- `src/App.tsx` (new routes)
- `src/pages/Dashboard.tsx` (remove pulse/concierge, add department shortcuts)
- `src/pages/History.tsx` (update filters for new agent types, add department column)
- `src/pages/JobDetail.tsx` (update for new agent types)
- `src/pages/Settings.tsx` (update agents tab for new agent list)

---

## Technical Details

- The Skill Builder stores skills in the mock data initially (will move to database later)
- The dynamic form uses react-hook-form with programmatic field registration based on `skill.inputs`
- Department pages use `useParams()` to get the department slug and filter skills accordingly
- The sidebar uses SidebarGroup with collapsible department sub-items
- `meeting-prep` is a new agent type specific to Sales (not a variant of Strategist)
