# Fix: Empty biomarkers / missing summary on completed scans

## What you're seeing (root cause)

When you opened your most recent two reports, the **diet plan, meal ideas, and Pidgin tabs** showed up — but the **English biomarker breakdown was empty** and the overall summary was blank.

I checked your account in the database. Both recent scans (`d54ae954…` and `100df7e6…`) have:
- `biomarkers = NULL` (English breakdown missing)
- `ai_summary = NULL` (summary missing)
- `biomarkers_pidgin` populated (7–8 entries)
- `dietary_plan` populated on one of them
- `status = completed`

That mismatch is impossible by accident — the Pidgin step **derives from** the English biomarkers, so they existed in memory but never got saved.

## Why it happens

In `supabase/functions/interpret-lab/index.ts` the pipeline does two writes:

1. **Partial write** (line ~311): saves `biomarkers`, `ai_summary`, `critical_alerts`, and sets `status = 'partial'`.
2. **Final write** (line ~525): sets `status = 'completed'` (or `'critical'`) only.

The `lab_results.status` column has this CHECK constraint:

```text
CHECK (status = ANY (ARRAY['processing','completed','failed','critical']))
```

`'partial'` is **not allowed**, so write #1 silently rejects the entire UPDATE — biomarkers and summary never land. The background Pidgin/diet tasks still run because they read in-memory data, then write their own columns successfully. Final write succeeds because `'completed'` is valid, leaving you with a "completed" row that has no English biomarkers.

This affects every successful scan since the partial-write code was added.

## Fix plan

### 1. Stop the bug (edge function)
In `supabase/functions/interpret-lab/index.ts`:
- Replace `partialStatus = hasCritical ? "critical" : "partial"` with `"processing"` (or `"critical"` for critical results) so the write satisfies the CHECK constraint.
- Add error checking on every `supabase.from("lab_results").update(...)` call — log the Postgres error instead of silently swallowing it. This would have surfaced the constraint failure immediately.
- Make the final write **also include** `biomarkers`, `ai_summary`, `has_critical_alert`, and `critical_alerts` again, so even if the partial write ever fails for any reason, the final write recovers the data.

### 2. Recover your two affected reports
Re-run the `interpret-lab` edge function for the two affected scans so the English biomarkers and summary populate. The Pidgin and diet data will be regenerated cleanly. The original lab images may already be gone (NDPA deletion); if so, we'll mark those two as `failed` with a clear message and prompt re-upload — and we'll check first before deciding.

### 3. Empty-state guard (UI)
In `src/pages/ResultReport.tsx` / `BiomarkersTab.tsx`: if `biomarkers.length === 0` on a `completed` result, show a friendly empty state ("Biomarker breakdown is still loading or wasn't extracted — tap to retry") instead of a blank tab. Prevents this from looking silent in the future.

### 4. (Optional safety) Migration
Add `'partial'` as an allowed value to the CHECK constraint so the original intent (showing the user a partial result mid-processing) works. This is optional — fix #1 alone resolves the bug.

## Technical summary

| Change | File |
|---|---|
| `partialStatus` uses CHECK-valid values; surface update errors | `supabase/functions/interpret-lab/index.ts` |
| Final UPDATE re-asserts biomarkers + summary | same file |
| Backfill the two affected `lab_results` rows | one-shot recovery |
| Empty-state UI for biomarkers tab when array is empty | `src/components/report/BiomarkersTab.tsx`, `ResultReport.tsx` |

No schema changes are required for the core fix. No RLS changes. Existing approved scans (`45fa3f28`, `693a1e92`, `830075f6`) are untouched and remain correct.

Approve and I'll apply the fix and recover your two reports.
