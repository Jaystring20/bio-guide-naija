## Goal

Make every source on `/sources` deep-linkable to the exact biomarker citations it backs, using public anchor links inside the same page (no auth, works for any visitor).

URL pattern:
```
/sources                 → page intro
/sources#bio-hba1c       → scrolls to the HbA1c reference card
/sources#bio-cholesterol → scrolls to the Cholesterol reference card
```

## What changes

### 1. `src/lib/medical-citations.ts` — add public catalog

Export a flat, slug-indexed list derived from the existing `RULES` array so the methodology page can iterate every curated biomarker and so each source card knows which biomarkers cite it.

```ts
export type BiomarkerCatalogEntry = {
  slug: string;          // "hba1c", "vitamin-d", "alt"
  label: string;         // display name derived from match key
  citations: MedicalCitation[];
};

export const BIOMARKER_CATALOG: BiomarkerCatalogEntry[];      // ~85 entries
export function getBiomarkersForDomain(domain): BiomarkerCatalogEntry[];
```

This is purely additive — the existing `getCitationsForBiomarker`, `hasCuratedCitation`, `getPrimaryDomain` keep working unchanged.

### 2. `src/components/landing/TrustedSources.tsx` — add `domain` field

Add a `domain` property to each `TrustedSource` matching the strings used in `medical-citations.ts` (e.g. `"NIH MedlinePlus"`, `"Mayo Clinic"`, `"WHO"`, `"WHO Africa"`, `"FMOH Nigeria"`, `"USDA"`). This lets `/sources` query "which biomarkers cite this source?" via `getBiomarkersForDomain(source.domain)`.

### 3. `src/pages/SourcesMethodologyPage.tsx` — three additions

**a. New section: "Biomarker Reference Library"** (between the Tier breakdown and the badge legend)

A scannable, deep-linkable list of all ~85 curated biomarkers. Each entry is its own anchor target:

```text
┌─ #bio-hba1c ─────────────────────────────────────┐
│ HbA1c                                            │
│ Cited by: NIH MedlinePlus · Mayo Clinic · WHO    │
│ → MedlinePlus: HbA1c Test ↗                      │
│ → Mayo Clinic: A1C test ↗                        │
└──────────────────────────────────────────────────┘
```

Implemented as a responsive grid of cards. Each card has `id="bio-{slug}"` so `/sources#bio-hba1c` scrolls to it. Includes a small alphabetical jump-bar (A · B · C …) at the top.

**b. Update each source card in the Tier section**

Below each source's existing description, add a "Used in:" row showing the first ~6 biomarkers it covers as deep-link chips:

```text
NIH MedlinePlus  ↗
Plain-language explanations for every lab test.
Used in: HbA1c · Glucose · Cholesterol · ALT · Ferritin · TSH · +52 more →
```

Each chip is `<a href="#bio-{slug}">` — clicking jumps to that biomarker's anchor in the library section below.

**c. Smooth scroll + highlight on hash change**

Use a small `useEffect` listening to `location.hash` to:
- Smooth-scroll to the target
- Briefly flash the target card with a `ring-primary/50` highlight so users see what was linked
- Account for the sticky header (use `scroll-mt-24` on each anchor)

### 4. `src/components/report/SourcesMethodology.tsx` — add outbound link (small)

In the in-report accordion, add a "View full methodology and biomarker library →" link at the bottom that goes to `/sources`. This closes the loop so users reading their report can jump out to the public reference page.

## Files touched

- `src/lib/medical-citations.ts` — append `BiomarkerCatalogEntry`, `BIOMARKER_CATALOG`, `getBiomarkersForDomain`, plus `slugify`/`titleCase` helpers. No changes to existing exports.
- `src/components/landing/TrustedSources.tsx` — add `domain` field to each entry in `TRUSTED_SOURCES`.
- `src/pages/SourcesMethodologyPage.tsx` — add Biomarker Reference Library section, "Used in:" chips on source cards, hash-scroll effect.
- `src/components/report/SourcesMethodology.tsx` — add outbound `/sources` link at the bottom of the accordion.

## What stays the same

- All existing report behaviour (citation chips, verified badges, PDF export) — untouched.
- Public/auth boundaries — `/sources` remains a public page, no user data leaves the report view.
- Citation sourcing logic — Gemini still never generates URLs; the catalog is built from the same vetted `RULES` already in use.

## Out of scope (per your "anchor links inside /sources" choice)

- No deep links into authenticated `/app/result/:id` views.
- No per-user "your biomarker history" page.
- No backend/database changes — the catalog is fully static and derived from the existing TS module.

## How users will experience it

1. Visit `/sources`, scroll to "Backed by these authorities".
2. On the **NIH MedlinePlus** card, see "Used in: HbA1c · Glucose · Cholesterol …".
3. Click "HbA1c" → page smooth-scrolls to the HbA1c card in the library, briefly highlighted, with all three of its citations listed.
4. From a lab report, click "View full methodology and biomarker library" in the in-report Sources accordion → lands on `/sources`. From there, jump to any specific biomarker via the catalog.
5. Share `getveridia.app/sources#bio-hba1c` directly — recipient lands on the right card without any login.
