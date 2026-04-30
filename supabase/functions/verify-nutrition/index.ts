// supabase/functions/verify-nutrition/index.ts
// For each food in a lab result's dietary_plan, queries USDA FoodData Central
// to get a canonical name + key nutrients + a citation URL. Writes the result
// into lab_results.nutrition_citations as a map of { [foodName]: NutritionCitation }.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FDC_BASE = "https://api.nal.usda.gov/fdc/v1";
// We surface the most user-meaningful nutrients first.
const KEY_NUTRIENT_IDS: Record<string, { name: string; unit: string }> = {
  "1003": { name: "Protein", unit: "g" },
  "1004": { name: "Fat", unit: "g" },
  "1005": { name: "Carbs", unit: "g" },
  "1008": { name: "Energy", unit: "kcal" },
  "1079": { name: "Fiber", unit: "g" },
  "1089": { name: "Iron", unit: "mg" },
  "1087": { name: "Calcium", unit: "mg" },
  "1092": { name: "Potassium", unit: "mg" },
  "1093": { name: "Sodium", unit: "mg" },
  "1162": { name: "Vitamin C", unit: "mg" },
  "1114": { name: "Vitamin D", unit: "µg" },
  "1178": { name: "Vitamin B12", unit: "µg" },
};

// Foods we care about most (for ordering)
const PRIORITY_NUTRIENT_ORDER = ["1089", "1087", "1092", "1162", "1178", "1114", "1079", "1003", "1005", "1008", "1004", "1093"];

type Food = { name: string; local_name?: string };
type Citation = {
  fdc_id: number;
  official_name: string;
  url: string;
  key_nutrients: Array<{ name: string; amount: number; unit: string }>;
};

async function lookupFood(name: string, apiKey: string): Promise<Citation | null> {
  try {
    const url = `${FDC_BASE}/foods/search?api_key=${apiKey}&query=${encodeURIComponent(name)}&pageSize=1&dataType=Foundation,SR%20Legacy,Survey%20%28FNDDS%29`;
    const r = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!r.ok) {
      console.log(`USDA lookup failed for "${name}": ${r.status}`);
      return null;
    }
    const data = await r.json();
    const top = data?.foods?.[0];
    if (!top || !top.fdcId) return null;

    const nutrients: Array<{ name: string; amount: number; unit: string }> = [];
    const seen = new Set<string>();
    for (const id of PRIORITY_NUTRIENT_ORDER) {
      if (seen.has(id)) continue;
      const meta = KEY_NUTRIENT_IDS[id];
      if (!meta) continue;
      const found = (top.foodNutrients || []).find((n: any) => String(n.nutrientId) === id);
      if (found && typeof found.value === "number" && found.value > 0) {
        nutrients.push({
          name: meta.name,
          amount: Math.round(found.value * 10) / 10,
          unit: meta.unit,
        });
        seen.add(id);
        if (nutrients.length >= 3) break;
      }
    }

    return {
      fdc_id: top.fdcId,
      official_name: top.description || name,
      url: `https://fdc.nal.usda.gov/food-details/${top.fdcId}/nutrients`,
      key_nutrients: nutrients,
    };
  } catch (e) {
    console.log(`USDA lookup error for "${name}":`, (e as Error).message);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { labResultId } = await req.json();
    if (!labResultId || typeof labResultId !== "string") {
      return new Response(JSON.stringify({ error: "labResultId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("USDA_FDC_API_KEY");
    if (!apiKey) {
      console.error("USDA_FDC_API_KEY not configured");
      return new Response(JSON.stringify({ error: "USDA_FDC_API_KEY missing" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Mark in-progress
    await supabase.from("lab_results").update({ nutrition_status: "pending" }).eq("id", labResultId);

    const { data: result, error: fetchErr } = await supabase
      .from("lab_results")
      .select("dietary_plan")
      .eq("id", labResultId)
      .maybeSingle();
    if (fetchErr || !result) {
      console.error("verify-nutrition: row not found", fetchErr);
      await supabase.from("lab_results").update({ nutrition_status: "failed" }).eq("id", labResultId);
      return new Response(JSON.stringify({ error: "result not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const plan: any = result.dietary_plan || {};
    const allFoods: Food[] = [
      ...(plan.foods_to_increase || []),
      ...(plan.foods_to_reduce || []),
      ...(plan.foods_to_avoid || []),
    ];

    if (allFoods.length === 0) {
      await supabase.from("lab_results").update({ nutrition_status: "done", nutrition_citations: {} }).eq("id", labResultId);
      return new Response(JSON.stringify({ success: true, count: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Sequential to respect USDA rate limits (1000/hr default).
    const citations: Record<string, Citation> = {};
    for (const f of allFoods) {
      if (!f?.name) continue;
      if (citations[f.name]) continue; // dedupe
      const c = await lookupFood(f.name, apiKey);
      if (c) citations[f.name] = c;
      // tiny delay to be polite
      await new Promise((r) => setTimeout(r, 80));
    }

    await supabase
      .from("lab_results")
      .update({
        nutrition_citations: citations,
        nutrition_status: "done",
      })
      .eq("id", labResultId);

    return new Response(JSON.stringify({ success: true, count: Object.keys(citations).length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("verify-nutrition error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
