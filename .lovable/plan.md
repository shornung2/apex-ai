

# Rework Content Library

## Overview

Redesign the Content Library to remove the permanent preview pane, add a slide-in detail panel, fix folder hierarchy, add full CRUD operations, and enrich content metadata. Also update Help content and Telegram bot with the latest changes (deck generation, content library improvements).

## Current Issues
- Preview pane takes up 50% of the screen permanently, even when nothing is selected
- Folders are flat (no nested hierarchy support despite `parent_id` column existing on `content_folders`)
- Limited metadata -- no view/access count tracking
- No inline rename for content items
- No nested folder creation or navigation

## Database Changes

**Add columns to `content_items`:**
- `view_count integer default 0` -- tracks how many times item was opened/viewed
- `updated_at timestamptz default now()` -- last modified date

**No changes needed to `content_folders`** -- `parent_id` column already exists, just not used in the UI.

## Frontend: Rebuilt `ContentLibrary.tsx`

### Layout Change
- Remove the permanent right-side preview Card
- Full-width list/table view of content items
- When an item is clicked, a **Sheet** (slide-in panel from the right) opens showing the full content preview with metadata and actions
- Sheet closes with X or clicking outside

### Folder Tree with Nesting
- Use `parent_id` on `content_folders` to build a proper tree
- Breadcrumb navigation: Home > Folder > Subfolder
- "New Folder" creates inside the currently viewed folder (sets `parent_id`)
- Clicking a folder navigates into it (shows its children folders + items)
- Folder actions: Rename, Delete, Move (to another folder)

### Content Items Table
- Switch from simple list to a proper data table with columns:
  - Checkbox (for bulk select)
  - Title
  - Department (badge)
  - Skill (badge)  
  - Owner
  - Created date
  - Views (count)
  - Actions (kebab menu)
- Sortable by any column header
- Row click opens the detail Sheet

### Detail Sheet (Fly-in Panel)
- Opens from the right when an item is selected
- Full markdown preview of content
- Metadata section at top: creator, date created, last updated, department, agent type, skill name, view count
- Action buttons: Download, Move to Folder, Rename, Delete, Copy to Clipboard
- Increment `view_count` each time the sheet opens

### Full CRUD
- **Create folder**: Dialog with name + parent selection (current folder by default)
- **Rename folder**: Inline edit or dialog
- **Delete folder**: Confirmation dialog; moves children items to parent folder
- **Rename item**: Inline edit in the detail sheet
- **Move item**: Dropdown to pick target folder
- **Delete item**: Confirmation in sheet or via bulk action
- **Bulk actions**: Download selected, Delete selected, Move selected to folder

### Additional Improvements
- Empty state with illustration when no items exist
- Item count badges on folders
- Search filters by title, department, skill name, content
- Sort toggle (newest first / oldest first / most viewed)

## Help Page Updates

Update the "Content Library" section in `Help.tsx` to document:
- New slide-in preview panel behavior
- Nested folder support with breadcrumb navigation
- View count tracking
- Enhanced metadata display
- Sorting and filtering capabilities
- Bulk operations

Also add a new section for **PowerPoint Deck Generation** under Departments or as its own section, covering:
- How to run a deck skill (Capabilities Overview, Proposal)
- What inputs are needed
- Download button on job detail page
- Brand context from Design System folder

## Telegram Bot Updates

Update `telegram-bot/index.ts`:
- In `executeSkill`, detect when a skill has `output_format = "pptx"` and route to `generate-deck` endpoint instead of `agent-dispatch`
- Handle the non-streaming JSON response from generate-deck
- Send the file URL back to the user as a download link
- Update `/help` command text to mention deck generation capability

## Files Modified

| File | Action |
|------|--------|
| SQL migration | Add `view_count`, `updated_at` to `content_items` |
| `src/pages/ContentLibrary.tsx` | Full rewrite -- table layout, nested folders, slide-in sheet |
| `src/pages/Help.tsx` | Update Content Library section + add Deck Generation section |
| `supabase/functions/telegram-bot/index.ts` | Route pptx skills to generate-deck, update help text |

## Technical Details

- The Sheet component from `@/components/ui/sheet` will be used for the fly-in panel (already installed via vaul/radix)
- Folder tree traversal: query all folders once, build tree client-side using `parent_id`
- View count: increment via `supabase.rpc` or simple update on item open
- Content table uses the existing `@/components/ui/table` components
- Realtime subscription on `content_items` stays in place for live updates

