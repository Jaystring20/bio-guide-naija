export type CriticalAlert = {
  biomarker: string;
  value: number;
  unit: string;
  severity: "emergency" | "urgent";
  message: string;
};

type ThresholdRule = {
  match: string;
  unit: string;
  checks: Array<{
    condition: (v: number) => boolean;
    severity: "emergency" | "urgent";
    message: string;
  }>;
};

const THRESHOLDS: ThresholdRule[] = [
  { match: "glucose", unit: "mg/dL", checks: [
    { condition: (v) => v > 300, severity: "emergency", message: "Dangerously high glucose. Risk of diabetic emergency." },
    { condition: (v) => v < 40, severity: "emergency", message: "Dangerously low glucose. Risk of hypoglycemic shock." },
  ]},
  { match: "hba1c", unit: "%", checks: [
    { condition: (v) => v > 10, severity: "urgent", message: "Very poor long-term blood sugar control." },
  ]},
  { match: "potassium", unit: "mmol/L", checks: [
    { condition: (v) => v > 6.5, severity: "urgent", message: "Very high potassium. Risk of cardiac arrhythmia." },
    { condition: (v) => v < 2.5, severity: "urgent", message: "Very low potassium. Risk of muscle weakness and heart problems." },
  ]},
  { match: "sodium", unit: "mmol/L", checks: [
    { condition: (v) => v > 155, severity: "emergency", message: "Dangerously high sodium. Risk of seizures." },
    { condition: (v) => v < 120, severity: "emergency", message: "Dangerously low sodium. Risk of brain swelling." },
  ]},
  { match: "hemoglobin", unit: "g/dL", checks: [
    { condition: (v) => v < 7, severity: "urgent", message: "Severely low hemoglobin. May need urgent blood transfusion." },
  ]},
  { match: "platelet", unit: "x10^9/L", checks: [
    { condition: (v) => v < 50, severity: "urgent", message: "Very low platelets. Risk of bleeding." },
    { condition: (v) => v > 1000, severity: "urgent", message: "Very high platelets. Risk of clotting." },
  ]},
  { match: "wbc", unit: "x10^9/L", checks: [
    { condition: (v) => v < 2, severity: "urgent", message: "Very low white blood cells. High infection risk." },
    { condition: (v) => v > 30, severity: "urgent", message: "Extremely high white blood cells." },
  ]},
  { match: "egfr", unit: "mL/min", checks: [
    { condition: (v) => v < 15, severity: "urgent", message: "Very low kidney function. May need dialysis evaluation." },
  ]},
  { match: "creatinine", unit: "mg/dL", checks: [
    { condition: (v) => v > 5, severity: "urgent", message: "Very high creatinine. Possible kidney failure." },
  ]},
  { match: "alt", unit: "U/L", checks: [
    { condition: (v) => v > 500, severity: "urgent", message: "Very high ALT. Severe liver injury possible." },
  ]},
  { match: "ast", unit: "U/L", checks: [
    { condition: (v) => v > 500, severity: "urgent", message: "Very high AST. Severe liver injury possible." },
  ]},
  { match: "bilirubin", unit: "mg/dL", checks: [
    { condition: (v) => v > 10, severity: "urgent", message: "Very high bilirubin. Severe jaundice." },
  ]},
  { match: "calcium", unit: "mg/dL", checks: [
    { condition: (v) => v > 13, severity: "urgent", message: "Very high calcium." },
    { condition: (v) => v < 7, severity: "urgent", message: "Very low calcium." },
  ]},
  { match: "inr", unit: "", checks: [
    { condition: (v) => v > 5, severity: "urgent", message: "Very high INR. Major bleeding risk." },
  ]},
  { match: "troponin", unit: "ng/mL", checks: [
    { condition: (v) => v > 0.04, severity: "emergency", message: "Elevated troponin. Possible heart attack." },
  ]},
];

export function checkCriticalThresholds(
  biomarkers: Array<{ name: string; value: number; unit: string }>
): CriticalAlert[] {
  const alerts: CriticalAlert[] = [];
  for (const marker of biomarkers) {
    const rule = THRESHOLDS.find((t) => marker.name.toLowerCase().includes(t.match));
    if (!rule) continue;
    for (const check of rule.checks) {
      if (check.condition(marker.value)) {
        alerts.push({
          biomarker: marker.name,
          value: marker.value,
          unit: marker.unit,
          severity: check.severity,
          message: check.message,
        });
      }
    }
  }
  return alerts;
}
