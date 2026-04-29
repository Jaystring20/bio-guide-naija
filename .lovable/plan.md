## Goal

Replace the dark-mode "white background pill" hack with the new dark-optimized VeriDIA logo you uploaded, so the logo has true contrast on dark mode without any background plate.

## What changes

1. **Save the new asset**
   - Copy `user-uploads://Untitled_design_9-2.png` → `src/assets/veridia-logo-dark.png` (already staged).

2. **Create a reusable theme-aware logo component** at `src/components/VeridiaLogo.tsx`
   - Renders the existing `veridia-logo.png` in light mode.
   - Renders the new `veridia-logo-dark.png` in dark mode.
   - Uses Tailwind's `dark:` variant (`block dark:hidden` / `hidden dark:block`) — instant switch, no flash, no JS theme reads needed.
   - Accepts `className` and `alt` props so each call site keeps its own size.

3. **Replace every existing logo usage** with the new component and remove the `dark:bg-white/95 dark:rounded-xl dark:px-2 dark:py-1 dark:shadow-glow-primary` workaround:
   - `src/pages/Landing.tsx` — nav (line 67) and footer (line 662)
   - `src/pages/Onboarding.tsx` (line 55)
   - `src/pages/Index.tsx` (line 86)
   - `src/pages/Auth.tsx` (line 40)
   - Drop the `import veridiaLogo from "@/assets/veridia-logo.png"` lines in those files (now handled inside the component).

## Result

- Light mode: unchanged.
- Dark mode: the uploaded logo variant is shown directly on the dark background — no white pill, full contrast.
- One component to maintain going forward; future logo swaps are a one-line change.

Approve and I'll apply it.