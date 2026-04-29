## Problem 1 — Why your previous results don't show up

Your results are still in the database (I checked: 42 results across 8 users, including 4 of yours). They're hidden by **two bugs**, not lost:

**Bug A — The History page filter is too strict.**
History only shows results matching the **active profile pill** at the top.
- If "Self" is selected, only results with `dependant_id = null` show.
- If a dependant pill is selected, only results for that dependant show.
- Result: switching profiles makes other results "disappear" even though they still exist.

**Bug B — Stale active-profile selection in localStorage.**
The active profile is remembered across sessions in `localStorage`. If you previously selected a dependant, the History page silently filters out your own results on next login until you tap "Self".

**Bug C — Broken "Latest result" link on Home.**
`src/pages/Index.tsx` navigates to `/result/${id}`. The legacy redirect rule in `App.tsx` is `/result/:id → /app/result/:id` — React Router does **not** substitute `:id` in `<Navigate to>`, so the link 404s or lands on a literal `:id` route.

### Fix
1. Add a new "**All profiles**" option to the History page (and to `useProfileStats`) that ignores the active-profile filter and lists every result for the signed-in user — your own + all dependants — with a "for: You / Dad / Mum" badge per row. Default the History view to "All profiles" so nothing is ever hidden by accident.
2. Keep the per-profile pill as a quick filter, but never as the default.
3. Change the Home "Latest result" link from `/result/${id}` to `/app/result/${id}`. Sweep the codebase for any remaining `/result/`, `/history`, etc. that bypass the `/app` prefix.

---

## Problem 2 — Super Admin dashboard

A read-only admin area at `/app/admin` for you to monitor the whole product.

### What it shows

**Overview cards**
- Total accounts (profiles) · Total dependants · Total lab results
- Results in last 7 / 30 days
- Critical alerts raised (all-time + last 30 days)
- Failed uploads (last 30 days) — your reliability signal
- Avg. results per active user

**Activity chart** — daily uploads for last 30 days (line chart, recharts already in stack).

**Recent uploads table** (last 50)
- Date · User (name + email) · Status (completed / processing / failed / critical) · Critical flag · Open report

**Users table**
- Name · Email · Joined · # results · # dependants · Last activity
- Search by name/email
- Click → drawer with that user's full result history

**Failure log** — list of `status='failed'` results so you can see what's breaking interpretation.

### Security model (this is the important part)

Roles **must** live in a separate `user_roles` table, never on `profiles` (storing roles on profiles is a known privilege-escalation pattern).

```text
auth.users ──┐
             ├── profiles (one-to-one)
             ├── user_roles (user_id, role)  ← NEW
             └── lab_results, dependants
```

- New enum `app_role` with values `admin`, `user`.
- New `user_roles` table with RLS: users can read their own row; only admins can insert/update.
- Security-definer function `has_role(_user_id uuid, _role app_role)` to avoid recursive RLS.
- New RLS policies (additive — existing user-scoped policies stay):
  - `lab_results`: admins can SELECT all rows.
  - `profiles`: admins can SELECT all rows.
  - `dependants`: admins can SELECT all rows.
- Frontend `useUserRole()` hook + `<AdminRoute>` guard. `/app/admin` returns to `/app` for non-admins. The "Admin" link in the bottom nav / profile menu is hidden unless `role === 'admin'`.
- I'll seed your account (`8a559b6c-66a8-42c4-93d4-1c35a4f4a4cd`, the one with the most uploads) as the first admin via the migration. Tell me if a different email is yours and I'll switch it.

### Reading user emails

Emails live in `auth.users`, not `profiles`. The admin dashboard needs them, so I'll add a `SECURITY DEFINER` RPC `admin_list_users()` that joins `auth.users` with `profiles` and aggregates counts — only callable when `has_role(auth.uid(), 'admin')`. This avoids exposing `auth.users` to the client.

---

## Problem 3 — Tracking product performance

Two layers, both free:

1. **In-app admin metrics** (above) — gives you *product* signal: uploads/day, failure rate, critical-alert rate, retention (active users in last 7/30 days).
2. **Lovable Analytics** — already built into your project. I'll add a short note in the admin page linking to it for traffic/page-view stats so you don't conflate the two.

Optional later (not in this plan unless you say so): wire a lightweight event log table (`analytics_events`) to track funnel steps like `upload_started`, `upload_succeeded`, `report_viewed`, `pdf_exported` so you can compute conversion rates.

---

## Files to change / add

**Database migration**
- Create enum `app_role`, table `user_roles`, function `has_role`, function `admin_list_users`.
- Add admin SELECT policies on `lab_results`, `profiles`, `dependants`.
- Insert one row into `user_roles` for the seed admin.

**Frontend**
- `src/hooks/useUserRole.ts` — new
- `src/components/AdminRoute.tsx` — new guard
- `src/pages/admin/AdminDashboard.tsx` — overview + chart
- `src/pages/admin/AdminUsers.tsx` — users table + drawer
- `src/pages/admin/AdminResults.tsx` — recent uploads + failures
- `src/App.tsx` — register `/app/admin`, `/app/admin/users`, `/app/admin/results`
- `src/components/BottomNav.tsx` (or Profile menu) — conditional "Admin" entry
- `src/pages/History.tsx` + `src/hooks/useProfileStats.ts` — add "All profiles" mode, default to it
- `src/pages/Index.tsx` — fix `/result/${id}` → `/app/result/${id}`
- Sweep for any remaining non-`/app` internal links

**No edge function needed.** All admin reads go through RLS + the one definer RPC.

---

## What I need from you before building

Just confirm: **is `dapomatthews@…` (or whichever email) yours?** I'll seed that account as admin. If you can't tell me, I'll seed the user_id with the most uploads (currently `8a559b6c-…`) and you can hand the role over later from the admin UI.
