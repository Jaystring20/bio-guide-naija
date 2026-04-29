// OCR preprocessing & validation for lab uploads.
// All helpers are pure (easy to test) and Deno-edge friendly (no DOM, no node).
//
// Three responsibilities:
//   1. preprocessImage  — downscale + re-encode photos so Gemini gets a tighter, sharper input
//   2. validateBiomarkers — schema + sanity-check what the model returned
//   3. normalizeBiomarker — canonicalise unit strings, parse numeric values, dedupe rows

import { decode as decodeJpeg, encode as encodeJpeg } from "https://deno.land/x/jpegts@1.1/mod.ts";

// ----------------------------------------------------------------------------
// 1. IMAGE PREPROCESSING
// ----------------------------------------------------------------------------

export type PreprocessResult = {
  bytes: Uint8Array;
  mimeType: string;
  note: string; // for logging — what we did
};

const MAX_DIM = 1600;          // longest side after downscale
const MAX_BYTES = 4 * 1024 * 1024; // skip preprocessing if already small

/**
 * Downscale a JPEG so the longest side is <= MAX_DIM. Returns the original
 * bytes unchanged for PDFs, non-JPEGs, or already-small images. Uses pure-JS
 * jpegts so it works in the Deno edge runtime (no native deps).
 *
 * Falls back gracefully on any error — never blocks the pipeline.
 */
export async function preprocessImage(
  bytes: Uint8Array,
  filePath: string,
): Promise<PreprocessResult> {
  const isPdf = filePath.toLowerCase().endsWith(".pdf");
  if (isPdf) {
    return { bytes, mimeType: "application/pdf", note: "pdf-passthrough" };
  }

  // Only attempt on JPEGs (most phone uploads). PNG/HEIC fall through unchanged.
  const isJpeg =
    bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (!isJpeg) {
    return { bytes, mimeType: "image/jpeg", note: "non-jpeg-passthrough" };
  }

  if (bytes.length < MAX_BYTES) {
    // Already small enough — sending raw is fine and avoids decode CPU time.
    return { bytes, mimeType: "image/jpeg", note: `small-${(bytes.length / 1024).toFixed(0)}KB` };
  }

  try {
    const decoded = decodeJpeg(bytes);
    const { width, height } = decoded;
    const longest = Math.max(width, height);

    if (longest <= MAX_DIM) {
      return { bytes, mimeType: "image/jpeg", note: "already-small-dim" };
    }

    const scale = MAX_DIM / longest;
    const newW = Math.max(1, Math.round(width * scale));
    const newH = Math.max(1, Math.round(height * scale));

    // Nearest-neighbour downscale of the RGBA buffer.
    // Quality is good enough for OCR — Gemini doesn't need photo-grade sharpness.
    const src = decoded.data; // Uint8Array RGBA
    const dst = new Uint8Array(newW * newH * 4);
    for (let y = 0; y < newH; y++) {
      const sy = Math.floor(y / scale);
      for (let x = 0; x < newW; x++) {
        const sx = Math.floor(x / scale);
        const sIdx = (sy * width + sx) * 4;
        const dIdx = (y * newW + x) * 4;
        dst[dIdx] = src[sIdx];
        dst[dIdx + 1] = src[sIdx + 1];
        dst[dIdx + 2] = src[sIdx + 2];
        dst[dIdx + 3] = src[sIdx + 3];
      }
    }

    const reencoded = encodeJpeg(
      { width: newW, height: newH, data: dst },
      82, // quality — 82 is a good OCR/size sweet spot
    );

    const out = new Uint8Array(reencoded.data);
    return {
      bytes: out,
      mimeType: "image/jpeg",
      note: `resized-${width}x${height}->${newW}x${newH}-${(bytes.length / 1024).toFixed(0)}KB->${(out.length / 1024).toFixed(0)}KB`,
    };
  } catch (e) {
    // If the image library chokes on a weird JPEG, fall back to the original.
    return { bytes, mimeType: "image/jpeg", note: `preprocess-fallback:${(e as Error).message.slice(0, 40)}` };
  }
}

// ----------------------------------------------------------------------------
// 2. UNIT NORMALIZATION
// ----------------------------------------------------------------------------

// Common OCR errors / vendor variants → canonical unit strings.
// Keep keys lowercase for case-insensitive matching.
const UNIT_ALIASES: Record<string, string> = {
  // glucose / lipids
  "mg/dl": "mg/dL",
  "mgdl": "mg/dL",
  "mg / dl": "mg/dL",
  "mmol/l": "mmol/L",
  "mmoll": "mmol/L",

  // hematology
  "g/dl": "g/dL",
  "gdl": "g/dL",
  "g / dl": "g/dL",
  "g/l": "g/L",

  // cell counts
  "x10^9/l": "x10^9/L",
  "10^9/l": "x10^9/L",
  "10*9/l": "x10^9/L",
  "x10e9/l": "x10^9/L",
  "/ul": "/uL",
  "/μl": "/uL",
  "cells/ul": "/uL",

  // enzymes
  "u/l": "U/L",
  "iu/l": "IU/L",

  // percentages
  "%": "%",
  "percent": "%",

  // egfr
  "ml/min/1.73m2": "mL/min/1.73m²",
  "ml/min/1.73m²": "mL/min/1.73m²",
  "ml/min": "mL/min",
};

export function normalizeUnit(raw: string | null | undefined): string {
  if (!raw) return "";
  const cleaned = raw.trim().replace(/\s+/g, " ").replace(/μ/g, "u");
  const key = cleaned.toLowerCase();
  return UNIT_ALIASES[key] ?? cleaned;
}

// ----------------------------------------------------------------------------
// 3. VALUE PARSING
// ----------------------------------------------------------------------------

/**
 * Coerce a value field to a finite number. Handles:
 *   - already-number
 *   - "5.6", "5,6" (European decimal)
 *   - "<0.1" / ">200" (returns the boundary)
 *   - "5.6 mg/dL" (strips trailing unit)
 *   - "3 - 5" range (returns midpoint)
 * Returns null when nothing usable can be parsed.
 */
export function parseValue(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw !== "string") return null;

  let s = raw.trim();
  if (!s) return null;

  // Range like "3 - 5" → midpoint
  const rangeMatch = s.match(/^([\d.,]+)\s*[-–]\s*([\d.,]+)/);
  if (rangeMatch) {
    const a = Number(rangeMatch[1].replace(",", "."));
    const b = Number(rangeMatch[2].replace(",", "."));
    if (Number.isFinite(a) && Number.isFinite(b)) return (a + b) / 2;
  }

  // Strip leading inequality
  s = s.replace(/^[<>≤≥]=?\s*/, "");

  // Keep only the first numeric token
  const numMatch = s.match(/-?[\d]+(?:[.,][\d]+)?/);
  if (!numMatch) return null;
  const n = Number(numMatch[0].replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

// ----------------------------------------------------------------------------
// 4. BIOMARKER VALIDATION & NORMALIZATION
// ----------------------------------------------------------------------------

export type RawBiomarker = {
  name?: unknown;
  value?: unknown;
  unit?: unknown;
  reference_range?: unknown;
  status?: unknown;
  explanation?: unknown;
  why_it_matters?: unknown;
  lifestyle_tip?: unknown;
  trend_context?: unknown;
};

export type CleanBiomarker = {
  name: string;
  value: number;
  unit: string;
  reference_range: string;
  status: "normal" | "borderline" | "deranged-low" | "deranged-high" | "critical";
  explanation: string;
  why_it_matters: string;
  lifestyle_tip: string;
  trend_context: string;
};

const VALID_STATUS = new Set([
  "normal", "borderline", "deranged-low", "deranged-high", "critical",
]);

// Plausibility ranges per common biomarker. Values outside these are almost
// certainly OCR errors (e.g. decimal point misread). We DROP rather than
// silently keep — better to lose one row than show "Hemoglobin: 1230 g/dL".
const PLAUSIBLE_RANGES: Array<{ match: string; min: number; max: number }> = [
  { match: "glucose",    min: 10,  max: 1500 },
  { match: "hba1c",      min: 2,   max: 20   },
  { match: "hemoglobin", min: 1,   max: 25   },
  { match: "hematocrit", min: 5,   max: 70   },
  { match: "platelet",   min: 1,   max: 2000 },
  { match: "wbc",        min: 0.1, max: 200  },
  { match: "rbc",        min: 0.5, max: 10   },
  { match: "sodium",     min: 80,  max: 200  },
  { match: "potassium",  min: 1,   max: 12   },
  { match: "chloride",   min: 70,  max: 150  },
  { match: "creatinine", min: 0.1, max: 30   },
  { match: "urea",       min: 1,   max: 300  },
  { match: "egfr",       min: 1,   max: 200  },
  { match: "alt",        min: 1,   max: 5000 },
  { match: "ast",        min: 1,   max: 5000 },
  { match: "alp",        min: 5,   max: 2000 },
  { match: "bilirubin",  min: 0.1, max: 50   },
  { match: "calcium",    min: 4,   max: 20   },
  { match: "cholesterol", min: 30, max: 800  },
  { match: "triglyceride", min: 10, max: 2000 },
  { match: "hdl",        min: 5,   max: 200  },
  { match: "ldl",        min: 5,   max: 500  },
  { match: "tsh",        min: 0.001, max: 200 },
  { match: "inr",        min: 0.5, max: 15   },
];

function plausibleValue(name: string, value: number): boolean {
  const lower = name.toLowerCase();
  const rule = PLAUSIBLE_RANGES.find(r => lower.includes(r.match));
  if (!rule) return true; // unknown biomarker — trust the model
  return value >= rule.min && value <= rule.max;
}

export type ValidationReport = {
  ok: boolean;
  reason?: string;
  biomarkers: CleanBiomarker[];
  dropped: Array<{ name: string; reason: string }>;
  summary: string;
};

/**
 * Validates + normalises an AI biomarker payload. Returns:
 *   - ok = false  → caller should retry the model call
 *   - ok = true   → use `biomarkers` (cleaned) and `summary`; `dropped` is for logging
 */
export function validateBiomarkers(args: any): ValidationReport {
  const empty: ValidationReport = { ok: false, reason: "no args", biomarkers: [], dropped: [], summary: "" };
  if (!args || typeof args !== "object") return empty;

  const summary = typeof args.summary === "string" ? args.summary.trim() : "";
  if (summary.length < 5) {
    return { ...empty, reason: "missing summary" };
  }

  if (!Array.isArray(args.biomarkers) || args.biomarkers.length === 0) {
    return { ...empty, reason: "no biomarkers" };
  }

  const cleaned: CleanBiomarker[] = [];
  const dropped: Array<{ name: string; reason: string }> = [];
  const seen = new Set<string>();

  for (const raw of args.biomarkers as RawBiomarker[]) {
    const name = typeof raw.name === "string" ? raw.name.trim() : "";
    if (!name) {
      dropped.push({ name: "(unnamed)", reason: "missing name" });
      continue;
    }

    const value = parseValue(raw.value);
    if (value === null) {
      dropped.push({ name, reason: `unparseable value: ${JSON.stringify(raw.value)}` });
      continue;
    }

    if (!plausibleValue(name, value)) {
      dropped.push({ name, reason: `implausible value: ${value}` });
      continue;
    }

    const unit = normalizeUnit(typeof raw.unit === "string" ? raw.unit : "");
    const reference_range = typeof raw.reference_range === "string" ? raw.reference_range.trim() : "";
    const statusRaw = typeof raw.status === "string" ? raw.status.toLowerCase().trim() : "";
    const status = (VALID_STATUS.has(statusRaw) ? statusRaw : "normal") as CleanBiomarker["status"];

    // Dedupe by name (keep first occurrence — usually the more complete one).
    const key = name.toLowerCase();
    if (seen.has(key)) {
      dropped.push({ name, reason: "duplicate" });
      continue;
    }
    seen.add(key);

    cleaned.push({
      name,
      value,
      unit,
      reference_range,
      status,
      explanation: typeof raw.explanation === "string" ? raw.explanation : "",
      why_it_matters: typeof raw.why_it_matters === "string" ? raw.why_it_matters : "",
      lifestyle_tip: typeof raw.lifestyle_tip === "string" ? raw.lifestyle_tip : "",
      trend_context: typeof raw.trend_context === "string" ? raw.trend_context : "",
    });
  }

  if (cleaned.length === 0) {
    return { ok: false, reason: "all biomarkers dropped during validation", biomarkers: [], dropped, summary };
  }

  return { ok: true, biomarkers: cleaned, dropped, summary };
}

// ----------------------------------------------------------------------------
// 5. PAGE / CONTENT DETECTION HEURISTIC
// ----------------------------------------------------------------------------

/**
 * After a successful extraction, decide whether the upload actually looked
 * like a lab report. Returns null if it looks fine, or a short reason string
 * the caller can surface to the user.
 *
 * Heuristic: a real lab report has at least 2 biomarkers AND at least one
 * recognised analyte name. Single-row "results" with no recognised analytes
 * are usually selfies, food labels, or screenshots of unrelated content.
 */
const KNOWN_ANALYTE_HINTS = [
  "glucose", "hemoglobin", "hba1c", "sodium", "potassium", "chloride",
  "creatinine", "urea", "egfr", "alt", "ast", "alp", "bilirubin",
  "calcium", "cholesterol", "triglyceride", "hdl", "ldl", "tsh",
  "platelet", "wbc", "rbc", "hematocrit", "albumin", "protein",
  "uric acid", "inr", "ferritin", "vitamin", "iron",
];

export function looksLikeLabReport(biomarkers: CleanBiomarker[]): { ok: boolean; reason?: string } {
  if (biomarkers.length < 2) {
    return { ok: false, reason: "Only one value detected — please upload a clearer photo of the full lab report." };
  }
  const hasKnown = biomarkers.some(b =>
    KNOWN_ANALYTE_HINTS.some(h => b.name.toLowerCase().includes(h))
  );
  if (!hasKnown) {
    return { ok: false, reason: "We couldn't recognise any standard lab values — make sure you're uploading a lab report." };
  }
  return { ok: true };
}
