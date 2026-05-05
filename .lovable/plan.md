## Add Forgot Password & Reset Password Flow

Currently `Auth.tsx` only has Sign In / Sign Up — users with forgotten passwords are stuck. We'll add a simple, branded recovery flow that uses the existing VeriDIA auth-email-hook (already wired up with the Recovery template).

### What gets built

**1. "Forgot password?" link on the sign-in form** (`src/pages/Auth.tsx`)
- Add a small link beneath the Sign In button (only visible in sign-in mode)
- Clicking it switches the form into a third "reset request" mode (no new route — keeps the page lightweight)

**2. Reset request mode (in `Auth.tsx`)**
- Single email input + "Send reset link" button
- Calls `supabase.auth.resetPasswordForEmail(email, { redirectTo: \`${window.location.origin}/reset-password\` })`
- Shows toast: "Check your email for a reset link" and returns to sign-in view
- Generic success message even if email doesn't exist (avoids account enumeration)

**3. New `/reset-password` page** (`src/pages/ResetPassword.tsx`)
- Public route (added to `App.tsx`, outside `ProtectedRoute`)
- On mount: Supabase auto-creates a recovery session from the URL token; we listen via `onAuthStateChange` for the `PASSWORD_RECOVERY` event
- Shows two inputs: New password + Confirm password (min 6 chars, must match)
- Calls `supabase.auth.updateUser({ password })`
- On success: signs out the recovery session, toasts "Password updated — please sign in", redirects to `/auth`
- On invalid/expired link: shows friendly error with a "Request a new link" button back to `/auth`
- Matches existing VeriDIA visual style (logo, rounded inputs, accent button)

**4. Route registration** (`src/App.tsx`)
- Add `<Route path="/reset-password" element={<PageFade><ResetPassword /></PageFade>} />` alongside `/auth` and `/unsubscribe`

### What we are NOT changing
- The existing recovery email template (`supabase/functions/_shared/email-templates/recovery.tsx`) — already branded and working
- `auth-email-hook` — already deployed and routing recovery emails correctly
- AuthContext — no API changes needed; we call `supabase.auth` directly from the new screens (same pattern as `Auth.tsx`)

### Files

```text
NEW   src/pages/ResetPassword.tsx
EDIT  src/pages/Auth.tsx           (add forgot link + reset-request mode)
EDIT  src/App.tsx                  (register /reset-password route)
```

### UX flow

```text
Sign In screen
  └─ "Forgot password?" link
       └─ Reset-request view (email field)
            └─ Email sent → toast → back to Sign In
                 └─ User clicks link in email
                      └─ /reset-password (new password form)
                           └─ Success → /auth (sign in with new password)
```

No DB migrations, no new edge functions, no config changes.
