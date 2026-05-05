// Support contact details. Update SUPPORT_WHATSAPP_NUMBER in one place.
// Format: full E.164 without the leading "+" (per https://wa.me/ spec).
export const SUPPORT_WHATSAPP_NUMBER = "2348038838094";

export interface WhatsAppContext {
  name?: string | null;
  resultId?: string | null;
  reason?: string | null;
  uploadDate?: string | null;
  language?: "en" | "pidgin";
  biomarkerCount?: number | null;
  /** Override device language; defaults to navigator.language at call time. */
  deviceLanguage?: string | null;
}

const detectDeviceLanguage = (): string | null => {
  if (typeof navigator === "undefined") return null;
  return navigator.language || (navigator.languages && navigator.languages[0]) || null;
};

export const buildWhatsAppUrl = (ctx: WhatsAppContext = {}): string => {
  const isPidgin = ctx.language === "pidgin";
  const lines: string[] = [];
  lines.push(
    isPidgin
      ? "Hello VeriDIA, I need help for my lab upload."
      : "Hi VeriDIA, I need help with my lab upload.",
  );
  lines.push("");
  lines.push(isPidgin ? "— My details —" : "— My details —");
  if (ctx.name) lines.push(`${isPidgin ? "Name" : "Name"}: ${ctx.name}`);

  const deviceLang = ctx.deviceLanguage ?? detectDeviceLanguage();
  if (deviceLang) lines.push(`${isPidgin ? "Phone language" : "Device language"}: ${deviceLang}`);
  lines.push(`${isPidgin ? "App language" : "App language"}: ${isPidgin ? "Pidgin" : "English"}`);

  if (ctx.resultId) lines.push(`${isPidgin ? "Result ID" : "Result ID"}: ${ctx.resultId}`);
  if (ctx.uploadDate) {
    const d = new Date(ctx.uploadDate);
    const pretty = isNaN(d.getTime()) ? ctx.uploadDate : d.toISOString();
    lines.push(`${isPidgin ? "Uploaded" : "Uploaded"}: ${pretty}`);
  }
  if (typeof ctx.biomarkerCount === "number") {
    lines.push(`${isPidgin ? "Biomarkers wey we read" : "Biomarkers detected"}: ${ctx.biomarkerCount}`);
  }
  if (ctx.reason) lines.push(`${isPidgin ? "Wetin happen" : "Error"}: ${ctx.reason}`);

  const text = encodeURIComponent(lines.join("\n"));
  return `https://wa.me/${SUPPORT_WHATSAPP_NUMBER}?text=${text}`;
};
