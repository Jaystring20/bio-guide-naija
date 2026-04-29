// Regenerate diet plan + consultation checklist for an existing lab_result.
// Used when the original diet generation failed (or never ran on a legacy report).
// Reads existing biomarkers + demographics, calls Gemini, persists the result.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// gemini-2.5-flash first (better at function calling for the larger diet schema),
// gemini-2.5-flash-lite as fallback. Order matters — lite frequently returns plain
// text instead of a function call for diet payloads.
const GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.5-flash-lite"];
const REQUEST_TIMEOUT_MS = 30_000;
const MAX_RETRIES = 2;

type StepLog = { step: string; ms: number; ok: boolean; model?: string; note?: string };

function extractFunctionCall(aiData: any): any | null {
  return aiData?.candidates?.[0]?.content?.parts?.find((p: any) => p.functionCall)?.functionCall?.args ?? null;
}

async function callGeminiOnce(model: string, body: unknown, apiKey: string) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
}

// Try each model; on each model retry transient HTTP errors, AND retry once if
// the response was 200 but the model produced no functionCall (schema-ignored).
async function callGeminiForFunction(body: unknown, apiKey: string): Promise<{ args: any | null; model: string; note?: string }> {
  let lastNote = "no models tried";
  for (const model of GEMINI_MODELS) {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await callGeminiOnce(model, body, apiKey);
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
        // give the same model one more attempt; many times retry yields the call
        if (attempt < MAX_RETRIES) continue;
      } catch (e) {
        lastNote = (e as Error).message;
        if (attempt < MAX_RETRIES) continue;
      }
    }
  }
  return { args: null, model: GEMINI_MODELS[GEMINI_MODELS.length - 1], note: lastNote };
}

const DIET_TOOL = {
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
        consultation_checklist: {
          type: "array",
          items: { type: "object", properties: { question: { type: "string" }, context: { type: "string" }, priority: { type: "string", enum: ["high", "medium", "low"] } }, required: ["question", "context", "priority"] },
        },
      },
      required: ["dietary_plan", "consultation_checklist"],
    },
  }],
};

const DIET_PIDGIN_TOOL = {
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
        consultation_checklist_pidgin: { type: "array", items: { type: "object", properties: { question: { type: "string" }, context: { type: "string" } }, required: ["question", "context"] } },
      },
    },
  }],
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const t0 = Date.now();
  const steps: StepLog[] = [];
  const log = (step: string, started: number, ok: boolean, model?: string, note?: string) => {
    steps.push({ step, ms: Date.now() - started, ok, model, note });
  };

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const geminiApiKey = Deno.env.get("GOOGLE_GEMINI_API_KEY");
    if (!geminiApiKey) throw new Error("GOOGLE_GEMINI_API_KEY not configured");

    // ---- Authenticate the caller via their JWT (verify_jwt = false in config) ----
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userId = userData.user.id;

    const { resultId } = await req.json();
    if (!resultId) {
      return new Response(JSON.stringify({ error: "Missing resultId" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Service role for the writes (RLS bypass), but we already authorized the caller.
    const supabase = createClient(supabaseUrl, serviceKey);

    // ---- Load the result and confirm ownership (or admin) ----
    const { data: result, error: rErr } = await supabase
      .from("lab_results")
      .select("id, user_id, dependant_id, biomarkers, has_critical_alert, processing_steps")
      .eq("id", resultId)
      .single();
    if (rErr || !result) {
      return new Response(JSON.stringify({ error: "Result not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (result.user_id !== userId) {
      // allow admins
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
      if (!roles) {
        return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    const biomarkers = (result.biomarkers as any[] | null) || [];
    if (!biomarkers.length) {
      return new Response(JSON.stringify({ error: "No biomarkers to base a diet plan on" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Mark in-flight so the UI can show "Regenerating…"
    await supabase.from("lab_results").update({ diet_status: "pending" }).eq("id", resultId);

    // ---- Demographics ----
    let demographics: { geopolitical_zone: string | null; age: number | null; sex: string | null } = { geopolitical_zone: null, age: null, sex: null };
    if (result.dependant_id) {
      const { data: d } = await supabase.from("dependants").select("geopolitical_zone, age, sex").eq("id", result.dependant_id).single();
      if (d) demographics = d as any;
    } else {
      const { data: p } = await supabase.from("profiles").select("geopolitical_zone, age, sex").eq("user_id", result.user_id).single();
      if (p) demographics = p as any;
    }

    // ---- Diet generation ----
    const dietStart = Date.now();
    const dietPrompt = `Based on these lab results for a patient from the ${demographics.geopolitical_zone || "Nigerian"} region (age ${demographics.age || "unknown"}, sex ${demographics.sex || "unknown"}), generate a comprehensive Nigerian food-mapped dietary plan.

Biomarkers (abnormal only): ${JSON.stringify(biomarkers.filter((b: any) => b.status !== "normal"))}

RULES:
- Use ONLY Nigerian foods with LOCAL MARKET NAMES
- Account for preparation methods (boiled vs stewed vs fried)
- Never suggest pharmaceutical drugs
- Be specific about quantities and preparation tips
- Write warmly and practically
- Include a 7-day meal plan, hydration tips, natural supplements
- Generate 3-7 personalized doctor questions with priority

You MUST respond with a function call using the submit_diet_plan tool.`;

    const dietBody = {
      systemInstruction: { parts: [{ text: "You are VeriDIA's Nigerian Nutritional Intelligence Engine — a caring aunty giving food advice. Never suggest drugs. Always respond with a function call." }] },
      contents: [{ role: "user", parts: [{ text: dietPrompt }] }],
      tools: [DIET_TOOL],
      toolConfig: { functionCallingConfig: { mode: "ANY", allowedFunctionNames: ["submit_diet_plan"] } },
    };

    const { args: dietArgs, model: dietModel, note: dietNote } = await callGeminiForFunction(dietBody, geminiApiKey);
    if (!dietArgs?.dietary_plan) {
      log("diet_call", dietStart, false, dietModel, dietNote || "no function call");
      const newSteps = [...((result.processing_steps as StepLog[] | null) || []), ...steps, { step: "regenerate_total", ms: Date.now() - t0, ok: false }];
      await supabase.from("lab_results").update({ diet_status: "failed", processing_steps: newSteps }).eq("id", resultId);
      return new Response(JSON.stringify({ error: "DIET_GENERATION_FAILED", message: "We couldn't generate the diet plan. Please try again in a moment." }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    log("diet_call", dietStart, true, dietModel);

    // Persist the English diet immediately
    await supabase.from("lab_results").update({
      dietary_plan: dietArgs.dietary_plan,
      consultation_checklist: dietArgs.consultation_checklist || null,
      diet_status: "done",
    }).eq("id", resultId);

    // ---- Pidgin (best-effort, do not block "done") ----
    const pidStart = Date.now();
    try {
      const dietPidginInput = {
        dietary_plan: {
          foods_to_increase: dietArgs.dietary_plan.foods_to_increase?.map((f: any) => ({ name: f.name, benefit: f.benefit, preparation_tip: f.preparation_tip || "" })),
          foods_to_reduce: dietArgs.dietary_plan.foods_to_reduce?.map((f: any) => ({ name: f.name, reason: f.reason })),
          foods_to_avoid: dietArgs.dietary_plan.foods_to_avoid?.map((f: any) => ({ name: f.name, reason: f.reason })),
          meal_suggestions: dietArgs.dietary_plan.meal_suggestions,
          hydration_tips: dietArgs.dietary_plan.hydration_tips || [],
          supplement_notes: dietArgs.dietary_plan.supplement_notes || [],
        },
        consultation_checklist: (dietArgs.consultation_checklist || []).map((q: any) => ({ question: q.question, context: q.context || "" })),
      };
      const pidBody = {
        systemInstruction: { parts: [{ text: "Translate to Nigerian Pidgin. Keep food names and medical terms in English." }] },
        contents: [{ role: "user", parts: [{ text: `Translate to warm Nigerian Pidgin: ${JSON.stringify(dietPidginInput)}` }] }],
        tools: [DIET_PIDGIN_TOOL],
        toolConfig: { functionCallingConfig: { mode: "ANY", allowedFunctionNames: ["submit_diet_pidgin"] } },
      };
      const { args: pidArgs, model: pidModel } = await callGeminiForFunction(pidBody, geminiApiKey);
      if (pidArgs) {
        await supabase.from("lab_results").update({
          dietary_plan_pidgin: pidArgs.dietary_plan_pidgin || null,
          consultation_checklist_pidgin: pidArgs.consultation_checklist_pidgin || null,
        }).eq("id", resultId);
        log("diet_pidgin_call", pidStart, true, pidModel);
      } else {
        log("diet_pidgin_call", pidStart, false, pidModel, "no function call");
      }
    } catch (e) {
      log("diet_pidgin_call", pidStart, false, undefined, (e as Error).message);
    }

    const newSteps = [...((result.processing_steps as StepLog[] | null) || []), ...steps, { step: "regenerate_total", ms: Date.now() - t0, ok: true }];
    await supabase.from("lab_results").update({ processing_steps: newSteps }).eq("id", resultId);

    return new Response(JSON.stringify({ success: true, diet_status: "done", totalMs: Date.now() - t0 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("regenerate-diet error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
