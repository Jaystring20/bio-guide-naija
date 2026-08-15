// Fallback path for Gemini calls.
//
// The app normally calls Google's Generative Language API directly with the
// GOOGLE_GEMINI_API_KEY. When that key is out of credits (HTTP 429
// RESOURCE_EXHAUSTED) or otherwise unusable, every lab analysis fails. This
// module re-issues the SAME Gemini-shaped request through the Lovable AI
// Gateway (OpenAI-compatible) and translates the answer back into the Gemini
// response shape, so callers need no other changes.

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

export const GATEWAY_MODELS = ["google/gemini-2.5-flash", "google/gemini-2.5-flash-lite"];

type AnyRec = Record<string, any>;

function partsToContent(parts: AnyRec[]): any {
  const out: AnyRec[] = [];
  for (const p of parts || []) {
    if (typeof p?.text === "string") {
      out.push({ type: "text", text: p.text });
    } else if (p?.inlineData?.data) {
      out.push({
        type: "image_url",
        image_url: { url: `data:${p.inlineData.mimeType || "image/jpeg"};base64,${p.inlineData.data}` },
      });
    }
  }
  if (out.length === 1 && out[0].type === "text") return out[0].text;
  return out;
}

/** Translate a Gemini generateContent body into an OpenAI-compatible payload. */
export function toGatewayBody(geminiBody: AnyRec, model: string): AnyRec {
  const messages: AnyRec[] = [];

  const sysText = (geminiBody?.systemInstruction?.parts || [])
    .map((p: AnyRec) => p?.text)
    .filter(Boolean)
    .join("\n\n");
  if (sysText) messages.push({ role: "system", content: sysText });

  for (const c of geminiBody?.contents || []) {
    messages.push({
      role: c?.role === "model" ? "assistant" : "user",
      content: partsToContent(c?.parts || []),
    });
  }

  const body: AnyRec = { model, messages };

  const decls = geminiBody?.tools?.[0]?.functionDeclarations;
  if (Array.isArray(decls) && decls.length) {
    body.tools = decls.map((d: AnyRec) => ({
      type: "function",
      function: { name: d.name, description: d.description, parameters: d.parameters },
    }));
    const forced = geminiBody?.toolConfig?.functionCallingConfig?.allowedFunctionNames?.[0];
    body.tool_choice = forced
      ? { type: "function", function: { name: forced } }
      : "auto";
  }

  const gc = geminiBody?.generationConfig || {};
  if (gc.maxOutputTokens) body.max_tokens = gc.maxOutputTokens;
  if (typeof gc.temperature === "number") body.temperature = gc.temperature;
  if (gc.responseMimeType === "application/json" && !body.tools) {
    body.response_format = { type: "json_object" };
  }

  return body;
}

/** Translate an OpenAI-compatible answer back into Gemini's response shape. */
export function toGeminiShape(openai: AnyRec): AnyRec {
  const msg = openai?.choices?.[0]?.message || {};
  const parts: AnyRec[] = [];

  const call = msg?.tool_calls?.[0];
  if (call?.function) {
    let args: any = {};
    try {
      args = typeof call.function.arguments === "string"
        ? JSON.parse(call.function.arguments)
        : (call.function.arguments || {});
    } catch {
      args = {};
    }
    parts.push({ functionCall: { name: call.function.name, args } });
  }
  if (typeof msg?.content === "string" && msg.content.length) {
    parts.push({ text: msg.content });
  }

  return {
    candidates: [{ content: { role: "model", parts }, finishReason: openai?.choices?.[0]?.finish_reason }],
    usageMetadata: openai?.usage,
    _via: "lovable-gateway",
  };
}

/**
 * Call the Lovable AI Gateway with a Gemini-shaped body.
 * Returns a Response whose JSON body matches Gemini's generateContent output,
 * so existing parsers (extractFunctionCall etc.) keep working.
 */
export async function callGatewayAsGemini(
  geminiBody: unknown,
  opts: { timeoutMs?: number; models?: string[] } = {},
): Promise<{ response: Response; model: string }> {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) throw new Error("LOVABLE_API_KEY not configured (gateway fallback unavailable)");

  const models = opts.models || GATEWAY_MODELS;
  const timeoutMs = opts.timeoutMs ?? 30_000;
  let lastStatus = 0;
  let lastBody = "";

  for (const model of models) {
    try {
      const res = await fetch(GATEWAY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify(toGatewayBody(geminiBody as AnyRec, model)),
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!res.ok) {
        lastStatus = res.status;
        lastBody = (await res.text()).slice(0, 300);
        console.log(`gateway ${model} failed ${lastStatus}: ${lastBody}`);
        continue;
      }
      const json = await res.json();
      const shaped = toGeminiShape(json);
      return {
        response: new Response(JSON.stringify(shaped), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
        model: `gateway:${model}`,
      };
    } catch (e) {
      lastBody = (e as Error).message;
      console.log(`gateway ${model} threw: ${lastBody}`);
    }
  }

  throw new Error(`gateway_unavailable${lastStatus ? `_http_${lastStatus}` : ""}: ${lastBody}`);
}
