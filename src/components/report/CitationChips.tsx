import { ExternalLink, BookOpen } from "lucide-react";
import { MedicalCitation } from "@/lib/medical-citations";
import { Language } from "./types";

interface CitationChipsProps {
  citations: MedicalCitation[];
  language: Language;
}

export const CitationChips = ({ citations, language }: CitationChipsProps) => {
  if (!citations || citations.length === 0) return null;
  const isPidgin = language === "pidgin";

  return (
    <div className="border-t border-border pt-3 mt-1">
      <div className="flex items-center gap-1.5 mb-2">
        <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
          {isPidgin ? "Where this come from" : "Sources"}
        </p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {citations.map((c, i) => (
          <a
            key={i}
            href={c.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary/10 border border-secondary/30 text-[11px] font-semibold text-secondary hover:bg-secondary/20 transition-colors touch-target-sm"
            title={c.title}
          >
            {c.domain}
            <ExternalLink className="w-2.5 h-2.5 opacity-70" />
          </a>
        ))}
      </div>
    </div>
  );
};
