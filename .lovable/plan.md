## Problem

The 9 organisation logos on the landing page (`TrustLogosStrip`) and `/sources` page (`TrustedSourcesSection`) are not rendering. All Wikimedia Commons URLs we used return **HTTP 400** — Wikimedia's thumbnail server rejects hot-linking these `thumb/.../NNNpx-...png` URLs from third-party origins. The result: empty grey boxes where the badges should appear.

Bonus issues we'll fix at the same time:
- WHO and WHO Africa currently point at the same WHO logo (no distinct Africa Region mark).
- FMOH Nigeria and Nigerian Heart Foundation both fall back to the Nigerian coat of arms — visually identical, confusing on the grid.

## Fix: bundle real official logos locally

Hot-linking external CDNs for logos is fragile (URLs change, hotlink blocks, CSP, slow loads). The standard fix is to download each official logo once and import it as a local asset, so it ships with the app and Vite fingerprints the file.

### 1. Add 9 logo files to `src/assets/sources/`

Greyscale-friendly official logos, sized ~320 px wide, kept as PNG with transparency (or SVG where the official version is clean):

```text
src/assets/sources/
  nih.png
  mayo-clinic.png
  who.png
  cdc.png
  usda.png
  who-africa.png        ← WHO AFRO regional mark (distinct from WHO global)
  africa-cdc.png
  fmoh-nigeria.png      ← Federal Ministry of Health official wordmark
  nigerian-heart-foundation.png
```

Source strategy: pull each from the organisation's official press/brand page or Wikimedia's *original* file URL (not the `thumb/` derivative), then commit the binary into the repo. This sidesteps the 400s and gives us full control over size and contrast.

### 2. Update `src/components/landing/TrustedSources.tsx`

- Replace the 9 inline `logo: "https://upload.wikimedia.org/..."` strings with ES module imports:
  ```ts
  import nih from "@/assets/sources/nih.png";
  // …8 more
  ```
- Point each `TRUSTED_SOURCES[i].logo` at the imported variable.
- Keep the existing greyscale + opacity styling and hover lift untouched.

### 3. Improve rendering robustness (small polish)

- Add `onError` fallback on each `<img>` that hides the broken image and shows the source name as a styled text chip — so even if a future asset is missing, the strip never shows a broken-image icon.
- Add `width`/`height` hints to reserve layout space and prevent the strip from collapsing while images load.

## Files to edit

- **add** `src/assets/sources/*.png` (9 files)
- **edit** `src/components/landing/TrustedSources.tsx` — swap URLs for imports, add `onError` fallback

## Out of scope

No copy, layout, ordering, or methodology-page logic changes. The badges already wired up to `/sources#bio-{slug}` continue to work as-is — only the image source changes.
