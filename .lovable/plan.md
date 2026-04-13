

# Integrate Google Gemini API (replacing Lovable AI Gateway)

## Overview
Store the Google API key as a secure backend secret, then update the `interpret-lab` edge function to call the Gemini API directly instead of the Lovable AI Gateway.

## Steps

### 1. Store API key as a secret
Use the `add_secret` tool to securely store `GOOGLE_GEMINI_API_KEY` in the backend. The key will only be accessible from edge functions.

### 2. Update `supabase/functions/interpret-lab/index.ts`
- Replace `LOVABLE_API_KEY` with `GOOGLE_GEMINI_API_KEY`
- Switch API endpoint from `https://ai.gateway.lovable.dev/v1/chat/completions` to Google's Gemini API: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`
- Adapt request format from OpenAI-compatible to Gemini's native format:
  - `contents[]` instead of `messages[]`
  - `inlineData` for images instead of `image_url`
  - Gemini's function calling format instead of OpenAI tools format
- Keep all existing logic: biomarker extraction, critical thresholds, diet plan generation, error handling
- Both AI calls (biomarker extraction + diet plan) switch to Gemini

### 3. Redeploy the edge function

## No other files change
The frontend (`UploadLab.tsx`, `ResultReport.tsx`) remains untouched — the edge function's input/output contract stays the same.

