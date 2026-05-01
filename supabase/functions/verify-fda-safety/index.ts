// supabase/functions/verify-fda-safety/index.ts
// Cross-checks each food and supplement in a lab result's dietary_plan against:
//   1) The FDA's curated "Information on Select Dietary Supplement Ingredients"
//      list (static, high-precision — Cat 2/3/4/7 = safety concerns / unlawful).
//   2) The openFDA food/enforcement endpoint for recent Class I recalls
//      (live, secondary signal).
//
// Writes per-item entries to lab_results.fda_safety and tracks fda_safety_status.
// Misses are EXPECTED and silent (most foods are not on any FDA warning list).
// Failures never break the diet plan UI.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  FDA_INGREDIENTS,
  isSafeNutrient,
  matchFdaIngredient,
  type FdaCategory,
  type FdaSeverity,
} from "../_shared/fda-ingredient-list.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const OPENFDA_URL = "https://api.fda.gov/food/enforcement.json";
const REQUEST_TIMEOUT_MS = 8_000;
const POLITE_DELAY_MS = 200;
const MAX_LOOKUPS = 25;

type Food = { name: string; local_name?: string };

type RecallSummary = {
  date: string;        // YYYYMMDD
  reason: string;
  firm: string;
  status: string;
};

type FdaSafetyEntry = {
  matched_term: string;
  severity: FdaSeverity;
  source: "fda_ingredient_list" | "openfda_recall";
  category?: FdaCategory;
  fda_url: string;
  reason_short: string;
  recent_class_i_recalls?: RecallSummary[];
};

const SUPPLEMENT_STOPWORDS = new Set([
  "supplement", "supplements", "tablet", "tablets", "capsule", "capsules",
  "pill", "pills", "syrup", "drops", "powder", "sachet", "daily", "iu",
  "mg", "mcg", "g", "ml", "the", "a", "an", "of", "for", "with", "and",
  "or", "consider", "take", "try", "add", "use", "natural", "your",
  "recommended", "optional", "maybe",
]);

function parseSupplementTerm(note: string): string | null {
  if (!note || typeof note !== "string") return null;
  const trimmed = note.trim();
  if (!trimmed) return null;
  let head = trimmed.split(/[:.\-—–]/, 1)[0].trim();
  head = head.replace(/\s*\([^)]*\)\s*$/g, "").trim();
  const tokens = head
    .split(/\s+/)
    .map((t) => t.replace(/[^\p{L}\p{N}-]/gu, ""))
    .filter((t) => t && !/^\d+$/.test(t) && !SUPPLEMENT_STOPWORDS.has(t.toLowerCase()));
  if (tokens.length === 0) return null;
  // For FDA matching we keep up to 3 tokens — "garcinia cambogia extract"
  // and "bitter orange" need multi-word matching.
  const term = tokens.slice(0, 3).join(" ");
  return term.length >= 3 ? term : null;
}

// 24-month cutoff for openFDA recall recency (YYYYMMDD format).
function recentCutoffYYYYMMDD(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 2);
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
}

async function searchClassIRecalls(term: string): Promise<RecallSummary[]> {
  try {
    const cutoff = recentCutoffYYYYMMDD();
    // openFDA query: product description AND classification AND date range
    const search = `product_description:"${term}"+AND+classification:"Class+I"+AND+recall_initiation_date:[${cutoff}+TO+99991231]`;
    const url = `${OPENFDA_URL}?search=${search}&limit=3`;
    const res = await fetch(url, {
      headers: {
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (compatible; VeriDIA/1.0; +https://getveridia.app)",
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!res.ok) {
      // 404 = no recalls — that's a normal, expected response
      if (res.status === 404) return [];
      console.log(`openFDA "${term}" -> HTTP ${res.status}`);
      return [];
    }
    const data = await res.json().catch(() => null);
    const rows: any[] = Array.isArray(data?.results) ? data.results : [];
    return rows.slice(0, 3).map((r) => ({
      date: String(r?.recall_initiation_date ?? ""),
      reason: String(r?.reason_for_recall ?? "").slice(0, 280),
      firm: String(r?.recalling_firm ?? "").slice(0, 120),
      status: String(r?.status ?? ""),
    }));
  } catch (e) {
    console.log(`openFDA error for "${term}":`, (e as Error).message);
    return [];
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

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    await supabase
      .from("lab_results")
      .update({ fda_safety_status: "pending" })
      .eq("id", labResultId);

    const { data: result, error: fetchErr } = await supabase
      .from("lab_results")
      .select("dietary_plan")
      .eq("id", labResultId)
      .maybeSingle();

    if (fetchErr || !result) {
      console.error("verify-fda-safety: row not found", fetchErr);
      await supabase
        .from("lab_results")
        .update({ fda_safety_status: "failed" })
        .eq("id", labResultId);
      return new Response(JSON.stringify({ error: "result not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const plan: any = result.dietary_plan || {};
    const foods: Food[] = [
      ...(plan.foods_to_increase || []),
      ...(plan.foods_to_reduce || []),
      ...(plan.foods_to_avoid || []),
    ];
    const supplementNotes: string[] = Array.isArray(plan.supplement_notes)
      ? plan.supplement_notes
      : [];

    type Job = { key: string; term: string; isSupplement: boolean };
    const jobs: Job[] = [];
    const seenKeys = new Set<string>();

    for (const f of foods) {
      if (!f?.name) continue;
      if (seenKeys.has(f.name)) continue;
      seenKeys.add(f.name);
      jobs.push({ key: f.name, term: f.name, isSupplement: false });
    }
    for (const note of supplementNotes) {
      if (seenKeys.has(note)) continue;
      const term = parseSupplementTerm(note);
      if (!term) continue;
      seenKeys.add(note);
      jobs.push({ key: note, term, isSupplement: true });
    }

    const safety: Record<string, FdaSafetyEntry> = {};
    let lookups = 0;
    let hits = 0;

    for (const job of jobs) {
      // 1. Safe-nutrient short-circuit — no warning, no API call.
      if (isSafeNutrient(job.term) && !job.isSupplement) {
        continue;
      }

      // 2. FDA ingredient list match (definitive signal).
      const ing = matchFdaIngredient(job.term);
      if (ing) {
        safety[job.key] = {
          matched_term: ing.display,
          severity: ing.severity,
          source: "fda_ingredient_list",
          category: ing.category,
          fda_url: ing.fda_url,
          reason_short: ing.reason_short,
        };
        hits++;
        continue;
      }

      // 3. For SUPPLEMENTS only (foods generate too many false-positive recalls
      //    — e.g. "vitamin d" → 569 brand-level recalls), check Class I recalls.
      if (!job.isSupplement) continue;
      if (lookups >= MAX_LOOKUPS) continue;
      if (isSafeNutrient(job.term)) continue; // safe vitamins / minerals — never recall-flag

      lookups++;
      const recalls = await searchClassIRecalls(job.term);
      await new Promise((r) => setTimeout(r, POLITE_DELAY_MS));

      if (recalls.length > 0) {
        safety[job.key] = {
          matched_term: job.term,
          severity: "medium",
          source: "openfda_recall",
          fda_url: `https://www.accessdata.fda.gov/scripts/ires/index.cfm?Product=${encodeURIComponent(job.term)}`,
          reason_short: `${recalls.length} FDA Class I recall${recalls.length > 1 ? "s" : ""} on file in the last 24 months for products containing this ingredient.`,
          recent_class_i_recalls: recalls,
        };
        hits++;
      }
    }

    await supabase
      .from("lab_results")
      .update({
        fda_safety: safety,
        fda_safety_status: "done",
      })
      .eq("id", labResultId);

    console.log(`verify-fda-safety: ${hits} hits, ${lookups} openFDA lookups for ${labResultId}`);
    return new Response(JSON.stringify({ success: true, hits, lookups }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("verify-fda-safety error:", e);
    try {
      const body = await req.clone().json().catch(() => ({}));
      if (body?.labResultId) {
        const supabase = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
        );
        await supabase
          .from("lab_results")
          .update({ fda_safety_status: "failed" })
          .eq("id", body.labResultId);
      }
    } catch (_) { /* ignore */ }
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// Re-export for any consumers that want to know what's on the static list.
export { FDA_INGREDIENTS };
