# Feedback button placement + post-result feedback prompts

## Problems

1. **FAB blocks UI on mobile.** `FeedbackButton` is pinned at `right-4 bottom-24`. On `/app/result/:id` and `/app/bulk-upload`, fixed action bars sit at `bottom-20` → the round Feedback pill overlaps "Download PDF / Share" buttons and the bulk-upload CTA.
2. **Feedback is passive.** Users only give feedback if they tap the FAB. We already have `InlineRatingPrompt` on the result page (1‑tap stars), but no follow-up: no auto-opened deep feedback sheet, and no email asking for feedback after they've had time to use the report.

---

## Plan

### 1. Reposition the floating Feedback button

Edit `src/components/feedback/FeedbackButton.tsx`:

- Shrink to a 44px **icon-only circle** on mobile (`sm:` keeps the labelled pill on desktop).
- Move higher so it never sits in the action-bar zone: `bottom-28` baseline, and bump to `bottom-44` on routes that render a fixed action bar (Result report, Bulk upload).
- Add those routes to a new `LIFTED_PREFIXES` list so the button auto-lifts (uses `useLocation` — no per-page wiring).
- Keep existing `HIDDEN_PREFIXES` (admin, auth, onboarding) behaviour.

Result: on mobile the FAB is a small green circle tucked above the bottom nav, never on top of the Download/Share row.

### 2. Auto-open the full feedback sheet after a result is viewed

New component `src/components/feedback/PostResultFeedbackPrompt.tsx`:

- Mounted from `ResultReport.tsx` only when `result.status === "completed"` and viewer is the owner (not admin).
- Waits **45 seconds** of dwell on the page, then opens `FeedbackSheet` once (uses the existing `wasPromptShownRecently` / `markPromptDismissedForever` cooldown helpers under key `post-result-deep-v1`, scoped per `result.id` so each new report can re-prompt).
- Pre-fills `defaultCategory="suggestion"`, `resultId={id}`, and a context note "Just read a report".
- Suppressed if the user already submitted any feedback for this `result_id` (cheap `useQuery` count) so we don't nag.

This complements the existing 1-tap `InlineRatingPrompt` — stars first, deeper sheet later.

### 3. Email people to ask for feedback

**New transactional template** `supabase/functions/_shared/transactional-email-templates/feedback-request.tsx`
- VeriDIA-branded (Clinical Navy heading, Vital Green CTA).
- Two variants via prop `variant: "post_result" | "post_signup"`:
  - `post_result`: "How was your VeriDIA report? Tap to share 1 quick thought." CTA → `https://getveridia.app/app/result/{id}?fb=1`.
  - `post_signup`: For users who signed up but never uploaded — "What's stopping you from trying your first report?" CTA → `https://getveridia.app/app?fb=1`.
- Add to `registry.ts`.

**New Edge Function** `supabase/functions/dispatch-feedback-emails/index.ts`
- Service-role; runs on a `pg_cron` schedule every hour.
- Two queries:
  1. `lab_results` where `status='completed'` AND `upload_date` between **24h and 72h ago** AND user has **no feedback row** AND no prior `feedback_email_sent_at` on that result.
  2. `auth.users` joined to `profiles` where account is **3+ days old**, no `lab_results`, no feedback row, and no prior `feedback_signup_email_sent_at` on profile.
- For each match: invoke `send-transactional-email` with template `feedback-request`, idempotency key `fb-${variant}-${id}`, then stamp the new column to prevent re-sends.

**Migration** (single SQL file):
- `ALTER TABLE lab_results ADD COLUMN feedback_email_sent_at timestamptz;`
- `ALTER TABLE profiles ADD COLUMN feedback_signup_email_sent_at timestamptz;`
- Schedule the cron job (hourly) calling `dispatch-feedback-emails` via the same vault-secret pattern used for `process-email-queue`.

**Front-end glue:** when `?fb=1` is present in the URL on `/app/result/:id` or `/app`, auto-open `FeedbackSheet` immediately (bypasses dwell timer, bypasses cooldown). One small `useEffect` in `ResultReport.tsx` and `Index.tsx`.

### 4. No new UI surface for users — uses existing FeedbackSheet

All prompts route through the existing branded `FeedbackSheet` so styling/analytics stay consistent.

---

## Files

**New**
- `src/components/feedback/PostResultFeedbackPrompt.tsx`
- `supabase/functions/_shared/transactional-email-templates/feedback-request.tsx`
- `supabase/functions/dispatch-feedback-emails/index.ts`
- `supabase/functions/dispatch-feedback-emails/deno.json`
- `supabase/migrations/<ts>_feedback_email_dispatch.sql`

**Edited**
- `src/components/feedback/FeedbackButton.tsx` — responsive sizing + lifted positioning.
- `src/pages/ResultReport.tsx` — mount `PostResultFeedbackPrompt`, handle `?fb=1`.
- `src/pages/Index.tsx` — handle `?fb=1` to open feedback sheet.
- `supabase/functions/_shared/transactional-email-templates/registry.ts` — register new template.

## Deploy

After writing files: deploy `dispatch-feedback-emails` and `send-transactional-email` (template registry change requires redeploy).

## Notes / assumptions

- Hourly cron is enough; emails go out 24–72 h after a completed report — gives users time to read it but stays fresh.
- Each user gets at most **one** feedback email per result, and at most **one** signup-nudge email ever.
- Suppression list and unsubscribe footer are already enforced by `send-transactional-email`, so users who unsubscribed won't be nudged.
- 45 s dwell timer for the in-app prompt is conservative; we can tune later from analytics.
