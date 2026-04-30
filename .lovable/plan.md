# Theme-aware logo tiles

## Problem
The typographic source tiles in `src/components/landing/TrustedSources.tsx` (and the matching tiles on `/sources`) use `text-muted-foreground/70` plus `border-current/20` / `bg-current/5`. Because every visual layer is driven by `currentColor`, the mark fades to a near-invisible outline in dark mode (especially against the already-elevated `bg-card`), and on the strip's `bg-card/40` panel in light mode the wordmark subtitle drops below comfortable contrast. We need explicit light + dark variants that stay readable on every surface they appear on (hero strip, `/sources` tier cards, methodology page).

## What changes

Only `src/components/landing/TrustedSources.tsx` — the `SourceLogo` component. Same API, same layout, same hover lift; only the color/border/background tokens become theme-aware. We keep "greyscale at rest, brand color on `group-hover`" as the existing convention.

### Token mapping

```text
                    Resting (light)            Resting (dark)             Hover (both)
mark text           muted-foreground           foreground/85              primary
mark border         border                     foreground/20              primary/50
mark background     muted/60                   foreground/[0.06]          primary/10
wordmark text       foreground/70              foreground/85              foreground
sub-wordmark text   muted-foreground           muted-foreground           foreground/80
```

All values use existing semantic tokens from `src/index.css`, so no new CSS vars. The dark overrides are applied via Tailwind's `dark:` variant — Tailwind is already in `darkMode: ["class"]`, and `ThemeContext` toggles the `.dark` class on `<html>`, so `dark:` will resolve correctly.

### Why this works on every surface

- **Strip (`bg-card/40`, light)**: `muted/60` mark + `border` outline reads as a subtle pill, not a ghost.
- **Tier card (`bg-card`, dark)**: `foreground/[0.06]` fill + `foreground/20` border give enough separation from the card without competing with the card's own border.
- **Hover** swaps to `primary` color across all three layers, matching the existing card's `hover:border-primary/40`.

### Touch points
- Edit `SourceLogo` in `src/components/landing/TrustedSources.tsx` — replace the `currentColor`-driven classes on the monogram and wordmark blocks with the explicit light/dark token classes above.
- No data changes, no changes to `TRUSTED_SOURCES`, `TrustLogosStrip`, `TrustedSourcesSection`, or `SourcesMethodologyPage.tsx` (it consumes `mark`/`wordmark` via its own wrapper, which already uses theme tokens correctly — but I'll spot-check it once in build mode and tweak only if the same `border-current/20` pattern appears there).

## Out of scope
- No changes to the `/sources` methodology copy, citations data, or any other component.
- No new CSS variables or Tailwind config changes.

## Verification
After implementing, view the strip and `/sources` tier cards in both themes via the preview, confirming the mark pill is clearly visible at rest and turns brand-green on hover in both.
