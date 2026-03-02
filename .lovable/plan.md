
# Plan: Knowledge Base Folders, Drag-and-Drop, and File Uploads for Agents

## Overview

Three major features: (1) folder organization with drag-and-drop in the Knowledge Base, (2) drag-and-drop file uploads, and (3) file attachment support in Alex Chat and relevant skill forms -- all feeding into the existing grounding pipeline via `knowledge_chunks`.

## 1. Database Migration

### New `knowledge_folders` table

```sql
CREATE TABLE public.knowledge_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  parent_id uuid REFERENCES public.knowledge_folders(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.knowledge_folders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage knowledge_folders"
ON public.knowledge_folders FOR ALL TO authenticated
USING (true) WITH CHECK (true);
```

### Add `folder_id` to `knowledge_documents`

```sql
ALTER TABLE public.knowledge_documents
ADD COLUMN folder_id uuid REFERENCES public.knowledge_folders(id) ON DELETE SET NULL;
```

This is a nullable FK -- documents without a folder sit at the root. Moving a file between folders is a single `UPDATE` on `folder_id`. Grounding is unaffected because `knowledge_chunks` references `document_id`, not folders.

## 2. Knowledge Base Page Redesign (`src/pages/Knowledge.tsx`)

### Folder management
- Add a "New Folder" button in the toolbar
- Display folders as clickable rows above documents (folder icon, name, item count)
- Breadcrumb navigation: Root > Folder > Subfolder
- Right-click or action menu on folders: Rename, Delete
- Clicking a folder navigates into it (filters documents by `folder_id`)

### Drag-and-drop file uploads
- Wrap the page content area with `onDragOver` / `onDrop` handlers
- Show a full-page overlay ("Drop files to upload") when files are dragged over
- Dropped files go through the existing upload pipeline (storage + `knowledge-ingest`)
- Files are uploaded into the currently viewed folder

### Drag-and-drop file reorganization
- Make document rows and folder rows draggable (`draggable="true"`)
- Folders act as drop targets -- dropping a document onto a folder updates its `folder_id`
- Visual feedback: highlight target folder on drag-over
- Support dragging files to breadcrumb items to move up the hierarchy

### Delete confirmation
- Add an `AlertDialog` confirmation before deleting documents or folders

## 3. File Upload in Alex Chat (`src/components/AlexChat.tsx`)

### UI changes
- Add a paperclip/attachment button next to the text input
- Hidden file input accepting `.pdf,.docx,.pptx,.txt,.md,.csv`
- When a file is selected, show a file chip (name + remove button) above the input
- On send: upload file to storage, call `knowledge-ingest`, then include the extracted text as context in the message payload

### Backend changes (`supabase/functions/alex-chat/index.ts`)
- Accept an optional `attachments` array in the request body: `[{ title, content }]`
- Prepend attachment content to the system prompt as additional context:
  ```
  ## USER-UPLOADED DOCUMENT
  [Document: filename.pdf]
  <extracted text>
  ```
- This is additive to the existing RAG context -- both sources are injected

## 4. File Upload in Skill Forms (`src/components/SkillForm.tsx`)

### New `file` input type
- Add a `file` input type to `SkillInput` in `src/data/mock-data.ts`
- Render a file picker when `input.type === "file"`
- On form submit: upload the file to storage, call `knowledge-ingest`, and pass extracted text as the input value (so it flows through the existing `{{variable}}` template system)

### Update Meeting Prep skill
- Add an optional "file" type input to the `meeting_prep_coach` skill: "Prior Meeting Transcript / Notes" with `type: "file"`, `required: false`
- This is a data update (not a schema change)

### Agent grounding impact
- **No changes needed** to `agent-dispatch` or `alex-chat` edge functions for skill-based file uploads because the extracted text is passed as a regular input value, which flows into the prompt template and the existing RAG search

## 5. Tests

### Frontend tests (`src/components/__tests__/`)

**Knowledge.test.tsx:**
- Renders document list correctly
- Shows folder breadcrumbs
- Create folder flow
- Rename/delete folder
- Drag-and-drop upload triggers file input
- Search filters documents

**AlexChat.test.tsx:**
- Renders chat widget
- Open/close toggle
- File attachment chip appears when file selected
- Send button disabled when loading

**SkillForm.test.tsx:**
- Renders all input types including file
- File input shows selected filename
- Form submission includes file data

## Files Summary

| Action | File |
|--------|------|
| Migration | Create `knowledge_folders` table, add `folder_id` to `knowledge_documents` |
| Data update | Add file input to `meeting_prep_coach` skill |
| Rewrite | `src/pages/Knowledge.tsx` -- folders, drag-drop, breadcrumbs |
| Modify | `src/components/AlexChat.tsx` -- file attachment UI + payload |
| Modify | `src/components/SkillForm.tsx` -- new `file` input type |
| Modify | `src/data/mock-data.ts` -- add `file` to `SkillInput.type` union |
| Modify | `supabase/functions/alex-chat/index.ts` -- accept attachments |
| Modify | `src/lib/agent-client.ts` -- pass attachment data |
| Create | `src/components/__tests__/Knowledge.test.tsx` |
| Create | `src/components/__tests__/AlexChat.test.tsx` |
| Create | `src/components/__tests__/SkillForm.test.tsx` |

## Grounding Integrity

The grounding pipeline is unaffected by folders -- `knowledge_chunks` references `document_id` regardless of folder structure. File uploads in Alex Chat and skill forms create temporary context injected directly into prompts (not persisted to the knowledge base unless explicitly saved). The existing RAG queries in `agent-dispatch`, `alex-chat`, and `telegram-bot` continue to work identically.
