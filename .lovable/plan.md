

# PDF Export + Pidgin/English Language Toggle + Relatable UX

## What We're Building

Three enhancements to the lab report experience:

1. **PDF Export** — A "Download PDF" button that generates a clean, branded PDF containing all three report sections (Biomarkers, Diet Plan, Doctor Questions) from the client side
2. **Pidgin ↔ English Toggle** — A language switcher on the report page. The AI generates both versions at interpretation time, and users flip between them instantly
3. **More Relatable Language** — Update the Gemini prompts to use warm, everyday Nigerian English — like a knowledgeable friend or big sister explaining your results

## How It Works

### 1. Language Toggle (Edge Function + DB + UI)

**Edge function change**: After the current biomarker + diet extraction, add a third Gemini call that takes the English output and translates it into Nigerian Pidgin — keeping medical accuracy but using everyday pidgin phrasing (e.g., "Your sugar level dey too high" instead of "Elevated glucose levels").

**Database**: Add two new JSONB columns to `lab_results`:
- `biomarkers_pidgin` — pidgin versions of explanations/tips per biomarker
- `dietary_plan_pidgin` — pidgin versions of diet plan text
- `consultation_checklist_pidgin` — pidgin doctor questions
- `ai_summary_pidgin` — pidgin summary

**UI**: Add a toggle pill at the top of ResultReport (🇬🇧 English / 🇳🇬 Pidgin). When toggled, all tab components read from the pidgin variants instead. No page reload needed — it's a simple React state switch.

### 2. PDF Export (Client-Side)

Use `jspdf` + `html2canvas` approach or a simpler text-based PDF using `jspdf` directly:
- Add a "Download PDF" floating action button on the report page
- Generate a branded PDF with:
  - Header: BioGuide logo, date, patient info
  - Section 1: Health Summary + score
  - Section 2: All biomarkers with status, explanation, lifestyle tips
  - Section 3: Diet plan (foods to increase/reduce/avoid, meal plan)
  - Section 4: Doctor consultation questions with priority
  - Footer: disclaimer ("This is not medical advice")
- Uses the currently active language (English or Pidgin)

### 3. More Relatable Prompts

Update both Gemini system prompts to emphasize:
- "Explain like a caring Nigerian big sister/brother"
- Use everyday analogies (e.g., "Think of your liver like a filter for dirty water")
- Reference relatable scenarios ("after eating that party jollof rice...")
- Keep it warm, not clinical

## Files Changed

| File | Change |
|------|--------|
| `supabase/functions/interpret-lab/index.ts` | Add 3rd Gemini call for Pidgin translation; update prompts for warmer tone |
| DB migration | Add `biomarkers_pidgin`, `dietary_plan_pidgin`, `consultation_checklist_pidgin`, `ai_summary_pidgin` columns |
| `src/pages/ResultReport.tsx` | Add language toggle state, pass language to all tabs, add PDF download button |
| `src/components/report/SummaryTab.tsx` | Accept `language` prop, switch between English/Pidgin summary |
| `src/components/report/BiomarkersTab.tsx` | Accept `language` prop, show pidgin explanations/tips when active |
| `src/components/report/DietPlanTab.tsx` | Accept `language` prop, show pidgin diet text when active |
| `src/components/report/ChecklistTab.tsx` | Accept `language` prop, show pidgin questions when active |
| `src/components/report/types.ts` | Add pidgin variant types |
| New: `src/components/report/PDFExport.tsx` | PDF generation component using jspdf |
| `package.json` | Add `jspdf` dependency |

## Technical Detail

### Pidgin Translation Call
The 3rd Gemini call receives the full English output and returns pidgin equivalents. Uses structured function calling to ensure consistent shape. This runs in parallel-ish with the diet call since it only needs biomarker data.

### PDF Structure
Uses `jspdf` (no canvas rendering needed — pure text/layout PDF). Sections are laid out programmatically with proper pagination. The PDF respects whichever language is currently active.

### Language State
A simple `useState<"en" | "pidgin">("en")` in ResultReport. Each tab component receives both English and Pidgin data, displaying based on the active language. The toggle is a sticky pill at the top of the page.

