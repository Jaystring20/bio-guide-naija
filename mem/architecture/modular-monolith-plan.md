---
name: Modular monolith refactor plan
description: Target structure for migrating VeriDIA into feature modules — current state of work, ordering, and rules.
type: feature
---
Reorganise `src/` and `supabase/functions/` into feature modules with clear boundaries while keeping a single deployable.

## Target structure

```
src/
  modules/
    auth/            contexts, hooks, Auth page
    onboarding/      pages, steps, schemas
    upload/          UploadLab, image quality, retry logic, preview overlay
    report/          ResultReport, tabs, banners, PDFExport, useRegenerateDiet
    diet/            diet rendering + regenerate UI (split from report when it grows)
    family/          dependants
    feedback/        feedback sheet, inline prompts, button
    admin/           admin pages, AdminRoute, role guards
  shared/
    ui/              shadcn (current src/components/ui)
    lib/             utils, motion, critical-thresholds, imageQuality
    api/             thin per-module wrappers around supabase calls
  app/
    AppShell, routes, providers, BottomNav, ProfileSwitcher

supabase/functions/
  _shared/           gemini client, prompts, schemas (DIET_TOOL etc.), logging
  interpret-lab/     orchestrates pipeline, imports from _shared
  regenerate-diet/   diet-only retry, imports from _shared
```

## Module rules
- Each module owns its UI, hooks, and a single `api.ts` that talks to Supabase.
- Outside code imports only from the module's `index.ts` — no cross-module deep imports.
- `_shared/` in edge functions holds Gemini schemas + helpers reused by `interpret-lab` and `regenerate-diet`.

## Migration order (do one module per PR; never big-bang)
1. report/ — biggest payoff; all the report tabs, PDF export, regenerate hook, EmptyBiomarkersBanner.
2. upload/ — UploadLab + imageQuality + UploadPreviewOverlay.
3. Extract Gemini diet/pidgin schemas into `supabase/functions/_shared/schemas.ts` (currently duplicated between interpret-lab and regenerate-diet).
4. feedback/ — FeedbackSheet, FeedbackButton, InlineRatingPrompt, useFeedback.
5. admin/ — AdminDashboard, ControlRoom, AdminRoute, AdminLogin, useUserRole.
6. family/ — Family, AddDependantDialog, useDependants, ProfileSwitcher.
7. onboarding/ + auth/ last (they're stable, lowest risk-of-change).

## Status
- Diet-status migration shipped (2026-04-29).
- `regenerate-diet` edge function created.
- Module reorganisation NOT YET STARTED — code still lives at flat `src/components/`, `src/pages/`, `src/hooks/`. Refactor begins on next dedicated request to keep the active product fix decoupled from the directory churn.

## PWA companion track
- Manifest-only PWA (installable, no service worker) — defer until requested. Per Lovable PWA guidance, service workers cause issues in the editor preview iframe; manifest gives Add-to-Home-Screen support without that risk.
