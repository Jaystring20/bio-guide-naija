
# Combined plan: New logo rollout + "Real People, Real Results" Landing section

Two related polish passes, bundled into one approval.

---

## Part A — Replace the VeriDIA logo everywhere

### Asset swap
- Copy the uploaded transparent-background mark from `user-uploads://VeriDIA_logo.png` over `src/assets/veridia-logo.png` (overwrite).
- Because every screen imports the logo via `import veridiaLogo from "@/assets/veridia-logo.png"`, the new artwork automatically flows into:
  - `src/pages/Landing.tsx` (nav header line 66, footer line 510)
  - `src/pages/Auth.tsx` (line 40)
  - `src/pages/Onboarding.tsx` (line 55)
  - `src/pages/Index.tsx` (Home hero, line 79)

### Fix the Home hero rendering
- `src/pages/Index.tsx` line 79 currently applies `brightness-0 invert` to force the old logo white on the dark navy hero. The new mark is multi-color (green checkmark/heartbeat ring + green "Veri" + navy "DIA"); inverting would destroy the brand colors.
- Remove `brightness-0 invert`, bump size to `h-6` for legibility, and wrap in a slim translucent chip (`bg-white/90 px-2 py-1 rounded-md`) so both the green and navy parts read cleanly against the dark hero gradient.

### Favicon + social preview
- Delete the existing `public/favicon.ico` (browsers request `/favicon.ico` by default and would otherwise override the new one).
- Generate from the new mark and write to `public/`:
  - `favicon.png` (512×512, square crop on the circular checkmark/heartbeat — the wordmark is unreadable at 32px).
  - `favicon.ico` (multi-size 16/32/48 from the same square crop).
  - `og-image.png` (1200×630, full logo centered on a soft Vital Green → Clinical Navy aurora background, for richer link previews).
- Update `index.html` (currently has zero favicon or OG image tags):
  - `<link rel="icon" href="/favicon.png" type="image/png" />`
  - `<meta property="og:image" content="/og-image.png" />`
  - `<meta name="twitter:image" content="/og-image.png" />`

### Sanity check
- Search confirms no other component embeds the logo as inline SVG or background-image (BottomNav, ProfileSwitcher, AppShell, EmergencyAlert all clean). No further wiring needed.

---

## Part B — "Real People, Real Results" section on Landing

Adapted from AwaDoc's portrait-constellation pattern, but recast to dramatize VeriDIA's actual job: turning a confusing lab number into a calm, culturally-grounded action.

### Where it goes
Inserted into `src/pages/Landing.tsx` **between the Hero (ends line 229) and the Stats Bar (starts line 232)** — the highest-impact spot, immediately after the headline, before "How It Works".

### Content (4 personas, each with a paired worry → VeriDIA reply)

| Persona | Halo color | Worry bubble | VeriDIA reply bubble |
|---|---|---|---|
| Aunty (caregiver) | amber `bg-destructive/10` | "Mum's BP 240/120 — what now?" | "Critical. Call her doctor today. Cut salt, add ugu & watermelon." |
| Father (diabetic) | green `bg-primary/10` | "HbA1c 8.2 — is that bad?" | "High. Swap white rice for ofada. Walk 20 min daily." |
| New mum | navy `bg-secondary/10` | "Iron 9.1 — feeling weak." | "Low. Add ugu, liver, and beans this week." |
| Health-conscious | accent `bg-accent/10` | "Cholesterol 280 — am I in trouble?" | "High. Try oats + garden egg. Recheck in 8 weeks." |

### Visual & motion details
- Each persona is a circular halo disc with a Lucide icon inside (`Users`, `Activity`, `Baby`, `HeartPulse`) acting as a stylized portrait — keeps it on-brand and avoids stock-photo cost. (If you'd rather have AI-generated Nigerian portrait photos, say so and I'll add that step before building.)
- Worry bubble: `bg-card`, muted text, slight `rotate-[-2deg]` tilt.
- Reply bubble: `bg-gradient-brand-soft` with a left accent rail in `bg-primary`, tiny `Sparkles`/`CheckCircle2` icon, opposite tilt.
- A subtle dotted SVG path connects each worry → reply, drawn in via `motion.path` `pathLength` on scroll-in (same trick as the existing hero underline).
- Layered behind the section: low-intensity `<Aurora tone="brand" intensity={0.4} />` for warmth.
- Stagger entrance: portraits scale-in (`springPop`), bubbles fade-up with 80ms stagger. All motion respects `prefers-reduced-motion` via the existing `src/lib/motion.ts` helpers.

### Layout sketch

```text
              REAL PEOPLE. REAL RESULTS.
   From confusing lab numbers to calm, clear action.

  [worry]                                          [worry]
   ↘  ◯ Aunty       ◯ Father     ◯ Mum     ◯ Health-conscious  ↙
  [reply]                                          [reply]

         [ Get Started Free → ]   (reuses existing CTA)
   👥👥👥👥👥  Trusted by 500+ Nigerian families
```

Mobile (<sm): renders as a vertical stack — one persona per row with worry above and reply below. Desktop (≥md): 4-column constellation as drawn.

### Implementation note
All inside `src/pages/Landing.tsx` — adds a `<RealStoriesSection />` block plus two small local helpers (`PortraitCard`, `ChatBubble`). No new files, no new dependencies.

---

## Files

**Replaced**
- `src/assets/veridia-logo.png`
- `public/favicon.ico` (deleted then regenerated from new mark)

**Created**
- `public/favicon.png`
- `public/og-image.png`

**Edited**
- `index.html` (favicon + OG/Twitter image meta tags)
- `src/pages/Index.tsx` (drop invert filter on hero logo, add white chip wrapper)
- `src/pages/Landing.tsx` (insert "Real People, Real Results" section between Hero and Stats Bar)

---

## Out of scope (ask if you want any)
- AI-generated Nigerian portrait photos for the 4 personas (instead of Lucide icons).
- Repeating the constellation pattern as a smaller widget on the Home dashboard hero.
- Animated SVG version of the heartbeat mark inside the new logo.
- Brand color token changes — the new logo matches existing Vital Green + Clinical Navy, so none needed.

Approve and I'll execute end-to-end in one pass.
