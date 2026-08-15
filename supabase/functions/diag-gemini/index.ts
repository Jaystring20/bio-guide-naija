import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async () => {
  const key = Deno.env.get("GOOGLE_GEMINI_API_KEY");
  const out: Record<string, unknown> = { hasKey: !!key, keyLen: key?.length ?? 0 };
  if (key) {
    try {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
      out.listStatus = r.status;
      const t = await r.text();
      out.listBody = t.slice(0, 500);
    } catch (e) {
      out.listError = (e as Error).message;
    }
    for (const m of ["gemini-2.5-flash", "gemini-2.5-flash-lite"]) {
      try {
        const r = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${key}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: "say ok" }] }] }),
          },
        );
        out[m] = { status: r.status, body: (await r.text()).slice(0, 300) };
      } catch (e) {
        out[m] = { error: (e as Error).message };
      }
    }
  }
  const lk = Deno.env.get("LOVABLE_API_KEY");
  out.hasLovableKey = !!lk;
  return new Response(JSON.stringify(out, null, 2), {
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
});
