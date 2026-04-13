

# BioGuide Public Landing Page

Build a public marketing/landing page at `/landing` (accessible without login), similar to AwaDoc's structure but branded for BioGuide's "Lab-to-Nutrition" value proposition.

## Page Structure

### 1. Top Navigation Bar
- BioGuide logo (Leaf icon + "BioGuide" text in Bio Deep)
- Nav links: How It Works, Features, Testimonials
- "Get Started" CTA button in Harvest Gold

### 2. Hero Section
- Headline: **"Understand Your Lab Results. Eat Right for Your Body."**
- Subtext: "Upload your lab result and get a personalized Nigerian diet plan powered by AI. No jargon, just clear guidance."
- Primary CTA: "Get Started Free" button (navigates to `/auth`)
- Social proof line: "Helping Nigerians take control of their health"
- Decorative floating cards showing sample interactions (e.g., "Your cholesterol is high", "Try more Oats & Garden Egg", "Ugu leaf is rich in iron")

### 3. How It Works (4 steps with icons)
1. **Sign Up** — Create your free account in seconds
2. **Upload Lab Result** — Snap or upload your lab result (image or PDF)
3. **Get AI Interpretation** — Understand every biomarker in plain English
4. **Receive Your Diet Plan** — Nigerian foods mapped to your specific needs

### 4. Features Section (3 cards)
- **Nigerian Food Intelligence** — Localized advice using foods from your region (Ugu, Ofada rice, Garden Egg, etc.)
- **Emergency Safety Alerts** — Critical values are flagged immediately with doctor contact guidance
- **Doctor Visit Checklist** — Personalized questions to bring to your next appointment

### 5. Compliance & Trust Bar
- NDPA 2023 compliant badge
- "Your data is confidential" messaging
- Data minimization policy note (images deleted after processing)

### 6. Testimonials Section
- 3-4 testimonial cards with Nigerian names, cities, star ratings
- Culturally resonant quotes about understanding lab results and eating better

### 7. CTA Banner
- "Accessing better nutrition shouldn't be hard. Let's make it easy."
- "Get Started Free" button

### 8. Footer
- BioGuide logo, copyright, disclaimer
- Links: Privacy Policy, Terms, Contact

## Routing Changes
- Add `/landing` route as a public page (no auth required)
- Redirect unauthenticated users from `/` to `/landing` instead of `/auth`
- Keep `/auth` as the signup/login page

## Technical Details
- New file: `src/pages/Landing.tsx` — single-file landing page component
- Update `src/App.tsx` — add `/landing` route, update redirect logic
- Pure CSS/Tailwind with BioGuide brand colors, no external images needed (use Lucide icons and CSS shapes for visuals)
- Responsive: looks great on mobile (360px) through desktop

