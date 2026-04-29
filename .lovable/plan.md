## Improving Lab Report Analysis: Speed, Reliability & Structure

### Current pipeline (what happens today)

```text
Upload → Storage → Insert row → Edge function:
  1. Download file from storage
  2. Base64 encode (sync, blocking)
  3. Gemini Call #1 — Biomarker extraction + summary  (~10–20s)
  4. Critical threshold check (local)
  5. Gemini Call #2 — Diet plan + consultation checklist  (~10–20s)
  6. Gemini Call #3 — Pidgin translation of EVERYTHING  (~10–20s)
  7. Update DB → return
```

Calls run **sequentially**. Total wall time today: ~30–60s on a good day, **frequently 60–90s+** when any call retries. Logs confirm `gemini-2.0-flash` returns 404 (no longer available to new users) — every fallback is wasted time.

---

### Top challenges identified

| # | Challenge | Evidence | Impact |
|---|---|---|---|
| 1 | **Sequential AI calls** — extraction → diet → pidgin run one after another | `interpret-lab/index.ts` lines 178–523 | Adds 20–40s of dead wait time |
| 2 | **`gemini-2.0-flash` fallback is dead** — returns 404, every retry wastes ~5s | Edge logs: "gemini-2.0-flash is no longer available to new users" | False sense of resilience; delays failures |
| 3 | **Pidgin translation blocks the response** even though most users read English first | Lines 383–523 | Adds 10–20s before user sees ANY result |
| 4 | **Single huge JSON schema** — 7-day meal plan + hydration + supplements + checklist in one call | Lines 254–359 | Slower generation, higher failure rate, hits token limits |
| 5 | **No structural validation** of AI output — accepts whatever shape comes back | Line 208 just destructures | Silent data corruption, broken UI |
| 6 | **No timeout on Gemini calls** — a single hung request can stall the whole flow | `fetch()` at line 17 has no `AbortSignal` | Indefinite waits |
| 7 | **No image preprocessing** — full-resolution photos sent as base64 | Lines 91–98 | Larger payload = slower upload to Gemini + slower OCR |
| 8 | **Critical thresholds are minimal** — only 5 biomarkers covered | Lines 212–218 | Misses many clinically important alerts |
| 9 | **No structured logging / timing** — can't tell which step is slow per request | Only generic console.logs | Can't optimize what we can't measure |
| 10 | **Blocking response pattern** — client waits for entire pipeline before navigating | `UploadLab.tsx` awaits full function | Perceived slowness even when DB is fast |

---

### The plan — 4 focused changes

#### 1. Parallelize + slim the pipeline (biggest speed win)

Restructure `interpret-lab/index.ts` so the response returns as soon as the **biomarkers + summary + critical alerts** are ready (the only data the user needs to land on the result page). Diet plan and Pidgin become **background jobs**.

```text
NEW FLOW:
  ┌─ Gemini Call #1: Biomarkers + summary (mandatory, ~10–15s)
  │  → Save partial row, mark status="partial", RETURN to client
  │
  └─ Fire-and-forget (EdgeRuntime.waitUntil):
       ├─ Gemini Call #2: Diet plan      ┐  parallel
       └─ Gemini Call #3: Pidgin (en→pcm) ┘
       → Update row when each finishes
```

- Client navigates to result page in **~15s** instead of 45–60s.
- Result page subscribes via Supabase Realtime to the `lab_results` row and progressively renders Diet/Pidgin tabs as they arrive (skeleton → content).

#### 2. Fix the model lineup + add hard timeouts

- Drop the dead `gemini-2.0-flash` fallback. Replace with: `gemini-2.5-flash` → `gemini-2.5-flash-lite` (faster, cheaper fallback).
- Add a **20s `AbortSignal.timeout`** to every Gemini call so a stalled request fails fast and retries.
- Cut `MAX_RETRIES` from 3 → 2 (current backoff is 2s + 4s = 6s wasted per dead model).

#### 3. Stricter response structure & validation

- Add a **Zod schema** (Deno-compatible) for the biomarker tool-call output. Reject + retry once if it doesn't validate, instead of writing garbage to the DB.
- Split the diet call into **two smaller tool calls** done in parallel:
  - `submit_food_lists` — increase / reduce / avoid + supplements + hydration
  - `submit_meal_plan_and_questions` — 7-day meals + consultation checklist
  - Smaller schemas = faster generation + fewer truncations.
- Expand the local critical-threshold table from 5 → ~15 biomarkers (creatinine, ALT/AST, bilirubin, WBC, platelets, HbA1c, etc.) using clinical literature.

#### 4. Image preprocessing + observability

- Before sending to Gemini, downscale images >1600px on the longest side and re-encode to JPEG quality 85 (use Deno-compatible image lib or skip if PDF). Typical phone photo drops from 4MB → ~400KB.
- Add structured timing logs: `{step: "biomarker_call", ms: 12340, model: "gemini-2.5-flash", ok: true}` so we can plot p50/p95 per step in the admin dashboard later.

---

### Files to change

- `supabase/functions/interpret-lab/index.ts` — full restructure (parallel + waitUntil + timeouts + validation + new model list)
- `src/lib/critical-thresholds.ts` — expand biomarker rules
- `src/pages/ResultReport.tsx` — handle `status="partial"`, subscribe to Realtime updates, show skeletons for pending Diet/Pidgin tabs
- `src/pages/UploadLab.tsx` — navigate as soon as biomarkers come back (don't wait for full pipeline)
- New migration — enable Realtime on `lab_results` (`ALTER PUBLICATION supabase_realtime ADD TABLE public.lab_results`) and add a `processing_steps jsonb` column for per-step timing/status

### Expected outcome

| Metric | Today | After |
|---|---|---|
| Time to result page (p50) | ~35s | **~12–15s** |
| Time to result page (p95) | 60–90s | **~25s** |
| Full report ready (with Pidgin) | 45–90s | **~30s** (in background, user already reading) |
| Failed-pipeline rate | ~10–15% (logs) | **<3%** (timeouts + validation + retry) |

### Out of scope for this round

- Caching identical lab results (privacy concern; data minimization rule)
- Switching to a different OCR-first pipeline (Vision API → LLM)
- Streaming the summary token-by-token (Gemini function-calling doesn't stream cleanly)

Approve and I'll implement.
