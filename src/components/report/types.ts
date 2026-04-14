export type Biomarker = {
  name: string;
  value: number;
  unit: string;
  reference_range: string;
  status: "normal" | "borderline" | "deranged-low" | "deranged-high" | "critical";
  explanation: string;
  why_it_matters: string;
  lifestyle_tip?: string;
  trend_context?: string;
};

export type DietaryPlan = {
  foods_to_increase: Array<{ name: string; local_name: string; benefit: string; preparation_tip: string }>;
  foods_to_reduce: Array<{ name: string; local_name: string; reason: string }>;
  foods_to_avoid: Array<{ name: string; local_name: string; reason: string }>;
  meal_suggestions: Array<{ meal: string; description: string }>;
  weekly_meal_plan?: Array<{ day: string; breakfast: string; lunch: string; dinner: string }>;
  hydration_tips?: string[];
  supplement_notes?: string[];
};

export type ChecklistItem = {
  question: string;
  context: string;
  priority: "high" | "medium" | "low";
} | string;

export const STATUS_COLORS: Record<string, string> = {
  normal: "bg-secondary/20 text-secondary border-secondary/30",
  borderline: "bg-harvest-gold/20 text-harvest-gold border-harvest-gold/30",
  "deranged-low": "bg-destructive/20 text-destructive border-destructive/30",
  "deranged-high": "bg-destructive/20 text-destructive border-destructive/30",
  critical: "bg-destructive text-destructive-foreground border-destructive",
};

export const STATUS_LABELS: Record<string, string> = {
  normal: "Normal",
  borderline: "Borderline",
  "deranged-low": "Low",
  "deranged-high": "High",
  critical: "Critical",
};
