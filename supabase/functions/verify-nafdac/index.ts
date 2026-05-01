// supabase/functions/verify-nafdac/index.ts
// Cross-checks each food and supplement in a lab result's dietary_plan against
// the NAFDAC Greenbook (Nigeria's official registered product database).
// Writes per-item citations to lab_results.nafdac_citations and tracks status.
//
// IMPORTANT design note:
// NAFDAC Greenbook lists branded, registered products (drugs, supplements,
// packaged foods, medical devices) — not generic raw foods like "ugu leaves".
// Misses are EXPECTED and silent. We only surface a badge when there's a real
// match. Failures never break the diet plan UI.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Greenbook server-side DataTables endpoint. Discovered by inspecting
// https://greenbook.nafdac.gov.ng/ — root accepts XHR with DataTables params
// and returns JSON. No auth required.
const GREENBOOK_URL = "https://greenbook.nafdac.gov.ng/";
const GREENBOOK_PRODUCT_BASE = "https://greenbook.nafdac.gov.ng/products/details/";
const GREENBOOK_SEARCH_BASE = "https://greenbook.nafdac.gov.ng/?search=";

const REQUEST_TIMEOUT_MS = 8_000;
const POLITE_DELAY_MS = 150;
const MAX_LOOKUPS = 25; // hard cap so a huge plan can't hammer NAFDAC

type Food = { name: string; local_name?: string };
type NafdacCitation = {
  product_id: number;
  product_name: string;
  nrn: string;
  applicant: string;
  approval_date: string | null;
  status: "Active";
  url: string;
  matched_term: string;
  source: "food" | "supplement";
};

// Strip Greenbook's internal markers ("##", "**") used to flag flagged products.
function cleanProductName(raw: string): string {
  return (raw || "").replaceAll("#", "").replaceAll("*", "").trim();
}

// Pull the first noun phrase from a free-form supplement note.
// e.g. "Iron supplement: take with vitamin C for better absorption" -> "Iron supplement"
//      "Consider Vitamin D3 (1000 IU) daily" -> "Vitamin D3"
function parseSupplementTerm(note: string): string | null {
  if (!note || typeof note !== "string") return null;
  const trimmed = note.trim();
  if (!trimmed) return null;
  // Cut at first colon, dash, or period.
  let term = trimmed.split(/[:.\-—–]/, 1)[0].trim();
  // Strip leading filler words.
  term = term.replace(/^(consider|take|try|add|use|recommend(?:ed)?|optional|maybe)\s+/i, "");
  // Strip trailing parenthesized dose/qualifier.
  term = term.replace(/\s*\([^)]*\)\s*$/g, "").trim();
  // Cap length so we don't search a whole sentence.
  if (term.length > 60) term = term.slice(0, 60);
  return term.length >= 3 ? term : null;
}

async function searchGreenbook(term: string): Promise<NafdacCitation | null> {
  try {
    const params = new URLSearchParams({
      draw: "1",
      start: "0",
      length: "5",
      "search[value]": term,
      "search[regex]": "false",
    });
    const res = await fetch(`${GREENBOOK_URL}?${params.toString()}`, {
      method: "GET",
      headers: {
        "X-Requested-With": "XMLHttpRequest",
        "Accept": "application/json, text/javascript, */*; q=0.01",
        "User-Agent": "Mozilla/5.0 (compatible; VeriDIA/1.0; +https://getveridia.app)",
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!res.ok) {
      console.log(`NAFDAC search "${term}" -> HTTP ${res.status}`);
      return null;
    }

    const data = await res.json().catch(() => null);
    const rows: any[] = Array.isArray(data?.data) ? data.data : [];
    // Prefer Active registrations; ignore Inactive/expired so we never claim
    // a stale registration is "verified".
    const active = rows.find((r) => (r?.status ?? "").toLowerCase() === "active");
    const top = active ?? null;
    if (!top || !top.product_id) return null;

    return {
      product_id: Number(top.product_id),
      product_name: cleanProductName(top.product_name),
      nrn: String(top.NAFDAC ?? "").trim(),
      applicant: String(top?.applicant?.name ?? "").trim(),
      approval_date: top.approval_date ?? null,
      status: "Active",
      url: `${GREENBOOK_PRODUCT_BASE}${top.product_id}`,
      matched_term: term,
      source: "food", // overwritten by caller for supplements
    };
  } catch (e) {
    console.log(`NAFDAC search error for "${term}":`, (e as Error).message);
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

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    await supabase.from("lab_results").update({ nafdac_status: "pending" }).eq("id", labResultId);

    const { data: result, error: fetchErr } = await supabase
      .from("lab_results")
      .select("dietary_plan")
      .eq("id", labResultId)
      .maybeSingle();

    if (fetchErr || !result) {
      console.error("verify-nafdac: row not found", fetchErr);
      await supabase.from("lab_results").update({ nafdac_status: "failed" }).eq("id", labResultId);
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
    const supplementNotes: string[] = Array.isArray(plan.supplement_notes) ? plan.supplement_notes : [];

    // Build the lookup queue: food name keyed by f.name, supplement keyed by raw note.
    type Job = { key: string; term: string; source: "food" | "supplement" };
    const jobs: Job[] = [];
    const seenKeys = new Set<string>();

    for (const f of foods) {
      if (!f?.name) continue;
      if (seenKeys.has(f.name)) continue;
      seenKeys.add(f.name);
      jobs.push({ key: f.name, term: f.name, source: "food" });
    }
    for (const note of supplementNotes) {
      const term = parseSupplementTerm(note);
      if (!term) continue;
      if (seenKeys.has(note)) continue;
      seenKeys.add(note);
      jobs.push({ key: note, term, source: "supplement" });
    }

    if (jobs.length === 0) {
      await supabase.from("lab_results").update({
        nafdac_status: "done",
        nafdac_citations: {},
      }).eq("id", labResultId);
      return new Response(JSON.stringify({ success: true, count: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const citations: Record<string, NafdacCitation> = {};
    let hits = 0;
    let lookups = 0;

    for (const job of jobs) {
      if (lookups >= MAX_LOOKUPS) break;
      lookups++;
      const c = await searchGreenbook(job.term);
      if (c) {
        c.source = job.source;
        citations[job.key] = c;
        hits++;
      }
      // Be polite to a public gov.ng endpoint.
      await new Promise((r) => setTimeout(r, POLITE_DELAY_MS));
    }

    await supabase
      .from("lab_results")
      .update({
        nafdac_citations: citations,
        nafdac_status: "done",
      })
      .eq("id", labResultId);

    console.log(`verify-nafdac: ${hits}/${lookups} hits for ${labResultId}`);
    return new Response(JSON.stringify({ success: true, hits, lookups }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("verify-nafdac error:", e);
    // Best-effort mark failed so the UI hides the loading pill.
    try {
      const body = await req.clone().json().catch(() => ({}));
      if (body?.labResultId) {
        const supabase = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
        );
        await supabase.from("lab_results").update({ nafdac_status: "failed" }).eq("id", body.labResultId);
      }
    } catch (_) { /* ignore */ }
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// Export Greenbook search URL builder so the frontend can deep-link if desired.
export { GREENBOOK_SEARCH_BASE };
