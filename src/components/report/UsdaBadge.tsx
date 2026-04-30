import { ShieldCheck, ExternalLink } from "lucide-react";
import { Language } from "./types";

export type NutritionCitation = {
  fdc_id: number;
  official_name: string;
  url: string;
  key_nutrients?: Array<{ name: string; amount: number; unit: string }>;
};

interface UsdaBadgeProps {
  citation: NutritionCitation | null | undefined;
  language: Language;
}

export const UsdaBadge = ({ citation, language }: UsdaBadgeProps) => {
  if (!citation) return null;
  const isPidgin = language === "pidgin";
  const topNutrient = citation.key_nutrients?.[0];

  return (
    <a
      href={citation.url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-primary/10 border border-primary/30 text-[10px] font-semibold text-primary hover:bg-primary/20 transition-colors max-w-full"
      title={`${citation.official_name} — verified by USDA FoodData Central`}
    >
      <ShieldCheck className="w-3 h-3 shrink-0" />
      <span className="truncate">
        {isPidgin ? "USDA verify" : "USDA verified"}
        {topNutrient && (
          <span className="font-normal opacity-80">
            {" — "}
            {topNutrient.amount}
            {topNutrient.unit} {topNutrient.name.toLowerCase()}/100g
          </span>
        )}
      </span>
      <ExternalLink className="w-2.5 h-2.5 opacity-60 shrink-0" />
    </a>
  );
};
