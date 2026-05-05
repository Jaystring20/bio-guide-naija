# Reply to users from the Support Desk

Right now the Support Desk only lets you **Copy reply** — you then have to paste it into your own email or WhatsApp. That's a real gap. Here's how we close it.

## What we have today

- **Email infrastructure is already wired up** (`send-transactional-email` edge function, queues, suppression, unsubscribe) — used for feedback + lab-result-ready emails.
- **No user phone numbers** are collected anywhere (`profiles` has no phone column, onboarding never asks).
- The user-side "Chat with support on WhatsApp" button (which you just shipped) deep-links the **user → your** number `2348038838094`. There is no reverse channel from admin → user.

So an admin reply today has two realistic paths:
1. Email (we own the infra, zero new accounts).
2. WhatsApp click-to-chat (only works if we have the user's phone number).

True outbound WhatsApp ("admin clicks Send and the user gets a WhatsApp message they didn't initiate") requires the **WhatsApp Business API** (Twilio / Meta Cloud API / 360dialog) + pre-approved message templates + a paid number. That's a separate, bigger piece of work — flagged at the bottom.

---

## Plan

### 1. Send playbook reply by email — one click

Add a new transactional template `support-reply` and a **Send by email** button next to **Copy reply** in the playbook accordion.

- **Template**: `supabase/functions/_shared/transactional-email-templates/support-reply.tsx`
  - Props: `name`, `messageHtml` (rendered as paragraphs, not raw HTML — split on newlines), `resultLink` (optional CTA button "Open my report")
  - Brand styling matching existing `lab-result-ready` template (Vital Green CTA, Clinical Navy heading)
  - Subject: `"VeriDIA support — about your recent upload"`
- **Register** in `_shared/transactional-email-templates/registry.ts`.
- **UI** (`SupportDesk.tsx`, playbook block ~line 586): add a second button:
  - `Send by email` → calls `supabase.functions.invoke('send-transactional-email', { body: { templateName: 'support-reply', recipientEmail: owner.email, idempotencyKey: \`support-${selectedId}-${entry.id}-${Date.now()}\`, templateData: { name: owner.full_name, messageHtml: filledReply, resultLink: reportLink } } })`
  - Loading + success/error toast
  - Disabled if no `owner.email`
- **Audit trail**: after a successful send, also write a note onto the existing support issue via `useAddIssueNote` so the timeline shows _"Replied by email at {time} — playbook: {entry.title}"_. This makes the conversation history visible to all admins.

### 2. WhatsApp click-to-chat — collect phone first

We can't send WhatsApp without the user's number. Two coordinated changes:

- **Onboarding**: add an optional `phone` field (E.164, with `+234` placeholder) on the existing onboarding step. Keep optional — don't block users who don't want to share.
- **Profile page**: add the same field so existing users can fill it in.
- **DB migration**: `ALTER TABLE public.profiles ADD COLUMN phone TEXT;` (nullable, no default). RLS already covers it (own-row policies).
- **`admin_get_result_owner` RPC**: extend the SELECT + return type to include `phone` so Support Desk can read it.
- **Support Desk UI**: when `owner.phone` is present, show a **Reply on WhatsApp** button next to **Send by email**. It opens `https://wa.me/{phone}?text={prefilled reply}` in a new tab — admin still hits Send manually inside WhatsApp (this is just click-to-chat, not API send). When phone is missing, show a small muted note: _"No phone on file — ask the user to add it in their profile."_

### 3. UI layout in the playbook reply card

Each playbook entry's "Reply to user" card gets a tidy 3-button row:

```text
[ Copy reply ]   [ Send by email ]   [ Reply on WhatsApp ]
                                       (disabled if no phone)
```

All three operate on the same `fillReply(...)` text so the message is identical regardless of channel.

### 4. Out of scope (call out, do not build now)

- **Outbound WhatsApp via API** (Twilio / Meta Cloud API). Requires: business verification, paid WhatsApp Business number, pre-approved message templates per use case, edge function to call the API, and a webhook to receive replies. Worth doing once volume justifies it — recommend revisiting after we see how often admins actually need to reach users.
- **In-app inbox / push notifications to the user** — different surface, separate plan.
- **SMS fallback** — also separate; would need an SMS provider (Termii is the usual NG choice).

---

## Files touched

**New**
- `supabase/functions/_shared/transactional-email-templates/support-reply.tsx`
- One DB migration: add `profiles.phone`, update `admin_get_result_owner` RPC return shape.

**Edited**
- `supabase/functions/_shared/transactional-email-templates/registry.ts` — register template
- `src/pages/admin/SupportDesk.tsx` — Send-by-email + WhatsApp buttons, owner.phone, audit-note write
- `src/pages/Onboarding.tsx` — optional phone input
- `src/pages/Profile.tsx` — optional phone input

After deploy I'll redeploy `send-transactional-email` so the new template is picked up, and verify the first send lands.
