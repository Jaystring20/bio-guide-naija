## Problem

Reports sometimes spin for 10–20+ minutes. Two real causes:

1. **Client waits for the whole edge function** before navigating to `/result/:id`. `UploadLab.tsx` calls `await supabase.functions.invoke("interpret-lab", ...)` and only navigates after it returns. If the biomarker stage (or anything before the response) stalls, the user sees the orbit spinner with no fallback.
2. **No client-side ceiling.** The edge function already does the right thing on the backend (writes biomarkers first, then uses `EdgeRuntime.waitUntil` for diet/checklist), but if Gemini hangs on the biomarker call there's nothing that says "this is taking too long, give up and retry."

The backend split (biomarkers blocking, diet/checklist/Pidgin background) and the realtime channel on `ResultReport` are already correct — we just aren't using them on the upload screen.

## Goal

- User sees Summary + Biomarkers within ~10–30s of tapping upload.
- If nothing has appeared after 60s, automatically cancel and retry once. After the second timeout, show a clear retry/back option instead of an endless spinner.
- Diet plan, checklist, Pidgin, FDA/NAFDAC/USDA badges keep streaming in afterwards (already working via realtime).

## Changes

### 1. `src/pages/UploadLab.tsx` — navigate as soon as biomarkers land

Replace the "await invoke → navigate" flow with: kick off the invoke, then poll `lab_results` for the row leaving `status = 'processing'` (i.e. `completed`, `critical`, or biomarkers populated). Navigate the moment that happens.

Pseudocode for `handleUpload` / `handleRetry` after the insert:

```text
const FIRST_PAINT_MS = 60_000   // ceiling for "show me something"
const POLL_MS = 1500

// Fire the edge function but DO NOT await it for navigation
const invokePromise = supabase.functions.invoke("interpret-lab", { body: {...} })
invokePromise.catch(err => console.error("interpret-lab failed:", err))

// Race: first paint OR timeout
const ready = await waitForFirstPaint(labResult.id, FIRST_PAINT_MS)

if (ready) {
  navigate(`/result/${labResult.id}`)
  // also await invokePromise in background to clean up storage:
  invokePromise.then(() => supabase.storage.from("lab-uploads").remove([filePath]))
} else {
  // 60s elapsed — auto-retry ONCE
  if (!autoRetried) { autoRetried = true; reset row to processing; reinvoke; race again }
  else { show "still working — open report or try again" with two buttons }
}
```

`waitForFirstPaint(id, ms)` polls `lab_results.status, biomarkers, diet_status` every ~1.5s and resolves true on any of:
- `status` is `completed` or `critical`
- `biomarkers` is non-null and non-empty (covers the "partial write" the server does after Step 1)

This lets us reach the report screen in 10–30s on the happy path without waiting for diet/checklist.

### 2. `src/pages/UploadLab.tsx` — show progress + auto-retry UX

While polling, the existing `OrbitProcessing` stays. Add:
- Step labels: "Reading lab numbers…" → "Almost there…" → at 45s "Taking longer than usual — auto-retrying soon".
- After the **second** 60s timeout: render a small card with "Open report anyway" (navigates to the result page where the empty-biomarkers banner + regenerate button already exist) and "Try a clearer photo" (resets the upload).
- Toast on auto-retry: "Connection was slow — re-running the analysis."

### 3. `supabase/functions/interpret-lab/index.ts` — hard ceiling on biomarker stage

Today the biomarker stage can spend up to `2 retries × 25s × 2 models × 2 outer attempts ≈ 200s` worst case before failing. Tighten so the user-perceived blocking phase can never exceed ~45s:

- Lower `REQUEST_TIMEOUT_MS` for the biomarker call from 25s → 18s.
- Wrap the entire biomarker-extraction loop (lines ~243–296) in an overall `Promise.race` with a 45s ceiling. If it trips, write `status: 'failed'` with a `TIMEOUT` error code and return — the client's auto-retry will pick it up cleanly.
- Diet / checklist / Pidgin already run in the background via `EdgeRuntime.waitUntil`, so they are unaffected.

### 4. `src/pages/ResultReport.tsx` — small touch-ups

Already polls and listens on realtime. Two tiny additions:
- If the user lands on the page and `status === 'processing'` for >90s with no biomarkers, surface a "Retry analysis" button (reuses existing `EmptyBiomarkersBanner` — just lower its threshold trigger from 5min to 90s for the processing case).
- Keep the existing per-tab "still loading" dots for diet/checklist (already implemented).

## What stays the same

- Backend already separates biomarkers from diet/checklist/Pidgin — no schema change.
- Realtime subscription on `lab_results` already streams updates as each background task completes.
- FDA / NAFDAC / USDA verification still fire-and-forget after diet lands.
- No new tables, no new columns, no migration.

## Files to edit

- `src/pages/UploadLab.tsx` — navigate-on-first-paint + 60s auto-retry loop, both for `handleUpload` and `handleRetry`.
- `supabase/functions/interpret-lab/index.ts` — 18s per-call timeout + 45s overall ceiling on biomarker stage.
- `src/pages/ResultReport.tsx` — surface retry option earlier when stuck in `processing`.

## Expected outcome

- Happy path: report screen visible in 10–30s with Summary + Biomarkers. Diet/checklist tabs show their existing pulse dot and fill in over the next 20–60s.
- Slow Gemini path: silent auto-retry at 60s, success on 2nd try in most cases.
- Worst path: after ~120s the user sees a clear "open report anyway / try again" choice instead of an infinite spinner.
