import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash"];
const MAX_RETRIES = 3;

async function callGeminiWithRetry(body: unknown, apiKey: string): Promise<Response> {
  for (const model of GEMINI_MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      console.log(`Trying ${model}, attempt ${attempt}/${MAX_RETRIES}`);
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (response.ok) return response;
      const status = response.status;
      if ((status === 503 || status === 429) && attempt < MAX_RETRIES) {
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`Got ${status}, waiting ${delay}ms before retry`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      if (status === 503 || status === 429) {
        console.log(`${model} exhausted retries with ${status}, trying next model`);
        break;
      }
      return response;
    }
  }
  throw new Error("All Gemini models unavailable after retries");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

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

    const { data: labResult } = await supabase
      .from("lab_results")
      .select("user_id, dependant_id")
      .eq("id", labResultId)
      .single();

    if (!labResult) throw new Error("Lab result not found");

    // Fetch demographics from dependant or profile
    let demographics: { geopolitical_zone: string | null; age: number | null; sex: string | null } = { geopolitical_zone: null, age: null, sex: null };

    if (labResult.dependant_id) {
      const { data: dependant } = await supabase
        .from("dependants")
        .select("geopolitical_zone, age, sex")
        .eq("id", labResult.dependant_id)
        .single();
      if (dependant) demographics = dependant;
    } else {
      const { data: profile } = await supabase
        .from("profiles")
        .select("geopolitical_zone, age, sex")
        .eq("user_id", labResult.user_id)
        .single();
      if (profile) demographics = profile;
    }

    const { data: fileData, error: downloadError } = await supabase.storage
      .from("lab-uploads")
      .download(filePath);

    if (downloadError) throw downloadError;

    const arrayBuffer = await fileData.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const CHUNK = 8192;
    let binaryStr = "";
    for (let i = 0; i < bytes.length; i += CHUNK) {
      binaryStr += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, Math.min(i + CHUNK, bytes.length))));
    }
    const base64 = btoa(binaryStr);
    const mimeType = filePath.endsWith(".pdf") ? "application/pdf" : "image/jpeg";

    // --- Biomarker extraction (warm, relatable tone) ---
    const systemPrompt = `You are BioGuide's Lab Interpretation Engine for Nigerian users. You're like a caring, knowledgeable big sister or brother explaining health results.

RULES:
- Extract ALL biomarker values, units, and reference ranges from the lab result image
- Classify each biomarker as: normal, borderline, deranged-low, deranged-high, or critical
- Write explanations like you're talking to a friend — warm, clear, no medical jargon
- Use everyday analogies Nigerians can relate to (e.g., "Think of your liver like a water filter for your body")
- For each biomarker, provide a practical lifestyle tip (non-drug) and trend context
- Generate a one-paragraph overall health summary — warm and encouraging, like a friend who cares
- NEVER suggest pharmaceutical drugs or medications
- NEVER diagnose conditions. Only explain what the numbers mean
- Keep it real, keep it relatable, keep it warm

You MUST respond with a function call using the provided tool.`;

    const userPrompt = `Read this Nigerian lab result. The patient is ${profile?.age || "unknown age"} years old, ${profile?.sex || "unknown sex"}, from the ${profile?.geopolitical_zone || "unknown"} region of Nigeria.

Extract all biomarkers with their values, units, reference ranges, status classification, lifestyle tips, and trend context. Also provide an overall health summary paragraph that sounds like a caring friend talking — not a clinical report.`;

    const biomarkerBody = {
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [
        {
          role: "user",
          parts: [
            { text: userPrompt },
            { inlineData: { mimeType, data: base64 } },
          ],
        },
      ],
      tools: [
        {
          functionDeclarations: [
            {
              name: "submit_lab_interpretation",
              description: "Submit the extracted biomarker data and health summary from the lab result",
              parameters: {
                type: "object",
                properties: {
                  summary: {
                    type: "string",
                    description: "A one-paragraph plain-English overall health summary. Written warmly like a caring friend — not clinical.",
                  },
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
                        explanation: { type: "string", description: "Explain what this result means using everyday language and relatable analogies" },
                        why_it_matters: { type: "string", description: "Why the patient should care about this — relate it to their daily life" },
                        lifestyle_tip: { type: "string", description: "One actionable non-drug lifestyle change. Be specific and practical." },
                        trend_context: { type: "string", description: "What this result could mean if it stays at this level or trends further" },
                      },
                      required: ["name", "value", "unit", "reference_range", "status", "explanation", "why_it_matters", "lifestyle_tip", "trend_context"],
                    },
                  },
                },
                required: ["summary", "biomarkers"],
              },
            },
          ],
        },
      ],
      toolConfig: {
        functionCallingConfig: {
          mode: "ANY",
          allowedFunctionNames: ["submit_lab_interpretation"],
        },
      },
    };

    let aiResponse: Response;
    try {
      aiResponse = await callGeminiWithRetry(biomarkerBody, geminiApiKey);
    } catch (e) {
      await supabase.from("lab_results").update({ status: "failed" }).eq("id", labResultId);
      return new Response(JSON.stringify({ error: "MODEL_UNAVAILABLE", message: "All AI models are currently overloaded. Please try again in a few minutes." }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("Gemini error:", aiResponse.status, errText);
      await supabase.from("lab_results").update({ status: "failed" }).eq("id", labResultId);

      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "RATE_LIMITED", message: "Too many requests. Please wait a moment and try again." }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI interpretation failed");
    }

    const aiData = await aiResponse.json();
    const functionCall = aiData.candidates?.[0]?.content?.parts?.find((p: any) => p.functionCall);
    if (!functionCall) {
      await supabase.from("lab_results").update({ status: "failed" }).eq("id", labResultId);
      throw new Error("AI did not return structured data");
    }

    const { biomarkers, summary } = functionCall.functionCall.args;

    // Critical thresholds check
    const criticalAlerts: any[] = [];
    const thresholds = [
      { match: "glucose", checks: [{ cond: (v: number) => v > 300, sev: "emergency", msg: "Dangerously high glucose. Risk of diabetic emergency." }, { cond: (v: number) => v < 40, sev: "emergency", msg: "Dangerously low glucose. Risk of hypoglycemic shock." }] },
      { match: "potassium", checks: [{ cond: (v: number) => v > 6.5, sev: "urgent", msg: "Very high potassium. Risk of cardiac arrhythmia." }, { cond: (v: number) => v < 2.5, sev: "urgent", msg: "Very low potassium." }] },
      { match: "hemoglobin", checks: [{ cond: (v: number) => v < 7, sev: "urgent", msg: "Severely low hemoglobin. May need urgent blood transfusion." }] },
      { match: "sodium", checks: [{ cond: (v: number) => v > 155, sev: "emergency", msg: "Dangerously high sodium." }, { cond: (v: number) => v < 120, sev: "emergency", msg: "Dangerously low sodium." }] },
      { match: "egfr", checks: [{ cond: (v: number) => v < 15, sev: "urgent", msg: "Very low kidney function." }] },
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

    // --- Enhanced Diet plan + Consultation checklist ---
    let dietaryPlan = null;
    let consultationChecklist = null;

    if (!hasEmergency) {
      const dietPrompt = `Based on these lab results for a patient from the ${profile?.geopolitical_zone || "Nigerian"} region, generate a comprehensive Nigerian food-mapped dietary plan.

Biomarkers: ${JSON.stringify(biomarkers.filter((b: any) => b.status !== "normal"))}

RULES:
- Use ONLY Nigerian foods with LOCAL MARKET NAMES
- For ${profile?.geopolitical_zone || "general Nigerian"} region specifically
- Account for preparation methods (boiled vs stewed vs fried) and their nutrient differences
- Never suggest pharmaceutical drugs
- Be specific about quantities and preparation tips
- Write like a caring friend giving food advice — warm, practical, relatable
- Include a 7-day meal plan with breakfast, lunch, and dinner for each day
- Include hydration tips based on the lab results
- Include natural supplement suggestions (moringa, zobo, etc.) — no pharmaceuticals
- Generate 3-7 personalized questions for the patient to ask their doctor, each with context explaining why it matters and a priority level`;

      const dietBody = {
        systemInstruction: { parts: [{ text: "You are BioGuide's Nigerian Nutritional Intelligence Engine. You're like a caring aunty who knows her food and health. Generate comprehensive dietary plans using Nigerian foods with local market names. Write warmly and relatably. Include weekly meal plans, hydration guidance, and natural supplements. Never suggest drugs." }] },
        contents: [{ role: "user", parts: [{ text: dietPrompt }] }],
        tools: [
          {
            functionDeclarations: [
              {
                name: "submit_diet_plan",
                description: "Submit the comprehensive dietary plan and consultation checklist",
                parameters: {
                  type: "object",
                  properties: {
                    dietary_plan: {
                      type: "object",
                      properties: {
                        foods_to_increase: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              name: { type: "string" },
                              local_name: { type: "string" },
                              benefit: { type: "string" },
                              preparation_tip: { type: "string" },
                            },
                            required: ["name", "local_name", "benefit"],
                          },
                        },
                        foods_to_reduce: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: { name: { type: "string" }, local_name: { type: "string" }, reason: { type: "string" } },
                            required: ["name", "local_name", "reason"],
                          },
                        },
                        foods_to_avoid: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: { name: { type: "string" }, local_name: { type: "string" }, reason: { type: "string" } },
                            required: ["name", "local_name", "reason"],
                          },
                        },
                        meal_suggestions: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: { meal: { type: "string" }, description: { type: "string" } },
                            required: ["meal", "description"],
                          },
                        },
                        weekly_meal_plan: {
                          type: "array",
                          description: "7-day meal plan with breakfast, lunch, and dinner",
                          items: {
                            type: "object",
                            properties: {
                              day: { type: "string", description: "Day of the week e.g. Monday" },
                              breakfast: { type: "string" },
                              lunch: { type: "string" },
                              dinner: { type: "string" },
                            },
                            required: ["day", "breakfast", "lunch", "dinner"],
                          },
                        },
                        hydration_tips: {
                          type: "array",
                          description: "Water and fluid recommendations based on results",
                          items: { type: "string" },
                        },
                        supplement_notes: {
                          type: "array",
                          description: "Natural supplement suggestions (moringa, zobo, etc.) — no pharmaceuticals",
                          items: { type: "string" },
                        },
                      },
                      required: ["foods_to_increase", "foods_to_reduce", "foods_to_avoid", "meal_suggestions", "weekly_meal_plan", "hydration_tips", "supplement_notes"],
                    },
                    consultation_checklist: {
                      type: "array",
                      description: "Personalized questions for the patient to ask their doctor",
                      items: {
                        type: "object",
                        properties: {
                          question: { type: "string" },
                          context: { type: "string", description: "Why this question matters for the patient" },
                          priority: { type: "string", enum: ["high", "medium", "low"] },
                        },
                        required: ["question", "context", "priority"],
                      },
                    },
                  },
                  required: ["dietary_plan", "consultation_checklist"],
                },
              },
            ],
          },
        ],
        toolConfig: {
          functionCallingConfig: {
            mode: "ANY",
            allowedFunctionNames: ["submit_diet_plan"],
          },
        },
      };

      try {
        const dietResponse = await callGeminiWithRetry(dietBody, geminiApiKey);
        if (dietResponse.ok) {
          const dietData = await dietResponse.json();
          const dietFnCall = dietData.candidates?.[0]?.content?.parts?.find((p: any) => p.functionCall);
          if (dietFnCall) {
            const parsed = dietFnCall.functionCall.args;
            dietaryPlan = parsed.dietary_plan;
            consultationChecklist = parsed.consultation_checklist;
          }
        }
      } catch {
        console.log("Diet plan generation failed after retries, continuing without it");
      }
    }

    // --- Pidgin Translation Call ---
    let biomarkersPidgin = null;
    let dietaryPlanPidgin = null;
    let consultationChecklistPidgin = null;
    let aiSummaryPidgin = null;

    try {
      const pidginInput = {
        summary: summary || "",
        biomarkers: biomarkers.map((b: any) => ({
          name: b.name,
          explanation: b.explanation,
          why_it_matters: b.why_it_matters,
          lifestyle_tip: b.lifestyle_tip || "",
          trend_context: b.trend_context || "",
        })),
        dietary_plan: dietaryPlan ? {
          foods_to_increase: dietaryPlan.foods_to_increase?.map((f: any) => ({ name: f.name, local_name: f.local_name, benefit: f.benefit, preparation_tip: f.preparation_tip || "" })),
          foods_to_reduce: dietaryPlan.foods_to_reduce?.map((f: any) => ({ name: f.name, local_name: f.local_name, reason: f.reason })),
          foods_to_avoid: dietaryPlan.foods_to_avoid?.map((f: any) => ({ name: f.name, local_name: f.local_name, reason: f.reason })),
          meal_suggestions: dietaryPlan.meal_suggestions?.map((m: any) => ({ meal: m.meal, description: m.description })),
          hydration_tips: dietaryPlan.hydration_tips || [],
          supplement_notes: dietaryPlan.supplement_notes || [],
        } : null,
        consultation_checklist: consultationChecklist?.map((q: any) => typeof q === "string" ? { question: q, context: "" } : { question: q.question, context: q.context || "" }),
      };

      const pidginPrompt = `Translate the following health report content into Nigerian Pidgin English. 

RULES:
- Keep ALL medical terms/biomarker names in English (e.g., "Hemoglobin", "Glucose")
- Translate the explanations, tips, reasons, and descriptions into warm, natural Nigerian Pidgin
- Don't translate food names — keep those as-is
- Make it sound like a caring friend who speaks Pidgin is explaining everything
- Keep it accurate — don't change the medical meaning
- Examples of good Pidgin: "Your sugar level dey too high o", "This one mean say your body no dey get enough iron", "Try dey drink more water every day"

Here is the content to translate:
${JSON.stringify(pidginInput, null, 2)}`;

      const pidginBody = {
        systemInstruction: { parts: [{ text: "You are a Nigerian Pidgin English translator for health content. You translate health explanations into warm, natural Nigerian Pidgin while keeping medical terms and food names in English. Be accurate but relatable." }] },
        contents: [{ role: "user", parts: [{ text: pidginPrompt }] }],
        tools: [
          {
            functionDeclarations: [
              {
                name: "submit_pidgin_translation",
                description: "Submit the Pidgin translations of all health report content",
                parameters: {
                  type: "object",
                  properties: {
                    summary_pidgin: { type: "string", description: "Pidgin translation of the health summary" },
                    biomarkers_pidgin: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          name: { type: "string" },
                          explanation: { type: "string" },
                          why_it_matters: { type: "string" },
                          lifestyle_tip: { type: "string" },
                          trend_context: { type: "string" },
                        },
                        required: ["name", "explanation", "why_it_matters", "lifestyle_tip", "trend_context"],
                      },
                    },
                    dietary_plan_pidgin: {
                      type: "object",
                      properties: {
                        foods_to_increase: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: { name: { type: "string" }, benefit: { type: "string" }, preparation_tip: { type: "string" } },
                            required: ["name", "benefit"],
                          },
                        },
                        foods_to_reduce: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: { name: { type: "string" }, reason: { type: "string" } },
                            required: ["name", "reason"],
                          },
                        },
                        foods_to_avoid: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: { name: { type: "string" }, reason: { type: "string" } },
                            required: ["name", "reason"],
                          },
                        },
                        meal_suggestions: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: { meal: { type: "string" }, description: { type: "string" } },
                            required: ["meal", "description"],
                          },
                        },
                        hydration_tips: { type: "array", items: { type: "string" } },
                        supplement_notes: { type: "array", items: { type: "string" } },
                      },
                    },
                    consultation_checklist_pidgin: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          question: { type: "string" },
                          context: { type: "string" },
                        },
                        required: ["question", "context"],
                      },
                    },
                  },
                  required: ["summary_pidgin", "biomarkers_pidgin"],
                },
              },
            ],
          },
        ],
        toolConfig: {
          functionCallingConfig: {
            mode: "ANY",
            allowedFunctionNames: ["submit_pidgin_translation"],
          },
        },
      };

      const pidginResponse = await callGeminiWithRetry(pidginBody, geminiApiKey);
      if (pidginResponse.ok) {
        const pidginData = await pidginResponse.json();
        const pidginFnCall = pidginData.candidates?.[0]?.content?.parts?.find((p: any) => p.functionCall);
        if (pidginFnCall) {
          const pidginArgs = pidginFnCall.functionCall.args;
          aiSummaryPidgin = pidginArgs.summary_pidgin || null;
          biomarkersPidgin = pidginArgs.biomarkers_pidgin || null;
          dietaryPlanPidgin = pidginArgs.dietary_plan_pidgin || null;
          consultationChecklistPidgin = pidginArgs.consultation_checklist_pidgin || null;
        }
      }
    } catch {
      console.log("Pidgin translation failed, continuing without it");
    }

    await supabase.from("lab_results").update({
      biomarkers,
      dietary_plan: dietaryPlan,
      consultation_checklist: consultationChecklist,
      has_critical_alert: hasCritical,
      critical_alerts: criticalAlerts.length > 0 ? criticalAlerts : null,
      ai_summary: summary || null,
      biomarkers_pidgin: biomarkersPidgin,
      dietary_plan_pidgin: dietaryPlanPidgin,
      consultation_checklist_pidgin: consultationChecklistPidgin,
      ai_summary_pidgin: aiSummaryPidgin,
      status: hasCritical ? "critical" : "completed",
    }).eq("id", labResultId);

    return new Response(JSON.stringify({ success: true }), {
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
