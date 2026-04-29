# Logo Legibility Pass — Bigger & Bolder Everywhere

Goal: Make the VeriDIA wordmark unmistakably visible and bold on every viewport (mobile → desktop), across every place it appears, while keeping it crisp on dark gradient backgrounds via a subtle white chip.

## Current sizes vs. proposed sizes

| Location | File | Current | Proposed (mobile → desktop) |
|---|---|---|---|
| Landing nav (top bar) | `src/pages/Landing.tsx:66` | `h-9` (36px) | `h-10 sm:h-12 md:h-14` (40 → 56px) |
| Landing footer | `src/pages/Landing.tsx:656` | `h-8` (32px) | `h-10 md:h-12` (40 → 48px) |
| Home hero card | `src/pages/Index.tsx:79` | `h-6` (24px) inside small chip | `h-9 sm:h-10` (36 → 40px) with larger chip padding `px-3 py-2` |
| Auth screen | `src/pages/Auth.tsx:40` | `h-16` | `h-20 sm:h-24` (80 → 96px) |
| Onboarding | `src/pages/Onboarding.tsx:55` | `h-20` | `h-24 sm:h-28` (96 → 112px) |

## Legibility enhancements

1. **White backdrop chip** anywhere the logo sits on a gradient/dark surface (Home hero already has one — enlarge it; Landing nav stays on light bg so no chip needed).
2. **`drop-shadow-sm`** on the logo image on light backgrounds so the colored mark doesn't visually disappear at small sizes.
3. **Crisp rendering**: add `style={{ imageRendering: "auto" }}` and ensure `width/height` intrinsic via the Tailwind classes (no layout shift).
4. **Mobile-first scaling**: Use responsive Tailwind classes (`h-10 sm:h-12 md:h-14`) so the logo grows with viewport instead of one fixed size.
5. **Nav bar height bump**: Landing nav currently `h-16` — bump to `h-16 md:h-20` so the larger logo fits without crowding.

## Files to edit
- `src/pages/Landing.tsx` — nav logo (line 66) + nav height (line 64) + footer logo (line 656)
- `src/pages/Index.tsx` — hero logo + chip (lines 78–80)
- `src/pages/Auth.tsx` — auth logo (line 40)
- `src/pages/Onboarding.tsx` — onboarding logo (line 55)

## Out of scope
- Favicon / OG image (already updated previously, sizes are fixed by spec).
- No logo asset re-export — the current PNG is high-res enough to scale up cleanly.

## QA checklist (post-implementation)
- View Landing at 360px, 390px, 768px, 1280px — logo readable in nav and footer.
- View Home (`/`) at 390px — logo legible on green hero gradient.
- Auth and Onboarding logos feel hero-sized, not stamp-sized.
