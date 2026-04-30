## Goal

Right now the report pipeline is *mostly* parallel but still has serial bottlenecks that make some report sections feel slow. After this change, each AI piece writes to the database the instant it finishes, the UI re-renders immediately via the existing realtime channel, and a slow Pidgin translation can no longer hold up the report being marked "completed".

## Current behaviour (what's slow)

Sequence today:

```text
[ Biomarkers + summary ]      ← user waits for this (blocking, ~6-12s)
        │
        ▼
   partial DB write  ──►  user lands on report page, sees biomarkers
        │
        ▼
  backgroundWork():
        ├─ English diet  ─┐
        ├─ Pidgin biomarkers ─┤  Promise.allSettled — waits for BOTH
        ▼                    │
   (waits for both)  ◄──────┘
        │
        ▼
   Pidgin diet (only starts now, even though Pidgin biomarkers may have finished long ago)
        │
        ▼
   Final UPDATE: status = 'completed'  ← only now does the report leave 'processing'
```

Two real serialization problems:
1. **Pidgin diet waits for *Pidgin biomarkers* to finish**, even though Pidgin diet only depends on English diet.
2. **Status doesn't flip to `completed` until Pidgin diet finishes** — so the spinner / "still working" hint stays visible long after the user-visible content is ready.

## New behaviour

```text
[ Biomarkers + summary ]      ← still blocking; nothing else can start without these
        │
        ▼
   partial DB write  ──►  realtime: report page shows biomarkers + summary
        │
        ▼
  backgroundWork(): launches FOUR independent tasks
        ├─ English diet ──► writes diet, diet_status='done'
        │      └─► chains Pidgin diet ──► writes pidgin diet
        ├─ Pidgin biomarkers ──► writes pidgin biomarkers
        └─ status finalizer ──► after biomarkers+diet land, sets status='completed'
                                (independent of Pidgin tasks)
```

Each successful Gemini call performs its own targeted `UPDATE` immediately, so realtime triggers a UI refresh per field. Pidgin failures no longer affect the English flow.

## Technical changes

### `supabase/functions/interpret-lab/index.ts`

- **Restructure `backgroundWork()`** so the three independent chains run concurrently:
  - Chain A: English diet → on success, fires its own Pidgin-diet translation (already chained, no need to wait for other tasks).
  - Chain B: Pidgin biomarkers (independent of diet — starts immediately).
  - Chain C: Status finalizer — waits only for Chain A's English-diet result and writes `status = 'completed' | 'critical'` plus the final `processing_steps` log. Pidgin tasks may still be in flight.
- Replace the current single `Promise.allSettled(tasks)` + sequential Pidgin-diet block with: `await Promise.allSettled([chainA, chainB])` for log completeness, but the status flip happens inside Chain A's continuation — not after the `allSettled`.
- Each Gemini result is persisted with its own narrow `UPDATE` (already true for diet; add the same pattern for the final write so it doesn't overwrite Pidgin fields that just landed).
- Final `UPDATE` will only set `status`, `processing_steps`, `has_critical_alert`, `critical_alerts` — it will **not** re-write `biomarkers` or `ai_summary` (those were already written in the partial write, and re-writing them risks racing with Pidgin updates).

### Frontend — no functional change needed

- `src/pages/ResultReport.tsx` already subscribes to `postgres_changes` on this row and refetches on every UPDATE, so each independent write surfaces in the UI immediately.
- Polling fallback (`refetchInterval`) already keys off `diet_status === 'pending'`; no change.

### Files to be edited

- `supabase/functions/interpret-lab/index.ts` (only file changed)

## Out of scope

- No schema changes — `diet_status` already exists; no equivalent flag is needed for Pidgin (UI already gracefully renders `null` Pidgin fields).
- No frontend changes — realtime subscription already handles per-field arrival.
- Module/folder refactor (`src/modules/`, `_shared/`) is **not** part of this change. Per the architecture memory it remains deferred so this performance fix stays isolated.

## Validation

After deploy:
1. Upload a fresh lab report and watch the report page:
   - Biomarkers + summary appear within seconds.
   - English diet appears next, independently.
   - Pidgin biomarkers and Pidgin diet pop in whenever each finishes — order is no longer fixed.
2. Check `processing_steps` in the DB row: `diet_call`, `pidgin_call`, `diet_pidgin_call` timings should overlap rather than stack.
3. Confirm `status` flips to `completed` as soon as biomarkers + English diet are done, even if Pidgin variants are still streaming in.
