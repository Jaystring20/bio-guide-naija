import { BadgeCheck, ExternalLink } from "lucide-react";
import { Language } from "./types";

export type NafdacCitation = {
  product_id: number;
  product_name: string;
  nrn: string;
  applicant: string;
  approval_date: string | null;
  status: "Active";
  url: string;
  matched_term: string;
  source: "food" | "supplement";
};

interface NafdacBadgeProps {
  citation: NafdacCitation | null | undefined;
  language: Language;
}

export const NafdacBadge = ({ citation, language }: NafdacBadgeProps) => {
  if (!citation) return null;
  const isPidgin = language === "pidgin";

  const label = isPidgin ? "NAFDAC verify" : "NAFDAC registered";
  const detail = citation.nrn ? ` · NRN ${citation.nrn}` : "";

  return (
    <a
      href={citation.url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-2 ml-2 inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-secondary/10 border border-secondary/30 text-[10px] font-semibold text-secondary hover:bg-secondary/20 transition-colors max-w-full"
      title={`${citation.product_name} — registered with NAFDAC by ${citation.applicant || "Nigerian regulator"}`}
    >
      <BadgeCheck className="w-3 h-3 shrink-0" />
      <span className="truncate">
        {label}
        <span className="font-normal opacity-80">{detail}</span>
      </span>
      <ExternalLink className="w-2.5 h-2.5 opacity-60 shrink-0" />
    </a>
  );
};
