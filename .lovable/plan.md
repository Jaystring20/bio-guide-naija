## What's actually wrong (root cause)

I queried the database for your recent reports. Here's what I found on today's report (`26b0abc2…`, status `completed`):

```
preprocess        ok    0ms
setup             ok    834ms
biomarker_call    ok    20.7s   gemini-2.5-flash
pidgin_call       ok    17.4s   gemini-2.5-flash
diet_call         FAIL  62.4s   gemini-2.5-flash-lite   note="no function call"
total                   84.1s
```

So the diet/checklist generation **failed silently**: Gemini returned text instead of a function call, the edge function logged it, but never wrote anything to `dietary_plan` or `consultation_checklist`. The Diet and Doctor Q's tabs in `ResultReport.tsx` only show their "Cooking…" / "Preparing…" loader when those fields are `null` — and they stay `null` forever, so the loader spins forever.

Same pattern affects an older completed report (`45fa3f28…`, April 17): biomarkers present, diet + checklist `null` → loader forever.

## Plan — three connected pieces

### 1. Stop the infinite loaders (immediate UX fix)

In `src/pages/ResultReport.tsx`:

- Track diet/checklist generation as a real state, not "is the field null?". Use the `processing_steps` array we already store: if `diet_call` exists with `ok:false`, show a clear failure card with a **Regenerate diet & questions** button instead of the spinner.
- Stop polling for diet/checklist updates once `status === 'completed'` AND `diet_call` step has finished (success or fail). Right now we poll forever because we look only at `status`, but the user already saw "completed".
- For older reports without `processing_steps`, treat null diet on a completed-but-aged report (>5 minutes since `upload_date`) as "needs regeneration" and offer the same button.

### 2. Make the AI pipeline robust (server fix)

In `supabase/functions/interpret-lab/index.ts`:

- **Retry the diet call once** with `gemini-2.5-flash` (not -lite) when the first attempt returns "no function call". The failure pattern is consistent: `flash-lite` ignores the function-calling schema for diet plans. Lite is fine for biomarkers, not for the larger diet schema.
- **Persist partial progress incrementally** instead of one big update at the end: write biomarkers + summary as soon as they're ready, then diet, then pidgin. This way a later step failing doesn't leave the earlier results invisible.
- **Add a `regenerate-diet` edge function** (small, focused) that takes a `result_id`, reads the existing biomarkers, and re-runs only the diet + checklist generation. The "Regenerate" button from step 1 calls this.
- Record a `diet_status` field (`pending` | `done` | `failed`) on `lab_results` so the client doesn't have to interpret `processing_steps` to know the truth.

### 3. Begin the modular-monolith refactor (foundation work)

You asked for a modular monolith and PWA. Today the code is a flat React app: `src/pages/`, `src/components/`, one big `interpret-lab` function. We'll keep one deployable, but reorganise around **feature modules with clear boundaries**.

Target structure (introduced gradually, no big-bang rewrite):

```text
src/
  modules/
    auth/          contexts, hooks, pages
    onboarding/    pages, steps, schema
    upload/        UploadLab, image quality, retry logic
    report/        ResultReport, tabs, banners, PDF export
    diet/          diet plan rendering + regenerate hook
    family/        dependants
    feedback/      feedback sheet, inline prompts
    admin/         admin pages, role guards
  shared/
    ui/            shadcn components (current src/components/ui)
    lib/           utils, motion, critical-thresholds
    api/           thin wrappers around supabase calls per module
  app/
    AppShell, routes, providers, BottomNav

supabase/functions/
  interpret-lab/        orchestrates pipeline (slim)
  _shared/              gemini client, prompts, schemas, logging
  regenerate-diet/      new — diet-only retry
  preprocess-image/     (future) heavy image work off main path
```

Rules each module follows:
- Owns its UI, hooks, and a single `api.ts` that talks to Supabase. Pages outside the module import only from the module's `index.ts`.
- No cross-module imports of internal files; only public exports.
- Edge function shared logic (Gemini client, prompts, schemas) moves into `supabase/functions/_shared/` so `interpret-lab` and `regenerate-diet` reuse it.

For this first pass we will:
- Create the `src/modules/` and `supabase/functions/_shared/` folders.
- Move the **report module** (`ResultReport`, all `components/report/*`, the new regenerate hook) into `src/modules/report/` with a public `index.ts`. Update import paths.
- Move the **upload module** (`UploadLab`, `imageQuality`, `UploadPreviewOverlay`) into `src/modules/upload/`.
- Extract Gemini prompt building + function-calling schemas from `interpret-lab/index.ts` into `_shared/`.
- Leave other features in place; document them in `.lovable/plan.md` as the next migration targets so we can refactor module-by-module without breaking the app.

PWA piece (small, fits this pass):
- Add a `manifest.webmanifest` with VeriDIA brand colors and icons (we already have brand tokens in memory).
- Add a minimal service worker via `vite-plugin-pwa` for app-shell caching only — no offline writes yet, since lab uploads must stay online for compliance. This sets the foundation; deeper offline-first work stays scoped to a future task per your `connectivity-strategy` memory.

## Database changes

One migration:

```sql
ALTER TABLE public.lab_results
  ADD COLUMN IF NOT EXISTS diet_status text NOT NULL DEFAULT 'pending';
-- backfill existing rows: rows with dietary_plan present → 'done', else 'pending'
UPDATE public.lab_results
   SET diet_status = CASE WHEN dietary_plan IS NOT NULL THEN 'done' ELSE 'pending' END;
```

No RLS changes needed — column inherits existing policies.

## Files touched (high level)

- New: `supabase/functions/regenerate-diet/index.ts`, `supabase/functions/_shared/{gemini,prompts,schemas,logging}.ts`
- New: `src/modules/report/`, `src/modules/upload/`, `src/modules/report/hooks/useRegenerateDiet.ts`
- Edited: `supabase/functions/interpret-lab/index.ts` (retry logic, incremental writes, import from _shared)
- Edited: `src/pages/ResultReport.tsx` → moved into module; loader/failure UI rewritten
- Edited: `src/components/report/*` → relocated, imports updated
- Edited: `src/pages/UploadLab.tsx` → relocated, imports updated
- New: `public/manifest.webmanifest`, `vite.config.ts` (PWA plugin), small icon set
- Migration: add `diet_status` column

## What you will see when this is done

- The two stuck reports (today's and the April 17 one) get a **Regenerate diet & questions** button instead of an endless loader. One tap fills them in within ~30s.
- New uploads no longer get stuck — diet retries automatically with the stronger model, and any partial result is saved as it lands.
- The codebase is reorganised into `report/` and `upload/` modules with shared edge-function code, setting the pattern for migrating the rest feature-by-feature.
- The app is installable as a PWA on Android/iOS home screens with proper VeriDIA branding.

Approve to proceed, or tell me which piece to drop/expand.
