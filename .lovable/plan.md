# Super Admin login, admin result access fix, and MVP feedback system

Three coordinated changes:

1. A dedicated Super Admin login screen at `/admin-login` with strict role verification before allowing access.
2. Fix the bug where the control room can't open user lab results (admin viewer mode).
3. Add a professional, engaging in-app feedback system to power the MVP testing push.

---

## 1. Dedicated Super Admin login (`/admin-login`)

**New page: `src/pages/AdminLogin.tsx`**
- Distinct visual identity from the consumer Auth page: dark Clinical Navy background, "VeriDIA Control Room" wordmark, shield icon, "Super Admin Access" heading, and a small "Authorized personnel only" notice.
- Email + password form only (no signup, no Google for this entry point — admins are provisioned, not self-registered).
- Submit flow:
  1. `supabase.auth.signInWithPassword(...)`
  2. On success, query `user_roles` for `role = 'admin'` for the returned user id.
  3. If admin → toast "Welcome back, admin" and `navigate("/app/admin")`.
  4. If NOT admin → immediately `supabase.auth.signOut()`, show clear error "This account does not have Super Admin privileges", and stay on the page. This prevents non-admins from getting an authenticated session via this entry point.
- A small "Back to app login" link to `/auth` for accidental visits.

**Routing changes (`src/App.tsx`)**
- Add public route: `<Route path="/admin-login" element={<AdminLogin />} />`.
- Keep `/app/admin` protected by existing `AdminRoute` (defense in depth).

**Why two checks (login screen + AdminRoute):**
- `/admin-login` enforces role at the entry point so non-admins never even land on the dashboard with a session.
- `AdminRoute` continues to guard the route itself for users who navigate directly while authenticated.

---

## 2. Fix: Control room can't open user results

**Root cause:** RLS already lets admins read all `lab_results` rows (policy "Admins can view all lab results"), and `admin_recent_results` returns them in the Results tab. But when an admin clicks **Open**, `ResultReport.tsx` queries with both `.eq("id", id)` AND `.eq("user_id", user.id)`, so the row is filtered out client-side for any result not owned by the admin.

**Fix in `src/pages/ResultReport.tsx`:**
- Detect admin via the existing `useUserRole()` hook.
- Drop the `.eq("user_id", user.id)` filter when `isAdmin` is true (RLS still protects non-admins server-side).
- Add a small "Admin viewing" banner at the top of the report when the result's `user_id !== currentUser.id`, with the patient's name/email (already returned by `admin_recent_results`, can be passed via navigation state or refetched via a tiny RPC). Simplest: add an `admin_get_result_owner(_result_id)` security-definer RPC that returns name/email for admins only.
- Disable any "edit/regenerate" actions in admin-viewer mode (read-only).

**Same fix applied to other per-result fetches** if any exist (Trends, BiomarkersTab, etc. — verified during implementation by ripgrepping `from("lab_results")`).

---

## 3. MVP feedback system — engaging, professional, low-friction

Goal: collect honest, actionable feedback during the MVP push without disrupting the core flow.

### Database (new migration)
- `feedback` table:
  - `id uuid pk`, `user_id uuid` (nullable to allow anon if ever needed, but defaulted to `auth.uid()`),
  - `category text` (enum-like via check: `bug | suggestion | praise | confusion | feature_request | other`),
  - `rating smallint` (1–5, optional — nullable),
  - `nps smallint` (0–10, optional — only set when prompted),
  - `message text not null`,
  - `screen text` (auto-captured pathname),
  - `result_id uuid` (nullable — links feedback to a specific lab report when given from the result page),
  - `device_info jsonb` (UA, viewport, online/offline, app version),
  - `status text default 'new'` (`new | reviewed | actioned | wont_fix`),
  - `admin_notes text`,
  - `created_at timestamptz default now()`.
- RLS:
  - Users INSERT their own (`auth.uid() = user_id`) and SELECT their own.
  - Admins SELECT all + UPDATE status/admin_notes (`has_role(auth.uid(),'admin')`).
- Add metric to `admin_overview_metrics`: `feedback_total`, `feedback_7d`, `avg_rating_30d`, `nps_30d`.

### UI surfaces

**A. Floating "Send feedback" button (global, in `AppShell`)**
- Small pill in the bottom-right above `BottomNav`: shield-free, Vital Green outline, label "Feedback".
- Opens a slide-up sheet (`Drawer` on mobile, `Dialog` on desktop):
  - Category chips (Bug, Suggestion, Praise, Confusion, Feature, Other) with icons.
  - 5-star rating (optional, animated on hover/tap).
  - Free-text textarea with placeholder "Tell us what worked or what tripped you up — even one sentence helps".
  - Auto-attached context badges shown to the user for transparency: "Screen: /app/upload", "Device: iPhone Safari".
  - Submit button: "Send feedback" with success state (confetti micro-burst already available via `Confetti.tsx`, then "Thanks — your voice shapes VeriDIA" with a personal sign-off).

**B. Contextual prompts (the engaging part)**
- **After first successful result** (in `ResultReport.tsx`): a one-time inline card "How was your first VeriDIA report?" with a 5-star inline rating + 1-line text box. Persisted via `localStorage` so it never re-appears for that user.
- **After 3 results uploaded**: a one-time NPS prompt "How likely are you to recommend VeriDIA to a friend or family member?" 0–10 slider. Stored as `nps`.
- **After a failed upload**: a softer prompt "Sorry that didn't work — what happened?" pre-selecting the Bug category and pre-filling `result_id`.

All prompts are dismissible, never block the UI, and respect a 24h cooldown between automatic prompts.

**C. Public testers landing strip on `/app` (Index.tsx)**
- Small "MVP Tester" banner with two CTAs: "Share feedback" and "Join the tester WhatsApp group" (link configurable later).
- Removes itself once the user submits any feedback.

### Admin tools

**New "Feedback" tab in `AdminDashboard.tsx`**
- KPIs: Total, last 7 days, average rating (30d), NPS (30d), unresolved bug count.
- Filters: category, status, has rating, date range.
- Table: date, user (name + email), category badge, rating, snippet of message, screen, status. Click row → side panel with full message, device info, link to the related result (when applicable), status dropdown (`new → reviewed → actioned → wont_fix`) and admin notes textarea.
- CSV export (matches existing CSV pattern).

### Why this works for the MVP push
- One always-available channel (floating button) for power users.
- Three high-signal contextual prompts that fire exactly when a tester just experienced something.
- Built-in NPS so we can quote a real number when pitching.
- Admin triage workflow (status + notes) so feedback turns into action, not a graveyard.
- Auto-captured screen + device removes friction and improves bug repro.

---

## Technical / file map

- New: `src/pages/AdminLogin.tsx`
- New: `src/components/feedback/FeedbackButton.tsx` (floating launcher)
- New: `src/components/feedback/FeedbackSheet.tsx` (form sheet/dialog)
- New: `src/components/feedback/InlineRatingPrompt.tsx` (post-result + NPS variants)
- New: `src/hooks/useFeedback.ts` (submit, prompt cooldown, "has submitted" check)
- New: `src/pages/admin/AdminFeedbackTab.tsx` (or inline in `AdminDashboard.tsx`)
- New migration: `feedback` table + RLS + extend `admin_overview_metrics` + new `admin_get_result_owner` RPC
- Edit: `src/App.tsx` — add `/admin-login` route
- Edit: `src/components/AppShell.tsx` — mount `FeedbackButton`
- Edit: `src/pages/ResultReport.tsx` — admin-aware fetch + admin viewer banner + post-result inline prompt
- Edit: `src/pages/UploadLab.tsx` — failure-path feedback prompt
- Edit: `src/pages/Index.tsx` — tester banner
- Edit: `src/pages/admin/AdminDashboard.tsx` — Feedback tab + extended metrics

## Out of scope (can follow up)
- Email notifications to admins on new critical feedback.
- Public changelog page showing "you asked, we shipped".
- Tester invite codes / closed beta gating.
