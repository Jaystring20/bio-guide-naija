## Goal

Give users a one-tap WhatsApp escape hatch whenever an upload/analysis fails, so nobody is left stuck after retrying.

## Where it appears

1. **`ResultReport.tsx` — failed-result screen** (the `result.status === "failed"` block, ~line 168): below the existing "Try Again" button.
2. **`ResultReport.tsx` — stuck-processing banner** (after 90s, ~line 145): alongside "Try a clearer photo".
3. **`EmptyBiomarkersBanner.tsx` — failed/empty variant**: as a final option after the existing recovery tips.

This covers every place the user currently sees a dead-end.

## Button behaviour

- Label: **"Chat with support on WhatsApp"** (Pidgin: **"Message us for WhatsApp"**).
- Green WhatsApp-style outline button with the `MessageCircle` Lucide icon (we don't ship a brand WhatsApp glyph; lucide stays consistent with the rest of the UI).
- Opens `https://wa.me/<SUPPORT_NUMBER>?text=<prefilled>` in a new tab.
- The prefilled message is auto-generated and includes:
  - "Hi VeriDIA, I need help with my lab upload."
  - The user's name (from `profile.full_name` if signed in).
  - The result ID (when on `ResultReport`).
  - The failure reason (when known, e.g. `not-lab`, validation drop).
  - Upload timestamp.
- Falls back gracefully when not signed in (just the generic message).

## Configuration

- Add a single constant `SUPPORT_WHATSAPP_NUMBER` in a new `src/lib/support.ts` (E.164, no `+`, e.g. `2348012345678`).
- Export a helper `buildWhatsAppUrl({ name, resultId, reason })` so all three call-sites stay consistent.
- The number is a placeholder for now; the user can swap it in one place. We'll ask them for the real number in chat after approval.

## Files

- **Create** `src/lib/support.ts` — number constant + URL builder.
- **Create** `src/components/support/WhatsAppSupportButton.tsx` — small reusable button accepting `{ resultId?, reason?, language?, variant? }`.
- **Edit** `src/pages/ResultReport.tsx` — drop the button into the failed and stuck-processing blocks.
- **Edit** `src/components/report/EmptyBiomarkersBanner.tsx` — append the button to the failed/empty recovery section.

## Out of scope

No backend logging of WhatsApp clicks (can be added later if useful). No changes to the upload page itself — the failed-upload flow already routes users to `ResultReport`, where the new button lives.
