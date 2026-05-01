import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { preprocessImage, validateBiomarkers, looksLikeLabReport } from "./preprocess.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Updated model lineup — gemini-2.0-flash is no longer available to new users.
const GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.5-flash-lite"];
const MAX_RETRIES = 2;
const REQUEST_TIMEOUT_MS = 25_000;

type StepLog = { step: string; ms: number; ok: boolean; model?: string; note?: string };

async function callGeminiWithRetry(body: unknown, apiKey: string): Promise<{ response: Response; model: string }> {
  let lastErr: unknown = null;
  for (const model of GEMINI_MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      console.log(`Trying ${model}, attempt ${attempt}/${MAX_RETRIES}`);
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });
        if (response.ok) return { response, model };
        const status = response.status;
        // Don't retry 404 (model gone) — switch to next model immediately.
        if (status === 404) {
          console.log(`${model} returned 404, switching to next model`);
          break;
        }
        if ((status === 503 || status === 429) && attempt < MAX_RETRIES) {
          const delay = 1500 * attempt;
          console.log(`Got ${status}, waiting ${delay}ms before retry`);
          await new Promise(r => setTimeout(r, delay));
          continue;
        }
        if (status === 503 || status === 429) {
          console.log(`${model} exhausted retries with ${status}, trying next model`);
          break;
        }
        return { response, model };
      } catch (e) {
        lastErr = e;
        console.log(`${model} attempt ${attempt} threw:`, (e as Error).message);
        if (attempt < MAX_RETRIES) {
          await new Promise(r => setTimeout(r, 1000));
          continue;
        }
        break;
      }
    }
  }
  throw new Error(`All Gemini models unavailable: ${(lastErr as Error)?.message || "unknown"}`);
}

function extractFunctionCall(aiData: any): any | null {
  return aiData?.candidates?.[0]?.content?.parts?.find((p: any) => p.functionCall)?.functionCall?.args ?? null;
}

// Try each model; on each model retry transient HTTP errors AND retry once if
// the response was 200 OK but the model produced no functionCall.
// gemini-2.5-flash-lite frequently ignores function-calling for the larger diet
// schema — so for diet we deliberately use this helper instead of the raw
// callGeminiWithRetry which only switches models on HTTP failures.
async function callGeminiForFunction(body: unknown, apiKey: string): Promise<{ args: any | null; model: string; note?: string }> {
  let lastNote = "no models tried";
  for (const model of GEMINI_MODELS) {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });
        if (!response.ok) {
          if ((response.status === 503 || response.status === 429) && attempt < MAX_RETRIES) {
            await new Promise(r => setTimeout(r, 1500 * attempt));
            continue;
          }
          lastNote = `http_${response.status}`;
          break; // try next model
        }
        const data = await response.json();
        const args = extractFunctionCall(data);
        if (args) return { args, model };
        lastNote = "no function call";
        if (attempt < MAX_RETRIES) continue; // retry same model once more
      } catch (e) {
        lastNote = (e as Error).message;
        if (attempt < MAX_RETRIES) continue;
      }
    }
  }
  return { args: null, model: GEMINI_MODELS[GEMINI_MODELS.length - 1], note: lastNote };
}

// Note: validateBiomarkers + preprocessImage live in ./preprocess.ts


serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const t0 = Date.now();
  const steps: StepLog[] = [];
  const logStep = (step: string, started: number, ok: boolean, model?: string, note?: string) => {
    const entry = { step, ms: Date.now() - started, ok, model, note };
    steps.push(entry);
    console.log(JSON.stringify({ timing: entry }));
  };

  try {
    const { labResultId, filePath } = await req.json();
    if (!labResultId || !filePath) {
      return new Response(JSON.stringify({ error: "Missing labResultId or filePath" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const geminiApiKey = Deno.env.get("GOOGLE_GEMINI_API_KEY");
    if (!geminiApiKey) throw new Error("GOOGLE_GEMINI_API_KEY not configured");

    const supabase = createClient(supabaseUrl, supabaseKey);

    // ---- Setup: fetch lab record + demographics + file (parallel) ----
    const setupStart = Date.now();
    const [labResultRes, fileRes] = await Promise.all([
      supabase.from("lab_results").select("user_id, dependant_id").eq("id", labResultId).single(),
      supabase.storage.from("lab-uploads").download(filePath),
    ]);

    if (labResultRes.error || !labResultRes.data) throw new Error("Lab result not found");
    if (fileRes.error) throw fileRes.error;

    const labResult = labResultRes.data;
    let demographics: { geopolitical_zone: string | null; age: number | null; sex: string | null } =
      { geopolitical_zone: null, age: null, sex: null };

    if (labResult.dependant_id) {
      const { data: dependant } = await supabase
        .from("dependants").select("geopolitical_zone, age, sex")
        .eq("id", labResult.dependant_id).single();
      if (dependant) demographics = dependant;
    } else {
      const { data: profile } = await supabase
        .from("profiles").select("geopolitical_zone, age, sex")
        .eq("user_id", labResult.user_id).single();
      if (profile) demographics = profile;
    }

    const arrayBuffer = await fileRes.data.arrayBuffer();
    const rawBytes = new Uint8Array(arrayBuffer);

    // OCR preprocessing — downscale large JPEGs so Gemini gets a tighter, sharper input.
    const preStart = Date.now();
    const { bytes, mimeType, note: preNote } = await preprocessImage(rawBytes, filePath);
    logStep("preprocess", preStart, true, undefined, preNote);

    // Chunked base64 encode (avoids stack overflow on large buffers).
    const CHUNK = 8192;
    let binaryStr = "";
    for (let i = 0; i < bytes.length; i += CHUNK) {
      binaryStr += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, Math.min(i + CHUNK, bytes.length))));
    }
    const base64 = btoa(binaryStr);
    logStep("setup", setupStart, true, undefined, `raw=${(rawBytes.length / 1024).toFixed(0)}KB sent=${(bytes.length / 1024).toFixed(0)}KB`);

    // ---- Step 1: Biomarker extraction (BLOCKING — user waits for this) ----
    const systemPrompt = `You are VeriDIA's Lab Interpretation Engine for Nigerian users. You're like a caring, knowledgeable big sister or brother explaining health results.

RULES:
- Extract ALL biomarker values, units, and reference ranges from the lab result image
- Classify each biomarker as: normal, borderline, deranged-low, deranged-high, or critical
- Write explanations like you're talking to a friend — warm, clear, no medical jargon
- Use everyday analogies Nigerians can relate to
- For each biomarker, provide a practical lifestyle tip (non-drug) and trend context
- Generate a one-paragraph overall health summary — warm and encouraging
- NEVER suggest pharmaceutical drugs or medications
- NEVER diagnose conditions. Only explain what the numbers mean

You MUST respond with a function call using the provided tool.`;

    const userPrompt = `Read this Nigerian lab result. The patient is ${demographics.age || "unknown age"} years old, ${demographics.sex || "unknown sex"}, from the ${demographics.geopolitical_zone || "unknown"} region of Nigeria.

Extract all biomarkers with their values, units, reference ranges, status classification, lifestyle tips, and trend context. Also provide an overall health summary paragraph that sounds like a caring friend talking — not a clinical report.`;

    const biomarkerBody = {
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{
        role: "user",
        parts: [{ text: userPrompt }, { inlineData: { mimeType, data: base64 } }],
      }],
      tools: [{
        functionDeclarations: [{
          name: "submit_lab_interpretation",
          description: "Submit the extracted biomarker data and health summary from the lab result",
          parameters: {
            type: "object",
            properties: {
              summary: { type: "string", description: "One-paragraph plain-English overall health summary, warm and friendly." },
              biomarkers: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    value: { type: "number" },
                    unit: { type: "string" },
                    reference_range: { type: "string" },
                    status: { type: "string", enum: ["normal", "borderline", "deranged-low", "deranged-high", "critical"] },
                    explanation: { type: "string" },
                    why_it_matters: { type: "string" },
                    lifestyle_tip: { type: "string" },
                    trend_context: { type: "string" },
                  },
                  required: ["name", "value", "unit", "reference_range", "status", "explanation", "why_it_matters", "lifestyle_tip", "trend_context"],
                },
              },
            },
            required: ["summary", "biomarkers"],
          },
        }],
      }],
      toolConfig: { functionCallingConfig: { mode: "ANY", allowedFunctionNames: ["submit_lab_interpretation"] } },
    };

    const bioStart = Date.now();
    let biomarkers: any[] = [];
    let summary = "";
    let bioModel = "";
    let lastErr = "";

    // Try up to 2 times — if validation fails, retry once with a stricter nudge.
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const { response, model } = await callGeminiWithRetry(biomarkerBody, geminiApiKey);
        bioModel = model;
        if (!response.ok) {
          const errText = await response.text();
          console.error("Gemini biomarker error:", response.status, errText);
          lastErr = `${response.status}`;
          if (response.status === 429) {
            await supabase.from("lab_results").update({ status: "failed", processing_steps: steps }).eq("id", labResultId);
            return new Response(JSON.stringify({ error: "RATE_LIMITED", message: "Too many requests. Please wait a moment and try again." }), {
              status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          continue;
        }
        const aiData = await response.json();
        const args = extractFunctionCall(aiData);
        const validation = validateBiomarkers(args);
        if (validation.dropped.length) {
          console.log(`Dropped ${validation.dropped.length} invalid biomarkers:`, JSON.stringify(validation.dropped));
        }
        if (!validation.ok) {
          lastErr = `validation: ${validation.reason}`;
          console.log(`Biomarker validation failed (attempt ${attempt}): ${validation.reason}`);
          continue;
        }
        biomarkers = validation.biomarkers;
        summary = validation.summary;
        break;
      } catch (e) {
        lastErr = (e as Error).message;
        console.error(`Biomarker call attempt ${attempt} failed:`, lastErr);
      }
    }

    if (!biomarkers.length) {
      logStep("biomarker_call", bioStart, false, bioModel, lastErr);
      await supabase.from("lab_results").update({ status: "failed", processing_steps: steps }).eq("id", labResultId);
      return new Response(JSON.stringify({ error: "MODEL_UNAVAILABLE", message: "We couldn't read the lab result. Please try a clearer photo or PDF." }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Page-detection guard — refuse non-lab uploads (selfies, food labels, etc.)
    const pageCheck = looksLikeLabReport(biomarkers);
    if (!pageCheck.ok) {
      logStep("biomarker_call", bioStart, false, bioModel, `not-lab:${pageCheck.reason}`);
      await supabase.from("lab_results").update({ status: "failed", processing_steps: steps }).eq("id", labResultId);
      return new Response(JSON.stringify({ error: "NOT_A_LAB_REPORT", message: pageCheck.reason }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    logStep("biomarker_call", bioStart, true, bioModel);

    // ---- Critical thresholds (expanded) ----
    const criticalAlerts: any[] = [];
    const thresholds = [
      { match: "glucose", checks: [
        { cond: (v: number) => v > 300, sev: "emergency", msg: "Dangerously high glucose. Risk of diabetic emergency." },
        { cond: (v: number) => v < 40, sev: "emergency", msg: "Dangerously low glucose. Risk of hypoglycemic shock." },
      ]},
      { match: "hba1c", checks: [{ cond: (v: number) => v > 10, sev: "urgent", msg: "Very poor long-term blood sugar control." }] },
      { match: "potassium", checks: [
        { cond: (v: number) => v > 6.5, sev: "urgent", msg: "Very high potassium. Risk of cardiac arrhythmia." },
        { cond: (v: number) => v < 2.5, sev: "urgent", msg: "Very low potassium." },
      ]},
      { match: "sodium", checks: [
        { cond: (v: number) => v > 155, sev: "emergency", msg: "Dangerously high sodium." },
        { cond: (v: number) => v < 120, sev: "emergency", msg: "Dangerously low sodium." },
      ]},
      { match: "hemoglobin", checks: [{ cond: (v: number) => v < 7, sev: "urgent", msg: "Severely low hemoglobin. May need urgent blood transfusion." }] },
      { match: "platelet", checks: [
        { cond: (v: number) => v < 50, sev: "urgent", msg: "Very low platelets. Risk of bleeding." },
        { cond: (v: number) => v > 1000, sev: "urgent", msg: "Very high platelets. Risk of clotting." },
      ]},
      { match: "wbc", checks: [
        { cond: (v: number) => v < 2, sev: "urgent", msg: "Very low white blood cells. High infection risk." },
        { cond: (v: number) => v > 30, sev: "urgent", msg: "Extremely high white blood cells." },
      ]},
      { match: "egfr", checks: [{ cond: (v: number) => v < 15, sev: "urgent", msg: "Very low kidney function." }] },
      { match: "creatinine", checks: [{ cond: (v: number) => v > 5, sev: "urgent", msg: "Very high creatinine. Possible kidney failure." }] },
      { match: "alt", checks: [{ cond: (v: number) => v > 500, sev: "urgent", msg: "Very high ALT. Severe liver injury possible." }] },
      { match: "ast", checks: [{ cond: (v: number) => v > 500, sev: "urgent", msg: "Very high AST. Severe liver injury possible." }] },
      { match: "bilirubin", checks: [{ cond: (v: number) => v > 10, sev: "urgent", msg: "Very high bilirubin. Severe jaundice." }] },
      { match: "calcium", checks: [
        { cond: (v: number) => v > 13, sev: "urgent", msg: "Very high calcium." },
        { cond: (v: number) => v < 7, sev: "urgent", msg: "Very low calcium." },
      ]},
      { match: "inr", checks: [{ cond: (v: number) => v > 5, sev: "urgent", msg: "Very high INR. Major bleeding risk." }] },
      { match: "troponin", checks: [{ cond: (v: number) => v > 0.04, sev: "emergency", msg: "Elevated troponin. Possible heart attack." }] },
    ];

    for (const marker of biomarkers) {
      const rule = thresholds.find(t => marker.name.toLowerCase().includes(t.match));
      if (!rule) continue;
      for (const check of rule.checks) {
        if (check.cond(marker.value)) {
          criticalAlerts.push({ biomarker: marker.name, value: marker.value, unit: marker.unit, severity: check.sev, message: check.msg });
        }
      }
    }

    const hasCritical = criticalAlerts.length > 0;
    const hasEmergency = criticalAlerts.some((a: any) => a.severity === "emergency");

    // ---- WRITE PARTIAL RESULT — user can navigate to result page now ----
    // Use 'processing' (or 'critical') so we satisfy the status CHECK constraint.
    // 'partial' was rejected silently and wiped biomarkers from previous scans.
    const partialStatus = hasCritical ? "critical" : "processing";
    {
      const { error: partialErr } = await supabase.from("lab_results").update({
        biomarkers,
        ai_summary: summary || null,
        has_critical_alert: hasCritical,
        critical_alerts: criticalAlerts.length > 0 ? criticalAlerts : null,
        status: partialStatus,
        processing_steps: steps,
        diet_status: "pending",
      }).eq("id", labResultId);
      if (partialErr) {
        console.error("Partial write failed:", partialErr.message, partialErr);
      }
    }

    // ---- Background tasks: diet plan + checklist + Pidgin in parallel ----
    // Independent chains:
    //   A1) English diet plan (foods + meals)  -> chains its own Pidgin diet
    //       -> triggers finalizeStatus() the moment it lands
    //   A2) English doctor's checklist (small, fast) -> chains its own Pidgin checklist
    //   B)  Pidgin biomarkers (independent — starts immediately)
    //   Emergency path: skip A1+A2, finalize immediately.
    //
    // The final status flip happens as soon as biomarkers + English diet (A1) are
    // done — it does NOT wait for the checklist or any Pidgin work. Each piece
    // streams into the UI via realtime as it lands.
    const backgroundWork = async () => {
      let statusFinalized = false;
      const finalizeStatus = async () => {
        if (statusFinalized) return;
        statusFinalized = true;
        const finalStatus = hasCritical ? "critical" : "completed";
        // Narrow update — do NOT re-write biomarkers/ai_summary/diet/checklist/pidgin fields,
        // so we can't race with concurrent writes that may land later.
        const { error: finalErr } = await supabase.from("lab_results").update({
          status: finalStatus,
          processing_steps: [...steps, { step: "total", ms: Date.now() - t0, ok: true }],
        }).eq("id", labResultId);
        if (finalErr) console.error("Final write failed:", finalErr.message, finalErr);
      };

      const tasks: Promise<any>[] = [];

      // ---- Chain A1: English diet plan (foods + meals) -> Pidgin diet -> finalizeStatus ----
      if (!hasEmergency) {
        tasks.push((async () => {
          const dietStart = Date.now();
          try {
            const dietPrompt = `Based on these lab results for a patient from the ${demographics.geopolitical_zone || "Nigerian"} region, generate a comprehensive Nigerian food-mapped dietary plan.

Biomarkers (abnormal only): ${JSON.stringify(biomarkers.filter((b: any) => b.status !== "normal"))}

RULES:
- Use ONLY Nigerian foods with LOCAL MARKET NAMES
- Account for preparation methods (boiled vs stewed vs fried)
- Never suggest pharmaceutical drugs
- Be specific about quantities and preparation tips
- Write warmly and practically
- Include a 7-day meal plan, hydration tips, natural supplements`;

            const dietBody = {
              systemInstruction: { parts: [{ text: "You are VeriDIA's Nigerian Nutritional Intelligence Engine — a caring aunty giving food advice. Never suggest drugs." }] },
              contents: [{ role: "user", parts: [{ text: dietPrompt }] }],
              tools: [{
                functionDeclarations: [{
                  name: "submit_diet_plan",
                  parameters: {
                    type: "object",
                    properties: {
                      dietary_plan: {
                        type: "object",
                        properties: {
                          foods_to_increase: { type: "array", items: { type: "object", properties: { name: { type: "string" }, local_name: { type: "string" }, benefit: { type: "string" }, preparation_tip: { type: "string" } }, required: ["name", "local_name", "benefit"] } },
                          foods_to_reduce: { type: "array", items: { type: "object", properties: { name: { type: "string" }, local_name: { type: "string" }, reason: { type: "string" } }, required: ["name", "local_name", "reason"] } },
                          foods_to_avoid: { type: "array", items: { type: "object", properties: { name: { type: "string" }, local_name: { type: "string" }, reason: { type: "string" } }, required: ["name", "local_name", "reason"] } },
                          meal_suggestions: { type: "array", items: { type: "object", properties: { meal: { type: "string" }, description: { type: "string" } }, required: ["meal", "description"] } },
                          weekly_meal_plan: { type: "array", items: { type: "object", properties: { day: { type: "string" }, breakfast: { type: "string" }, lunch: { type: "string" }, dinner: { type: "string" } }, required: ["day", "breakfast", "lunch", "dinner"] } },
                          hydration_tips: { type: "array", items: { type: "string" } },
                          supplement_notes: { type: "array", items: { type: "string" } },
                        },
                        required: ["foods_to_increase", "foods_to_reduce", "foods_to_avoid", "meal_suggestions", "weekly_meal_plan", "hydration_tips", "supplement_notes"],
                      },
                    },
                    required: ["dietary_plan"],
                  },
                }],
              }],
              toolConfig: { functionCallingConfig: { mode: "ANY", allowedFunctionNames: ["submit_diet_plan"] } },
            };

            const { args, model, note } = await callGeminiForFunction(dietBody, geminiApiKey);
            if (args?.dietary_plan) {
              await supabase.from("lab_results").update({
                dietary_plan: args.dietary_plan,
                diet_status: "done",
                nutrition_status: "pending",
                nafdac_status: "pending",
                nafdac_citations: null,
                fda_safety_status: "pending",
                fda_safety: null,
              }).eq("id", labResultId);
              logStep("diet_call", dietStart, true, model);

              // Fire-and-forget source verification (independent layers — each can fail without affecting the other).
              try {
                const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
                const authHeader = `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`;
                // USDA nutrition lookup
                fetch(`${supabaseUrl}/functions/v1/verify-nutrition`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json", "Authorization": authHeader },
                  body: JSON.stringify({ labResultId }),
                }).catch((err) => console.log("verify-nutrition trigger failed:", err.message));
                // NAFDAC registration cross-check
                fetch(`${supabaseUrl}/functions/v1/verify-nafdac`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json", "Authorization": authHeader },
                  body: JSON.stringify({ labResultId }),
                }).catch((err) => console.log("verify-nafdac trigger failed:", err.message));
                // FDA safety check (curated ingredient list + Class I recall lookup)
                fetch(`${supabaseUrl}/functions/v1/verify-fda-safety`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json", "Authorization": authHeader },
                  body: JSON.stringify({ labResultId }),
                }).catch((err) => console.log("verify-fda-safety trigger failed:", err.message));
              } catch (e) {
                console.log("source-verification fire failed:", (e as Error).message);
              }

              // Diet is done — flip status to completed NOW (don't wait for Pidgin or checklist).
              await Promise.all([
                finalizeStatus(),
                translateDietToPidgin(args.dietary_plan),
              ]);
              return { dietary_plan: args.dietary_plan };
            }
            logStep("diet_call", dietStart, false, model, note || "no function call");
            await supabase.from("lab_results").update({ diet_status: "failed" }).eq("id", labResultId);
            await finalizeStatus();
          } catch (e) {
            logStep("diet_call", dietStart, false, undefined, (e as Error).message);
            await supabase.from("lab_results").update({ diet_status: "failed" }).eq("id", labResultId);
            await finalizeStatus();
          }
          return null;
        })());

        // ---- Chain A2: Doctor's checklist (independent of A1) -> Pidgin checklist ----
        tasks.push((async () => {
          const ckStart = Date.now();
          try {
            const checklistPrompt = `Based on these lab results for a patient from the ${demographics.geopolitical_zone || "Nigerian"} region (age ${demographics.age || "unknown"}, sex ${demographics.sex || "unknown"}), generate 3-7 personalized questions the patient should ask their doctor.

Biomarkers (abnormal only): ${JSON.stringify(biomarkers.filter((b: any) => b.status !== "normal"))}

RULES:
- Each question must be specific to one or more abnormal biomarkers
- Provide brief context explaining WHY this question matters
- Assign a priority: 'high' for critical/urgent concerns, 'medium' for important follow-ups, 'low' for general wellness
- Write warmly and practically — like a caring family friend prepping the patient for their appointment
- Never suggest drugs or diagnoses

You MUST respond with a function call using the submit_consultation_checklist tool.`;

            const checklistBody = {
              systemInstruction: { parts: [{ text: "You are VeriDIA's Doctor-Visit Coach — you help Nigerian patients ask the right questions at their doctor's appointment. Never diagnose, never suggest drugs." }] },
              contents: [{ role: "user", parts: [{ text: checklistPrompt }] }],
              tools: [{
                functionDeclarations: [{
                  name: "submit_consultation_checklist",
                  parameters: {
                    type: "object",
                    properties: {
                      consultation_checklist: {
                        type: "array",
                        items: { type: "object", properties: { question: { type: "string" }, context: { type: "string" }, priority: { type: "string", enum: ["high", "medium", "low"] } }, required: ["question", "context", "priority"] },
                      },
                    },
                    required: ["consultation_checklist"],
                  },
                }],
              }],
              toolConfig: { functionCallingConfig: { mode: "ANY", allowedFunctionNames: ["submit_consultation_checklist"] } },
            };

            const { args, model, note } = await callGeminiForFunction(checklistBody, geminiApiKey);
            if (args?.consultation_checklist?.length) {
              await supabase.from("lab_results").update({
                consultation_checklist: args.consultation_checklist,
                checklist_status: "done",
              }).eq("id", labResultId);
              logStep("checklist_call", ckStart, true, model);

              // Translate checklist to Pidgin in parallel — non-blocking on UI.
              await translateChecklistToPidgin(args.consultation_checklist);
              return { consultation_checklist: args.consultation_checklist };
            }
            logStep("checklist_call", ckStart, false, model, note || "no function call");
            await supabase.from("lab_results").update({ checklist_status: "failed" }).eq("id", labResultId);
          } catch (e) {
            logStep("checklist_call", ckStart, false, undefined, (e as Error).message);
            await supabase.from("lab_results").update({ checklist_status: "failed" }).eq("id", labResultId);
          }
          return null;
        })());
      } else {
        // Emergency: skip diet + checklist; mark both failed and finalize status
        // immediately so the report leaves 'processing' without waiting for Pidgin.
        await supabase.from("lab_results").update({
          diet_status: "failed",
          checklist_status: "failed",
        }).eq("id", labResultId);
        await finalizeStatus();
      }

      // ---- Helper: Pidgin translation of a finished English diet plan ----
      async function translateDietToPidgin(dietary_plan: any) {
        const pidStart = Date.now();
        try {
          const dietPidginInput = {
            dietary_plan: {
              foods_to_increase: dietary_plan.foods_to_increase?.map((f: any) => ({ name: f.name, benefit: f.benefit, preparation_tip: f.preparation_tip || "" })),
              foods_to_reduce: dietary_plan.foods_to_reduce?.map((f: any) => ({ name: f.name, reason: f.reason })),
              foods_to_avoid: dietary_plan.foods_to_avoid?.map((f: any) => ({ name: f.name, reason: f.reason })),
              meal_suggestions: dietary_plan.meal_suggestions,
              hydration_tips: dietary_plan.hydration_tips || [],
              supplement_notes: dietary_plan.supplement_notes || [],
            },
          };

          const body = {
            systemInstruction: { parts: [{ text: "Translate to Nigerian Pidgin. Keep food names and medical terms in English." }] },
            contents: [{ role: "user", parts: [{ text: `Translate to warm Nigerian Pidgin: ${JSON.stringify(dietPidginInput)}` }] }],
            tools: [{
              functionDeclarations: [{
                name: "submit_diet_pidgin",
                parameters: {
                  type: "object",
                  properties: {
                    dietary_plan_pidgin: {
                      type: "object",
                      properties: {
                        foods_to_increase: { type: "array", items: { type: "object", properties: { name: { type: "string" }, benefit: { type: "string" }, preparation_tip: { type: "string" } }, required: ["name", "benefit"] } },
                        foods_to_reduce: { type: "array", items: { type: "object", properties: { name: { type: "string" }, reason: { type: "string" } }, required: ["name", "reason"] } },
                        foods_to_avoid: { type: "array", items: { type: "object", properties: { name: { type: "string" }, reason: { type: "string" } }, required: ["name", "reason"] } },
                        meal_suggestions: { type: "array", items: { type: "object", properties: { meal: { type: "string" }, description: { type: "string" } }, required: ["meal", "description"] } },
                        hydration_tips: { type: "array", items: { type: "string" } },
                        supplement_notes: { type: "array", items: { type: "string" } },
                      },
                    },
                  },
                },
              }],
            }],
            toolConfig: { functionCallingConfig: { mode: "ANY", allowedFunctionNames: ["submit_diet_pidgin"] } },
          };

          const { response, model } = await callGeminiWithRetry(body, geminiApiKey);
          if (response.ok) {
            const data = await response.json();
            const args = extractFunctionCall(data);
            if (args?.dietary_plan_pidgin) {
              await supabase.from("lab_results").update({
                dietary_plan_pidgin: args.dietary_plan_pidgin,
              }).eq("id", labResultId);
              logStep("diet_pidgin_call", pidStart, true, model);
              return;
            }
          }
          logStep("diet_pidgin_call", pidStart, false, model, "no function call");
        } catch (e) {
          logStep("diet_pidgin_call", pidStart, false, undefined, (e as Error).message);
        }
      }

      // ---- Helper: Pidgin translation of a finished English checklist ----
      async function translateChecklistToPidgin(consultation_checklist: any[]) {
        const pidStart = Date.now();
        try {
          const ckPidginInput = {
            consultation_checklist: (consultation_checklist || []).map((q: any) => ({ question: q.question, context: q.context || "" })),
          };

          const body = {
            systemInstruction: { parts: [{ text: "Translate to Nigerian Pidgin. Keep medical terms in English." }] },
            contents: [{ role: "user", parts: [{ text: `Translate to warm Nigerian Pidgin: ${JSON.stringify(ckPidginInput)}` }] }],
            tools: [{
              functionDeclarations: [{
                name: "submit_checklist_pidgin",
                parameters: {
                  type: "object",
                  properties: {
                    consultation_checklist_pidgin: {
                      type: "array",
                      items: { type: "object", properties: { question: { type: "string" }, context: { type: "string" } }, required: ["question", "context"] },
                    },
                  },
                  required: ["consultation_checklist_pidgin"],
                },
              }],
            }],
            toolConfig: { functionCallingConfig: { mode: "ANY", allowedFunctionNames: ["submit_checklist_pidgin"] } },
          };

          const { response, model } = await callGeminiWithRetry(body, geminiApiKey);
          if (response.ok) {
            const data = await response.json();
            const args = extractFunctionCall(data);
            if (args?.consultation_checklist_pidgin) {
              await supabase.from("lab_results").update({
                consultation_checklist_pidgin: args.consultation_checklist_pidgin,
              }).eq("id", labResultId);
              logStep("checklist_pidgin_call", pidStart, true, model);
              return;
            }
          }
          logStep("checklist_pidgin_call", pidStart, false, model, "no function call");
        } catch (e) {
          logStep("checklist_pidgin_call", pidStart, false, undefined, (e as Error).message);
        }
      }


      // ---- Chain B: Pidgin biomarkers (independent — runs in parallel with Chain A) ----
      tasks.push((async () => {
        const pidStart = Date.now();
        try {
          const pidginInput = {
            summary: summary || "",
            biomarkers: biomarkers.map((b: any) => ({
              name: b.name, explanation: b.explanation, why_it_matters: b.why_it_matters,
              lifestyle_tip: b.lifestyle_tip || "", trend_context: b.trend_context || "",
            })),
          };

          const pidginPrompt = `Translate these health explanations into Nigerian Pidgin English. Keep medical terms (Hemoglobin, Glucose) in English. Make it warm and natural.

Content: ${JSON.stringify(pidginInput, null, 2)}`;

          const pidginBody = {
            systemInstruction: { parts: [{ text: "You translate health content into warm Nigerian Pidgin English. Keep medical terms in English." }] },
            contents: [{ role: "user", parts: [{ text: pidginPrompt }] }],
            tools: [{
              functionDeclarations: [{
                name: "submit_pidgin_translation",
                parameters: {
                  type: "object",
                  properties: {
                    summary_pidgin: { type: "string" },
                    biomarkers_pidgin: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: { name: { type: "string" }, explanation: { type: "string" }, why_it_matters: { type: "string" }, lifestyle_tip: { type: "string" }, trend_context: { type: "string" } },
                        required: ["name", "explanation", "why_it_matters", "lifestyle_tip", "trend_context"],
                      },
                    },
                  },
                  required: ["summary_pidgin", "biomarkers_pidgin"],
                },
              }],
            }],
            toolConfig: { functionCallingConfig: { mode: "ANY", allowedFunctionNames: ["submit_pidgin_translation"] } },
          };

          const { response, model } = await callGeminiWithRetry(pidginBody, geminiApiKey);
          if (response.ok) {
            const data = await response.json();
            const args = extractFunctionCall(data);
            if (args) {
              await supabase.from("lab_results").update({
                ai_summary_pidgin: args.summary_pidgin || null,
                biomarkers_pidgin: args.biomarkers_pidgin || null,
              }).eq("id", labResultId);
              logStep("pidgin_call", pidStart, true, model);
              return;
            }
          }
          logStep("pidgin_call", pidStart, false, model, "no function call");
        } catch (e) {
          logStep("pidgin_call", pidStart, false, undefined, (e as Error).message);
        }
      })());

      // Wait for everything (Chain A — incl. its inner pidgin-diet — and Chain B)
      // purely so we can persist a complete processing_steps log. The status was
      // already flipped to 'completed' inside Chain A, so user-visible UI doesn't
      // wait on this.
      await Promise.allSettled(tasks);

      // Safety net — if Chain A never ran (shouldn't happen), make sure the
      // report doesn't get stuck in 'processing'.
      await finalizeStatus();
    };


    // Fire-and-forget — but Deno edge runtime needs waitUntil for it to actually run.
    // @ts-ignore EdgeRuntime is available in Supabase edge functions
    if (typeof EdgeRuntime !== "undefined" && (EdgeRuntime as any).waitUntil) {
      // @ts-ignore
      EdgeRuntime.waitUntil(backgroundWork());
    } else {
      // Fallback — await it (slower but safe)
      await backgroundWork();
    }

    return new Response(JSON.stringify({ success: true, status: partialStatus, totalMs: Date.now() - t0 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("interpret-lab error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
