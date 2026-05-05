// Hourly cron: send feedback-request emails to:
//   1) Users who got a completed lab result 24-72h ago and haven't given feedback for it.
//   2) Users who signed up 3+ days ago, never uploaded, and were never asked.
// Each recipient is stamped after a successful enqueue so they're never re-asked for the same trigger.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE_URL = "https://getveridia.app";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  const summary = { post_result_sent: 0, post_signup_sent: 0, errors: [] as string[] };

  // ---- 1) Post-result feedback: completed reports between 24h and 72h ago, no feedback yet, not stamped.
  try {
    const since = new Date(Date.now() - 72 * 3600 * 1000).toISOString();
    const until = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const { data: results, error } = await supabase
      .from("lab_results")
      .select("id, user_id, upload_date")
      .eq("status", "completed")
      .gte("upload_date", since)
      .lte("upload_date", until)
      .is("feedback_email_sent_at", null)
      .limit(50);
    if (error) throw error;

    for (const r of results || []) {
      // Skip if user already left feedback on this report.
      const { count } = await supabase
        .from("feedback")
        .select("id", { count: "exact", head: true })
        .eq("result_id", r.id);
      if ((count ?? 0) > 0) {
        await supabase.from("lab_results").update({ feedback_email_sent_at: new Date().toISOString() }).eq("id", r.id);
        continue;
      }

      const { data: u } = await supabase.auth.admin.getUserById(r.user_id);
      const email = u?.user?.email;
      if (!email) continue;

      const { data: prof } = await supabase.from("profiles").select("full_name").eq("user_id", r.user_id).maybeSingle();
      const firstName = (prof?.full_name || "").split(" ")[0] || undefined;

      const { error: invokeErr } = await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "feedback-request",
          recipientEmail: email,
          idempotencyKey: `fb-post-result-${r.id}`,
          templateData: {
            name: firstName,
            variant: "post_result",
            ctaUrl: `${SITE_URL}/app/result/${r.id}?fb=1`,
          },
        },
      });
      if (invokeErr) {
        summary.errors.push(`result ${r.id}: ${invokeErr.message}`);
        continue;
      }
      await supabase.from("lab_results").update({ feedback_email_sent_at: new Date().toISOString() }).eq("id", r.id);
      summary.post_result_sent++;
    }
  } catch (e) {
    summary.errors.push(`post_result: ${(e as Error).message}`);
  }

  // ---- 2) Post-signup nudge: account 3+ days old, no lab result, no prior nudge.
  try {
    const cutoff = new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString();
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("user_id, full_name, created_at")
      .lt("created_at", cutoff)
      .is("feedback_signup_email_sent_at", null)
      .limit(50);
    if (error) throw error;

    for (const p of profiles || []) {
      const { count: labCount } = await supabase
        .from("lab_results")
        .select("id", { count: "exact", head: true })
        .eq("user_id", p.user_id);
      if ((labCount ?? 0) > 0) {
        await supabase.from("profiles").update({ feedback_signup_email_sent_at: new Date().toISOString() }).eq("user_id", p.user_id);
        continue;
      }
      const { count: fbCount } = await supabase
        .from("feedback")
        .select("id", { count: "exact", head: true })
        .eq("user_id", p.user_id);
      if ((fbCount ?? 0) > 0) {
        await supabase.from("profiles").update({ feedback_signup_email_sent_at: new Date().toISOString() }).eq("user_id", p.user_id);
        continue;
      }

      const { data: u } = await supabase.auth.admin.getUserById(p.user_id);
      const email = u?.user?.email;
      if (!email) continue;

      const firstName = (p.full_name || "").split(" ")[0] || undefined;
      const { error: invokeErr } = await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "feedback-request",
          recipientEmail: email,
          idempotencyKey: `fb-post-signup-${p.user_id}`,
          templateData: {
            name: firstName,
            variant: "post_signup",
            ctaUrl: `${SITE_URL}/app?fb=1`,
          },
        },
      });
      if (invokeErr) {
        summary.errors.push(`signup ${p.user_id}: ${invokeErr.message}`);
        continue;
      }
      await supabase.from("profiles").update({ feedback_signup_email_sent_at: new Date().toISOString() }).eq("user_id", p.user_id);
      summary.post_signup_sent++;
    }
  } catch (e) {
    summary.errors.push(`post_signup: ${(e as Error).message}`);
  }

  return new Response(JSON.stringify(summary), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
});
