import jsPDF from "jspdf";
import {
  Biomarker,
  BiomarkerPidgin,
  DietaryPlan,
  DietaryPlanPidgin,
  ChecklistItem,
  ChecklistItemPidgin,
  Language,
  STATUS_LABELS,
} from "./types";
import {
  ALL_SOURCE_DOMAINS,
  getCitationsForBiomarker,
  hasCuratedCitation,
  getPrimaryDomain,
} from "@/lib/medical-citations";

export type NutritionCitation = {
  query: string;
  official_name?: string | null;
  fdc_id?: number | null;
  url?: string | null;
};

// ─────────────────────────────────────────────────────────────────────────────
// Unified VeriDIA report PDF template.
// One branded layout used for download + WhatsApp + Email + native share so the
// output always looks the same, in the same order, with the same coverage.
// ─────────────────────────────────────────────────────────────────────────────

export interface PDFData {
  language: Language;
  uploadDate: string;
  patientName?: string | null;
  testDate?: string | null;
  hasCriticalAlert?: boolean;
  criticalAlerts?: any[] | null;
  aiSummary: string | null;
  aiSummaryPidgin: string | null;
  biomarkers: Biomarker[];
  biomarkersPidgin: BiomarkerPidgin[] | null;
  dietaryPlan: DietaryPlan | null;
  dietaryPlanPidgin: DietaryPlanPidgin | null;
  checklist: ChecklistItem[];
  checklistPidgin: ChecklistItemPidgin[] | null;
  /** USDA-verified nutrition entries keyed by lowercase food name (optional). */
  nutritionCitations?: NutritionCitation[] | null;
  /** Public URL back to this report (used in share messages). Optional. */
  reportUrl?: string | null;
}

function isStructured(item: ChecklistItem): item is { question: string; context: string; priority: "high" | "medium" | "low" } {
  return typeof item === "object" && item !== null && "question" in item;
}

/** Find a USDA verification entry for a given food name. */
function findUsdaMatch(name: string, list: NutritionCitation[] | null | undefined): NutritionCitation | null {
  if (!name || !list?.length) return null;
  const lower = name.toLowerCase();
  return (
    list.find((n) => n.query?.toLowerCase() === lower) ??
    list.find((n) => lower.includes((n.query || "").toLowerCase()) || (n.query || "").toLowerCase().includes(lower)) ??
    null
  );
}

// Brand palette (RGB) — mirrors index.css tokens.
const BRAND = {
  primary: [46, 204, 113] as [number, number, number],   // Vital Green #2ECC71
  navy: [28, 59, 112] as [number, number, number],       // Clinical Navy #1C3B70
  red: [192, 57, 43] as [number, number, number],        // Emergency Red
  amber: [243, 156, 18] as [number, number, number],     // Alert Amber
  ink: [24, 28, 36] as [number, number, number],
  body: [48, 54, 64] as [number, number, number],
  muted: [120, 128, 140] as [number, number, number],
  hairline: [228, 231, 236] as [number, number, number],
  surface: [247, 249, 251] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
};

const STATUS_RGB: Record<string, [number, number, number]> = {
  normal: BRAND.primary,
  borderline: BRAND.amber,
  "deranged-low": BRAND.red,
  "deranged-high": BRAND.red,
  critical: BRAND.red,
};

const PAGE = { w: 210, h: 297 };
const MARGIN = 15;
const CONTENT_W = PAGE.w - MARGIN * 2;
const HEADER_H = 14;
const FOOTER_H = 14;
const BODY_TOP = HEADER_H + 6;
const BODY_BOTTOM = PAGE.h - FOOTER_H - 4;

interface Ctx {
  doc: jsPDF;
  y: number;
  pageNum: number;
  data: PDFData;
  isPidgin: boolean;
}

function setColor(doc: jsPDF, c: [number, number, number]) {
  doc.setTextColor(c[0], c[1], c[2]);
}
function setFill(doc: jsPDF, c: [number, number, number]) {
  doc.setFillColor(c[0], c[1], c[2]);
}
function setDraw(doc: jsPDF, c: [number, number, number]) {
  doc.setDrawColor(c[0], c[1], c[2]);
}

function drawHeader(ctx: Ctx, totalPages?: number) {
  const { doc, pageNum } = ctx;
  // Brand bar
  setFill(doc, BRAND.primary);
  doc.rect(0, 0, PAGE.w, 4, "F");
  // Wordmark
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  setColor(doc, BRAND.navy);
  doc.text("VeriDIA", MARGIN, 11);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  setColor(doc, BRAND.muted);
  doc.text(ctx.isPidgin ? "Your Health Report" : "Your Health Report", MARGIN + 22, 11);
  // Page indicator (right)
  const pageLabel = totalPages ? `Page ${pageNum} of ${totalPages}` : `Page ${pageNum}`;
  doc.text(pageLabel, PAGE.w - MARGIN - doc.getTextWidth(pageLabel), 11);
  // Hairline
  setDraw(doc, BRAND.hairline);
  doc.setLineWidth(0.2);
  doc.line(MARGIN, HEADER_H, PAGE.w - MARGIN, HEADER_H);
}

function drawFooter(ctx: Ctx) {
  const { doc, isPidgin } = ctx;
  const yLine = PAGE.h - FOOTER_H;
  setDraw(doc, BRAND.hairline);
  doc.setLineWidth(0.2);
  doc.line(MARGIN, yLine, PAGE.w - MARGIN, yLine);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  setColor(doc, BRAND.muted);
  const disclaimer = isPidgin
    ? "Information only o — no be medical advice. Abeg see your doctor."
    : "For information only — not medical advice. Please consult your doctor.";
  doc.text(disclaimer, MARGIN, yLine + 5);
  const right = "getveridia.app";
  doc.text(right, PAGE.w - MARGIN - doc.getTextWidth(right), yLine + 5);
  doc.setFontSize(7);
  doc.text("NDPA 2023 compliant", MARGIN, yLine + 9.5);
}

function newPage(ctx: Ctx) {
  ctx.doc.addPage();
  ctx.pageNum += 1;
  ctx.y = BODY_TOP;
  drawHeader(ctx);
  drawFooter(ctx);
}

function ensureSpace(ctx: Ctx, needed: number) {
  if (ctx.y + needed > BODY_BOTTOM) newPage(ctx);
}

function addParagraph(
  ctx: Ctx,
  text: string,
  opts: { x?: number; size?: number; bold?: boolean; color?: [number, number, number]; maxWidth?: number; lineGap?: number } = {},
) {
  const { doc } = ctx;
  const x = opts.x ?? MARGIN;
  const size = opts.size ?? 10;
  const maxWidth = opts.maxWidth ?? PAGE.w - x - MARGIN;
  doc.setFont("helvetica", opts.bold ? "bold" : "normal");
  doc.setFontSize(size);
  setColor(doc, opts.color ?? BRAND.body);
  const lines = doc.splitTextToSize(text || "", maxWidth) as string[];
  const lineHeight = size * 0.45;
  for (const line of lines) {
    ensureSpace(ctx, lineHeight);
    doc.text(line, x, ctx.y + lineHeight - 1);
    ctx.y += lineHeight;
  }
  ctx.y += opts.lineGap ?? 1.5;
}

function sectionHeading(ctx: Ctx, label: string, color: [number, number, number]) {
  ensureSpace(ctx, 14);
  ctx.y += 3;
  // Pill
  const padX = 3;
  ctx.doc.setFont("helvetica", "bold");
  ctx.doc.setFontSize(11);
  const labelW = ctx.doc.getTextWidth(label);
  setFill(ctx.doc, color);
  (ctx.doc as any).roundedRect(MARGIN, ctx.y, labelW + padX * 2, 7, 2, 2, "F");
  setColor(ctx.doc, BRAND.white);
  ctx.doc.text(label, MARGIN + padX, ctx.y + 5);
  ctx.y += 11;
}

function statusBadge(ctx: Ctx, x: number, y: number, status: string) {
  const color = STATUS_RGB[status] ?? BRAND.muted;
  const label = STATUS_LABELS[status] ?? status;
  ctx.doc.setFont("helvetica", "bold");
  ctx.doc.setFontSize(7.5);
  const w = ctx.doc.getTextWidth(label) + 4;
  setFill(ctx.doc, color);
  (ctx.doc as any).roundedRect(x, y - 3.5, w, 4.8, 1.5, 1.5, "F");
  setColor(ctx.doc, BRAND.white);
  ctx.doc.text(label, x + 2, y);
  return w;
}

function priorityBadge(ctx: Ctx, x: number, y: number, priority: string) {
  const color = priority === "high" ? BRAND.red : priority === "medium" ? BRAND.amber : BRAND.primary;
  const label = priority.toUpperCase();
  ctx.doc.setFont("helvetica", "bold");
  ctx.doc.setFontSize(7);
  const w = ctx.doc.getTextWidth(label) + 4;
  setFill(ctx.doc, color);
  (ctx.doc as any).roundedRect(x, y - 3.2, w, 4.5, 1.5, 1.5, "F");
  setColor(ctx.doc, BRAND.white);
  ctx.doc.text(label, x + 2, y);
  return w;
}

// Cover page with health-score ring.
function drawCover(ctx: Ctx) {
  const { doc, data, isPidgin } = ctx;

  // Brand band
  setFill(doc, BRAND.navy);
  doc.rect(0, 0, PAGE.w, 38, "F");
  setFill(doc, BRAND.primary);
  doc.rect(0, 38, PAGE.w, 2, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  setColor(doc, BRAND.white);
  doc.text("VeriDIA", MARGIN, 18);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(isPidgin ? "Your Health Report" : "Your Health Report", MARGIN, 25);

  const dateStr = new Date(data.uploadDate).toLocaleDateString("en-NG", {
    day: "numeric", month: "long", year: "numeric",
  });
  doc.setFontSize(9);
  doc.text(dateStr, PAGE.w - MARGIN - doc.getTextWidth(dateStr), 25);

  ctx.y = 50;

  // Patient block
  if (data.patientName) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    setColor(doc, BRAND.muted);
    doc.text(isPidgin ? "PATIENT" : "PATIENT", MARGIN, ctx.y);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    setColor(doc, BRAND.ink);
    doc.text(data.patientName, MARGIN, ctx.y + 7);
    ctx.y += 14;
  }
  if (data.testDate) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    setColor(doc, BRAND.muted);
    const td = new Date(data.testDate).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" });
    doc.text(`${isPidgin ? "Test date" : "Test date"}: ${td}`, MARGIN, ctx.y);
    ctx.y += 6;
  }

  // Critical alert banner
  if (data.hasCriticalAlert && data.criticalAlerts && data.criticalAlerts.length > 0) {
    ctx.y += 4;
    setFill(doc, BRAND.red);
    (doc as any).roundedRect(MARGIN, ctx.y, CONTENT_W, 22, 3, 3, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    setColor(doc, BRAND.white);
    doc.text(isPidgin ? "⚠ CRITICAL — SEE DOCTOR NOW" : "⚠ CRITICAL — SEE A DOCTOR NOW", MARGIN + 5, ctx.y + 7);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    const names = data.criticalAlerts
      .map((a: any) => a?.name || a?.biomarker || "")
      .filter(Boolean)
      .slice(0, 4)
      .join(" • ");
    if (names) doc.text(names, MARGIN + 5, ctx.y + 14);
    ctx.y += 26;
  }

  // Health score ring
  const total = data.biomarkers.length;
  const normal = data.biomarkers.filter((b) => b.status === "normal").length;
  const borderline = data.biomarkers.filter((b) => b.status === "borderline").length;
  const abnormal = data.biomarkers.filter((b) => ["deranged-low", "deranged-high", "critical"].includes(b.status)).length;
  const score = total > 0 ? Math.round((normal / total) * 100) : 0;

  ctx.y += 6;
  const cx = MARGIN + 28;
  const cy = ctx.y + 28;
  // Outer track
  setDraw(doc, BRAND.hairline);
  doc.setLineWidth(4);
  doc.circle(cx, cy, 22, "S");
  // Filled arc — approximate with line segments
  const ringColor = score >= 70 ? BRAND.primary : score >= 40 ? BRAND.amber : BRAND.red;
  setDraw(doc, ringColor);
  doc.setLineWidth(4);
  const segs = Math.max(1, Math.round((score / 100) * 60));
  for (let i = 0; i < segs; i++) {
    const a1 = -Math.PI / 2 + (i / 60) * Math.PI * 2;
    const a2 = -Math.PI / 2 + ((i + 1) / 60) * Math.PI * 2;
    const x1 = cx + Math.cos(a1) * 22;
    const y1 = cy + Math.sin(a1) * 22;
    const x2 = cx + Math.cos(a2) * 22;
    const y2 = cy + Math.sin(a2) * 22;
    doc.line(x1, y1, x2, y2);
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  setColor(doc, BRAND.ink);
  const scoreText = `${score}%`;
  doc.text(scoreText, cx - doc.getTextWidth(scoreText) / 2, cy + 1);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  setColor(doc, BRAND.muted);
  const lbl = isPidgin ? "Normal" : "Normal";
  doc.text(lbl, cx - doc.getTextWidth(lbl) / 2, cy + 7);

  // Stats column to the right
  const sx = MARGIN + 64;
  let sy = ctx.y + 4;
  const drawStat = (color: [number, number, number], count: number, label: string) => {
    setFill(doc, color);
    (doc as any).roundedRect(sx, sy, 6, 6, 1.5, 1.5, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    setColor(doc, BRAND.ink);
    doc.text(String(count), sx + 10, sy + 5);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    setColor(doc, BRAND.muted);
    doc.text(label, sx + 22, sy + 5);
    sy += 11;
  };
  drawStat(BRAND.primary, normal, isPidgin ? "Normal" : "Normal");
  drawStat(BRAND.amber, borderline, isPidgin ? "Borderline" : "Borderline");
  drawStat(BRAND.red, abnormal, isPidgin ? "Wahala" : "Abnormal");

  ctx.y += 60;

  // AI summary
  const summary = ctx.isPidgin ? data.aiSummaryPidgin || data.aiSummary : data.aiSummary;
  if (summary) {
    setFill(doc, BRAND.surface);
    const summaryLines = doc.splitTextToSize(summary, CONTENT_W - 8) as string[];
    const blockH = 12 + summaryLines.length * 4.6;
    (doc as any).roundedRect(MARGIN, ctx.y, CONTENT_W, blockH, 3, 3, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    setColor(doc, BRAND.navy);
    doc.text(isPidgin ? "WETIN AI TALK" : "AI HEALTH SUMMARY", MARGIN + 5, ctx.y + 7);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    setColor(doc, BRAND.body);
    summaryLines.forEach((line, i) => {
      doc.text(line, MARGIN + 5, ctx.y + 13 + i * 4.6);
    });
    ctx.y += blockH + 4;
  }

  drawFooter(ctx);
}

function renderBiomarkers(ctx: Ctx) {
  const { data, isPidgin, doc } = ctx;
  if (data.biomarkers.length === 0) return;
  sectionHeading(ctx, isPidgin ? "Your Results" : "Biomarker Results", BRAND.navy);

  data.biomarkers.forEach((b) => {
    const pidginB = data.biomarkersPidgin?.find((p) => p.name === b.name);
    ensureSpace(ctx, 26);

    // Name + value row
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    setColor(doc, BRAND.ink);
    doc.text(b.name, MARGIN, ctx.y + 4);

    const valueText = `${b.value} ${b.unit}`;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    setColor(doc, STATUS_RGB[b.status] ?? BRAND.body);
    doc.text(valueText, PAGE.w - MARGIN - doc.getTextWidth(valueText), ctx.y + 4);
    ctx.y += 6;

    // Ref + status badge
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    setColor(doc, BRAND.muted);
    const refText = `${isPidgin ? "Ref" : "Ref"}: ${b.reference_range}`;
    doc.text(refText, MARGIN, ctx.y + 3);
    statusBadge(ctx, MARGIN + doc.getTextWidth(refText) + 4, ctx.y + 3, b.status);
    ctx.y += 5;

    // Explanation
    const explanation = isPidgin && pidginB ? pidginB.explanation : b.explanation;
    if (explanation) addParagraph(ctx, explanation, { size: 9.5, color: BRAND.body });

    // Why it matters
    const why = isPidgin && pidginB ? pidginB.why_it_matters : b.why_it_matters;
    if (why) {
      addParagraph(ctx, isPidgin ? "Why e matter:" : "Why it matters:", {
        size: 8.5, bold: true, color: BRAND.navy, lineGap: 0.5,
      });
      addParagraph(ctx, why, { size: 9, color: BRAND.body });
    }

    // Trend
    const trend = isPidgin && pidginB ? pidginB.trend_context : b.trend_context;
    if (trend) {
      addParagraph(ctx, `↗ ${trend}`, { size: 8.5, color: BRAND.muted });
    }

    // Tip
    const tip = isPidgin && pidginB ? pidginB.lifestyle_tip : b.lifestyle_tip;
    if (tip) {
      addParagraph(ctx, `💡 ${tip}`, { size: 8.5, color: BRAND.muted });
    }

    // Hairline separator
    setDraw(doc, BRAND.hairline);
    doc.setLineWidth(0.2);
    doc.line(MARGIN, ctx.y + 1, PAGE.w - MARGIN, ctx.y + 1);
    ctx.y += 4;
  });
}

function renderDiet(ctx: Ctx) {
  const { data, isPidgin, doc } = ctx;
  const diet = data.dietaryPlan;
  if (!diet) return;
  const pidginDiet = data.dietaryPlanPidgin;

  sectionHeading(ctx, isPidgin ? "Your Diet Plan" : "Your Diet Plan", BRAND.primary);

  const renderFoodList = (
    title: string,
    color: [number, number, number],
    items: Array<{ name: string; local_name?: string; benefit?: string; reason?: string; preparation_tip?: string }> | undefined,
    pidginItems: Array<{ name?: string; benefit?: string; reason?: string; preparation_tip?: string }> | undefined,
  ) => {
    if (!items?.length) return;
    addParagraph(ctx, title, { size: 10.5, bold: true, color, lineGap: 1 });
    items.forEach((f, i) => {
      const pf = pidginItems?.[i];
      const head = `• ${f.name}${f.local_name ? `  (${f.local_name})` : ""}`;
      addParagraph(ctx, head, { size: 9.5, bold: true, color: BRAND.ink, x: MARGIN + 2, lineGap: 0.5 });
      const detail = isPidgin && pf ? pf.benefit ?? pf.reason : f.benefit ?? f.reason;
      if (detail) addParagraph(ctx, detail, { size: 9, color: BRAND.body, x: MARGIN + 6, lineGap: 0.5 });
      const tip = isPidgin && pf?.preparation_tip ? pf.preparation_tip : f.preparation_tip;
      if (tip) addParagraph(ctx, `💡 ${tip}`, { size: 8.5, color: BRAND.muted, x: MARGIN + 6 });
    });
    ctx.y += 2;
  };

  renderFoodList(
    isPidgin ? "✅ Chop More Of This" : "✅ Foods to Eat More",
    BRAND.primary,
    diet.foods_to_increase,
    pidginDiet?.foods_to_increase,
  );
  renderFoodList(
    isPidgin ? "⚠ Reduce This One" : "⚠ Foods to Reduce",
    BRAND.amber,
    diet.foods_to_reduce,
    pidginDiet?.foods_to_reduce,
  );
  renderFoodList(
    isPidgin ? "🚫 No Touch This One" : "🚫 Foods to Avoid",
    BRAND.red,
    diet.foods_to_avoid,
    pidginDiet?.foods_to_avoid,
  );

  // Meal ideas
  if (diet.meal_suggestions?.length) {
    addParagraph(ctx, isPidgin ? "🍽 Food Ideas" : "🍽 Meal Ideas", { size: 10.5, bold: true, color: BRAND.navy });
    diet.meal_suggestions.forEach((m, i) => {
      const pm = pidginDiet?.meal_suggestions?.[i];
      addParagraph(ctx, `• ${m.meal}`, { size: 9.5, bold: true, color: BRAND.ink, x: MARGIN + 2, lineGap: 0.5 });
      const desc = isPidgin && pm ? pm.description : m.description;
      if (desc) addParagraph(ctx, desc, { size: 9, color: BRAND.body, x: MARGIN + 6 });
    });
    ctx.y += 2;
  }

  // Weekly meal plan table
  if (diet.weekly_meal_plan?.length) {
    addParagraph(ctx, isPidgin ? "📅 7-Day Chop Plan" : "📅 7-Day Meal Plan", { size: 10.5, bold: true, color: BRAND.navy });
    const colWidths = [22, (CONTENT_W - 22) / 3, (CONTENT_W - 22) / 3, (CONTENT_W - 22) / 3];
    const headers = isPidgin ? ["Day", "Morning", "Afternoon", "Night"] : ["Day", "Breakfast", "Lunch", "Dinner"];

    // Header row
    ensureSpace(ctx, 8);
    setFill(doc, BRAND.surface);
    doc.rect(MARGIN, ctx.y, CONTENT_W, 7, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    setColor(doc, BRAND.navy);
    let xCursor = MARGIN + 2;
    headers.forEach((h, i) => {
      doc.text(h, xCursor, ctx.y + 5);
      xCursor += colWidths[i];
    });
    ctx.y += 7;

    diet.weekly_meal_plan.forEach((day) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      setColor(doc, BRAND.body);
      const cells = [day.day, day.breakfast, day.lunch, day.dinner];
      const wrapped = cells.map((c, i) => doc.splitTextToSize(String(c || ""), colWidths[i] - 3) as string[]);
      const rowH = Math.max(...wrapped.map((w) => w.length)) * 4 + 3;
      ensureSpace(ctx, rowH);
      setDraw(doc, BRAND.hairline);
      doc.setLineWidth(0.15);
      doc.line(MARGIN, ctx.y, PAGE.w - MARGIN, ctx.y);
      let cx = MARGIN + 2;
      wrapped.forEach((lines, i) => {
        if (i === 0) {
          doc.setFont("helvetica", "bold");
          setColor(doc, BRAND.navy);
        } else {
          doc.setFont("helvetica", "normal");
          setColor(doc, BRAND.body);
        }
        lines.forEach((ln, li) => {
          doc.text(ln, cx, ctx.y + 4 + li * 4);
        });
        cx += colWidths[i];
      });
      ctx.y += rowH;
    });
    ctx.y += 3;
  }

  // Hydration
  if (diet.hydration_tips?.length) {
    addParagraph(ctx, isPidgin ? "💧 Water Matter" : "💧 Hydration Tips", { size: 10.5, bold: true, color: BRAND.navy });
    diet.hydration_tips.forEach((tip, i) => {
      const pt = pidginDiet?.hydration_tips?.[i];
      addParagraph(ctx, `• ${isPidgin && pt ? pt : tip}`, { size: 9, color: BRAND.body, x: MARGIN + 2 });
    });
    ctx.y += 2;
  }

  // Supplements
  if (diet.supplement_notes?.length) {
    addParagraph(ctx, isPidgin ? "🌿 Natural Booster" : "🌿 Natural Supplements", { size: 10.5, bold: true, color: BRAND.navy });
    diet.supplement_notes.forEach((note, i) => {
      const pn = pidginDiet?.supplement_notes?.[i];
      addParagraph(ctx, `• ${isPidgin && pn ? pn : note}`, { size: 9, color: BRAND.body, x: MARGIN + 2 });
    });
  }
}

function renderChecklist(ctx: Ctx) {
  const { data, isPidgin, doc } = ctx;
  if (!data.checklist.length) return;
  sectionHeading(ctx, isPidgin ? "Questions for Doctor" : "Questions for Your Doctor", BRAND.navy);

  data.checklist.forEach((q, i) => {
    const pidginQ = data.checklistPidgin?.[i];
    const structured = isStructured(q);
    const questionText = isPidgin && pidginQ ? pidginQ.question : structured ? q.question : (q as string);
    const context = isPidgin && pidginQ ? pidginQ.context : structured ? q.context : "";
    const priority = structured ? q.priority : null;

    ensureSpace(ctx, 14);
    // Number bubble
    setFill(doc, BRAND.navy);
    doc.circle(MARGIN + 3, ctx.y + 3, 3, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    setColor(doc, BRAND.white);
    const num = String(i + 1);
    doc.text(num, MARGIN + 3 - doc.getTextWidth(num) / 2, ctx.y + 4.2);

    // Question text
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    setColor(doc, BRAND.ink);
    const qLines = doc.splitTextToSize(questionText, CONTENT_W - 24) as string[];
    qLines.forEach((ln, li) => {
      doc.text(ln, MARGIN + 9, ctx.y + 4 + li * 4.4);
    });
    let blockH = qLines.length * 4.4;

    // Priority badge (right aligned)
    if (priority) {
      priorityBadge(ctx, PAGE.w - MARGIN - 14, ctx.y + 4, priority);
    }
    ctx.y += blockH + 1;

    if (context) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      setColor(doc, BRAND.muted);
      const cLines = doc.splitTextToSize(`${isPidgin ? "Why e matter: " : "Why this matters: "}${context}`, CONTENT_W - 12) as string[];
      cLines.forEach((ln) => {
        ensureSpace(ctx, 4);
        doc.text(ln, MARGIN + 9, ctx.y + 3);
        ctx.y += 3.8;
      });
    }
    ctx.y += 3;
  });
}

function renderDisclaimerPage(ctx: Ctx) {
  const { doc, isPidgin } = ctx;
  newPage(ctx);
  sectionHeading(ctx, isPidgin ? "Important Notice" : "Important Notice", BRAND.red);
  addParagraph(ctx,
    isPidgin
      ? "This report na for information only o. E no be medical advice. The AI no fit replace your doctor. Abeg always go see your doctor before you change your medicine, your chop, or your treatment."
      : "This report is for informational purposes only and does not constitute medical advice. AI is not a substitute for a qualified healthcare provider. Always consult your doctor before changing medication, diet, or treatment.",
    { size: 10, color: BRAND.body },
  );
  addParagraph(ctx,
    isPidgin
      ? "Your data dey safe with us. We follow Nigeria Data Protection Act (NDPA 2023). We dey delete your lab pictures after we don read them."
      : "Your data is protected under the Nigeria Data Protection Act (NDPA 2023). Lab images are deleted after processing.",
    { size: 9.5, color: BRAND.muted },
  );
  ctx.y += 4;
  addParagraph(ctx, "Generated by VeriDIA — getveridia.app", { size: 9, color: BRAND.muted });
}

function buildReportPdf(data: PDFData): { doc: jsPDF; fileName: string } {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const ctx: Ctx = {
    doc,
    y: BODY_TOP,
    pageNum: 1,
    data,
    isPidgin: data.language === "pidgin",
  };

  // Cover (no header — uses its own brand band)
  drawCover(ctx);

  // Body sections each start on a new page so the cover stays clean.
  newPage(ctx);
  renderBiomarkers(ctx);

  if (data.dietaryPlan) {
    newPage(ctx);
    renderDiet(ctx);
  }

  if (data.checklist.length > 0) {
    newPage(ctx);
    renderChecklist(ctx);
  }

  renderDisclaimerPage(ctx);

  // Stamp "Page X of Y" by re-drawing headers on every page now that we know totals.
  const total = (doc as any).getNumberOfPages();
  for (let p = 2; p <= total; p++) {
    doc.setPage(p);
    // Wipe old header area then redraw with totals.
    setFill(doc, BRAND.white);
    doc.rect(0, 0, PAGE.w, HEADER_H + 0.5, "F");
    setFill(doc, BRAND.primary);
    doc.rect(0, 0, PAGE.w, 4, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    setColor(doc, BRAND.navy);
    doc.text("VeriDIA", MARGIN, 11);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    setColor(doc, BRAND.muted);
    doc.text(ctx.isPidgin ? "Your Health Report" : "Your Health Report", MARGIN + 22, 11);
    const pageLabel = `Page ${p} of ${total}`;
    doc.text(pageLabel, PAGE.w - MARGIN - doc.getTextWidth(pageLabel), 11);
    setDraw(doc, BRAND.hairline);
    doc.setLineWidth(0.2);
    doc.line(MARGIN, HEADER_H, PAGE.w - MARGIN, HEADER_H);
  }

  const fileName = `VeriDIA-Report-${new Date(data.uploadDate)
    .toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })
    .replace(/\s/g, "-")}.pdf`;

  return { doc, fileName };
}

export function generatePDF(data: PDFData, returnBlob?: boolean): { blob: Blob | null; fileName: string } {
  const { doc, fileName } = buildReportPdf(data);
  if (returnBlob) {
    return { blob: doc.output("blob") as Blob, fileName };
  }
  doc.save(fileName);
  return { blob: null, fileName };
}

/**
 * Short, Nigerian-friendly WhatsApp blurb with vitals snapshot + link back to
 * the report. Pidgin or English depending on the report language. Kept tight
 * so it fits in a WhatsApp preview without truncation.
 */
function buildWhatsAppMessage(data: PDFData): string {
  const isPidgin = data.language === "pidgin";
  const total = data.biomarkers.length;
  const normal = data.biomarkers.filter((b) => b.status === "normal").length;
  const borderline = data.biomarkers.filter((b) => b.status === "borderline").length;
  const abnormal = data.biomarkers.filter((b) => ["deranged-low", "deranged-high", "critical"].includes(b.status)).length;
  const critical = data.biomarkers.filter((b) => b.status === "critical").length;
  const score = total > 0 ? Math.round((normal / total) * 100) : 0;
  const dateStr = new Date(data.uploadDate).toLocaleDateString("en-NG", {
    day: "numeric", month: "short", year: "numeric",
  });

  const link = data.reportUrl || "https://getveridia.app";
  const who = data.patientName ? (isPidgin ? ` for ${data.patientName}` : ` for ${data.patientName}`) : "";

  const lines: string[] = [];
  if (isPidgin) {
    lines.push(`🩺 My VeriDIA lab report${who} (${dateStr})`);
    lines.push(`Health score: ${score}% normal`);
    lines.push(`✅ ${normal} okay  •  ⚠️ ${borderline} borderline  •  🔴 ${abnormal} wahala`);
    if (critical > 0) lines.push(`❗ ${critical} need urgent attention — abeg check am.`);
    lines.push("");
    lines.push(`See full report 👇`);
    lines.push(link);
  } else {
    lines.push(`🩺 My VeriDIA lab report${who} (${dateStr})`);
    lines.push(`Health score: ${score}% normal`);
    lines.push(`✅ ${normal} normal  •  ⚠️ ${borderline} borderline  •  🔴 ${abnormal} abnormal`);
    if (critical > 0) lines.push(`❗ ${critical} need urgent attention — please review.`);
    lines.push("");
    lines.push(`Open the full report 👇`);
    lines.push(link);
  }
  return lines.join("\n");
}

export function buildShareMessage(data: PDFData): string {
  return buildWhatsAppMessage(data);
}

export async function sharePDF(data: PDFData, method: "whatsapp" | "email" | "native") {
  const { blob, fileName } = generatePDF(data, true) as { blob: Blob; fileName: string };
  const message = buildWhatsAppMessage(data);

  if (method === "native" && navigator.share && blob) {
    try {
      const file = new File([blob], fileName, { type: "application/pdf" });
      // @ts-ignore — canShare is widely supported
      if (!navigator.canShare || navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: "VeriDIA Lab Report",
          text: message,
          files: [file],
        });
        return true;
      }
    } catch (e: any) {
      if (e.name === "AbortError") return false;
      // Fall through to download
    }
  }

  if (method === "whatsapp") {
    // Try native file share targeted at WhatsApp first (works on mobile).
    const file = new File([blob], fileName, { type: "application/pdf" });
    // @ts-ignore
    if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
      try {
        await navigator.share({
          title: "VeriDIA Lab Report",
          text: message,
          files: [file],
        });
        return true;
      } catch (e: any) {
        if (e.name === "AbortError") return false;
        // fall through to deep-link fallback
      }
    }
    // Fallback: download PDF + open WhatsApp text composer with the snapshot.
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);

    const text = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${text}`, "_blank");
    return true;
  }

  if (method === "email") {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);

    const subject = encodeURIComponent(
      data.language === "pidgin" ? "My VeriDIA Lab Report" : "My VeriDIA Lab Report",
    );
    const body = encodeURIComponent(
      `${message}\n\n(The PDF report don download for your device — abeg attach am to this email.)`,
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    return true;
  }

  return false;
}

