import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

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

    // Get user profile
    const { data: labResult } = await supabase
      .from("lab_results")
      .select("user_id")
      .eq("id", labResultId)
      .single();

    if (!labResult) throw new Error("Lab result not found");

    const { data: profile } = await supabase
      .from("profiles")
      .select("geopolitical_zone, age, sex")
      .eq("user_id", labResult.user_id)
      .single();

    // Download file from storage
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

    // --- Biomarker extraction via Gemini ---
    const systemPrompt = `You are BioGuide's Lab Interpretation Engine for Nigerian users. You are a clinical-grade AI that reads lab results.

RULES:
- Extract ALL biomarker values, units, and reference ranges from the lab result image
- Classify each biomarker as: normal, borderline, deranged-low, deranged-high, or critical
- Write plain-English explanations (no medical jargon). Explain like a knowledgeable friend
- NEVER suggest pharmaceutical drugs or medications
- NEVER diagnose conditions. Only explain what the numbers mean

You MUST respond with a function call using the provided tool.`;

    const userPrompt = `Read this Nigerian lab result. The patient is ${profile?.age || "unknown age"} years old, ${profile?.sex || "unknown sex"}, from the ${profile?.geopolitical_zone || "unknown"} region of Nigeria.

Extract all biomarkers with their values, units, reference ranges, and status classification.`;

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
              description: "Submit the extracted biomarker data from the lab result",
              parameters: {
                type: "object",
                properties: {
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
                        explanation: { type: "string", description: "Plain English explanation of what this value means" },
                        why_it_matters: { type: "string", description: "Why this biomarker matters for health" },
                      },
                      required: ["name", "value", "unit", "reference_range", "status", "explanation", "why_it_matters"],
                    },
                  },
                },
                required: ["biomarkers"],
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

    const aiResponse = await fetch(`${GEMINI_URL}?key=${geminiApiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(biomarkerBody),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("Gemini error:", aiResponse.status, errText);

      if (aiResponse.status === 429) {
        await supabase.from("lab_results").update({ status: "failed" }).eq("id", labResultId);
        return new Response(JSON.stringify({ error: "RATE_LIMITED", message: "Too many requests. Please wait a moment and try again." }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await supabase.from("lab_results").update({ status: "failed" }).eq("id", labResultId);
      throw new Error("AI interpretation failed");
    }

    const aiData = await aiResponse.json();
    const functionCall = aiData.candidates?.[0]?.content?.parts?.find((p: any) => p.functionCall);
    if (!functionCall) {
      await supabase.from("lab_results").update({ status: "failed" }).eq("id", labResultId);
      throw new Error("AI did not return structured data");
    }

    const { biomarkers } = functionCall.functionCall.args;

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

    // --- Diet plan via Gemini (skip if emergency) ---
    let dietaryPlan = null;
    let consultationChecklist = null;

    if (!hasEmergency) {
      const dietPrompt = `Based on these lab results for a patient from the ${profile?.geopolitical_zone || "Nigerian"} region, generate a Nigerian food-mapped dietary plan.

Biomarkers: ${JSON.stringify(biomarkers.filter((b: any) => b.status !== "normal"))}

RULES:
- Use ONLY Nigerian foods with LOCAL MARKET NAMES
- For ${profile?.geopolitical_zone || "general Nigerian"} region specifically
- Account for preparation methods (boiled vs stewed vs fried) and their nutrient differences
- Never suggest pharmaceutical drugs
- Be specific about quantities and preparation tips
- Also generate 3-7 personalized questions for the patient to ask their doctor`;

      const dietBody = {
        systemInstruction: { parts: [{ text: "You are BioGuide's Nigerian Nutritional Intelligence Engine. Generate dietary plans using Nigerian foods with local market names. Never suggest drugs." }] },
        contents: [{ role: "user", parts: [{ text: dietPrompt }] }],
        tools: [
          {
            functionDeclarations: [
              {
                name: "submit_diet_plan",
                description: "Submit the dietary plan and consultation checklist",
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
                              local_name: { type: "string", description: "Nigerian/local market name" },
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
                      },
                      required: ["foods_to_increase", "foods_to_reduce", "foods_to_avoid", "meal_suggestions"],
                    },
                    consultation_checklist: {
                      type: "array",
                      items: { type: "string" },
                      description: "3-7 personalized questions for the patient's next doctor visit",
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

      const dietResponse = await fetch(`${GEMINI_URL}?key=${geminiApiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dietBody),
      });

      if (dietResponse.ok) {
        const dietData = await dietResponse.json();
        const dietFnCall = dietData.candidates?.[0]?.content?.parts?.find((p: any) => p.functionCall);
        if (dietFnCall) {
          const parsed = dietFnCall.functionCall.args;
          dietaryPlan = parsed.dietary_plan;
          consultationChecklist = parsed.consultation_checklist;
        }
      }
    }

    // Update lab result
    await supabase.from("lab_results").update({
      biomarkers,
      dietary_plan: dietaryPlan,
      consultation_checklist: consultationChecklist,
      has_critical_alert: hasCritical,
      critical_alerts: criticalAlerts.length > 0 ? criticalAlerts : null,
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
