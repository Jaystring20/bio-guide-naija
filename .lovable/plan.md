## Goal

Turn the existing dependants infrastructure into a real **Family Plan**: one caregiver account, with a top-of-app **active profile switcher** that scopes Home, History, Trends, Upload, and Result reports to whichever family member is selected (the caregiver themselves, a Parent, a Child, etc.).

You already have most of the data layer (`dependants` table + `dependant_id` on `lab_results`). What's missing is a **single source of truth for "who am I currently looking at"**, a fast switcher in the UI, and a Family hub. This plan adds those.

---

## What it looks like

```text
┌─────────────────────────────────────┐
│  [Avatar▼ Mama Ngozi · Parent]   ⚙ │ ← Active Profile pill (sticky, top)
├─────────────────────────────────────┤
│  Good evening, Tunde 👋             │  ← Caregiver greeting (always own name)
│  Viewing: Mama Ngozi (Parent, 62)   │
│                                      │
│  [ Upload lab result for Mama ]      │  ← CTA scoped to active profile
│  [ Latest result · 12 Sep ]          │  ← Mama's latest, not yours
│                                      │
│  Family ───────────────────────      │
│  ● Tunde (You)        2 results      │
│  ● Mama Ngozi · Parent 5 results     │
│  ● Tobi · Child        1 result      │
│  + Add family member                 │
└─────────────────────────────────────┘
```

Tapping the pill at the top opens a sheet with all family members; selecting one instantly re-scopes the entire app.

---

## What changes

### 1. New: `ActiveProfileContext` (`src/contexts/ActiveProfileContext.tsx`)
- Holds `activeProfileId` (string | null — `null` means the caregiver themselves).
- Persists to `localStorage` under `veridia.activeProfileId` so it survives reload.
- Exposes: `activeProfileId`, `activeProfile` (resolved object: either own profile or a dependant), `activeName`, `isSelf`, `setActiveProfileId(id|null)`.
- Provider wraps the protected app inside `App.tsx`.

### 2. New: `ProfileSwitcher` component (`src/components/ProfileSwitcher.tsx`)
- Sticky pill at the top of every in-app page (rendered inside `AppShell`).
- Shows active avatar + name + relationship badge + chevron.
- Tap opens a bottom **Sheet** listing: "You" (self) + every dependant with avatar, relationship pill, and result count. A "+ Add family member" row at the bottom opens `AddDependantDialog` with a Family-Plan emphasis (relationship locked default to Parent or Child suggestions).
- Selection updates `ActiveProfileContext` and closes the sheet. Toast: "Now viewing Mama Ngozi".

### 3. New: `FamilyHub` page (`src/pages/Family.tsx`, route `/family`)
- Caregiver dashboard: each family member as a rich card showing avatar, relationship, age, last result date, # results, # flagged biomarkers. Tap card → makes them active and routes to `/history`.
- Quick actions per card: "Upload" (sets active + → /upload), "View history" (sets active + → /history), "Edit", "Remove".
- "+ Add family member" tile opens `AddDependantDialog`. The dialog gets a small Family-Plan refresh: relationship presets reordered to **Parent, Child, Spouse**, with helper copy ("Add a family member you care for").

### 4. Wire existing pages to `ActiveProfileContext` (replaces local filter state)
- **`Index.tsx` (Home)**: caregiver name in greeting, but "Latest result", "Upload CTA copy", and stats reflect the active profile. Add "Viewing: X" line under greeting when `!isSelf`.
- **`UploadLab.tsx`**: remove the local `selectedPerson` state — derive from context. Keep the segmented person row but pre-select active. Lab insert continues to set `dependant_id` from active.
- **`History.tsx`**: remove local `personFilter`. Filter results by active profile. The segmented control is replaced by a single "Viewing: X" header with a "Switch" button (opens the same switcher sheet); the switcher is the single way to change scope.
- **`Trends.tsx`**: same — driven by context, not URL param. Keep `?person=` deep-link by writing it into context on mount (back-compat).
- **`ResultReport.tsx`**: when opening a result whose `dependant_id` differs from active, automatically switch active to match (so back-navigation lands in the right person's history). Show a subtle "Result for Mama Ngozi" pill at the top.

### 5. Bottom nav addition
- Add a new **Family** tab to `BottomNav` (icon: `Users`), placed between "History" and "Trends". The current 5 tabs stay; this becomes 6. Keep "Upload" as the prominent center action.

### 6. Profile page touch-up
- The "People I Manage" section becomes a slim summary card linking to **Family hub** ("Manage family →"). Avoids duplicating the family list in two places.

### 7. Onboarding nudge (small)
- After completing onboarding, if `user_role === "caregiver"` (already a value), navigate to `/family` first instead of `/` and show a one-time "Add your first family member" empty state on the Family hub. No DB change needed.

---

## What stays the same

- **No schema changes.** `dependants` and `lab_results.dependant_id` already model exactly this.
- **No new RLS policies.** Existing policies (caregiver owns all dependants and all lab_results) keep family data private.
- **No new edge function calls.** `interpret-lab` already accepts the row id.
- All existing routes keep working; deep links to `/result/:id` and `/trends?person=…` keep working.

---

## Files

**New**
- `src/contexts/ActiveProfileContext.tsx`
- `src/components/ProfileSwitcher.tsx`
- `src/pages/Family.tsx`

**Edited**
- `src/App.tsx` — wrap protected routes in `ActiveProfileProvider`; register `/family` route
- `src/components/AppShell.tsx` — render `ProfileSwitcher` at the top
- `src/components/BottomNav.tsx` — add Family tab
- `src/components/AddDependantDialog.tsx` — small copy/preset tweaks for Family Plan
- `src/pages/Index.tsx` — "Viewing X", scope CTA + latest result to active
- `src/pages/UploadLab.tsx` — derive person from context
- `src/pages/History.tsx` — derive filter from context, replace filter row with switch header
- `src/pages/Trends.tsx` — derive person from context, sync deep-link param
- `src/pages/ResultReport.tsx` — auto-set active from result's `dependant_id`, add "Result for X" pill
- `src/pages/Profile.tsx` — replace dependants section with summary link to `/family`

**Unchanged**
- Database schema, RLS, edge functions, auth.

---

## Notes / open question

- Bottom nav goes from 5 → 6 tabs on a 428px viewport. It will still fit (icons + 11px labels, ~57px per tab), but one item gets tighter. If you'd rather **swap** something out (e.g. move "Trends" inside the Family hub since trends are inherently per-person), say the word and I'll do that instead of adding a 6th tab.
