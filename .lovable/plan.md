# Empty-biomarkers error banner with diagnostics + report-this-issue link

When a lab result lands with no biomarkers, the user currently sees only a quiet inline message in the Results tab and nothing on the Summary tab. We'll replace that with a real error banner that:

- Tells the user what happened in plain English (and Pidgin)
- Shows the failing pipeline step from `processing_steps` so they (and we) know which stage broke
- Offers a one-tap **Re-upload lab** action
- Offers a one-tap **Report this issue** action that opens the existing FeedbackSheet pre-filled (category = `bug`, `result_id` attached, contextual note)
- Lets the user expand a "Show technical details" section listing every pipeline step with status + duration + model — useful for the support loop and our control room

## Files

### New: `src/components/report/EmptyBiomarkersBanner.tsx`
A reusable component with two variants:
- `variant="compact"` — slim banner shown at top of `ResultReport` whenever biomarkers are empty (visible regardless of which tab you open)
- `variant="full"` — replaces the current empty-state inside `BiomarkersTab`

Props: `status`, `processingSteps`, `resultId`, `language`, `variant`.

Behavior:
- Picks copy + tone based on `status`:
  - `failed` → destructive red — "We couldn't read your lab values"
  - `processing` / `partial` → amber — "Still reading your lab values…"
  - other → neutral fallback
- Highlights the first failed step from `processing_steps` (e.g. `biomarker_call — validation: no biomarkers`)
- Collapsible processing log (per-step `step · ms · model · note`, ✗ for failed)
- Buttons: **Re-upload lab** → `/app/upload`, **Report this issue** → opens `FeedbackSheet` with `defaultCategory="bug"`, `resultId`, and `contextNote` describing the empty-biomarkers situation

### Edit: `src/components/report/BiomarkersTab.tsx`
Replace the current plain empty-state div with `<EmptyBiomarkersBanner variant="full" status={…} processingSteps={…} resultId={…} language={…} />`. Add `status`, `processingSteps`, `resultId` to the component's props.

### Edit: `src/pages/ResultReport.tsx`
- Read `processing_steps` from the result row
- When `biomarkers.length === 0` and the row is not still in initial `processing` (i.e. status is `completed`, `failed`, `critical`, or `partial`), render `<EmptyBiomarkersBanner variant="compact" …/>` immediately above the tab strip so it's visible no matter which tab the user opens
- Pass `status`, `processingSteps`, `resultId` down to `BiomarkersTab` so the full-variant banner inside the Results tab shows the same diagnostics

## Out of scope
- No backend or schema changes — `processing_steps` already exists on `lab_results` and is populated by the edge function
- No new RPCs; the banner reads what's already in the row
- No analytics events added (FeedbackSheet already records device + screen on submit)

Approve and I'll implement these three changes.
