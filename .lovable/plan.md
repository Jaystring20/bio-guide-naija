

# Make Gemini API calls resilient to 503 overload errors

## Problem
Google's `gemini-2.5-flash` model is returning 503 errors due to high demand. The API key and integration are correct — this is a Google-side availability issue.

## Solution
Update `supabase/functions/interpret-lab/index.ts` with two resilience strategies:

### 1. Retry with exponential backoff
- Wrap each Gemini API call in a retry helper that attempts up to 3 times
- Delays: 2s, 4s between retries
- Only retries on 503 and 429 status codes

### 2. Fallback model
- If all retries on `gemini-2.5-flash` fail with 503, retry once with `gemini-2.0-flash` as a fallback
- Same request format — both models support the same Gemini API contract

### Implementation detail
Add a helper function at the top of the edge function:

```text
async function callGeminiWithRetry(body, apiKey):
  models = ["gemini-2.5-flash", "gemini-2.0-flash"]
  for each model:
    for attempt 1..3:
      response = fetch(model URL, body)
      if response.ok → return response
      if 503 or 429 → wait (2^attempt seconds), retry
      else → throw
  throw "All models unavailable"
```

Both the biomarker extraction call and the diet plan call will use this helper.

### File changed
- `supabase/functions/interpret-lab/index.ts` — add retry helper, update both Gemini fetch calls to use it

### No other changes
Frontend stays the same. The edge function's input/output contract is unchanged.

