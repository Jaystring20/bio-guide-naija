
# Rebrand: BioGuide → VeriDIA

Your message was cut off after "most importantly the…". I'll proceed with a full rebrand pass and call out the one thing I'm assuming below — tell me if it's wrong and I'll adjust before/after building.

Brand name spelling per your Brand Identity PDF + logo: **VeriDIA** (lowercase `Veri`, uppercase `DIA`). I'll use this exact casing everywhere user-visible.

## 1. Text replacements — every "BioGuide" → "VeriDIA"

Found 27 occurrences across 11 files. All will be updated:

| File | What changes |
|---|---|
| `index.html` | `<title>`, meta description, og:title, og:description, twitter:title, twitter:description |
| `src/pages/Landing.tsx` | Header logo text, hero subhead, 2 testimonial quotes, CTA copy, footer brand, footer disclaimer, copyright |
| `src/pages/Auth.tsx` | Brand heading on login/signup screen |
| `src/pages/Onboarding.tsx` | "Welcome to VeriDIA", "How will you use VeriDIA?" |
| `src/pages/Index.tsx` | Footer disclaimer line |
| `src/pages/Profile.tsx` | Disclaimer paragraph |
| `src/components/report/SummaryTab.tsx` | Share text + share title |
| `src/components/report/ChecklistTab.tsx` | Share text header + signature |
| `src/components/report/PDFExport.tsx` | PDF header, footer signature, share title/text, email subject/body, file name (`VeriDIA-Report-...pdf`), update share URL from `bio-guide-naija.lovable.app` → `getveridia.app` |
| `src/index.css` | Brand-colors comment header |
| `supabase/functions/interpret-lab/index.ts` | 2 system-prompt strings ("You are VeriDIA's Lab Interpretation Engine…" / "…Nigerian Nutritional Intelligence Engine") |

## 2. Logo asset

Install your uploaded logo as the brand mark:

- Copy `user-uploads://IMG_4140.PNG` → `src/assets/veridia-logo.png` (clean wordmark+icon — works on light bg)
- Replace the plain text "VeriDIA" wordmark in:
  - `Landing.tsx` header (top-left nav)
  - `Landing.tsx` footer
  - `Auth.tsx` (above the form)
  - `Onboarding.tsx` welcome screen
- Keep text fallback alongside `<img alt="VeriDIA">` for accessibility

If you want me to also use it as the **favicon** and **PWA icon** (`public/favicon.ico`, og:image), say yes — otherwise I'll leave the current favicon alone.

## 3. Color palette — apply official VeriDIA colors

Update `src/index.css` HSL tokens to the brand palette from your Brand Identity doc:

- `--primary` → Vital Green `#2ECC71`
- `--secondary` / accent → Clinical Navy `#1C3B70`
- `--success` → Forest Verification `#27AE60`
- `--destructive` → Emergency Red `#C0392B`
- `--warning` → Alert Amber `#F39C12`
- Pale tints (`--muted`, soft backgrounds) → Vital Pale `#EAFAF1` / Clinical Pale `#EBF0F8`

Will be applied to both light and (where relevant) dark variants, all converted to the HSL format Tailwind expects.

## 4. Memory update

Update `mem://index.md` Core line from "BioGuide:" to "VeriDIA:" so future sessions use the right brand name.

## What I'm NOT touching (unless you say so)

- DB table/column names, edge function file names, Supabase project ref — internal-only, safe to keep
- `bun.lock`, `package.json` `name` field — not user-visible
- Custom domain — `getveridia.app` is already configured

## Open question (because your message was cut off)

Your sentence ended with "and most importantly the…". My best guess is one of:

1. **The logo** — make sure the actual VeriDIA mark replaces the text wordmark (covered above)
2. **The colors** — apply the brand palette (covered above)
3. **The PDF report header** — make sure exported PDFs are branded VeriDIA (covered above)
4. Something else entirely

I'll proceed assuming you meant **all three** (logo + colors + PDF). If you actually meant something different (e.g. typography swap to DM Serif Display + DM Sans + IBM Plex Mono per your brand doc, or favicon/PWA icon), reply with that detail when you approve and I'll fold it in.
