

# Enhance BioGuide Analysis: Comprehensive Reports + UX Optimization

## Your Question
You asked whether diet plans alone are enough as a USP. Short answer: **no, but the combination is**. The real value is the full loop — lab interpretation in plain language, localized Nigerian diet plans, AND actionable doctor questions — all from a single photo upload. Right now the pieces exist but feel disconnected. This plan makes the analysis richer and the experience more polished.

## What Changes

### 1. Richer AI Analysis (Edge Function)
Enhance both Gemini prompts to produce deeper, more actionable output:

**Biomarkers** — add two new fields per biomarker:
- `lifestyle_tip`: one actionable non-drug lifestyle change (e.g., "Walk 30 min after meals to help regulate blood sugar")
- `trend_context`: context about what this result could mean over time

**Diet Plan** — add:
- `weekly_meal_plan`: 7-day sample meal plan with breakfast/lunch/dinner mapped to the patient's region
- `hydration_tips`: water/fluid recommendations based on results
- `supplement_notes`: natural supplement suggestions (moringa, zobo, etc.) — no pharmaceuticals

**Consultation Checklist** — restructure from plain strings to objects with:
- `question`: the question text
- `context`: why this question matters (so the user understands its importance)
- `priority`: high / medium / low

### 2. Summary Dashboard Card (New)
Add a top-level summary section to the ResultReport page showing:
- Overall health snapshot: count of normal / borderline / abnormal biomarkers
- Color-coded progress ring or bar
- One-sentence AI-generated summary (added to edge function output)
- "Share Full Report" button

### 3. Enhanced ResultReport Page
- **Summary tab** (new default): health snapshot + AI summary + quick action buttons
- **Biomarkers tab**: add lifestyle tips inline, visual status bar showing where value falls in reference range
- **Diet Plan tab**: add weekly meal plan section, hydration tips, supplement notes
- **Doctor Questions tab**: show priority badges, add context expandable per question

### 4. Database Schema Update
Add column to `lab_results`:
- `ai_summary` (text) — one-paragraph plain-English health summary

### Files Changed
- `supabase/functions/interpret-lab/index.ts` — enhanced prompts and function declarations
- `src/pages/ResultReport.tsx` — new Summary tab, enhanced Biomarkers/Diet/Checklist tabs
- Database migration — add `ai_summary` column

### What Stays the Same
- Upload flow, retry logic, authentication, critical alerts — all unchanged
- Existing data in `biomarkers`, `dietary_plan`, `consultation_checklist` JSONB columns still works (new fields are additive)

## Technical Detail

The edge function's two Gemini calls get expanded tool schemas:

**Call 1** adds `lifestyle_tip` and `trend_context` string fields to each biomarker object, plus a top-level `summary` string field.

**Call 2** adds `weekly_meal_plan` (array of day objects), `hydration_tips` (string array), `supplement_notes` (string array) to the dietary plan, and restructures `consultation_checklist` from `string[]` to `{question, context, priority}[]`.

The ResultReport page gets a 4-tab layout: Summary → Biomarkers → Diet Plan → Doctor Questions, with the summary as the default landing tab showing a visual health snapshot.

