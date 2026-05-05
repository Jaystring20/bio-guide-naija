// Support contact details. Update SUPPORT_WHATSAPP_NUMBER in one place.
// Format: full E.164 without the leading "+" (per https://wa.me/ spec).
export const SUPPORT_WHATSAPP_NUMBER = "2348012345678"; // TODO: replace with real VeriDIA support number

export interface WhatsAppContext {
  name?: string | null;
  resultId?: string | null;
  reason?: string | null;
  uploadDate?: string | null;
  language?: "en" | "pidgin";
}

export const buildWhatsAppUrl = (ctx: WhatsAppContext = {}): string => {
  const lines: string[] = [];
  const greeting =
    ctx.language === "pidgin"
      ? "Hello VeriDIA, I need help for my lab upload."
      : "Hi VeriDIA, I need help with my lab upload.";
  lines.push(greeting);
  if (ctx.name) lines.push(`Name: ${ctx.name}`);
  if (ctx.resultId) lines.push(`Result ID: ${ctx.resultId}`);
  if (ctx.reason) lines.push(`Issue: ${ctx.reason}`);
  if (ctx.uploadDate) lines.push(`Uploaded: ${ctx.uploadDate}`);
  const text = encodeURIComponent(lines.join("\n"));
  return `https://wa.me/${SUPPORT_WHATSAPP_NUMBER}?text=${text}`;
};
