// admin-issue-action
// Admin-only: run a recovery action AND log it on the linked issue's timeline.
// Supported actions: regenerate_diet, set_status_failed, set_status_completed.
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
      return json({ error: "Unauthorized" }, 401);
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) return json({ error: "Unauthorized" }, 401);
    const adminId = claimsData.claims.sub as string;

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: roleRows } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", adminId)
      .eq("role", "admin");
    if (!roleRows?.length) return json({ error: "Forbidden" }, 403);

    const { issueId, action, note } = await req.json();
    if (!issueId || !action) {
      return json({ error: "issueId and action required" }, 400);
    }
    const ALLOWED = new Set(["regenerate_diet", "set_status_failed", "set_status_completed"]);
    if (!ALLOWED.has(action)) {
      return json({ error: "Unsupported action" }, 400);
    }

    // Load issue to get linked lab_result_id
    const { data: issue, error: issueErr } = await admin
      .from("support_issues")
      .select("id, lab_result_id, status")
      .eq("id", issueId)
      .single();
    if (issueErr || !issue) return json({ error: "Issue not found" }, 404);
    if (!issue.lab_result_id) return json({ error: "Issue has no linked report" }, 400);

    let outcome: any = { ok: true };
    let actionKey = action;

    if (action === "regenerate_diet") {
      await admin
        .from("lab_results")
        .update({ diet_status: "pending", checklist_status: "pending" })
        .eq("id", issue.lab_result_id);

      const invokeRes = await fetch(`${SUPABASE_URL}/functions/v1/regenerate-diet`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SERVICE_ROLE}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ labResultId: issue.lab_result_id, _adminOverride: true }),
      });
      const txt = await invokeRes.text();
      outcome = { ok: invokeRes.ok, status: invokeRes.status, body: txt.slice(0, 500) };
      actionKey = "regenerate-diet";
    } else if (action === "set_status_failed" || action === "set_status_completed") {
      const newStatus = action === "set_status_failed" ? "failed" : "completed";
      const { data: row } = await admin
        .from("lab_results")
        .select("processing_steps")
        .eq("id", issue.lab_result_id)
        .single();
      const steps = Array.isArray((row as any)?.processing_steps) ? (row as any).processing_steps : [];
      steps.push({
        step: newStatus === "failed" ? "admin_mark_failed" : "admin_force_complete",
        ms: 0,
        ok: true,
        note: `via issue ${issueId} by admin ${adminId} at ${new Date().toISOString()}`,
      });
      const { error: updErr } = await admin
        .from("lab_results")
        .update({ status: newStatus, processing_steps: steps })
        .eq("id", issue.lab_result_id);
      if (updErr) return json({ error: updErr.message }, 500);
      outcome = { ok: true, status: newStatus };
      actionKey = `set-status:${newStatus}`;

      // Auto-move issue into in_progress so admins know we acted.
      if (issue.status === "open") {
        await admin.from("support_issues").update({ status: "in_progress" }).eq("id", issueId);
      }
    }

    // Append timeline event
    await admin.from("support_issue_events").insert({
      issue_id: issueId,
      actor_id: adminId,
      event_type: "action_taken",
      action_key: actionKey,
      note: note || null,
      metadata: outcome,
    });

    return json({ ok: true, action: actionKey, outcome });
  } catch (e) {
    console.error("admin-issue-action error:", e);
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
