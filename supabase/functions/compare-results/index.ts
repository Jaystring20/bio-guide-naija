// Compare Lab Results — external Gemini API (not Lovable AI).
// Reads OPTED-IN payload from client (already-aligned deltas) and returns
// structured, actionable insights. Uses gemini-2.5-flash / -flash-lite via the
// public generativelanguage.googleapis.com endpoint with GOOGLE_GEMINI_API_KEY.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.5-flash-lite"];
const REQUEST_TIMEOUT_MS = 20_000;
const MAX_RETRIES = 2;

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    headline: { type: "STRING", description: "One-sentence plain-language summary of the overall trajectory." },
    wins: { type: "ARRAY", items: { type: "STRING" }, description: "Concrete improvements. Max 4 short items." },
    concerns: { type: "ARRAY", items: { type: "STRING" }, description: "What worsened or needs attention. Max 4 items." },
    likely_drivers: { type: "ARRAY", items: { type: "STRING" }, description: "Possible reasons for the changes (lifestyle, diet, medications). Max 3 items." },
    next_actions: { type: "ARRAY", items: { type: "STRING" }, description: "Actionable next steps the user can take. Max 4 items, imperative voice, Nigeria-friendly." },
    questions_for_doctor: { type: "ARRAY", items: { type: "STRING" }, description: "Specific questions to raise with a clinician. Max 3 items." },
  },
  required: ["headline", "wins", "concerns", "likely_drivers", "next_actions", "questions_for_doctor"],
};

async function callGemini(body: unknown, apiKey: string): Promise<Response> {
  let lastErr: unknown = null;
  for (const model of GEMINI_MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });
        if (res.ok) return res;
        if (res.status === 404) break; // model gone → next model
        if ((res.status === 429 || res.status === 503) && attempt < MAX_RETRIES) {
          await new Promise((r) => setTimeout(r, 1200 * attempt));
          continue;
        }
        if (res.status === 429 || res.status === 503) break;
        return res; // other client errors → return so caller can log body
      } catch (e) {
        lastErr = e;
        if (attempt < MAX_RETRIES) {
          await new Promise((r) => setTimeout(r, 800));
          continue;
        }
      }
    }
  }
  throw new Error(`Gemini unreachable: ${(lastErr as Error)?.message || "unknown"}`);
}

function buildPrompt(payload: unknown): string {
  return [
    "You are VeriDIA, a Nigerian health companion. The user has ordered lab results and wants a",
    "plain-language read on how their biomarkers changed across reports.",
    "",
    "STRICT RULES:",
    "- Never invent numbers. Only reference the deltas in the JSON below.",
    "- Do NOT diagnose. Use hedged language (\"may suggest\", \"could indicate\").",
    "- Keep bullets punchy (max ~14 words each).",
    "- Prefer Nigerian-friendly examples (foods, habits, local context) where useful.",
    "- If a delta is marked unit_mismatch, do not treat it as a real change.",
    "- If cross_profile=true, remind the reader these are DIFFERENT people and comparisons are guidance only.",
    "- Return JSON matching the required schema exactly. No prose outside the JSON.",
    "",
    "PAYLOAD:",
    JSON.stringify(payload),
  ].join("\n");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("GOOGLE_GEMINI_API_KEY");
    if (!apiKey) throw new Error("GOOGLE_GEMINI_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const { resultIds, payload } = body as { resultIds?: string[]; payload?: unknown };
    if (!Array.isArray(resultIds) || resultIds.length < 2) {
      return new Response(JSON.stringify({ error: "Need at least 2 resultIds" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify ownership of every result before sending anything to Gemini.
    const { data: owned, error: ownedErr } = await supabase
      .from("lab_results")
      .select("id")
      .in("id", resultIds)
      .eq("user_id", user.id);
    if (ownedErr) throw ownedErr;
    if (!owned || owned.length !== resultIds.length) {
      return new Response(JSON.stringify({ error: "Forbidden: unknown result IDs" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Trim payload before sending: drop non-comparable rows and cap list to focus the model.
    const trimmedPayload = trimPayload(payload);
    const prompt = buildPrompt(trimmedPayload);

    const geminiBody = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 2048,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
        // Disable thinking tokens on 2.5-flash — they consume the output budget and
        // cause the JSON response to be truncated mid-object.
        thinkingConfig: { thinkingBudget: 0 },
      },
    };

    const res = await callGemini(geminiBody, apiKey);
    if (!res.ok) {
      const errText = await res.text();
      console.error("Gemini error:", res.status, errText);
      const friendly =
        res.status === 429 ? "AI is briefly busy — please try again in a few seconds."
        : res.status === 503 ? "AI service is temporarily unavailable. Try again shortly."
        : "AI service error. Please try again.";
      return new Response(
        JSON.stringify({ error: friendly, status: res.status }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = await res.json();
    const candidate = data?.candidates?.[0];
    const finishReason: string | undefined = candidate?.finishReason;
    const text: string | undefined =
      candidate?.content?.parts?.find((p: any) => typeof p.text === "string")?.text;

    if (!text) {
      console.error("No text returned:", JSON.stringify(data).slice(0, 500), "finish:", finishReason);
      return new Response(
        JSON.stringify({ error: "AI returned an empty response. Please try again." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch {
      // Attempt to recover from a truncated JSON by closing open braces/brackets.
      const salvaged = trySalvageJson(text);
      if (salvaged) {
        parsed = salvaged;
      } else {
        console.error("JSON parse failed (finish:", finishReason, "):", text.slice(0, 500));
        return new Response(
          JSON.stringify({ error: "AI response was cut short. Please try again." }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    // Defensive: ensure array fields exist so the client can render safely.
    const safe = {
      headline: String(parsed.headline ?? "").trim(),
      wins: Array.isArray(parsed.wins) ? parsed.wins.slice(0, 4) : [],
      concerns: Array.isArray(parsed.concerns) ? parsed.concerns.slice(0, 4) : [],
      likely_drivers: Array.isArray(parsed.likely_drivers) ? parsed.likely_drivers.slice(0, 3) : [],
      next_actions: Array.isArray(parsed.next_actions) ? parsed.next_actions.slice(0, 4) : [],
      questions_for_doctor: Array.isArray(parsed.questions_for_doctor) ? parsed.questions_for_doctor.slice(0, 3) : [],
    };

    return new Response(JSON.stringify(safe), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("compare-results error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message || "unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
