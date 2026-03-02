

# Plan: Scheduled Tasks Feature

## Overview

Add a Tasks system that lets users schedule any eligible skill to run automatically on a recurring basis. Tasks are powered by `pg_cron` and `pg_net` calling the existing `agent-dispatch` edge function. A new Tasks page shows all scheduled tasks with status, next run time, and history. The Dashboard gets a "Scheduled Tasks" card.

## 1. Which Skills Are Schedulable

Add a `schedulable` boolean column to the `skills` table (default `false`). Skills that produce useful output when re-run with the same inputs get flagged as schedulable. Based on the current skill set:

| Skill | Schedulable | Rationale |
|-------|-------------|-----------|
| Company Research | Yes | Track competitors over time |
| Contact Research | No | One-off person lookup |
| Market & Industry Trends | Yes | Markets change; periodic refresh is valuable |
| General Research | Yes | Monitor any topic over time |
| Sales Email | No | Contextual, one-time per recipient |
| Social Media Posts | Yes | Recurring content creation |
| Article / Blog | Yes | Weekly content pipeline |
| Proposal Draft | No | Deal-specific, one-time |
| Meeting Prep | No | Tied to a specific meeting |
| Deal Strategy | No | Point-in-time deal analysis |

New skills created by users will default to `schedulable = false` but can be toggled on in the skill builder.

## 2. Database Changes

### New table: `scheduled_tasks`

```text
id              uuid PK (gen_random_uuid)
skill_id        uuid FK -> skills.id
skill_name      text (denormalized for display)
department      text
agent_type      text
title           text (user-provided name like "Weekly Market Scan")
inputs          jsonb (frozen inputs to use each run)
schedule_type   text ('once' | 'daily' | 'weekly' | 'monthly' | 'custom')
cron_expression text (e.g. '0 9 * * 1' for weekly Monday 9am)
next_run_at     timestamptz (computed from cron)
last_run_at     timestamptz
last_job_id     uuid (FK -> agent_jobs.id, most recent run)
status          text ('active' | 'paused' | 'completed')
run_count       integer (default 0)
created_at      timestamptz (default now())
```

### Alter `skills` table

```sql
ALTER TABLE skills ADD COLUMN schedulable boolean NOT NULL DEFAULT false;
```

Then update the known schedulable skills via INSERT tool (data operation).

### Alter `agent_jobs` table

```sql
ALTER TABLE agent_jobs ADD COLUMN scheduled_task_id uuid REFERENCES scheduled_tasks(id);
```

This links a job back to the task that triggered it, so task history is traceable.

## 3. New Edge Function: `task-scheduler`

**File:** `supabase/functions/task-scheduler/index.ts`

A simple endpoint called by `pg_cron` that:

1. Queries `scheduled_tasks` where `status = 'active'` and `next_run_at <= now()`
2. For each due task:
   - Fetches the skill from `skills` table
   - Calls `agent-dispatch` internally with the frozen inputs
   - Updates `last_run_at`, `last_job_id`, `run_count`
   - Computes and sets `next_run_at` based on `cron_expression`
   - If `schedule_type = 'once'`, sets `status = 'completed'`
3. Returns summary of tasks executed

**Config:** `verify_jwt = false` in `supabase/config.toml` (called by pg_cron)

### Cron Job Setup

Use `pg_cron` + `pg_net` to call `task-scheduler` every hour:

```sql
SELECT cron.schedule(
  'run-scheduled-tasks',
  '0 * * * *',  -- every hour on the hour
  $$ SELECT net.http_post(
    url := '<function_url>/functions/v1/task-scheduler',
    headers := '{"Authorization": "Bearer <anon_key>"}'::jsonb,
    body := '{}'::jsonb
  ) $$
);
```

## 4. New Page: `/tasks`

**File:** `src/pages/Tasks.tsx`

Layout:
- Header: "Scheduled Tasks" with a "New Task" button
- Task list showing each scheduled task as a card:
  - Skill emoji + task title
  - Schedule badge (Daily, Weekly, etc.)
  - Status badge (Active, Paused, Completed)
  - Next run time (relative, e.g. "in 3 hours")
  - Last run result link (to the job detail page)
  - Run count
  - Pause/Resume and Delete actions

### "New Task" Dialog

A multi-step dialog:
1. **Select Skill** -- shows only skills where `schedulable = true`, grouped by department
2. **Fill Inputs** -- reuses the existing `SkillForm` input fields for the selected skill
3. **Set Schedule** -- pick frequency (Once, Daily, Weekly, Monthly, Custom) with:
   - Daily: pick time of day
   - Weekly: pick day + time
   - Monthly: pick day-of-month + time
   - Custom: raw cron expression input (advanced)
   - Once: pick date + time
4. **Name & Confirm** -- give the task a title, review, and create

## 5. Dashboard Update

**File:** `src/pages/Dashboard.tsx`

Add a new card between the stat cards and Recent Activity:

- Title: "Scheduled Tasks" with a calendar icon
- Shows up to 3 upcoming tasks with next run time
- "View all" link to `/tasks`
- If no tasks: "No scheduled tasks yet. Set one up to automate your skills."

## 6. Sidebar Update

**File:** `src/components/AppSidebar.tsx`

Add "Tasks" to the `toolItems` array (with a `CalendarClock` icon from lucide) between "Capabilities" and "Knowledge Base".

## 7. Skill Builder Integration

**File:** `src/pages/Capabilities.tsx` (or wherever skill editing lives)

Add a "Schedulable" toggle switch to the skill creation/edit form so users can mark custom skills as schedulable.

## Files Summary

| Action | File |
|--------|------|
| Create | `src/pages/Tasks.tsx` |
| Create | `supabase/functions/task-scheduler/index.ts` |
| Modify | `src/pages/Dashboard.tsx` -- add upcoming tasks card |
| Modify | `src/components/AppSidebar.tsx` -- add Tasks nav item |
| Modify | `src/App.tsx` -- add `/tasks` route |
| Modify | `src/pages/Capabilities.tsx` -- add schedulable toggle |
| Modify | `src/pages/Help.tsx` -- add Tasks documentation |
| Migration | Create `scheduled_tasks` table |
| Migration | Add `schedulable` column to `skills` |
| Migration | Add `scheduled_task_id` column to `agent_jobs` |
| Migration | Enable `pg_cron` and `pg_net` extensions |
| Data update | Set `schedulable = true` on eligible skills |
| Data update | Create `pg_cron` job to call `task-scheduler` hourly |

## Technical Notes

- The scheduler runs hourly, so tasks are accurate to the hour (daily minimum granularity makes this fine)
- `next_run_at` is computed server-side when a task is created or after each run
- The `task-scheduler` function calls `agent-dispatch` internally (HTTP fetch to its own Supabase functions URL), reusing all existing agent logic
- Jobs created by scheduled tasks have `scheduled_task_id` set, so the Tasks page can show run history
- Pausing a task simply sets `status = 'paused'`; the scheduler skips paused tasks

