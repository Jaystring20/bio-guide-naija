## Root cause of the "Couldn't generate insights" error

From the `compare-results` edge function logs:
```
JSON parse failed: {"headline":"Your recent lab results show some positive changes, especially with your white blood cells and malaria status, but
```
The Gemini response was cut off mid-sentence. Cause: `maxOutputTokens: 900` is too low once Gemini uses reasoning tokens on `gemini-2.5-flash`, so the JSON never closes → `JSON.parse` throws → function returns 502 → client shows "Edge Function returned a non-2xx status code".

Secondary UX issues visible in your screenshots:
1. Both cards show the same date "2 JUL 26" with no way to tell them apart (same test_date; upload time not shown).
2. "Dropped" chip on Malaria/Platelets is confusing — it just means that biomarker wasn't in the newer report, not that the value dropped.
3. Empty "—" cells sometimes still get an "Unchanged" chip.
4. Floating feedback button overlaps the verdict chip on the last card.
5. No legend explaining what Improved / Worsened / Dropped / New mean.

## Plan

### 1. Fix the AI insights failure (`supabase/functions/compare-results/index.ts`)
- Bump `maxOutputTokens` to 2048 so the schema-constrained JSON always closes.
- Set `thinkingConfig: { thinkingBudget: 0 }` on the Gemini request to disable reasoning tokens on 2.5-flash (they eat the output budget and are the real cause of truncation).
- Handle `finishReason === "MAX_TOKENS"` explicitly: retry once with the lite model + higher budget, and if still truncated return a clean 200 with a friendly `error` field so the UI shows a real message instead of "non-2xx".
- Trim the payload we send to Gemini: only include deltas where `verdict !== "dropped"` and `verdict !== "new"` (missing biomarkers don't need AI commentary) and cap to top ~20 by absolute % change. Keeps prompt small and focuses the model.
- Improve the client error surface in `AiVerdictPanel.tsx`: read `error.context?.body` from the Supabase invoke error so users see the real reason ("AI is briefly overloaded, try again") instead of the generic HTTP text.

### 2. Simplify the comparison UX

**`src/components/compare/BiomarkerDeltaCard.tsx`**
- Rename verdict labels for humans:
  - `dropped` → **"Not in newer report"** (neutral gray, small info icon)
  - `new` → **"First time measured"**
  - `unit_mismatch` → **"Units differ"**
- Hide the numeric delta row entirely when the verdict is `dropped` / `new` / `unit_mismatch` (currently a `—` still appears).
- When one side has no value, dim that value cell and show "Not measured" instead of "—".
- For binary/qualitative markers (e.g. Malaria Parasite `0` = negative), suppress the % calculation and just show "Cleared" or "Still present" based on status transitions.

**`src/components/compare/CompareHeader.tsx` / new header block on `Compare.tsx`**
- When both reports share the same test_date, append the upload time (e.g. "2 Jul 26 · 9:14 AM" vs "2 Jul 26 · 4:02 PM") so cards are distinguishable.
- Add a compact one-line legend under the summary card: `↑ Improved  ↓ Worsened  — Same  ○ Not measured`.
- Add a short "How to read this" collapsible (one paragraph) — one tap, no jargon.

**`AiVerdictPanel.tsx`**
- Preface the panel with a one-line "Plain-English summary" label so its role is obvious.
- Group the sections into two visible-first tabs on mobile: **"What changed"** (wins + concerns) and **"What to do"** (next actions + doctor questions). Likely drivers stays as a small footnote card. This reduces the current 5-section scroll to something scannable.

**Floating feedback button overlap (visible in screenshot 3)**
- On `/app/compare/*` add the same lifted offset used on other action-bar pages so the FAB doesn't cover verdict chips on the last row.

### 3. Verification
- Deploy the edge function, run one real compare through it, and read the response to confirm no truncation and clean JSON.
- Reload Compare in preview at 428×784, check the legend, chip labels, and FAB clearance.

## Files touched
- `supabase/functions/compare-results/index.ts` — token budget, thinkingBudget, payload trim, better error body.
- `src/components/compare/AiVerdictPanel.tsx` — richer error, tabbed layout, real error message.
- `src/components/compare/BiomarkerDeltaCard.tsx` — renamed verdicts, hide delta for non-comparable rows, qualitative-marker handling.
- `src/components/compare/CompareHeader.tsx` — legend + "how to read".
- `src/pages/Compare.tsx` — pass upload-time labels; trim payload sent to edge function; FAB lift class.

## Out of scope
- No schema/DB changes.
- No changes to the underlying compare engine math beyond what's needed for the qualitative-marker case.
