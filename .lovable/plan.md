# Make VeriDIA installable on phones

Goal: Let users install VeriDIA to their home screen on Android and iOS so it opens like a native app — without breaking the Lovable preview.

## Approach: manifest-only PWA (no service worker)

Per Lovable's PWA guidance, a full service-worker PWA causes stale-cache and preview issues. Since we don't need offline support (lab interpretation needs the network anyway), we'll use the simpler **manifest-only** approach. This is enough for "Add to Home Screen" / "Install app" on both Android (Chrome/Edge) and iOS (Safari).

What the user gets:
- Android Chrome shows an "Install app" prompt and adds VeriDIA to the launcher.
- iOS Safari users tap Share → Add to Home Screen; the app opens fullscreen with the VeriDIA icon and brand colors.
- Splash screen uses Vital Green (#2ECC71) and the VeriDIA logo.
- No service worker, so no cache-staleness issues in the Lovable editor.

Caveat to mention to the user: Install prompts only appear on the **published** site (getveridia.app), not inside the Lovable preview iframe. They will not work offline — this is a deliberate trade-off to keep the editor reliable.

## Changes

### 1. Create `public/manifest.webmanifest`
Defines app name, icons, theme color, display mode.
- `name`: "VeriDIA"
- `short_name`: "VeriDIA"
- `description`: same as current meta description
- `start_url`: "/"
- `scope`: "/"
- `display`: "standalone"
- `orientation`: "portrait"
- `background_color`: "#FFFFFF"
- `theme_color`: "#2ECC71"
- `icons`: 192x192 and 512x512 (both regular and `purpose: "maskable"` for Android adaptive icons)

### 2. Add PWA icons to `public/`
- `public/icon-192.png` (192×192)
- `public/icon-512.png` (512×512)
- `public/icon-maskable-512.png` (512×512 with safe-zone padding)
- `public/apple-touch-icon.png` (180×180, used by iOS home screen)

These will be generated from the existing `public/favicon.png` / VeriDIA brand mark using ImageMagick, padded on a Vital Green background.

### 3. Update `index.html`
Inside `<head>`, add:
- `<link rel="manifest" href="/manifest.webmanifest" />`
- `<link rel="apple-touch-icon" href="/apple-touch-icon.png" />` (replaces current favicon-as-apple-touch-icon)
- `<meta name="apple-mobile-web-app-capable" content="yes" />`
- `<meta name="apple-mobile-web-app-status-bar-style" content="default" />`
- `<meta name="apple-mobile-web-app-title" content="VeriDIA" />`
- `<meta name="mobile-web-app-capable" content="yes" />`

Existing `theme-color` stays as `#2ECC71`.

### 4. Optional: lightweight in-app install hint
Add a small dismissible banner on `/` (Index page) that:
- On Android: listens for the `beforeinstallprompt` event and shows an "Install VeriDIA" button that triggers the native prompt.
- On iOS Safari: shows a one-line tip "Tap Share → Add to Home Screen to install" (only when not already in standalone mode).
- Stores dismissal in `localStorage` so it doesn't nag.

This is a nice-to-have; flag for confirmation if you'd rather skip and rely purely on the browser's built-in install UI.

## Explicitly NOT doing
- No `vite-plugin-pwa`
- No service worker / `sw.js`
- No offline caching
- No Capacitor / native app wrapper

These would either break the Lovable preview (service worker) or be significant additional scope (Capacitor + app store submission).

## Files to be added/edited
- create `public/manifest.webmanifest`
- create `public/icon-192.png`, `public/icon-512.png`, `public/icon-maskable-512.png`, `public/apple-touch-icon.png`
- edit `index.html` (add manifest link + iOS meta tags)
- (optional) create `src/components/InstallPrompt.tsx` and mount it in `src/pages/Index.tsx`
