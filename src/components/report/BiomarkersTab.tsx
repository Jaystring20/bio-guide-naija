import { useState } from "react";
import { Biomarker, BiomarkerPidgin, Language, STATUS_COLORS, STATUS_LABELS } from "./types";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, Lightbulb, TrendingUp } from "lucide-react";

interface BiomarkersTabProps {
  biomarkers: Biomarker[];
  biomarkersPidgin: BiomarkerPidgin[] | null;
  language: Language;
}

export const BiomarkersTab = ({ biomarkers, biomarkersPidgin, language }: BiomarkersTabProps) => {
  const [expanded, setExpanded] = useState<string | null>(null);
  const isPidgin = language === "pidgin";

  const getPidgin = (name: string) => biomarkersPidgin?.find(p => p.name === name);

  return (
    <div className="space-y-3">
      {biomarkers.map((b) => {
        const pidgin = getPidgin(b.name);
        const explanation = isPidgin && pidgin ? pidgin.explanation : b.explanation;
        const whyMatters = isPidgin && pidgin ? pidgin.why_it_matters : b.why_it_matters;
        const tip = isPidgin && pidgin ? pidgin.lifestyle_tip : b.lifestyle_tip;
        const trend = isPidgin && pidgin ? pidgin.trend_context : b.trend_context;

        return (
          <div key={b.name} className="bg-card rounded-xl border border-border overflow-hidden">
            <button
              onClick={() => setExpanded(expanded === b.name ? null : b.name)}
              className="w-full p-4 flex items-center justify-between gap-2 touch-target"
            >
              <div className="text-left min-w-0 flex-1">
                <p className="font-semibold text-body truncate">{b.name}</p>
                <p className="text-body-sm text-muted-foreground truncate">
                  {b.value} {b.unit} <span className="text-xs">(Ref: {b.reference_range})</span>
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={cn("px-2.5 py-1 rounded-full text-xs font-bold border whitespace-nowrap", STATUS_COLORS[b.status])}>
                  {STATUS_LABELS[b.status]}
                </span>
                {expanded === b.name ? (
                  <ChevronUp className="w-5 h-5 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />
                )}
              </div>
            </button>
            {expanded === b.name && (
              <div className="px-4 pb-4 border-t border-border pt-3 space-y-3 animate-slide-up">
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                    {isPidgin ? "Wetin e mean" : "What this means"}
                  </p>
                  <p className="text-body-sm">{explanation}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                    {isPidgin ? "Why e matter" : "Why it matters"}
                  </p>
                  <p className="text-body-sm">{whyMatters}</p>
                </div>
                {tip && (
                  <div className="bg-accent/10 rounded-lg p-3 border border-accent/20">
                    <div className="flex items-center gap-2 mb-1">
                      <Lightbulb className="w-4 h-4 text-accent" />
                      <p className="text-xs font-bold text-accent uppercase tracking-wide">
                        {isPidgin ? "Wetin You Fit Do" : "Lifestyle Tip"}
                      </p>
                    </div>
                    <p className="text-body-sm">{tip}</p>
                  </div>
                )}
                {trend && (
                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="w-4 h-4 text-muted-foreground" />
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                        {isPidgin ? "If E Continue So" : "Trend Context"}
                      </p>
                    </div>
                    <p className="text-body-sm text-muted-foreground">{trend}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
