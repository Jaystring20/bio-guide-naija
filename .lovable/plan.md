## Goal

Today, after a user uploads, `UploadLab.tsx` calls `waitForFirstPaint` inline and only navigates to `/app/result/:id` once OCR is done. If the user reloads, navigates away, or lands on the report before biomarkers exist, they see partial loaders or (historically) "Result not found." We'll add a clear, dedicated **Processing** screen that any flow can land on, polls until the result is ready, and auto-redirects.

## What to build

### 1. New page: `src/pages/ProcessingResult.tsx` (route `/app/processing/:id`)

A single-purpose status screen for an in-flight lab analysis.

- Reuses `OrbitProcessing` (heart + aurora + rotating phrases) for visual continuity.
- Shows live status text driven by the row:
  - "Reading your lab…" (status `processing`, no biomarkers yet)
  - "Mapping biomarkers…" (biomarkers present, diet/checklist `pending`)
  - "Finalising your plan…" (almost done)
- Step pips (0/1/2) advance with the above.
- Polls `lab_results` every 2s via `useQuery` + `refetchInterval`, plus a Supabase Realtime subscription on `lab-result-${id}` for instant updates (mirrors `ResultReport`).
- Auto-redirect rules (uses `navigate(..., { replace: true })`):
  - `status === 'completed' | 'critical'` OR biomarkers array non-empty → `/app/result/:id`
  - `status === 'failed'` → `/app/upload?retry=:id`
- Safety net:
  - Soft timeout at 60s: keep polling but show an extra reassurance line ("Taking a little longer than usual — hang tight").
  - Hard timeout at 3 min: stop auto-poll, show **Try again**, **View history**, and the existing `WhatsAppSupportButton` as a final fallback (matches the failure-screen pattern we already use in `ResultReport`).
- Handles "row not yet visible" with the same `maybeSingle` + `not-found-yet` retry pattern used in `ResultReport` so a freshly-inserted row never dead-ends.

### 2. Wire it into the upload flow (`src/pages/UploadLab.tsx`)

- After the `lab_results` row is inserted and the `interpret-lab` function is invoked, immediately `navigate('/app/processing/' + newId, { replace: true })` instead of awaiting `waitForFirstPaint` inline.
- Remove the now-redundant inline `OrbitProcessing` block from `UploadLab` (the processing page owns it). Keep the upload-time spinners (compression/upload progress) — only the post-insert "waiting for AI" stage moves out.
- `waitForFirstPaint` becomes unused for this flow; leave the helper in place for any other callers, but stop importing it here.

### 3. Route registration (`src/App.tsx`)

- Add `<Route path="processing/:id" element={<ProcessingResult />} />` inside the existing authenticated `/app` shell.
- Lazy-import alongside the other authenticated pages.

### 4. Belt-and-braces in `ResultReport.tsx`

If a user lands directly on `/app/result/:id` while the row still has `status === 'processing'` and no biomarkers, redirect once to `/app/processing/:id` (replace). This keeps the report page focused on rendering finished results and the processing page focused on waiting. No other behaviour changes.

## Out of scope

- No backend, RPC, or edge-function changes.
- No changes to `interpret-lab`, diet regeneration, or email queues.
- No changes to the failed-upload screen itself (it already exists with the WhatsApp fallback).

## Files

- **New:** `src/pages/ProcessingResult.tsx`
- **Edited:** `src/App.tsx`, `src/pages/UploadLab.tsx`, `src/pages/ResultReport.tsx`
