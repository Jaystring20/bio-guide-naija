import { ExternalLink, BookOpen, MapPin } from "lucide-react";
import { MedicalCitation } from "@/lib/medical-citations";
import { Language } from "./types";

interface CitationChipsProps {
  citations: MedicalCitation[];
  language: Language;
}

const Chip = ({ c, local }: { c: MedicalCitation; local?: boolean }) => (
  <a
    href={c.url}
    target="_blank"
    rel="noopener noreferrer"
    className={
      local
        ? "inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/30 text-[11px] font-semibold text-primary hover:bg-primary/20 transition-colors touch-target-sm"
        : "inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary/10 border border-secondary/30 text-[11px] font-semibold text-secondary hover:bg-secondary/20 transition-colors touch-target-sm"
    }
    title={c.title}
  >
    {c.domain}
    <ExternalLink className="w-2.5 h-2.5 opacity-70" />
  </a>
);

export const CitationChips = ({ citations, language }: CitationChipsProps) => {
  if (!citations || citations.length === 0) return null;
  const isPidgin = language === "pidgin";

  const local = citations.filter((c) => c.region === "africa" || c.region === "nigeria");
  const global = citations.filter((c) => !c.region || c.region === "global");

  return (
    <div className="border-t border-border pt-3 mt-1 space-y-3">
      {global.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              {isPidgin ? "International sources" : "International sources"}
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {global.map((c, i) => (
              <Chip key={`g-${i}`} c={c} />
            ))}
          </div>
        </div>
      )}
      {local.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <MapPin className="w-3.5 h-3.5 text-primary" />
            <p className="text-[10px] font-bold text-primary uppercase tracking-wider">
              {isPidgin ? "Naija & Africa sources" : "Nigeria & Africa sources"}
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {local.map((c, i) => (
              <Chip key={`l-${i}`} c={c} local />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
