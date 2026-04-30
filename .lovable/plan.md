## Really nice Goal

Split the single heavy diet Gemini call into two smaller, independent calls that run concurrently:

- **Call D1: Foods + meal plan** → writes `dietary_plan` → drives the **Diet Plan** tab
- **Call D2: Doctor's checklist** → writes `consultation_checklist` → drives the **Checklist** tab

Each finishes on its own timeline, writes its own narrow `UPDATE`, and surfaces in the UI via the existing realtime channel. The Checklist tab is much smaller (5–7 short questions vs. 7-day meal plan + multi-array food lists), so it should land 30–50% faster than today's combined call. The diet plan tab also gets faster because its schema is smaller and `flash-lite` fallback succeeds more often on simpler schemas.

## Current behaviour

Today, one Gemini call returns `{dietary_plan, consultation_checklist}` — the user waits for *both* to land before either tab populates. If the diet schema fails the first attempt (common with `flash-lite`'s function-calling on the big schema), the checklist also gets delayed.

```text
   biomarkers ready
        │
        ▼
   ONE big Gemini call (foods + 7-day meals + checklist)
        │
        ▼
   write dietary_plan + consultation_checklist together
        │
        ▼
   Pidgin diet (chained)
```

## New behaviour

```text
   biomarkers ready
        │
        ├──► Call D1: foods + meal plan ──► write dietary_plan, diet_status='done'
        │           └──► chained: Pidgin diet ──► write dietary_plan_pidgin
        │
        ├──► Call D2: doctor's checklist ──► write consultation_checklist, checklist_status='done'
        │           └──► chained: Pidgin checklist ──► write consultation_checklist_pidgin
        │
        └──► Pidgin biomarkers (already independent)
```

Status flips to `completed` as soon as biomarkers + D1 (foods/meals) land. Checklist may still arrive after `completed` — UI handles this gracefully via its own status field.

## Technical changes

### 1. New schema field — `checklist_status`

Add `checklist_status text NOT NULL DEFAULT 'pending'` to `lab_results`, mirroring `diet_status` (values: `pending` | `done` | `failed`). Backfill: rows where `consultation_checklist IS NOT NULL` → `'done'`; rows where overall `status` is terminal but checklist is null AND row is older than 5 min → `'failed'`; else `'pending'`.

### 2. `supabase/functions/interpret-lab/index.ts`

Replace the current single diet call with two concurrent helper calls inside the Chain A path:

- `**callDietPlanOnly()**` — uses the existing `DIET_TOOL` schema **minus** `consultation_checklist` (so just `dietary_plan`). On success: `UPDATE dietary_plan, diet_status='done'`, then chain `translateDietToPidgin()` as today.
- `**callChecklistOnly()**` — new, much smaller tool with just `consultation_checklist` array (3–7 prioritized questions). On success: `UPDATE consultation_checklist, checklist_status='done'`, then chain a small `translateChecklistToPidgin()` (writes `consultation_checklist_pidgin`).

Both run via `Promise.all` from the same `tasks.push(...)` slot so the existing `finalizeStatus()` logic (which fires after D1) keeps working unchanged. Checklist failure marks `checklist_status='failed'` but does **not** affect `diet_status` or overall status.

Emergency path: skip D1 (as today), skip D2 too — both marked `failed`, finalize immediately.

### 3. `supabase/functions/regenerate-diet/index.ts`

Mirror the same split so the "Regenerate diet" button regenerates both pieces concurrently. Keep the single user-facing button — it sets both `diet_status` and `checklist_status` to `pending` and runs both calls in parallel.

### 4. `src/pages/ResultReport.tsx`

- Add a derived `inferredChecklistStatus` paralleling the existing `inferredDietStatus` block (lines 144–159), with the same legacy-row inference rules.
- Update the `refetchInterval` to keep polling while *either* `diet_status === 'pending'` OR `checklist_status === 'pending'`.

### 5. `src/components/report/ChecklistTab.tsx`

Show a small inline "Generating doctor's questions…" loader when `checklistStatus === 'pending'` (similar to how the Diet tab today shows a pending state), and a "Regenerate checklist" affordance when `checklistStatus === 'failed'`. The existing diet-pending UI is the visual reference — same look, same wording style.

### 6. `src/hooks/useRegenerateDiet.ts`

No signature change needed — the regenerate edge function still owns the orchestration; the hook just kicks it off.

### Files edited / created

- `supabase/functions/interpret-lab/index.ts`
- `supabase/functions/regenerate-diet/index.ts`
- `src/pages/ResultReport.tsx`
- `src/components/report/ChecklistTab.tsx`
- New migration: add `checklist_status` column + check constraint + backfill

## Out of scope

- Dropping the 7-day meal plan from the first call (option 2 from the previous breakdown). This split alone gives most of the win without changing user-visible content.
- Switching to Lovable AI Gateway / newer Gemini models. Per memory, direct Gemini is a deliberate choice.
- Module folder refactor — still deferred.

## Validation

1. Upload a fresh lab → biomarkers + summary appear → diet plan and checklist tabs each populate independently. The checklist tab in particular should populate visibly faster than the diet tab on most uploads.
2. Inspect `processing_steps` — `diet_call` and `checklist_call` timings should overlap, not stack.
3. Force a diet failure (e.g. test with an unusual lab) → checklist should still land successfully, and vice versa.
4. Test "Regenerate" — both pieces should regenerate in parallel.