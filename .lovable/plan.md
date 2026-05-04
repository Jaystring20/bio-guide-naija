## Goal

Make signup verification, password reset, and magic-link emails:
1. Send from your real brand domain (`notify.getveridia.app`) instead of the leftover `notify.mandheyewear.com`.
2. Look like VeriDIA — green Vital Green CTA, Clinical Navy headings, friendly Nigerian-aware copy, logo, and a clear "Verify my account" button.
3. Be reliable (queued + retried, not lost on transient failures).

## Steps

### 1. Provision `notify.getveridia.app` as the email sender domain

Open the email-domain setup dialog so a new sender subdomain (`notify.getveridia.app`) can be added to your `getveridia.app` domain. Lovable will:
- Add NS records for `notify.getveridia.app` pointing to `ns3.lovable.cloud` / `ns4.lovable.cloud`.
- Auto-provision SPF, DKIM, MX records for high deliverability.
- Verify DNS in the background (usually minutes, can be up to 72h).

You only need to click "Set up email domain" in the dialog — DNS records are created automatically because `getveridia.app` is already managed through Lovable.

### 2. Retire the old `notify.mandheyewear.com` sender

Once the new domain is selected as the project's email domain, the old one stops being used by VeriDIA automatically. The NS records on `mandheyewear.com` itself can be cleaned up later by whoever owns that domain — it doesn't block VeriDIA from sending.

### 3. Scaffold branded VeriDIA auth email templates

Generate the 6 standard auth email templates and the `auth-email-hook` edge function, then style them to match VeriDIA:

- **Background:** white (#FFFFFF) — required for inbox compatibility, even though the app is dark-themed.
- **Headings:** Clinical Navy `#1C3B70`, sans-serif, 24px+.
- **CTA button:** Vital Green `#2ECC71` background, white text, large rounded button (touch-friendly, mirrors the app's `h-14 rounded-xl` buttons).
- **Body text:** dark gray, 16px, sans-serif (matches Inter family).
- **Logo:** the VeriDIA logo at the top of every email (uploaded to an `email-assets` storage bucket).
- **Tone:** warm, plain-English, Nigerian-context aware. Examples:
  - Signup: "Welcome to VeriDIA — let's confirm it's really you" / button "Verify my account"
  - Password reset: "Reset your VeriDIA password" / button "Choose a new password"
  - Magic link: "Your VeriDIA sign-in link"
- **Footer:** "VeriDIA — Your lab-to-nutrition companion. Built for Nigerians, by Nigerians." + privacy/NDPA reminder.

### 4. Deploy and activate

Deploy the `auth-email-hook` edge function. Lovable will automatically:
- Route Supabase Auth emails through the hook.
- Render them with the VeriDIA templates.
- Enqueue each send to the durable email queue (auto-retry on rate-limits / transient errors).

While DNS for `notify.getveridia.app` finishes verifying (usually quick), Supabase will keep delivering the *default* templates so signups don't break. Once DNS is green, every new email automatically switches to the branded VeriDIA version from `notify@getveridia.app`.

### 5. Verify end-to-end

After deployment, do a real signup with a fresh email and confirm:
- Sender shows as `VeriDIA <notify@getveridia.app>`.
- Subject is the new branded one.
- "Verify my account" button works and lands on the app.
- Email lands in inbox (not spam) — Lovable's auto-configured SPF/DKIM/DMARC handles this.

## Technical notes

- No third-party email service (Resend / SendGrid) is needed — Lovable Cloud's built-in email infra covers everything and is already wired to your auth system.
- All sends go through the pgmq queue with auto-retry, so a single Lovable Email API hiccup will no longer drop verification mail.
- Templates live in `supabase/functions/_shared/email-templates/*.tsx` and can be edited any time; redeploy `auth-email-hook` to push changes.
- The site URL used inside the verification link will be your active app URL (`https://getveridia.app`), so users land on the real production site.
- This change does **not** touch the `mandheyewear.com` Cloudflare zone — that's a separate workspace artifact and can stay or be cleaned up independently.

## Out of scope (can do later if you want)

- Transactional emails (e.g. "your lab result is ready", "critical biomarker alert" follow-up email).
- Admin-side outbound emails to users from the Support Desk / Issue Tracker.
- Custom DKIM rotation or a second sender subdomain for marketing.

Approve this and I'll run steps 1–4 in one go.