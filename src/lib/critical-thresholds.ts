export type CriticalAlert = {
  biomarker: string;
  value: number;
  unit: string;
  severity: "emergency" | "urgent";
  message: string;
};

type ThresholdRule = {
  biomarker: string;
  unit: string;
  checks: Array<{
    condition: (v: number) => boolean;
    severity: "emergency" | "urgent";
    message: string;
  }>;
};

const THRESHOLDS: ThresholdRule[] = [
  {
    biomarker: "Glucose",
    unit: "mg/dL",
    checks: [
      { condition: (v) => v > 300, severity: "emergency", message: "Dangerously high glucose. Risk of diabetic emergency." },
      { condition: (v) => v < 40, severity: "emergency", message: "Dangerously low glucose. Risk of hypoglycemic shock." },
    ],
  },
  {
    biomarker: "Potassium",
    unit: "mmol/L",
    checks: [
      { condition: (v) => v > 6.5, severity: "urgent", message: "Very high potassium. Risk of cardiac arrhythmia." },
      { condition: (v) => v < 2.5, severity: "urgent", message: "Very low potassium. Risk of muscle weakness and heart problems." },
    ],
  },
  {
    biomarker: "Hemoglobin",
    unit: "g/dL",
    checks: [
      { condition: (v) => v < 7, severity: "urgent", message: "Severely low hemoglobin. May need urgent blood transfusion." },
    ],
  },
  {
    biomarker: "Sodium",
    unit: "mmol/L",
    checks: [
      { condition: (v) => v > 155, severity: "emergency", message: "Dangerously high sodium. Risk of seizures." },
      { condition: (v) => v < 120, severity: "emergency", message: "Dangerously low sodium. Risk of brain swelling." },
    ],
  },
  {
    biomarker: "eGFR",
    unit: "mL/min",
    checks: [
      { condition: (v) => v < 15, severity: "urgent", message: "Very low kidney function. May need dialysis evaluation." },
    ],
  },
];

export function checkCriticalThresholds(
  biomarkers: Array<{ name: string; value: number; unit: string }>
): CriticalAlert[] {
  const alerts: CriticalAlert[] = [];

  for (const marker of biomarkers) {
    const rule = THRESHOLDS.find(
      (t) => marker.name.toLowerCase().includes(t.biomarker.toLowerCase())
    );
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
