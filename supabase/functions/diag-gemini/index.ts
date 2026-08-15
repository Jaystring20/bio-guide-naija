import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callGatewayAsGemini } from "../_shared/gemini-gateway.ts";

// Temporary diagnostics: verifies whether direct Google access works and whether
// the Lovable AI Gateway fallback can satisfy a function-calling request.
serve(async () => {
  const out: Record<string, unknown> = {};
  const key = Deno.env.get("GOOGLE_GEMINI_API_KEY");
  out.hasGoogleKey = !!key;

  if (key) {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: "say ok" }] }] }),
      },
    );
    out.directStatus = r.status;
    out.directBody = (await r.text()).slice(0, 200);
  }

  const body = {
    systemInstruction: { parts: [{ text: "You must call the tool." }] },
    contents: [{ role: "user", parts: [{ text: "Report glucose 5.5 mmol/L as normal." }] }],
    tools: [{
      functionDeclarations: [{
        name: "submit_lab_interpretation",
        description: "Submit interpretation",
        parameters: {
          type: "object",
          properties: {
            summary: { type: "string" },
            biomarkers: {
              type: "array",
              items: {
                type: "object",
                properties: { name: { type: "string" }, value: { type: "number" }, status: { type: "string" } },
                required: ["name", "value", "status"],
              },
            },
          },
          required: ["summary", "biomarkers"],
        },
      }],
    }],
    toolConfig: { functionCallingConfig: { mode: "ANY", allowedFunctionNames: ["submit_lab_interpretation"] } },
  };

  try {
    const { response, model } = await callGatewayAsGemini(body, { timeoutMs: 30_000 });
    out.gatewayModel = model;
    out.gatewayShaped = await response.json();
  } catch (e) {
    out.gatewayError = (e as Error).message;
  }

  return new Response(JSON.stringify(out, null, 2), {
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
});
