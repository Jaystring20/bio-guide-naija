
# Easy WhatsApp share + unified, complete PDF template

Two related fixes for the report screen:

1. **Surface "Share to WhatsApp" as a one-tap action** — today it's hidden behind a tiny floating Share toggle that opens a secondary fan of round icons. Users have to tap twice and read icons.
2. **Fix the PDF** — it currently leaves out a lot (meal ideas, weekly meal plan, hydration tips, supplements, "why it matters" per biomarker, structured checklist context/priority, dependant name, health score, lab name) and the design is plain. We'll build **one branded PDF template** and use it everywhere a PDF is generated (download, WhatsApp share, email share, native share).

---

## 1. One-tap WhatsApp share

Replace the current floating Share-toggle behavior with a clear, prominent action bar at the bottom of the report (above the bottom nav).

```text
┌──────────────────────────────────────────┐
│  [ 📲  Send to WhatsApp ]  [ ⬇ PDF ] [⋯] │
└──────────────────────────────────────────┘
```

- **Primary green WhatsApp button** (full label "Send to WhatsApp", WhatsApp brand green) — single tap → generates the PDF and opens WhatsApp share.
- **PDF download** button (icon + "PDF" label) next to it.
- **"More" (⋯) button** opens a small sheet with Email, Native share, and Copy summary link — keeps the screen uncluttered without hiding WhatsApp.
- Remove the current double-tap "Share toggle → fan of icons" pattern.
- On devices that support `navigator.share` with files, the WhatsApp button still uses the direct WhatsApp deep-link path (more reliable than relying on the OS picker landing on WhatsApp).
- Same WhatsApp-first treatment is applied to the smaller share buttons inside `SummaryTab` and `ChecklistTab` for consistency: a labeled WhatsApp button first, then a smaller "More" menu.

---

## 2. Unified, fully-detailed PDF template

Create a single template module that owns the look and the content of every PDF the app produces. Today `PDFExport.tsx` is the only generator but its output is incomplete and visually plain.

### Branded layout (every page)

- **Cover page**: VeriDIA wordmark, report title, patient/dependant name, lab name (if present), report date, health score ring (rendered via `jsPDF` arcs, mirrors the app's circular score), and the abnormal/borderline/normal counts as colored chips.
- **Header band** on every subsequent page: thin Vital Green bar, "VeriDIA" wordmark left, page X of Y right.
- **Footer band**: NDPA disclaimer line + "getveridia.app" + page number, in muted gray.
- **Section headers**: colored pill ("Summary", "Biomarkers", "Diet Plan", "Doctor Q's") matching the in-app tab palette (Vital Green / Clinical Navy / Harvest Gold / Emergency Red where appropriate).
- **Typography**: Helvetica bold for headings, regular for body, larger 11pt body (matches the app's high-contrast, 18pt+ ethos as much as a print PDF allows).
- Status colors reused from `STATUS_COLORS` map so app and PDF feel like one product.

### Sections — currently missing pieces called out

**Cover / Summary**
- Patient or dependant name (currently never printed).
- Lab name / source (if stored on the result).
- Health score ring + counts.
- Full AI summary (English or Pidgin based on selected language) — already present, kept.
- A second "Pidgin" summary block if both languages exist and user is on English (and vice-versa) — optional toggle, default off.

**Biomarkers** (currently misses "why it matters" and trend context)
- Name, value + unit, reference range, status badge (colored).
- Plain-English explanation.
- **Why it matters** (new in PDF).
- **Trend context** if present (new in PDF).
- Lifestyle tip.

**Diet Plan** (currently misses meal suggestions, weekly plan, hydration, supplements)
- Foods to increase / reduce / avoid (kept, with local names).
- **Meal Ideas** list (`meal_suggestions`) — new.
- **7-Day Meal Plan** table (`weekly_meal_plan`) — new; one row per day, three columns Breakfast/Lunch/Dinner.
- **Hydration tips** — new.
- **Natural supplements / boosters** — new.

**Doctor's Q&A Checklist** (currently flattens structured items)
- Numbered question with **priority badge** (high/medium/low, colored).
- **"Why this matters"** context block under each question — new in PDF.
- Pidgin variant printed underneath when available and when language="pidgin".

**Critical alerts** (new section, only if `has_critical_alert`)
- Red banner at top of cover page summarizing each critical biomarker so the doctor sees it first.

**Disclaimer page** (kept, polished)
- NDPA + "not medical advice" copy in both English and Pidgin.

### Page hygiene

- Single `addSection(title, color, render)` helper that auto-paginates with the branded header/footer instead of the current ad-hoc `checkPage` calls — fixes the "details get cut off" feel.
- Compute total page count after layout to render "Page X of Y".

### One template, everywhere

- `generatePDF(pdfData)` and `sharePDF(pdfData, method)` keep their public signatures so callers (`ResultReport`, future Trends/History export) don't change.
- All visual + content logic moves into a single `buildReportPdf()` function inside `PDFExport.tsx`. Anywhere else that ever needs a report PDF imports the same function — guarantees the "unified template" the user asked for.

### Data passed in

Extend the `PDFData` type to include `patientName`, `labName`, `criticalAlerts`, and `healthScore` (computed from biomarkers, same formula as `SummaryTab`). `ResultReport.tsx` already has all of these — just plumb them through.

---

## Technical details

- **Files edited**
  - `src/components/report/PDFExport.tsx` — rewrite around a unified template, add cover page, branded header/footer, all missing sections, proper auto-pagination.
  - `src/components/report/types.ts` — extend `PDFData`-related types if needed (or define `PDFData` here so it can be reused).
  - `src/pages/ResultReport.tsx` — replace the floating Share toggle with the new bottom action bar (WhatsApp primary, PDF, ⋯ More); pass `patientName`, `labName`, `criticalAlerts` into `pdfData`.
  - `src/components/report/SummaryTab.tsx` and `src/components/report/ChecklistTab.tsx` — adjust their inline share rows to put WhatsApp first with a label, then a smaller "More" trigger, using the same helper.
- **No DB / edge-function changes.** All required data is already on `lab_results` (or already fetched: `dependants`, owner info for admins).
- **No new dependencies.** Continues to use `jspdf`. SVG-style health ring is drawn with `doc.circle` + `doc.lines` arcs.
- **QA checklist before shipping**: render a sample PDF with (a) a full report including weekly meal plan + critical alerts, (b) a Pidgin report, (c) a report with no diet plan yet — confirm no clipping, headers/footers on every page, page numbers correct.
