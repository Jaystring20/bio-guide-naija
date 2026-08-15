---
name: AI provider fallback
description: Lab analysis calls Google Gemini directly, then falls back to Lovable AI Gateway when the Google key is out of credits
type: feature
---
Lab analysis (`interpret-lab`), diet regeneration (`regenerate-diet`) and compare insights (`compare-results`) call Google's Generative Language API directly with `GOOGLE_GEMINI_API_KEY`.

Aug 2026 outage: that key returned `429 RESOURCE_EXHAUSTED — "Your prepayment credits are depleted"` for every model, so all analyses failed with "All Gemini models unavailable: unknown".

Rule: every Gemini call must have a fallback through the Lovable AI Gateway (`LOVABLE_API_KEY`, models `google/gemini-2.5-flash` and `google/gemini-2.5-flash-lite`). Shared translator: `supabase/functions/_shared/gemini-gateway.ts` — accepts a Gemini-shaped body (contents/inlineData/functionDeclarations/toolConfig) and returns a Gemini-shaped response, so existing parsers work unchanged.

Also: failure notes stored in `lab_results.processing_steps` must include the real HTTP status and error body snippet — a bare "unknown" makes outages undiagnosable.
