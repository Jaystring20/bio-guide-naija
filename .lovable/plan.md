# Compare Results Feature

Compare 2–5 lab results side-by-side or as a timeline, with deterministic deltas by default and an on-demand AI verdict powered by the **direct Google Gemini API** (matching how `interpret-lab` already calls Gemini — not Lovable AI Gateway).

## Core UX principles
- **Zero-friction entry**: three launch points (History multi-select, Result Report "Compare with previous", Trends chart dot-pair).
- **Deterministic first, AI second**: instant per-biomarker deltas; AI narrative only when the user taps "Get AI insights" (saves Gemini spend on every view).
- **Mobile-first**: card-per-biomarker on ≤428px, columns on ≥768px; horizontal scroll for timeline mode.
- **Safety on cross-profile compares**: allowed, but with an amber banner ("Comparing across people isn't clinically equivalent — guidance only").

## Modes

**A. Side-by-side (2 results)** — cleanest verdict.
- Two columns (A = older, B = newer; swap button).
- Per biomarker: value A → value B, absolute Δ, % Δ, direction arrow, status pill change (e.g. High → Normal).
- Verdict badge: `Improved` / `Worsened` / `Unchanged` / `New` / `Dropped`, based on a clinical-direction map in `src/lib/biomarker-direction.ts` (LDL lower = better, HDL higher = better, most others = "closer to range").
- Top summary strip: counts of Improved / Worsened / Unchanged + "Biggest win" and "Biggest concern".

**B. Timeline (3–5 results)** — chronological.
- Horizontal scroll of N columns (oldest → newest), sticky biomarker-name column.
- Per row: mini-sparkline (recharts) + first→last delta + status trajectory.
- Same verdict logic on net change across the series.

Mode toggle at the top; auto-selects based on count (2 → side-by-side; 3+ → timeline; user can override).

## Entry points

1. **History page** — new "Compare" button top-right toggles multi-select; checkboxes appear on cards; sticky footer `Compare (n)` enabled when 2–5 selected. Mixed profiles trigger the amber banner.
2. **Result Report** — "Compare with previous" action next to Export; opens directly against the immediately previous done result for the same profile (falls back to a lightweight picker).
3. **Trends page** — tap two dots on any biomarker chart → floating "Compare these two" pill → opens compare with that biomarker highlighted.

## AI verdict (on-demand, direct Gemini API)

Button "Get AI insights" at the bottom. Calls a new edge function `compare-results` that uses the **existing `GOOGLE_GEMINI_API_KEY` secret** and the same direct-REST pattern already used in `supabase/functions/interpret-lab/index.ts` — not Lovable AI Gateway, not the AI SDK, no `LOVABLE_API_KEY`.

- Endpoint: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=<GOOGLE_GEMINI_API_KEY>` (same model family the interpret-lab function uses; falls back to `gemini-2.5-flash-8b` on quota, mirroring existing fallback logic).
- Receives the already-computed deltas + raw biomarkers so the model doesn't recompute math.
- Response schema (via `responseMimeType: application/json` + `responseSchema`): `headline`, `wins[]`, `concerns[]`, `likely_drivers[]`, `next_actions[]`, `questions_for_doctor[]`.
- CORS + JWT verification consistent with other edge functions in the project.
- In-memory cache per browser session, keyed by sorted result IDs, so re-opening is free.
- Graceful failure UI: retry button + WhatsApp support fallback on persistent errors.

## Data & safety
- Read-only. No schema changes.
- Uses existing `lab_results.biomarkers` JSON.
- Cross-profile amber banner + one-line disclaimer.
- Biomarker matching by normalized name with a small alias map (HbA1c / A1C, LDL-C / LDL, etc.), reusing the normalization already in `Trends.tsx`.
- Unit mismatch (mg/dL vs mmol/L on the same biomarker across results) → flagged, delta skipped, no false verdict.

## Technical details

**New files**
- `src/pages/CompareResults.tsx` — route `/app/compare?ids=<uuid>,<uuid>[,...]&highlight=<biomarker>`.
- `src/components/compare/CompareHeader.tsx` — profile chips, mode toggle, swap, safety banner.
- `src/components/compare/CompareSummary.tsx` — counts + biggest win/concern.
- `src/components/compare/BiomarkerDeltaCard.tsx` — side-by-side card.
- `src/components/compare/TimelineRow.tsx` — timeline row with sparkline.
- `src/components/compare/AiVerdictPanel.tsx` — collapsible AI narrative, skeleton, retry.
- `src/lib/biomarker-direction.ts` — clinical-direction map for ~40 common biomarkers.
- `src/lib/compare-engine.ts` — pure fns: `alignBiomarkers`, `computeDelta`, `verdictFor`, `summarize`.
- `supabase/functions/compare-results/index.ts` — direct Gemini REST call using `GOOGLE_GEMINI_API_KEY` (no Lovable AI Gateway, no AI SDK).

**Modified files**
- `src/App.tsx` — add `/app/compare` route.
- `src/pages/History.tsx` — multi-select mode, Compare CTA.
- `src/pages/ResultReport.tsx` — "Compare with previous" button.
- `src/pages/Trends.tsx` — dot-pair selection → "Compare these two".

**Route/query design**
- IDs in URL for shareability + back-button sanity: `/app/compare?ids=uuid1,uuid2,uuid3`.
- Invalid/empty IDs → friendly picker screen.

**Layout**
```text
┌─────────────────────────────────────────┐
│ ← Compare results         [Timeline ▾]  │
│ Profile: You  •  3 results              │
│ ⚠ Cross-profile compare (if applicable) │
├─────────────────────────────────────────┤
│ Summary: 8 improved · 2 worse · 5 same  │
│ Biggest win: HbA1c 7.8 → 6.4 (−18%)     │
│ Biggest concern: LDL 120 → 148 (+23%)   │
├─────────────────────────────────────────┤
│ [Biomarker cards / timeline rows...]    │
├─────────────────────────────────────────┤
│ [ Get AI insights ]                     │
└─────────────────────────────────────────┘
```

## Out of scope (this iteration)
- Auto unit conversion (mg/dL ↔ mmol/L) — flagged, not converted.
- Compare-view PDF export (easy follow-up if you want it).
- Public shareable compare links.

## Verification
- Manual: pick 2 results in History → open compare → verify deltas & verdicts → tap AI insights → confirm narrative renders from direct Gemini call → try 3-result timeline → try cross-profile → confirm amber banner.
- Edge cases: missing biomarkers on one side (`New`/`Dropped`), unparseable values (skipped with note), unit mismatch, only one done result (Compare disabled with tooltip).
