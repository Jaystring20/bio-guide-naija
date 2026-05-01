# Add NAFDAC and U.S. FDA as Trusted Sources

Wire two new regulatory authorities into the trust strip, full sources section, biomarker citation map, and Sources & Methodology page — matching the existing pattern (logo + typographic fallback + clickable card).

## What's being added

1. **NAFDAC** (Naija & Africa tier) — National Agency for Food and Drug Administration and Control. Used for verifying that locally recommended foods, supplements, and drugs are registered/safe in Nigeria.
2. **U.S. FDA** (International tier) — used as a global reference for food safety, supplement regulation, and OTC product guidance.

Total trusted sources goes from **9 → 11**.

## Changes

### 1. Logo assets
- Add `src/assets/sources/nafdac.png` (official NAFDAC mark — green/yellow shield).
- Add `src/assets/sources/us-fda.svg` (official U.S. FDA blue wordmark).
- If a clean public logo file can't be sourced, fall back to the `TypographicLogo` tile automatically (already supported by `SourceLogo`'s `onError` handler).

### 2. `src/components/landing/TrustedSources.tsx`
Add two entries to `TRUSTED_SOURCES`:

```text
International tier:
  U.S. FDA  → fda.gov   mark "FDA"   "U.S. Food &" / "Drug Administration"

Naija & Africa tier:
  NAFDAC    → nafdac.gov.ng   mark "NAFDAC"   "National Agency for Food &" / "Drug Administration · Nigeria"
```

Each entry includes `logo`, `cite` (one-line role), and a `domain` key matching the citation map. Update the strip grid from `lg:grid-cols-9` to `lg:grid-cols-11` (or shift to a more flexible `flex-wrap` layout) so all 11 marks line up cleanly on desktop.

### 3. `src/lib/medical-citations.ts`
Add reusable citation anchors and attach them to relevant biomarkers:

- **`US_FDA_NUTRITION`** — FDA Nutrition Facts label & daily values reference. Attached to: cholesterol, LDL, HDL, triglycerides, sodium, glucose-related entries (as a complementary global source alongside Mayo/NIH).
- **`NAFDAC_FOOD_SAFETY`** — NAFDAC food/drug registry. Attached to: any biomarker rule that already cites local Nigerian foods/supplements (e.g. iron/anaemia where iron supplements are mentioned, vitamin D, hypertension where salt substitutes are recommended).

Both get a `domain` string ("U.S. FDA", "NAFDAC") that matches the new `TrustedSource.domain` values, so the methodology page's "biomarkers citing this source" lookup works automatically.

### 4. `src/pages/SourcesMethodologyPage.tsx`
No structural changes needed — it already iterates `TRUSTED_SOURCES` and groups by tier. The two new entries appear automatically in the right tiers, with their logos in the authority grid and biomarker deep-links populated from the citation map.

### 5. Memory update
Update `mem://features/source-grounding` to reflect 11 sources (adding NAFDAC and U.S. FDA), and bump the count in any inline comments in `medical-citations.ts`.

## Files touched

- `src/components/landing/TrustedSources.tsx` (add 2 entries, adjust grid)
- `src/lib/medical-citations.ts` (add 2 anchors, wire into ~6–10 rules)
- `src/assets/sources/nafdac.png` (new)
- `src/assets/sources/us-fda.svg` (new)
- `mem://features/source-grounding` (update count)

No DB/edge-function changes. No new dependencies.
