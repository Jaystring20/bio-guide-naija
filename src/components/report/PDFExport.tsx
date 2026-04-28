import jsPDF from "jspdf";
import { Biomarker, BiomarkerPidgin, DietaryPlan, DietaryPlanPidgin, ChecklistItem, ChecklistItemPidgin, Language, STATUS_LABELS } from "./types";

interface PDFData {
  language: Language;
  uploadDate: string;
  aiSummary: string | null;
  aiSummaryPidgin: string | null;
  biomarkers: Biomarker[];
  biomarkersPidgin: BiomarkerPidgin[] | null;
  dietaryPlan: DietaryPlan | null;
  dietaryPlanPidgin: DietaryPlanPidgin | null;
  checklist: ChecklistItem[];
  checklistPidgin: ChecklistItemPidgin[] | null;
}

function isStructured(item: ChecklistItem): item is { question: string; context: string; priority: "high" | "medium" | "low" } {
  return typeof item === "object" && "question" in item;
}

export function generatePDF(data: PDFData, returnBlob?: boolean): { blob: Blob | null; fileName: string } {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const lang = data.language;
  const isPidgin = lang === "pidgin";

  const checkPage = (needed: number) => {
    if (y + needed > 275) {
      doc.addPage();
      y = margin;
    }
  };

  const addText = (text: string, x: number, fontSize: number, opts?: { bold?: boolean; color?: [number, number, number]; maxWidth?: number }) => {
    doc.setFontSize(fontSize);
    doc.setFont("helvetica", opts?.bold ? "bold" : "normal");
    if (opts?.color) doc.setTextColor(...opts.color);
    else doc.setTextColor(33, 33, 33);
    const lines = doc.splitTextToSize(text, opts?.maxWidth || contentWidth);
    checkPage(lines.length * fontSize * 0.45);
    doc.text(lines, x, y);
    y += lines.length * fontSize * 0.45 + 2;
  };

  // Header
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 30, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("VeriDIA", margin, 14);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(isPidgin ? "Your Health Report" : "Your Health Report", margin, 22);
  const dateStr = new Date(data.uploadDate).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" });
  doc.text(dateStr, pageWidth - margin - doc.getTextWidth(dateStr), 22);
  y = 40;

  // Summary
  const summaryText = isPidgin ? (data.aiSummaryPidgin || data.aiSummary) : data.aiSummary;
  if (summaryText) {
    addText(isPidgin ? "Wetin Your Result Talk" : "Health Summary", margin, 14, { bold: true, color: [59, 130, 246] });
    y += 2;
    addText(summaryText, margin, 10);
    y += 6;
  }

  // Biomarker stats
  const normal = data.biomarkers.filter(b => b.status === "normal").length;
  const borderline = data.biomarkers.filter(b => b.status === "borderline").length;
  const abnormal = data.biomarkers.filter(b => ["deranged-low", "deranged-high", "critical"].includes(b.status)).length;
  addText(`${isPidgin ? "Normal" : "Normal"}: ${normal}  |  ${isPidgin ? "Borderline" : "Borderline"}: ${borderline}  |  ${isPidgin ? "Wahala" : "Abnormal"}: ${abnormal}`, margin, 10, { bold: true });
  y += 4;

  // Biomarkers
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;
  addText(isPidgin ? "Your Results One By One" : "Biomarker Results", margin, 14, { bold: true, color: [59, 130, 246] });
  y += 2;

  data.biomarkers.forEach((b, i) => {
    checkPage(30);
    const pidginB = data.biomarkersPidgin?.find(p => p.name === b.name);

    addText(`${b.name} — ${b.value} ${b.unit} (${isPidgin ? "Ref" : "Ref"}: ${b.reference_range})`, margin, 10, { bold: true });
    addText(`Status: ${STATUS_LABELS[b.status]}`, margin + 2, 9, {
      color: b.status === "normal" ? [22, 163, 74] : b.status === "borderline" ? [202, 138, 4] : [220, 38, 38],
    });
    const explanation = isPidgin && pidginB ? pidginB.explanation : b.explanation;
    addText(explanation, margin + 2, 9, { maxWidth: contentWidth - 4 });

    const tip = isPidgin && pidginB ? pidginB.lifestyle_tip : b.lifestyle_tip;
    if (tip) {
      addText(`💡 ${tip}`, margin + 2, 8, { color: [100, 100, 100], maxWidth: contentWidth - 4 });
    }
    y += 3;
  });

  // Diet Plan
  const diet = data.dietaryPlan;
  if (diet) {
    checkPage(20);
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;
    addText(isPidgin ? "Wetin You Suppose Chop" : "Your Diet Plan", margin, 14, { bold: true, color: [22, 163, 74] });
    y += 2;

    const pidginDiet = data.dietaryPlanPidgin;

    if (diet.foods_to_increase?.length) {
      addText(isPidgin ? "✅ Chop More Of This" : "✅ Foods to Eat More", margin, 11, { bold: true, color: [22, 163, 74] });
      diet.foods_to_increase.forEach((f, i) => {
        checkPage(12);
        const pidginF = pidginDiet?.foods_to_increase?.[i];
        const benefit = isPidgin && pidginF ? pidginF.benefit : f.benefit;
        addText(`• ${f.name} (${f.local_name}) — ${benefit}`, margin + 2, 9, { maxWidth: contentWidth - 4 });
      });
      y += 3;
    }

    if (diet.foods_to_reduce?.length) {
      addText(isPidgin ? "⚠️ Reduce This One" : "⚠️ Foods to Reduce", margin, 11, { bold: true, color: [202, 138, 4] });
      diet.foods_to_reduce.forEach((f, i) => {
        checkPage(12);
        const pidginF = pidginDiet?.foods_to_reduce?.[i];
        const reason = isPidgin && pidginF ? pidginF.reason : f.reason;
        addText(`• ${f.name} (${f.local_name}) — ${reason}`, margin + 2, 9, { maxWidth: contentWidth - 4 });
      });
      y += 3;
    }

    if (diet.foods_to_avoid?.length) {
      addText(isPidgin ? "🚫 No Touch This One" : "🚫 Foods to Avoid", margin, 11, { bold: true, color: [220, 38, 38] });
      diet.foods_to_avoid.forEach((f, i) => {
        checkPage(12);
        const pidginF = pidginDiet?.foods_to_avoid?.[i];
        const reason = isPidgin && pidginF ? pidginF.reason : f.reason;
        addText(`• ${f.name} (${f.local_name}) — ${reason}`, margin + 2, 9, { maxWidth: contentWidth - 4 });
      });
      y += 3;
    }
  }

  // Doctor Questions
  if (data.checklist.length > 0) {
    checkPage(20);
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;
    addText(isPidgin ? "Wetin You Go Ask Doctor" : "Questions for Your Doctor", margin, 14, { bold: true, color: [59, 130, 246] });
    y += 2;

    data.checklist.forEach((q, i) => {
      checkPage(15);
      const pidginQ = data.checklistPidgin?.[i];
      const questionText = isStructured(q) ? q.question : q;
      const displayQ = isPidgin && pidginQ ? pidginQ.question : questionText;
      addText(`${i + 1}. ${displayQ}`, margin + 2, 9, { bold: true, maxWidth: contentWidth - 4 });
    });
  }

  // Footer disclaimer
  checkPage(20);
  y += 8;
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;
  addText(
    isPidgin
      ? "⚠️ This report na for information only o. E no be medical advice. Abeg go see your doctor."
      : "⚠️ This report is for informational purposes only and does not constitute medical advice. Please consult your healthcare provider.",
    margin, 8, { color: [120, 120, 120] }
  );
  addText("Generated by VeriDIA — getveridia.app", margin, 7, { color: [150, 150, 150] });

  const fileName = `VeriDIA-Report-${new Date(data.uploadDate).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }).replace(/\s/g, "-")}.pdf`;

  if (returnBlob) {
    return { blob: doc.output("blob") as Blob, fileName };
  }

  doc.save(fileName);
  return { blob: null, fileName };
}

export async function sharePDF(data: PDFData, method: "whatsapp" | "email" | "native") {
  const { blob, fileName } = generatePDF({ ...data }, true) as { blob: Blob; fileName: string };

  if (method === "native" && navigator.share && blob) {
    try {
      const file = new File([blob], fileName, { type: "application/pdf" });
      await navigator.share({
        title: "VeriDIA Lab Report",
        text: "Check out my lab report from VeriDIA",
        files: [file],
      });
      return true;
    } catch (e: any) {
      if (e.name === "AbortError") return false;
      // Fall through to download
    }
  }

  if (method === "whatsapp") {
    // WhatsApp doesn't support file attachments via URL, so we download the PDF
    // and open WhatsApp with a text message
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);

    const text = encodeURIComponent(
      "Here's my lab report from VeriDIA 🩺\nDownload the PDF I just shared and check it out!\n\nhttps://getveridia.app"
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
    return true;
  }

  if (method === "email") {
    // Download PDF, then open email client
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);

    const subject = encodeURIComponent("My VeriDIA Lab Report");
    const body = encodeURIComponent(
      "Hi,\n\nPlease find my lab report from VeriDIA attached (downloaded separately).\n\nGenerated by VeriDIA — https://getveridia.app"
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    return true;
  }

  return false;
}
