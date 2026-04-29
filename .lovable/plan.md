
# Make VeriDIA feel surreal & emotionally captivating

Goal: Lift VeriDIA from "polished" to "felt". The interface should breathe, respond, and reward — so a worried daughter uploading her mother's lab result feels calm, cared for, and hopeful, not anxious.

We'll keep the brand (Vital Green / Clinical Navy, high-contrast, mobile-first 18pt+) but layer warmth, micro-interactions and a few "wow" moments. All motion respects `prefers-reduced-motion`.

---

## Emotional pillars (drives every animation choice)

1. **Reassurance** — slow, soft entrances; nothing snaps. Easing curves are gentle (easeOut, spring with low stiffness).
2. **Warmth** — golden-hour gradient washes, soft glows behind family avatars, a "heartbeat" pulse on the hero.
3. **Hope & momentum** — upward motion on every key reveal (results, diet plan, stats counting up).
4. **Care** — confetti-light celebration when an upload completes; gentle haptic-like scale on every tap.

---

## What we'll build

### 1. Global motion system (`src/index.css` + new `src/lib/motion.ts`)
- Add keyframes: `aurora` (slow drifting gradient), `heartbeat` (2-beat soft pulse), `breathe` (scale 1 → 1.02), `shimmer-text`, `draw-line` (SVG stroke), `ripple`, `count-up`.
- Add utilities: `.bg-aurora`, `.animate-heartbeat`, `.animate-breathe`, `.text-shimmer`, `.tap-scale` (active:scale-[0.97] transition).
- Export `framer-motion` variants: `fadeUp`, `fadeUpSoft`, `staggerKids`, `springPop`, `revealMask` for reuse.
- Wrap motion in `useReducedMotion()` checks so accessibility is respected.

### 2. Landing page — surreal hero
- **Aurora background**: layered gradient blobs that slowly drift (40s loop) behind hero — green → navy → amber whispers.
- **Hero headline**: word-by-word fade-up with slight blur-in (blur 8px → 0). "Life-Saving" gets the existing underline drawn in via animated SVG `pathLength`.
- **Floating cards**: switch from CSS float to framer-motion with subtle 3D tilt on scroll (parallax y + rotateX).
- **Avatar stack**: each avatar pops in with spring + soft glow ring; on hover, the stack fans out slightly.
- **Stats bar**: numbers count up from 0 when scrolled into view.
- **Section reveals**: each section uses a scroll-triggered "mask reveal" (clip-path inset 0 100% 0 0 → 0 0 0 0) for a cinematic wipe.
- **Testimonial cards**: gentle continuous breathe animation; on hover, lift + glow.
- **Footer CTA**: large gradient button with continuous soft glow pulse (the existing `subtle-pulse` extended).

### 3. Home (`Index.tsx`) — your warm welcome
- **Hero card**: gradient becomes a slow `aurora` (drifting hue). Adds a faint "heartbeat" ring around the avatar button — signals "alive, monitoring".
- **Greeting**: typewriter-style reveal of name (~400ms), then waving emoji micro-bounces 3 times.
- **Upload CTA glass card**: continuous soft `breathe` + arrow icon does a gentle "nudge right" loop every 4s.
- **Family tiles**: stagger-in on mount (60ms each), hover lift already exists — add a soft glow halo behind avatar matching relationship color.
- **Stat tiles**: numbers count up on first paint; tile taps trigger a quick ripple from touch point.
- **Latest result card**: slide-in from right with spring; the "Latest" pill has a slow pulsing dot (already there — animate it).

### 4. Upload flow (`UploadLab.tsx`) — the emotional centerpiece
This is where users are most anxious. Make it feel like the app is *with* them.
- **Pre-upload tiles**: gentle breathe on the camera/file tiles; on tap, a ripple + scale.
- **Processing screen** (Uploading → Reading → Finalizing):
  - Replace linear bar with a **circular orbit**: a small dot orbits a central pulsing heart icon while text rotates through reassuring phrases ("Reading your results carefully…", "Mapping to local foods…", "Almost there…").
  - Background subtly shifts hue from navy → green as it progresses (color = hope rising).
- **Success moment**: when interpretation completes, a soft confetti burst (5–8 particles, brand colors only — no clown vibes) + checkmark draws itself in + haptic-style scale bounce. Then auto-routes to report after 1.2s with a "Your plan is ready" line that fades up.

### 5. Result Report (`ResultReport.tsx`) — clarity with feeling
- **Tab switches**: framer-motion `AnimatePresence` with horizontal slide+fade between Summary / Biomarkers / Diet / Checklist.
- **Biomarker rows**: stagger in; each value bar fills from 0 → actual with spring (visualises range position).
- **Critical alerts**: red emergency cards already exist — add a slow attention pulse (NOT alarming — empathetic) and a subtle red aura behind the icon.
- **Diet plan items**: each food card fades up with image-style hover lift; "local name" badge bounces in.

### 6. Family Hub (`Family.tsx`) — the heart of the app
- Member cards stagger in with spring; tapping a card triggers a satisfying scale + glow before navigation.
- Add member button: dashed border breathes gently, inviting interaction.
- Empty state (no dependants): a soft illustrated moment with floating heart particles and a warm "Add the people you care about" line that fades in word-by-word.

### 7. Profile switcher (top sticky pill) — alive & friendly
- Avatar inside the pill gets a faint pulsing ring when there are unread/critical results for that profile (uses existing `useProfileStats`).
- Sheet open: bottom-sheet rises with a slight overshoot spring.
- Profile rows: stagger in; selected row's check has a draw-in animation.

### 8. Bottom Nav — tactile feedback
- Active tab indicator (the dot) morphs between tabs with a layout animation (framer `layoutId`).
- Center FAB: continuous soft glow pulse + on tap, a ripple expands outward.
- Tab icons do a tiny "settle" bounce when becoming active.

### 9. Page transitions
- Wrap routes in `AnimatePresence` (in `App.tsx`) so navigation between Home / History / Family / Profile gets a soft cross-fade + 8px upward slide (~250ms). Subtle, not flashy.

---

## Accessibility & performance guardrails

- Every animation guarded by `useReducedMotion()` — falls back to instant or simple opacity.
- No animation longer than 700ms on interactive feedback; ambient loops use `transform`/`opacity` only (GPU-friendly).
- Confetti uses canvas-free DOM particles (max 10) and unmounts after 1.5s.
- All decorative motion has `pointer-events-none` and `aria-hidden`.

---

## Files to change

Edit:
- `src/index.css` — new keyframes, utilities, aurora gradient
- `src/App.tsx` — `AnimatePresence` route wrapper
- `src/pages/Landing.tsx` — aurora, word reveals, count-up, mask reveals
- `src/pages/Index.tsx` — heartbeat, breathe CTA, count-up stats, ripple
- `src/pages/UploadLab.tsx` — orbit processing, success confetti
- `src/pages/ResultReport.tsx` — tab transitions, biomarker bars, alert aura
- `src/pages/Family.tsx` — stagger, glow, empty-state warmth
- `src/components/ProfileSwitcher.tsx` — pulsing ring, spring sheet
- `src/components/BottomNav.tsx` — `layoutId` indicator, ripple FAB
- `src/components/EmergencyAlert.tsx` — empathetic pulse

Create:
- `src/lib/motion.ts` — shared variants + reduced-motion helpers
- `src/components/CountUp.tsx` — accessible number-animator
- `src/components/Confetti.tsx` — lightweight DOM confetti (brand colors)
- `src/components/Ripple.tsx` — tap ripple wrapper

No new dependencies needed (`framer-motion` is already used).

---

## Out of scope (ask before adding)

- Sound effects / haptics
- Lottie / video assets
- 3D / WebGL backgrounds
- Changing the brand color palette

Approve and I'll implement it end-to-end.
