# Routing Restructure — Marketing site at `/`, app at `/app`

Goal: When a visitor lands on `getveridia.app`, they see the marketing page directly (no `/landing` in the URL). Sign-in lives at `/auth`. The signed-in product lives under `/app/*`. This matches the convention used by Linear, Notion, Vercel, etc.

## New URL map

| URL | What it shows |
|---|---|
| `/` | Public Landing (marketing) — auto-redirects to `/app` if already signed in |
| `/auth` | Sign in / sign up |
| `/onboarding` | First-time profile setup (after sign-up) |
| `/app` | Authenticated home (current `Index`) |
| `/app/upload` | Upload lab |
| `/app/result/:id` | Result report |
| `/app/history` | History |
| `/app/trends` | Trends |
| `/app/bulk-upload` | Bulk upload |
| `/app/family` | Family |
| `/app/profile` | Profile |

## Back-compatibility redirects (so old links/bookmarks keep working)

- `/landing` → `/`
- `/upload` → `/app/upload`
- `/result/:id` → `/app/result/:id`
- `/history` → `/app/history`
- `/trends` → `/app/trends`
- `/bulk-upload` → `/app/bulk-upload`
- `/family` → `/app/family`
- `/profile` → `/app/profile`

## Auth flow (the "ideal process")

```text
Visitor at /  ──►  clicks "Get Started"  ──►  /auth
                                                │
                          ┌─────────────────────┴─────────────────────┐
                          ▼                                           ▼
              new account, no profile yet              existing account
                          │                                           │
                          ▼                                           ▼
                    /onboarding ──── completes ────►            /app (home)
```

- `ProtectedRoute` (any `/app/*` route): if not signed in → `/` (marketing). If signed in but onboarding incomplete → `/onboarding`.
- `PublicLanding` wrapper on `/`: if already signed in → `/app` (so returning users skip the marketing page).
- `Auth` page: on success → `/app` (or `/onboarding` via the ProtectedRoute guard).
- `Onboarding`: on success → `/app`.

## Files to edit

1. **`src/App.tsx`** — Restructure `<Routes>`:
   - Make `/` render `Landing` (wrapped in a `PublicLanding` guard that redirects authed users to `/app`).
   - Move all protected routes under a `path="/app"` parent with `index` for home.
   - Add the back-compat redirects listed above.
   - Update `ProtectedRoute` fallback from `/landing` to `/`.

2. **`src/pages/Auth.tsx`** — `navigate("/")` → `navigate("/app")` after successful sign-in.

3. **`src/pages/Onboarding.tsx`** — `navigate("/")` → `navigate("/app")` after onboarding completes.

4. **`src/pages/Landing.tsx`** — `goAuth` already points to `/auth`; no change needed. Keep "Get Started" → `/auth`.

5. **`src/pages/Index.tsx`** — Update internal `navigate()` calls:
   - `/profile` → `/app/profile`
   - `/upload` → `/app/upload`
   - `/family` → `/app/family`
   - `/history` → `/app/history`
   - `/trends` → `/app/trends`

6. **`src/pages/UploadLab.tsx`** — `/bulk-upload` → `/app/bulk-upload`.

7. **`src/pages/Trends.tsx`** — `/history` → `/app/history`, `/upload` → `/app/upload`.

8. **`src/pages/ResultReport.tsx`** — `/` → `/app`, `/upload` → `/app/upload`.

9. **`src/pages/History.tsx`** — `/upload` → `/app/upload`.

10. **`src/pages/BulkUpload.tsx`** — `/upload` → `/app/upload`, `/history` → `/app/history`.

11. **`src/pages/Profile.tsx`** — `/auth` stays as is (sign-out leaves the app).

12. **`src/components/BottomNav.tsx`** — Update the 4 nav paths:
    - `/history` → `/app/history`
    - `/upload` → `/app/upload`
    - `/family` → `/app/family`
    - `/profile` → `/app/profile`
    - Also: the active-state matcher needs to handle the home tab matching `/app` exactly.

## Notes

- Hosting: Lovable's SPA fallback already serves `index.html` for any unknown path, so deep links like `/app/result/abc` will work on refresh. No `_redirects` or hosting config needed.
- After approval, the "report generation" work the user mentioned will follow as a separate task — this PR is scoped to routing only.
