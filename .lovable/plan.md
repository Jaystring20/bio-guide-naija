## Goal

Make every biomarker explanation and every food recommendation in a VeriDIA report cite **real, credible sources** the user can tap to verify — so the report stops being "trust the AI" and becomes "trust the AI, here's where it got this."

## Two grounded data sources we'll wire in

1. **Perplexity Sonar API** (via Lovable connector) — for medical/clinical claims (biomarker explanations, why-it-matters, critical alert context). Returns answers *with citations* from the live web, restricted to credible domains.
2. **USDA FoodData Central API** (free public API, no connector — just an API key the user gets free at fdc.nal.usda.gov) — for nutrition facts on every food Gemini suggests. Citation = the official USDA food entry.

We deliberately keep Gemini for the **OCR + initial interpretation** (it's already working well), and add the grounded layer on top.

## What the user will see

**On every biomarker card** (when expanded), a new "Sources" row:
> Sources: Mayo Clinic · NIH MedlinePlus · WHO
> _(each is a tappable link)_

**On every food in the diet plan** (Foods to Increase / Reduce / Avoid), a small badge:
> ✓ USDA verified — _Spinach, raw — 2.71 mg iron / 100 g_
> _(tap → opens USDA FoodData Central entry)_

**On critical alerts**, a "Clinical reference" link to the WHO/NIH page describing the threshold.

**At the bottom of the report**, a "Sources & Methodology" section listing every domain cited, plus the disclaimer that AI interpretation is grounded but not a substitute for a doctor.

## Restricted source whitelist (Perplexity `search_domain_filter`)

Only these domains will be allowed for medical grounding:
- nih.gov, medlineplus.gov, ncbi.nlm.nih.gov (PubMed)
- who.int
- mayoclinic.org
- cdc.gov
- nice.org.uk
- cochrane.org
- nhs.uk

This guarantees no random blog or unverified site can ever appear as a "source."

## Architecture

```text
Upload lab image
      |
      v
  [interpret-lab edge fn]   ← unchanged, Gemini extracts biomarkers + draft summary
      |
      v
  Save partial result (status=processing)
      |
      +--→ [ground-biomarkers edge fn]   NEW
      |       Perplexity Sonar per abnormal biomarker
      |       → saves citations[] into each biomarker
      |
      +--→ [regenerate-diet edge fn]   ← extended
              After Gemini returns foods, loop foods through
              [verify-nutrition edge fn]   NEW
              USDA FDC lookup → saves usda_ref into each food
```

Both grounding steps run **in the background after the partial result lands**, so the user still sees their report instantly. Citations stream in and the UI re-renders as they arrive (we already use Supabase realtime patterns).

## Database changes

Two JSONB columns added to `lab_results`:
- `biomarker_citations` — `{ [biomarkerName]: [{ title, url, domain, snippet }] }`
- `nutrition_citations` — `{ [foodName]: { fdc_id, official_name, key_nutrients, url } }`

Plus two new status fields so the UI can show "Verifying sources…":
- `grounding_status` — pending | done | failed
- `nutrition_status` — pending | done | failed

## New edge functions

1. **`ground-biomarkers`** — takes a `labResultId`, loads abnormal biomarkers, calls Perplexity Sonar for each with the domain whitelist, writes citations back.
2. **`verify-nutrition`** — takes a `labResultId`, loops every food in `dietary_plan.foods_to_increase/reduce/avoid`, queries USDA FDC `/v1/foods/search`, saves the top match's FDC ID + canonical name + 3 key nutrients per food.

Both run with `verify_jwt = false` and are triggered by `interpret-lab` after the partial write.

## UI changes

- `BiomarkersTab.tsx` — add a "Sources" footer to each expanded card showing citation chips.
- `DietPlanTab.tsx` — add a USDA badge under each food name, tappable.
- `SummaryTab.tsx` — add a "Sources & Methodology" collapsible at the bottom.
- New `<CitationChips />` component — reusable pill list that opens links in a new tab and works offline (links degrade gracefully when offline).
- `EmergencyAlert.tsx` — add a "Read more (WHO)" link for each critical threshold, pre-mapped to a WHO/NIH URL in `critical-thresholds.ts`.

## Secrets needed

| Secret | Where it comes from | Who adds it |
|---|---|---|
| `PERPLEXITY_API_KEY` | Set up via Lovable's Perplexity **connector** (one click, no manual key) | I'll trigger the connector flow |
| `USDA_FDC_API_KEY` | Free signup at api.data.gov / fdc.nal.usda.gov — takes 30 seconds | You paste it once when prompted |

## Memory / methodology

I'll save a new memory file `mem://features/source-grounding` documenting:
- the whitelist domains
- the two grounding pipelines
- the disclaimer copy
- the rule: every clinical claim shown to a user must have at least one citation, or display "no verified source — AI-generated".

## Out of scope (deliberately)

- We will **not** swap Gemini out — it stays the OCR + first-pass interpreter.
- We will **not** add Google Search grounding to Gemini (overlaps with Perplexity, costs more).
- We will **not** ingest the West African Food Composition Table yet (separate project — needs licensed data).
- No live drug/medication lookup (VeriDIA's policy is no pharmaceutical suggestions).

## Rollout order

1. DB migration (two JSONB columns + two status columns).
2. Connect Perplexity via connector + ask you for the USDA key.
3. Build `verify-nutrition` (simpler, USDA — no AI calls).
4. Build `ground-biomarkers` (Perplexity Sonar with domain whitelist).
5. Wire both into `interpret-lab` as background tasks.
6. Add `<CitationChips />` and update the three report tabs.
7. Add Sources & Methodology section + emergency alert "Read more" links.
8. Update memory.

If this looks right, approve and I'll start with the connector + the secret request.