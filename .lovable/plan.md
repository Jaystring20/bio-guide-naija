# Strengthening the Gemini ↔ Citation Handshake

We'll do all five upgrades in order. Each step is shippable on its own, so you can review/use the report after every step.

---

## Step 1 — Expand the curated biomarker map (≈30 → ~55 biomarkers)

**Goal:** make sure almost every biomarker on a Nigerian lab panel gets a real NIH/Mayo/WHO citation, not the generic fallback.

Add curated entries for the panels Nigerian labs commonly run that we don't fully cover yet:

- **FBC extras:** MCV, MCH, MCHC, RDW, neutrophils, lymphocytes, eosinophils
- **LFT extras:** ALP, GGT, albumin, total protein, globulin
- **U&E / kidney extras:** chloride, bicarbonate, phosphate, magnesium
- **Lipid extras:** VLDL, non-HDL, lipoprotein(a)
- **Endocrine:** Free T3, Free T4, fasting insulin, HOMA-IR, cortisol, prolactin
- **Reproductive:** FSH, LH, estradiol, testosterone, beta-hCG
- **Infectious / tropical (Nigerian context):** malaria parasitemia, HIV antibody, HBsAg, Anti-HCV, VDRL, widal, H. pylori, typhoid IgM/IgG
- **Inflammation:** CRP, ESR, procalcitonin
- **Urinalysis:** protein, glucose (urine), ketones, leukocytes, nitrites

**File touched:** `src/lib/medical-citations.ts` (extend `RULES`).

**No DB changes, no UI changes.** Existing `CitationChips` immediately picks them up.

---

## Step 2 — Add a Nigerian / African authority tier

**Goal:** boost local trust by linking to authorities that speak to Nigerian patients directly.

Introduce a second-tier list shown alongside the international sources:

- **Federal Ministry of Health Nigeria** — `health.gov.ng` (where treatment guidelines exist)
- **Nigerian Heart Foundation** — for lipids/BP biomarkers
- **Africa CDC** — `africacdc.org` (HIV, malaria, TB, NCDs)
- **WHO Africa** — `afro.who.int` (Africa-specific fact sheets)
- **NAFDAC** — for nutrient/supplement context

Implementation:

- Extend `MedicalCitation` with an optional `region: "global" | "africa" | "nigeria"` field (defaults to `"global"` so existing entries are untouched).
- Add region-tagged entries to high-impact biomarkers (glucose, HbA1c, lipids, hemoglobin, malaria, HIV markers, BP-related).
- `CitationChips` groups by region: **International sources** + **Nigeria & Africa** sub-rows.
- Update `ALL_SOURCE_DOMAINS` in `SourcesMethodology` to include the new domains.

**Files touched:** `src/lib/medical-citations.ts`, `src/components/report/CitationChips.tsx`, `src/components/report/SourcesMethodology.tsx`.

---

## Step 3 — "Verified against" badge per biomarker

**Goal:** users see the handshake at a glance, not just hidden under a chevron.

Add a small, always-visible label on every biomarker card:

```text
┌─────────────────────────────────────────┐
│ Fasting Glucose          126 mg/dL  ⚠   │
│ ✓ Cross-checked against NIH MedlinePlus │
│ [tap to expand for sources & guidance]  │
└─────────────────────────────────────────┘
```

Behaviour:

- If a biomarker has ≥1 curated citation → green check + "Cross-checked against {top domain}" (e.g. NIH MedlinePlus).
- If only fallback → no badge (handled by Step 5).
- Expanding the card still shows the full `CitationChips` list (Step 2 grouping included).

**Files touched:** `src/components/report/BiomarkersTab.tsx` (add badge above the value row), small new sub-component `VerifiedBadge.tsx`.

No DB changes.

---

## Step 4 — Show sources on the PDF / share export

**Goal:** the credibility doesn't disappear when the user downloads or WhatsApps the report to a doctor.

Update `src/components/report/PDFExport.tsx`:

- For each biomarker section in the PDF, add a **"Sources:"** line listing the domains (e.g. *Sources: NIH MedlinePlus, Mayo Clinic, WHO*). URLs become clickable in the PDF.
- For each food in the diet plan that has a USDA match, append a small *"USDA verified"* tag with the FDC ID.
- Add a final **"Sources & Methodology"** page at the end of the PDF mirroring the in-app `SourcesMethodology` section, plus the medical disclaimer.
- Pass `biomarker_citations` and `nutrition_citations` from `ResultReport.tsx` into `pdfData`.

**Files touched:** `src/components/report/PDFExport.tsx`, `src/pages/ResultReport.tsx` (extend `pdfData`).

No DB changes.

---

## Step 5 — Strict mode: flag unverified interpretations

**Goal:** never let an AI-only interpretation look as authoritative as a cross-checked one.

Behaviour:

- If `getCitationsForBiomarker(name)` returns only the generic fallback, the biomarker card shows an amber pill: **"AI interpretation — source not verified"** instead of the green "Cross-checked" badge.
- The same pill appears in the PDF.
- `SourcesMethodology` adds one line explaining the difference between cross-checked and AI-only items.
- Add a tiny helper `hasCuratedCitation(name)` to `medical-citations.ts` so the UI can branch cleanly.

**Files touched:** `src/lib/medical-citations.ts` (helper), `src/components/report/BiomarkersTab.tsx`, `src/components/report/PDFExport.tsx`, `src/components/report/SourcesMethodology.tsx`.

No DB changes.

---

## What stays the same (the "handshake" itself)

- Gemini still does the **interpretation**.
- Gemini **never supplies URLs** — citations are attached server-/client-side from our allow-list.
- USDA remains the single source of truth for nutrition verification (already wired).
- No new secrets, no new third-party APIs, no Perplexity.

## Order of execution

1. Step 1 — expand map  *(foundation; everything else benefits)*
2. Step 2 — Nigerian/African tier  *(local credibility)*
3. Step 3 — Verified badge  *(visible handshake)*
4. Step 4 — PDF citations  *(credibility survives sharing)*
5. Step 5 — Strict mode  *(never overstate certainty)*

Each step ends in a working build you can review before we move to the next.
