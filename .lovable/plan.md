# U.S. FDA Safety Check for Supplements & Fortified Foods

Add a third source-grounding layer alongside USDA (nutrition) and NAFDAC (Nigerian registration) that **flags higher-risk OTC supplements and fortified foods** with a clear, severity-tiered warning before they appear in a diet plan.

## What I confirmed during exploration

The FDA exposes the data we need through two complementary public sources, both no-auth:

1. **openFDA `food/enforcement` API** — every FDA food/supplement recall, classified by severity:
   - `Class I` (serious health hazard / death risk)
   - `Class II` (temporary / reversible adverse health effect)
   - `Class III` (unlikely to cause adverse effects)
   Verified live: `kratom` → 83 recalls (mostly salmonella + ingredient adulteration), `garcinia` → 5, `kava` → 7. Records include `reason_for_recall`, `recalling_firm`, `recall_initiation_date`, `status` (Ongoing/Terminated). Endpoint: `https://api.fda.gov/food/enforcement.json?search=product_description:<term>`.
2. **FDA's curated "Information on Select Dietary Supplement Ingredients" list** — a static, FDA-maintained ingredient registry with category codes:
   - **Category 2** = "Safety concerns" (e.g. Kava, Kratom, Nerium oleander, LGD-4033, Ostarine)
   - **Category 3** = "Drug, not a dietary ingredient" (e.g. Higenamine HCl, Phenibut, Picamilon, Methylsynephrine)
   - **Category 4** = "Approved drug, unlawful in supplements" (e.g. Ibuprofen, Naproxen, Galantamine, HCG, Lorcaserin, Metformin)
   - **Category 7** = "Adulterated" (e.g. Hordenine, N-Methyltyramine, Octopamine)
   - Category 1 is *informational* (qualified health claim) and is **NOT** a safety concern — we exclude it.

A pure recall-count check is too noisy on its own (e.g. "vitamin d" returns 569 recalls — all specific contaminated brands, not a problem with vitamin D itself). Combining the **categorized ingredient list** (definitive risk signal) with **recent Class I recalls** (acute risk signal) gives an honest, high-precision warning.

## Architecture

Mirror the USDA and NAFDAC layers exactly — separate edge function, separate column, separate badge — independent failure modes.

```text
interpret-lab / regenerate-diet
        │
        ├── fire-and-forget → verify-nutrition  (USDA, existing)
        ├── fire-and-forget → verify-nafdac     (NAFDAC, existing)
        └── fire-and-forget → verify-fda-safety (new)
                                    │
                                    ▼
                    lab_results.fda_safety (jsonb)
                    lab_results.fda_safety_status (text)
                                    │
                                    ▼
                       FdaSafetyBadge component
       (red/amber/green pill; renders in DietPlanTab; emergency-style
        alert at the top of the diet tab if any Class I or Cat-4 hit)
```

## What the FDA layer flags (and what it doesn't)

We only flag items where the AI suggested something the FDA has actually warned about. We never flag generic safe nutrients — vitamin C, iron, magnesium, B12 etc. are all in our **safe-list passthrough** and never produce a warning even though they have many product-level recalls.

| Severity | Trigger | Badge color | Diet-plan behaviour |
|---|---|---|---|
| **Critical** (`high`) | FDA Cat 4 or Cat 7 ingredient match (illegal in supplements) | Red `EmergencyRed` | Show 🚫 warning at top of diet tab + remove from "supplement_notes" with replacement note |
| **High** (`high`) | FDA Cat 2 (safety concerns) ingredient match | Red `EmergencyRed` | Show ⚠️ warning at top of diet tab + keep item with red "FDA SAFETY CONCERN" badge |
| **Medium** (`medium`) | FDA Cat 3 OR ≥1 Class I recall in the last 24 months | Amber `AlertAmber` | Keep item with amber "FDA recall on file" badge |
| **Low** (`low`) | Class II/III recalls only | Hidden | No badge (too noisy to show) |
| **None** | No match | None | No badge |

The safe-list (vitamins, minerals, common Nigerian foods) short-circuits to "None" before any API call to keep noise low and reduce API usage.

## Changes

### 1. Database migration
Add two columns to `lab_results`:

```sql
ALTER TABLE public.lab_results
  ADD COLUMN IF NOT EXISTS fda_safety jsonb,
  ADD COLUMN IF NOT EXISTS fda_safety_status text NOT NULL DEFAULT 'pending';
```

Same shape pattern as `nafdac_citations` / `nafdac_status`.

### 2. Static ingredient list: `supabase/functions/_shared/fda-ingredient-list.ts`
Hand-curated TypeScript constant extracted from the FDA's "Information on Select Dietary Supplement Ingredients" page (2024 snapshot). Roughly 60 entries, each:

```ts
{
  ingredient: "Kratom",
  synonyms: ["mitragyna speciosa"],
  category: 2,          // 2|3|4|7
  severity: "high",     // critical | high | medium
  fda_url: "https://www.fda.gov/news-events/public-health-focus/fda-and-kratom",
  reason_short: "FDA safety advisory: opioid-like effects, risk of dependence and serious adverse events.",
}
```

Same module also exports a `SAFE_NUTRIENT_ALLOWLIST` set (vitamins A/B-complex/C/D/E/K, common minerals, omega-3, fibre, water, raw Nigerian foods like ugu/efo/garlic/ginger) that short-circuits the safety check to "None".

### 3. New edge function: `supabase/functions/verify-fda-safety/index.ts`
- Accepts `{ labResultId }`, marks `fda_safety_status='pending'`.
- Loads `dietary_plan`, gathers candidate strings from `foods_to_increase`, `foods_to_avoid`, **and especially `supplement_notes`** (parsed via the same `parseSupplementTerm` helper used by `verify-nafdac`).
- For each unique term:
  1. If it's in `SAFE_NUTRIENT_ALLOWLIST` → skip entirely.
  2. Match against the ingredient list (exact + synonym + substring) → produce `category`, `severity`, `fda_url`, `reason_short`. This is the *primary* signal.
  3. **Only if** the term is NOT in the allowlist AND has no ingredient-list match, query openFDA `food/enforcement` for **Class I recalls in the last 24 months** with `search=product_description:"<term>"+AND+classification:"Class+I"` (limit=3). On hit, attach a `recent_class_i_recalls` array with `{recall_initiation_date, reason_for_recall, recalling_firm, status}` and severity `medium`.
- Returns map keyed by the food/note string:
  ```ts
  type FdaSafetyEntry = {
    matched_term: string;
    severity: "critical" | "high" | "medium";
    source: "fda_ingredient_list" | "openfda_recall";
    category?: 2 | 3 | 4 | 7;
    fda_url: string;
    reason_short: string;
    recent_class_i_recalls?: Array<{date: string; reason: string; firm: string; status: string}>;
  };
  ```
- Hard cap 25 lookups per result, 200 ms gap, 8 s timeout per call. Total failure → `fda_safety_status='failed'` (UI hides badges, never breaks).

### 4. Trigger from existing functions
- `supabase/functions/interpret-lab/index.ts`: add a third fire-and-forget `fetch` to `/verify-fda-safety` next to the existing USDA + NAFDAC triggers.
- `supabase/functions/regenerate-diet/index.ts`: same — and reset `fda_safety: null`, `fda_safety_status: 'pending'` on regeneration.

### 5. New `FdaSafetyBadge` component
`src/components/report/FdaSafetyBadge.tsx` — three visual variants:
- **critical/high** → red pill with ⚠️ icon and "FDA SAFETY CONCERN" / Pidgin "FDA WARN AM"; clickable → opens `fda_url`.
- **medium** → amber pill with "FDA recall on file"; tooltip shows recent recall summary.
- Tooltip / details popover shows the full `reason_short` and a link to the FDA page.

### 6. Top-of-diet-tab safety alert: `FdaSafetyAlert`
`src/components/report/FdaSafetyAlert.tsx` — when ANY entry has `severity: critical | high`, render a prominent red alert above all food sections summarising:
- "FDA flagged 1 supplement in this plan: **Kratom** — known safety concerns. Do not use without consulting your doctor."
- List of items with severity ≥ high, each with the FDA link.

### 7. Wire into `DietPlanTab.tsx`
- Add `fdaSafety`, `fdaSafetyStatus` props.
- Render `<FdaSafetyAlert>` at the top when any high/critical entries exist.
- Render `<FdaSafetyBadge>` next to the existing `UsdaBadge` + `NafdacBadge` in each food card.
- Render `<FdaSafetyBadge>` on each `supplement_notes` entry (this is where it matters most).
- Update the loading pill copy to "Verifying with USDA, NAFDAC & FDA…".

### 8. Plumb through `ResultReport.tsx`
Pass `fdaSafety` and `fdaSafetyStatus` from the row to `<DietPlanTab>`, mirroring the USDA + NAFDAC plumbing.

### 9. PDF export update
`src/components/report/PDFExport.tsx`:
- Add `fdaSafety?` to `PDFData`.
- Each food/supplement with a critical/high entry prints "🚫 FDA SAFETY CONCERN — {reason_short}" in EmergencyRed.
- Medium entries print "⚠ FDA recall on file ({date}, {firm})" in AlertAmber.
- Sources & Methodology PDF page gets a new bullet describing the FDA layer.

### 10. Methodology copy
`src/pages/SourcesMethodologyPage.tsx`: insert a new step after the NAFDAC step explaining the FDA safety layer, including the important caveat that absence of an FDA badge means we couldn't find a published concern — not that the item is FDA-approved.

### 11. Memory update
Update `mem://features/source-grounding` to add the third layer (FDA endpoints, columns, function name, what triggers a flag).

## Failure modes (intentional)

- **openFDA is down / 5xx / times out** → recall lookup skipped per item; ingredient-list matches still fire (they're local). Status ends `done` with partial data.
- **Item not in ingredient list AND no recalls** → no badge, no alert. Expected for safe nutrients and almost all foods.
- **Safe nutrient (vitamin C, iron, etc.) with many product-level recalls** → short-circuited by allowlist, no badge. Prevents the "569 vitamin D recalls" false-alarm.
- **AI suggests an actively dangerous item (e.g. ephedra, kratom, SARMs)** → red top-of-tab alert, red badge, FDA link visible immediately.

## Files touched

- `supabase/migrations/<new>.sql` (add 2 columns)
- `supabase/functions/_shared/fda-ingredient-list.ts` (new)
- `supabase/functions/verify-fda-safety/index.ts` (new)
- `supabase/functions/interpret-lab/index.ts` (3rd trigger)
- `supabase/functions/regenerate-diet/index.ts` (3rd trigger + reset)
- `src/components/report/FdaSafetyBadge.tsx` (new)
- `src/components/report/FdaSafetyAlert.tsx` (new)
- `src/components/report/DietPlanTab.tsx` (wire badge + alert + supplement section)
- `src/pages/ResultReport.tsx` (plumb props)
- `src/components/report/PDFExport.tsx` (FDA lines in export)
- `src/pages/SourcesMethodologyPage.tsx` (methodology copy)
- `mem://features/source-grounding` (update)

No new secrets — openFDA is free and unauthenticated (we'll respect the public 240 req/min limit easily; we average 1-3 lookups per result after allowlist filtering).
