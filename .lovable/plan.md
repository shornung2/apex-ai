
# Plan: Enhanced Knowledge Base with File Management

## Overview

Upgrade the Knowledge Base to support PDF, Word, and PowerPoint uploads via a new edge function that extracts text server-side. Replace the inline document viewer with a clean file management UI (download, open, rename, delete). Store original files in the existing `documents` storage bucket. Ensure all agents (agent-dispatch, alex-chat, telegram-bot) use knowledge base content for grounding.

## 1. New Edge Function: `knowledge-ingest`

A backend function that handles text extraction from binary file formats.

**How it works:**
- Frontend uploads the original file to the `documents` storage bucket
- Frontend calls `knowledge-ingest` with the file path, title, and mime type
- The function downloads the file from storage
- For text files (.txt, .md, .csv): reads content directly
- For PDF: extracts text using a lightweight Deno PDF parser (pdf-parse or similar)
- For DOCX: unzips the .docx (which is a ZIP), parses `word/document.xml` to extract text
- For PPTX: unzips the .pptx, parses `ppt/slides/slide*.xml` to extract text from all slides
- Inserts a `knowledge_documents` record with extracted text content
- Chunks the text by paragraphs and inserts into `knowledge_chunks`
- Returns the created document record

**Why server-side?** Binary file parsing (PDF, DOCX, PPTX) requires libraries that don't run in the browser. The edge function handles this reliably.

## 2. Database Changes

Add two columns to `knowledge_documents`:

```sql
ALTER TABLE public.knowledge_documents
  ADD COLUMN file_path text,
  ADD COLUMN mime_type text;
```

- `file_path`: path in the `documents` storage bucket (for download/open)
- `mime_type`: original file type (application/pdf, etc.)

## 3. Redesign Knowledge Base Page (`src/pages/Knowledge.tsx`)

**Remove:**
- The right-side document viewer panel (ReactMarkdown viewer)
- The 2-column + 3-column grid layout
- The `selectedDoc` state

**New layout -- single full-width list:**
- Search bar at top
- Upload zone (now accepting PDF, DOCX, PPTX, TXT, MD, CSV)
- Document list as a clean table/card list with columns: icon, title, type badge, tokens, date, actions
- Each row has action buttons:
  - **Download**: generates a signed URL from storage and triggers browser download
  - **Open**: for files with a `file_path`, opens the storage URL in a new tab (browser handles PDF/DOCX natively)
  - **Rename**: inline edit of the title (updates `knowledge_documents.title`)
  - **Delete**: removes the document, its chunks, and the storage file

**Upload flow:**
1. User selects file(s)
2. File uploaded to `documents` bucket with path `knowledge/{uuid}/{filename}`
3. Call `knowledge-ingest` edge function to extract text and create chunks
4. Show processing state while ingestion runs
5. Refresh list on completion

## 4. Grounding Verification

The grounding logic already works correctly in all three agent functions:

- **agent-dispatch** (line 66-86): Searches `knowledge_chunks` by input terms, injects into system prompt -- **already working**
- **alex-chat** (line 107-131): Same RAG pattern on `knowledge_chunks` -- **already working**
- **telegram-bot**: Need to verify it also uses knowledge chunks

All three query `knowledge_chunks.content` with ilike filters. Since the new ingestion creates chunks identically to the current flow, grounding will work automatically for all uploaded file types.

No changes needed to agent-dispatch or alex-chat -- they already consume knowledge_chunks.

## 5. Storage Bucket RLS

The `documents` bucket exists and is public. Add RLS policies on `storage.objects` for authenticated access:

```sql
CREATE POLICY "Authenticated users can upload documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Authenticated users can read documents"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'documents');

CREATE POLICY "Authenticated users can delete documents"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'documents');
```

## Files Summary

| Action | File |
|--------|------|
| Migration | Add `file_path` and `mime_type` columns to `knowledge_documents`; add storage RLS policies |
| Create | `supabase/functions/knowledge-ingest/index.ts` -- text extraction from PDF/DOCX/PPTX |
| Rewrite | `src/pages/Knowledge.tsx` -- remove viewer, add file management UI, multi-format upload |
| Config | `supabase/config.toml` -- add `knowledge-ingest` function entry |

## Technical Notes

- PDF text extraction in Deno uses `pdf-parse` or direct PDF stream parsing
- DOCX/PPTX are ZIP archives; Deno's built-in `JSZip` or `fflate` can unzip and parse the XML inside
- Files that fail text extraction will still be stored (for download) but marked with `status: 'failed'` and zero chunks
- Maximum file size: 20MB (enforced client-side before upload)
- The `knowledge-ingest` function uses the service role key to bypass RLS for inserting documents and chunks
