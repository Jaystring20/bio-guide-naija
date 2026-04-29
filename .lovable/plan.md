## Goal

Elevate VeriDIA's interface from "clean utilitarian" to "sophisticated clinical product" — the kind of polish you'd expect from Linear, Stripe, or a premium health app — while preserving accessibility (18pt+ fonts, high contrast, large touch targets) and the brand identity (Vital Green, Clinical Navy).

No features added or removed. No backend changes. Pure visual + motion refinement.

---

## What changes (per surface)

### 1. Global design system polish (`src/index.css`, `tailwind.config.ts`)
- Add subtle elevation tokens: `--shadow-sm`, `--shadow-md`, `--shadow-lg` using soft Clinical Navy tints (not pure black) for a clinical-premium feel.
- Add a `--gradient-brand` (Vital Green → Forest Verification) and `--gradient-surface` (subtle navy-tinted off-white) for hero blocks.
- Introduce a `--ring-soft` focus token (green @ low alpha) for refined focus states.
- Register the new shadows/gradients in Tailwind so they're reusable as `shadow-soft`, `bg-gradient-brand`, etc.
- Add 2 keyframes: `shimmer` (loading skeletons) and `subtle-pulse` (CTAs at rest).

### 2. Home (`src/pages/Index.tsx`) — biggest visual lift
- Replace the flat green header with a **gradient hero card** (Vital Green → deeper Forest) with a subtle noise/grid SVG overlay and a soft inner glow. Logo + greeting sit on it.
- Convert the "Upload Lab Result" CTA into a glass-effect card (frosted white over the gradient) with a chevron arrow that animates on hover.
- Redesign "People I manage" cards: avatar circle with initials in brand gradient, relationship as a pill, hover lift.
- Quick Stats: replace bordered rectangles with **soft-shadow tiles** featuring a small colored icon chip top-left and a subtle background pattern.
- Latest result card: add a tiny status dot, biomarker count chips, and a right-aligned arrow with a hover slide.
- Add staggered fade-in-up on mount (framer-motion is already installed).

### 3. Upload (`src/pages/UploadLab.tsx`)
- Wrap the page in a softer container with a "step badge" header ("Step 1 of 1 · Lab upload").
- Person selector: convert to **segmented control** style with a sliding active indicator.
- Date picker button: refine with a leading icon chip and clearer empty state.
- Camera/Upload buttons: upgrade to two large tiles with gradient borders, hover scale, and an icon backdrop. The "Take a Photo" tile keeps the green gradient; "Upload File" gets a dashed Clinical Navy border with a soft tint.
- Processing state: replace the lone spinner with a **3-step progress indicator** (Uploading → Reading → Finalizing) using the existing `processingStep` strings, animated dots between steps.

### 4. History (`src/pages/History.tsx`)
- Filter chips: segmented control style matching Upload.
- Result rows: redesign as cards with a left **status accent bar** (red/amber/green), an icon chip, the date in display font, and biomarker counts as small colored badges (`X normal`, `Y flagged`).
- Empty state: friendlier illustration block with the brand gradient and a primary CTA button.
- Add subtle entrance animation for list items.

### 5. Profile (`src/pages/Profile.tsx`)
- Header card: gradient avatar (initials), name in display font, role badge pill underneath.
- Convert info rows into a clean key/value grid with muted labels.
- "People I Manage": each row gets an avatar chip and hover state; Add button becomes a dashed-border tile at the bottom of the list ("+ Add person").
- Privacy & Disclaimer: combine into a single subdued card with a shield icon header to reduce visual weight.
- Sign Out: ghost-style with destructive accent only on hover.

### 6. Landing (`src/pages/Landing.tsx`) — light touch
- Hero badge gets the brand gradient background.
- Primary CTA: add the same gradient + soft glow shadow as the in-app Home CTA so brand feels consistent.
- Floating cards: refine borders (gradient accent on left edge instead of solid), tighten typography.
- Stats bar: add a faint top-to-bottom gradient and animated count-up on first view.
- (No structural / copy changes.)

### 7. BottomNav (`src/components/BottomNav.tsx`)
- Add a top hairline with a subtle gradient.
- Active tab gets a small dot indicator above the icon.
- Center "Upload" button gets the brand gradient + soft glow shadow (matches Home CTA).

---

## What stays the same
- All routes, data fetching, auth logic, Supabase calls, edge function — untouched.
- Brand colors (Vital Green primary, Clinical Navy secondary) — only used more richly.
- Font stack (Plus Jakarta Sans + DM Sans) — unchanged.
- All accessibility commitments (18pt body, 48px touch targets, high contrast).

---

## Files to edit
- `src/index.css` — new tokens, gradients, shadows, keyframes
- `tailwind.config.ts` — register new shadows/gradients/animations
- `src/pages/Index.tsx` — Home redesign
- `src/pages/UploadLab.tsx` — Upload redesign
- `src/pages/History.tsx` — History redesign
- `src/pages/Profile.tsx` — Profile redesign
- `src/pages/Landing.tsx` — light polish
- `src/components/BottomNav.tsx` — nav polish

No new files, no new dependencies (framer-motion already installed).

---

## Out of scope (ask before doing)
- Dark mode redesign (tokens exist; only adjusted if you want)
- Result Report / Trends / Auth / Onboarding pages — say the word and I'll extend the same treatment to them.
