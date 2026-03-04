

# Output Quality Feedback

## Summary

Add thumbs up/down feedback to completed job outputs, show quality badges on skill cards, and ensure the Super Admin Quality tab works with existing columns.

## Database Changes

The `feedback_rating` and `feedback_note` columns already exist on `agent_jobs`. A migration is needed only to add a validation trigger constraining `feedback_rating` to `1` or `-1`.

```sql
CREATE OR REPLACE FUNCTION validate_feedback_rating()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.feedback_rating IS NOT NULL AND NEW.feedback_rating NOT IN (1, -1) THEN
    RAISE EXCEPTION 'feedback_rating must be 1 or -1';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_feedback_rating
BEFORE INSERT OR UPDATE ON public.agent_jobs
FOR EACH ROW EXECUTE FUNCTION validate_feedback_rating();
```

## Frontend Changes

### 1. JobDetail.tsx — Feedback UI

After the output card (when `status === 'complete'`), add a feedback section:

- "Was this output useful?" label with ThumbsUp / ThumbsDown icon buttons
- If `job.feedback_rating` is already set: show the selected button highlighted, both disabled
- On thumbs-down: reveal a textarea "What could be improved?" with a "Submit Feedback" button
- On any save: `supabase.from('agent_jobs').update({ feedback_rating, feedback_note }).eq('id', jobId)`
- Toast: "Thanks — your feedback helps us improve Apex AI."

### 2. Capabilities.tsx — Quality badge on skill cards

In the skill library grid, for each skill card, query aggregate feedback stats. Use a single batch query after skills load:

```sql
SELECT skill_id, 
  COUNT(*) as total, 
  SUM(CASE WHEN feedback_rating = 1 THEN 1 ELSE 0 END) as positive
FROM agent_jobs 
WHERE feedback_rating IS NOT NULL AND skill_id = ANY($skillIds)
GROUP BY skill_id
```

On cards where `total >= 5`, show `⭐ {pct}% positive ({total} ratings)` as small muted text.

### 3. Department.tsx — Same quality badge

Same pattern: after loading department skills, fetch feedback stats and display on skill cards.

### 4. SuperAdmin Quality tab

Already correctly queries `feedback_rating = -1` via the `admin_list_all_agent_jobs` RPC. No changes needed.

## Files Affected

| File | Action |
|---|---|
| Database migration | Create: feedback validation trigger |
| `src/pages/JobDetail.tsx` | Edit: add feedback row after output |
| `src/pages/Capabilities.tsx` | Edit: add quality badge to skill cards |
| `src/pages/Department.tsx` | Edit: add quality badge to skill cards |

