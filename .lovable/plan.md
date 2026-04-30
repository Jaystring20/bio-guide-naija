# Real brand logos for trusted sources — honest options

You asked a fair question. Let me be straight about what's possible and pick the best path.

## Why we don't have real logos right now

The original implementation hot-linked PNGs from Wikimedia Commons. Wikimedia's thumbnail endpoint returns **HTTP 400** to third-party origins (it's not a CDN — it's there to serve Wikipedia itself). So the images broke. We then switched to the typographic tiles you're looking at now.

## Three real options

### Option A — Bundle official SVG logos locally (recommended)

Every org we cite publishes an official SVG or high-res PNG on their own site or press kit. We download them once, optimise, and ship them inside `src/assets/sources/` as part of our bundle. No external requests, no broken images, real brand colors.

What I'd pull and from where:

| Source | Asset source |
|---|---|
| NIH MedlinePlus | medlineplus.gov press materials (SVG) |
| Mayo Clinic | mayoclinic.org press kit |
| WHO | who.int/about/communications/branding |
| U.S. CDC | cdc.gov media resources (SVG) |
| USDA FoodData Central | usda.gov design system |
| WHO Africa | afro.who.int press kit |
| Africa CDC | africacdc.org media |
| FMOH Nigeria | health.gov.ng (PNG, will trace to SVG if low-res) |
| Nigerian Heart Foundation | nigerianheart.org |

**Trademark / fair-use note (important and honest):** these are registered marks. Nominative fair use lets us display them to identify whose guidelines we cite, **provided** we (a) don't imply endorsement, (b) link to the source, (c) keep the disclaimer we already show. We already do all three. This is the same legal posture every "as featured in" or "trusted sources" grid uses. Risk is low but non-zero — if any org ever asks us to remove their mark, we swap that one tile back to the typographic version. I'll keep the typographic `SourceLogo` as a fallback component for exactly that case.

### Option B — Real brand colors only, keep typographic tiles

Keep the current typographic tile, but tint each tile with that org's actual brand color (NIH navy, WHO blue, CDC blue, USDA green, etc.). Zero trademark surface area, more visual variety than today, no asset bundling. Looks better than now but not as recognisable as real logos.

### Option C — Hybrid (real where safe, typographic where not)

Real logos for clearly-public-domain US government marks (NIH, CDC, USDA — works of the US federal government are public domain by statute) and real logos for WHO/Africa CDC (their press kits explicitly grant non-commercial reuse with attribution). Typographic tiles for the rest. Lowest legal risk, still ~6 of 9 tiles get real logos.

## Recommendation

**Option A**, with the typographic component preserved as a per-source fallback. It looks the most professional, it's what users expect on a "trusted by" grid, and the legal posture is the standard one. If you'd rather be extra cautious, I'll do **Option C** instead — same code path, just fewer real logos.

## What I'll do once you pick

1. Fetch each official asset (SVG preferred, PNG fallback) from the org's own site using the website-fetch tool — no Wikimedia, no third-party CDNs.
2. Save under `src/assets/sources/<slug>.svg` so Vite fingerprints and serves them from our own origin.
3. Extend `TrustedSource` with an optional `logo` import. The render path becomes: `logo ? <img …> : <SourceLogo …>` — so the typographic tile auto-fills any source we can't get a real asset for.
4. Add `width`/`height` and `loading="lazy"` to every `<img>` to prevent layout shift, plus an `onError` that falls back to the typographic tile if a future asset 404s.
5. Match the existing greyscale-at-rest, color-on-hover behavior using `grayscale group-hover:grayscale-0` so the strip still reads as a calm "trusted by" row, not a noisy logo wall.
6. Keep the disclaimer block exactly as it is.

No changes to `TRUSTED_SOURCES` data shape beyond the optional `logo` field, no changes to `SourcesMethodologyPage` consumers, no new dependencies.

**Which option do you want — A (real logos everywhere), B (brand-colored typographic tiles), or C (hybrid)?**
