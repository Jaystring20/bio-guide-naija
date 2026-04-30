import { ShieldCheck, AlertTriangle } from "lucide-react";
import { Language } from "./types";
import { hasCuratedCitation, getPrimaryDomain } from "@/lib/medical-citations";

interface VerifiedBadgeProps {
  biomarkerName: string;
  language: Language;
}

/**
 * Visible "handshake" indicator showing whether the AI's interpretation of this
 * biomarker is cross-checked against a curated medical source.
 *  - Curated match  → green "Cross-checked against {domain}" pill.
 *  - Fallback only  → amber "AI interpretation — source not verified" pill.
 */
export const VerifiedBadge = ({ biomarkerName, language }: VerifiedBadgeProps) => {
  const isPidgin = language === "pidgin";
  const verified = hasCuratedCitation(biomarkerName);

  if (verified) {
    const domain = getPrimaryDomain(biomarkerName) ?? "NIH MedlinePlus";
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/30 text-[10px] font-semibold text-primary"
        title={isPidgin ? `We confirm am with ${domain}` : `Cross-checked against ${domain}`}
      >
        <ShieldCheck className="w-3 h-3" />
        {isPidgin ? `Confirm with ${domain}` : `Cross-checked · ${domain}`}
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[hsl(var(--alert-amber))]/15 border border-[hsl(var(--alert-amber))]/40 text-[10px] font-semibold text-[hsl(var(--alert-amber))]"
      title={isPidgin ? "AI talk only — no medical source confirm" : "AI interpretation — source not verified"}
    >
      <AlertTriangle className="w-3 h-3" />
      {isPidgin ? "AI talk · no source confirm" : "AI only · source not verified"}
    </span>
  );
};
