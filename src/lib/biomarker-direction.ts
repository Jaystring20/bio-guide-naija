/**
 * Clinical direction for common biomarkers.
 * - "lower_is_better": reducing the value = improvement (e.g. LDL, glucose, BP)
 * - "higher_is_better": increasing the value = improvement (e.g. HDL, vit D)
 * - "in_range": neither direction inherently better; verdict = "closer to reference range"
 *
 * Names are normalized (lowercase, punctuation stripped) before lookup.
 * A few common aliases are folded into the same canonical key.
 */

export type Direction = "lower_is_better" | "higher_is_better" | "in_range";

const RAW: Record<string, Direction> = {
  // Glycemic
  "glucose": "lower_is_better",
  "fasting glucose": "lower_is_better",
  "fasting blood sugar": "lower_is_better",
  "fbs": "lower_is_better",
  "random blood sugar": "lower_is_better",
  "rbs": "lower_is_better",
  "hba1c": "lower_is_better",
  "a1c": "lower_is_better",
  "glycated hemoglobin": "lower_is_better",
  "insulin": "lower_is_better",

  // Lipids
  "total cholesterol": "lower_is_better",
  "cholesterol": "lower_is_better",
  "ldl": "lower_is_better",
  "ldl c": "lower_is_better",
  "ldl cholesterol": "lower_is_better",
  "hdl": "higher_is_better",
  "hdl c": "higher_is_better",
  "hdl cholesterol": "higher_is_better",
  "triglycerides": "lower_is_better",
  "vldl": "lower_is_better",
  "non hdl cholesterol": "lower_is_better",

  // Kidney
  "creatinine": "lower_is_better",
  "urea": "lower_is_better",
  "bun": "lower_is_better",
  "uric acid": "lower_is_better",
  "egfr": "higher_is_better",

  // Liver
  "alt": "lower_is_better",
  "sgpt": "lower_is_better",
  "ast": "lower_is_better",
  "sgot": "lower_is_better",
  "alp": "lower_is_better",
  "ggt": "lower_is_better",
  "bilirubin": "lower_is_better",
  "total bilirubin": "lower_is_better",
  "direct bilirubin": "lower_is_better",
  "albumin": "in_range",

  // CBC
  "hemoglobin": "higher_is_better",
  "haemoglobin": "higher_is_better",
  "hgb": "higher_is_better",
  "hb": "higher_is_better",
  "hematocrit": "in_range",
  "pcv": "in_range",
  "rbc": "in_range",
  "wbc": "in_range",
  "platelets": "in_range",
  "mcv": "in_range",
  "mch": "in_range",
  "mchc": "in_range",

  // Vitamins & minerals
  "vitamin d": "higher_is_better",
  "25 oh vitamin d": "higher_is_better",
  "vitamin b12": "higher_is_better",
  "b12": "higher_is_better",
  "folate": "higher_is_better",
  "iron": "in_range",
  "ferritin": "in_range",
  "tibc": "in_range",
  "transferrin saturation": "in_range",
  "calcium": "in_range",
  "magnesium": "in_range",
  "phosphate": "in_range",
  "sodium": "in_range",
  "potassium": "in_range",
  "chloride": "in_range",

  // Thyroid
  "tsh": "in_range",
  "t3": "in_range",
  "t4": "in_range",
  "free t3": "in_range",
  "free t4": "in_range",

  // Inflammation / cardiac
  "crp": "lower_is_better",
  "hs crp": "lower_is_better",
  "esr": "lower_is_better",

  // BP (occasionally on lab panels)
  "systolic": "lower_is_better",
  "diastolic": "lower_is_better",
  "blood pressure": "lower_is_better",
};

function canonical(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const MAP: Record<string, Direction> = {};
for (const [k, v] of Object.entries(RAW)) MAP[canonical(k)] = v;

export function getDirection(name: string): Direction {
  if (!name) return "in_range";
  const key = canonical(name);
  if (MAP[key]) return MAP[key];
  // Loose contains-based fallbacks for lab-specific naming
  if (key.includes("ldl")) return "lower_is_better";
  if (key.includes("hdl")) return "higher_is_better";
  if (key.includes("triglyceride")) return "lower_is_better";
  if (key.includes("cholesterol")) return "lower_is_better";
  if (key.includes("glucose") || key.includes("sugar")) return "lower_is_better";
  if (key.includes("hba1c") || key.includes("a1c")) return "lower_is_better";
  if (key.includes("hemoglob") || key.includes("haemoglob")) return "higher_is_better";
  if (key.includes("vitamin d") || key.includes("b12") || key.includes("folate")) return "higher_is_better";
  if (key.includes("creatinine") || key.includes("urea") || key.includes("uric")) return "lower_is_better";
  if (key.includes("crp") || key.includes("esr")) return "lower_is_better";
  return "in_range";
}

/** Normalize a biomarker name to a stable key for alignment across reports. */
export function biomarkerKey(name: string): string {
  return canonical(name);
}
