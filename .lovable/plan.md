

# Plan: Help Center + Content Library

## Feature 1: Help Page with User Guides

Add a comprehensive Help page accessible from the sidebar (above Settings) with guides for every feature.

### Sidebar Change
- Add a "Help" nav item with `HelpCircle` icon at URL `/help`, placed above Settings in the footer section
- Reorder `bottomItems` to: Help, then Settings

### Help Page (`src/pages/Help.tsx`)
- Accordion-based layout covering all app features:
  - **Getting Started** -- Overview of the platform, navigation, and core concepts
  - **Dashboard** -- Understanding metrics, token usage, and activity feed
  - **Departments (Sales & Marketing)** -- How to browse skills, run agents, and view results
  - **Capabilities** -- Skill Library browsing, Skill Builder wizard (6-step walkthrough)
  - **Knowledge Base** -- Uploading documents, viewing content, how agents use KB
  - **Content Library** -- Folders, saving agent outputs, search, download, deletion
  - **History & Job Detail** -- Viewing past runs, real-time streaming, saving outputs
  - **Settings** -- Workspace config, appearance, API keys, agent toggles
- Each section includes step-by-step instructions written for non-technical users
- Search bar to filter guide sections

### Route
- Add `/help` route in `App.tsx`

---

## Feature 2: Content Library

A full-featured content management system for saving, organizing, and managing agent-produced outputs.

### Database Changes (Migration)

**New table: `content_folders`**
- `id` (uuid, PK)
- `name` (text, not null)
- `parent_id` (uuid, nullable, self-referencing FK for nested folders)
- `created_at` (timestamptz)

**New table: `content_items`**
- `id` (uuid, PK)
- `title` (text, not null)
- `content` (text, not null)
- `folder_id` (uuid, nullable FK to content_folders)
- `agent_type` (text) -- which agent produced it
- `skill_id` (text) -- which skill produced it
- `skill_name` (text) -- display name of the skill
- `department` (text) -- originating department
- `job_id` (uuid, nullable) -- link back to the agent job
- `created_at` (timestamptz, default now())
- `owner` (text, default 'system') -- placeholder for future auth

RLS: open access (matching existing pattern -- no auth currently configured).

Enable realtime on `content_items` for live updates.

### Content Library Page (`src/pages/ContentLibrary.tsx`)

**Left panel -- Folder tree + item list:**
- Create/rename/delete folders
- Drag or move items between folders via a "Move to" dropdown
- "All Content" view showing everything regardless of folder
- Search bar filtering by title, agent, skill, department

**Right panel -- Content viewer:**
- Markdown-rendered preview of selected item
- Metadata display: date, owner, agent type, skill name, department
- Actions: Download (as .md), Delete

**Bulk operations toolbar:**
- Checkbox selection on items
- "Download Selected" (zips multiple .md files or downloads individually)
- "Delete Selected"

### Save to Content Library from Job Detail

Update `src/pages/JobDetail.tsx`:
- Replace or augment the existing "Save to KB" button with "Save to Content Library"
- Opens a small dialog/popover to choose a folder (or create new)
- Saves to `content_items` with agent_type, skill_id, skill_name, department, job_id metadata

### Sidebar Navigation
- Add "Content Library" with `FolderOpen` icon in the Tools section, between Knowledge Base and History

### Route
- Add `/content-library` route in `App.tsx`

---

## Files to Create
1. `src/pages/Help.tsx` -- Help center with accordion guides
2. `src/pages/ContentLibrary.tsx` -- Full content library UI

## Files to Modify
1. `src/components/AppSidebar.tsx` -- Add Help and Content Library nav items
2. `src/App.tsx` -- Add routes for `/help` and `/content-library`
3. `src/pages/JobDetail.tsx` -- Add "Save to Content Library" with folder picker

## Database Migration
- Create `content_folders` and `content_items` tables with RLS policies

