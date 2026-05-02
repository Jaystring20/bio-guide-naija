// admin-regenerate-diet
// Admin-only wrapper that re-invokes the existing regenerate-diet function on
// behalf of any user. Verifies the caller has the 'admin' role before calling.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify caller
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const adminId = claimsData.claims.sub as string;

    // Service-role client to check role + perform writes
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: roleRows, error: roleErr } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", adminId)
      .eq("role", "admin");
    if (roleErr || !roleRows?.length) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { labResultId } = await req.json();
    if (!labResultId || typeof labResultId !== "string") {
      return new Response(JSON.stringify({ error: "labResultId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Reset diet status so the existing regenerate-diet function will run cleanly.
    await admin
      .from("lab_results")
      .update({ diet_status: "pending", checklist_status: "pending" })
      .eq("id", labResultId);

    // Append audit log
    const { data: row } = await admin
      .from("lab_results")
      .select("processing_steps")
      .eq("id", labResultId)
      .single();
    const steps = Array.isArray((row as any)?.processing_steps) ? (row as any).processing_steps : [];
    steps.push({
      step: "admin_regenerate_diet",
      ms: 0,
      ok: true,
      note: `triggered by admin ${adminId} at ${new Date().toISOString()}`,
    });
    await admin.from("lab_results").update({ processing_steps: steps }).eq("id", labResultId);

    // Invoke regenerate-diet with service role so it can act on any user's row.
    const invokeRes = await fetch(`${SUPABASE_URL}/functions/v1/regenerate-diet`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SERVICE_ROLE}`,
        apikey: SERVICE_ROLE,
      },
      body: JSON.stringify({ labResultId, _adminOverride: true }),
    });

    const text = await invokeRes.text();
    return new Response(
      JSON.stringify({ ok: invokeRes.ok, status: invokeRes.status, downstream: text }),
      {
        status: invokeRes.ok ? 200 : 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (e) {
    console.error("admin-regenerate-diet error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
