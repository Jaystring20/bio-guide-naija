

# BioGuide — Core Loop MVP Implementation Plan

## Visual Identity
Apply the brand system from your visual guide:
- **Bio Deep** (#0A3D2B) — Primary, headers, nav
- **Harvest Gold** (#C8840A) — CTAs, accent buttons
- **Kitchen Earth** (#B05835) — Warmth, alerts
- **Parchment** (#F8F4ED) — Background
- **Sage** (#4A7C59) — Secondary, cards
- **Deep Night** (#1C1407) — Body text
- Minimum 18pt sans-serif body text, 48×48px touch targets throughout

---

## 1. Design System & App Shell
- Update Tailwind CSS variables with the BioGuide color palette
- Create persistent bottom navigation bar with 4 tabs: **Home**, **Upload** (center, prominent), **History**, **Profile**
- Mobile-first layout optimized for 360–414px viewports
- High-contrast, large-text typography system

## 2. Authentication & Onboarding
- Enable Lovable Cloud with Supabase auth (email + phone)
- Create `profiles` table (name, age, sex, geopolitical_zone — South-South/South-West/South-East/North-Central/North-East/North-West)
- Build a warm, empathetic onboarding flow (3 screens): welcome → region selection → profile setup
- Medical disclaimer & NDPA consent screen with granular opt-ins

## 3. Lab Result Upload (Snap & Upload)
- Camera capture + file upload UI (JPG, PNG, PDF)
- Upload to Supabase Storage (temporary bucket, auto-delete after processing)
- Show upload progress with "pending sync" state for offline resilience
- Store structured results in `lab_results` table (user_id, biomarkers JSONB, upload_date, status)

## 4. AI Interpretation Engine (Edge Function)
- Create `interpret-lab` edge function using Lovable AI Gateway
- AI receives the uploaded lab image and extracts biomarker data (OCR via multimodal AI — Gemini vision)
- System prompt instructs AI to:
  - Extract all biomarker values, units, and reference ranges
  - Classify each as Normal / Borderline / Deranged-Low / Deranged-High / Critical
  - Generate plain-English explanations (no jargon)
  - **Never suggest pharmaceutical drugs**
- Return structured JSON with extracted biomarkers and classifications

## 5. Emergency Alert Protocol (Safety-Critical)
- Hard-coded critical thresholds checked BEFORE any dietary advice:
  - Glucose >300 mg/dL or <40 mg/dL → 🚨 Full-screen emergency
  - Potassium <2.5 or >6.5 mmol/L → ⚠️ Urgent flag
  - Hemoglobin <7 g/dL → ⚠️ Urgent flag
  - Sodium <120 or >155 mmol/L → 🚨 Emergency
  - eGFR <15 mL/min → ⚠️ Urgent flag
- Emergency screen: full-screen, non-dismissible, red alert with one-tap "Call Doctor Now" button
- If critical: block ALL dietary recommendations

## 6. Nigerian Food-Mapped Dietary Plan
- Create `generate-diet-plan` edge function using Lovable AI
- System prompt contains the Nigerian Food Intelligence Layer:
  - Regional food mapping by geopolitical zone (user's profile)
  - Local market ingredient names (Ugu, Efo Shoko, Ofada rice, Garden Egg, Crayfish, etc.)
  - Preparation-method awareness (boiled vs. stewed nutrient differences)
  - Foods to increase / reduce / avoid per derangement
- Render as a beautiful card-based dietary plan with food categories
- "Foods for You" and "Foods to Avoid" sections with local names

## 7. Consultation Checklist
- AI generates 3–7 personalized questions for the user's next doctor visit
- Based on specific deranged biomarkers
- Shareable via WhatsApp (Web Share API) and copy-to-clipboard
- Empathetic tone: "Questions to bring to your doctor"

## 8. Results Dashboard
- Lab result summary page with color-coded biomarker cards (green/yellow/red)
- Plain-English explanation for each biomarker
- Expandable detail view per biomarker
- "What this means" + "Why it matters" sections

## 9. History Page
- List of past lab uploads with date and status summary
- Basic trend indicators (↑ improved / ↓ worsened) when comparing to previous result

## Pages & Navigation Flow
1. **Splash/Onboarding** → Region + Profile setup
2. **Home** — Welcome message, quick upload CTA, last result summary
3. **Upload** — Camera/file picker → processing animation → results
4. **Result Report** — Biomarker summary → Dietary plan → Consultation checklist
5. **History** — Past results list
6. **Profile** — User info, region, medical disclaimer, NDPA settings

