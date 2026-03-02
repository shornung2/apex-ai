

# Plan: PowerPoint Deck Generation for Sales Content Agent

## Overview

Add two new skills ("Capabilities Overview Deck" and "Proposal Deck") to the Sales Content agent. When run, they produce a real downloadable `.pptx` file using PptxGenJS, styled with your brand assets from the uploaded Design System templates.

## Architecture

```text
User fills skill inputs (company, scope, etc.)
        |
        v
Frontend detects output_format="pptx", calls generate-deck edge function
        |
        v
Edge function:
  1. Reads brand templates from Storage (your uploaded PPTX/PDF)
  2. Calls AI (Gemini 2.5 Pro) with tool_calling to get structured slide JSON
  3. Builds .pptx with PptxGenJS using brand colors/fonts/logo
  4. Uploads to "decks" storage bucket
  5. Creates agent_job with file_url + markdown summary
        |
        v
Frontend redirects to JobDetail, shows Download button + slide summary
```

## Step-by-Step Changes

### 1. Database Migration: Add `file_url` column and `decks` bucket

- Add `file_url text` column to `agent_jobs` (nullable)
- Create `decks` storage bucket (public) with RLS for authenticated reads/inserts

### 2. Create `generate-deck` Edge Function

**File**: `supabase/functions/generate-deck/index.ts`

This function handles the entire deck generation pipeline:

1. **Receive inputs** from frontend (deck type, company name, industry, scope, etc.)
2. **Insert agent_job** with status "running"
3. **Fetch brand context**: Download the Design System PDF content and PPTX template metadata from the `documents` storage bucket to extract brand guidance (colors, fonts, layout preferences)
4. **Call AI Gateway** with `google/gemini-2.5-pro` using **tool calling** to force structured output. The tool schema:

```text
generate_deck_slides:
  slides: array of objects, each with:
    - layout: "title" | "section" | "content" | "two-column" | "bullets" | "closing"
    - title: string
    - subtitle: string (optional)
    - body: string (full prose, not outline)
    - bullets: string[] (optional, only when layout=bullets)
    - left_column: string (for two-column)
    - right_column: string (for two-column)
    - speaker_notes: string
```

5. **System prompt** will be extremely detailed, instructing the AI to write COMPLETE slide content (full sentences, real talking points, substantive bullets). Not outlines. It will reference the brand guidelines from the uploaded Design System.

6. **Build PPTX** with PptxGenJS (imported via `https://esm.sh/pptxgenjs@4`):
   - Title slide: Logo top-left, large title centered, subtitle, date
   - Section headers: Brand accent background, white text
   - Content slides: Title bar + flowing prose body
   - Two-column: Split layout for comparisons/before-after
   - Bullet slides: Title + 4-6 substantive bullets
   - Closing slide: CTA, contact info
   - Brand colors, fonts from your Design System

7. **Export as base64**, upload to `decks` bucket
8. **Update agent_job** with `status=complete`, markdown summary in `output`, storage URL in `file_url`
9. **Return** `{ jobId, fileUrl, slideCount }`

### 3. Insert Two New Skills (SQL data insert)

**Skill 1: Capabilities Overview Deck**
- Department: sales, Agent: content, Emoji: slide icon
- Inputs: Target Company, Industry, Key Pain Points (optional), Number of Slides (select: 8/12/16)
- output_format: "pptx"
- System prompt: Detailed instructions for a Solutionment capabilities deck covering services, Apex AI, Academy, consulting expertise, case studies, and differentiators

**Skill 2: Proposal Deck**
- Department: sales, Agent: content, Emoji: handshake icon
- Inputs: Client Company, Project Name, Scope Summary, Investment Range (optional), Timeline (optional), Number of Slides (select: 10/15/20)
- output_format: "pptx"
- System prompt: Detailed instructions for a tailored proposal covering executive summary, problem, solution, approach, team, timeline, investment, and next steps

### 4. Frontend: New `runDeckSkill()` in `agent-client.ts`

Add a function that POSTs to `generate-deck` (not `agent-dispatch`). This is a simple request/response (no SSE streaming). Returns `{ jobId, fileUrl }`. The frontend polls or awaits the response.

### 5. Frontend: Update `Department.tsx`

When a skill has `outputFormat === "pptx"`, call `runDeckSkill()` instead of `runSkill()`. Show a "Generating deck..." loading state (no streaming preview since it's a synchronous generation).

### 6. Frontend: Update `JobDetail.tsx`

When a job has a `file_url`:
- Show a prominent "Download PowerPoint" button with a FileDown icon at the top of the output section
- Still render the markdown summary below as a content preview
- Badge showing slide count

### 7. Update `supabase/config.toml`

Add the `generate-deck` function entry with `verify_jwt = false` (matching existing pattern).

### 8. Deploy

Deploy the `generate-deck` edge function.

## Brand Asset Integration

Your uploaded files in the "Design System" Knowledge Base folder will be used:
- **Design system.docx.pdf**: The edge function will fetch and read this for brand colors, fonts, and style rules to bake into the PptxGenJS template
- **SolutionmentMstr.pptx / SolutionmentMstr - SKY2.pptx**: Stored in the `documents` bucket. The function will reference these for layout inspiration, though PptxGenJS builds slides programmatically (it cannot use a .pptx as a template directly). The brand elements (colors, fonts, logo placement) will be extracted and hardcoded into the slide builder

The brand defaults will be set based on what's in your Design System. You can refine colors/fonts after the first test run.

## Files Summary

| File | Action |
|------|--------|
| SQL migration | Add `file_url` to `agent_jobs`, create `decks` bucket |
| `supabase/functions/generate-deck/index.ts` | Create new edge function |
| `supabase/config.toml` | Add generate-deck entry (auto-managed) |
| `src/lib/agent-client.ts` | Add `runDeckSkill()` |
| `src/pages/Department.tsx` | Route pptx skills to deck function |
| `src/pages/JobDetail.tsx` | Add download button for file_url |
| SQL data insert | Insert 2 new skills |

## Technical Notes

- **PptxGenJS in Deno**: Imported via `https://esm.sh/pptxgenjs@4`. Outputs base64 which gets uploaded to storage. Validated to work in serverless environments.
- **No streaming**: Deck generation is request/response. Expected time: 20-40 seconds for a 15-slide deck.
- **Model**: Using `google/gemini-2.5-pro` for deck content since quality is paramount. Tool calling ensures structured JSON output.
- **Timeout**: Edge function config set to 120s to handle larger decks.
- **Existing flows untouched**: All current skills, agent-dispatch, Alex chat, and Telegram continue to work as before.

