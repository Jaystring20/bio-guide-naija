import { useState } from "react";
import { Biomarker, STATUS_COLORS, STATUS_LABELS } from "./types";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, Lightbulb, TrendingUp } from "lucide-react";

interface BiomarkersTabProps {
  biomarkers: Biomarker[];
}

export const BiomarkersTab = ({ biomarkers }: BiomarkersTabProps) => {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {biomarkers.map((b) => (
        <div key={b.name} className="bg-card rounded-xl border border-border overflow-hidden">
          <button
            onClick={() => setExpanded(expanded === b.name ? null : b.name)}
            className="w-full p-4 flex items-center justify-between touch-target"
          >
            <div className="text-left">
              <p className="font-semibold text-body">{b.name}</p>
              <p className="text-body-sm text-muted-foreground">
                {b.value} {b.unit} <span className="text-xs">(Ref: {b.reference_range})</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn("px-3 py-1 rounded-full text-xs font-bold border", STATUS_COLORS[b.status])}>
                {STATUS_LABELS[b.status]}
              </span>
              {expanded === b.name ? (
                <ChevronUp className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
          </button>
          {expanded === b.name && (
            <div className="px-4 pb-4 border-t border-border pt-3 space-y-3 animate-slide-up">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">What this means</p>
                <p className="text-body-sm">{b.explanation}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Why it matters</p>
                <p className="text-body-sm">{b.why_it_matters}</p>
              </div>
              {b.lifestyle_tip && (
                <div className="bg-accent/10 rounded-lg p-3 border border-accent/20">
                  <div className="flex items-center gap-2 mb-1">
                    <Lightbulb className="w-4 h-4 text-accent" />
                    <p className="text-xs font-bold text-accent uppercase tracking-wide">Lifestyle Tip</p>
                  </div>
                  <p className="text-body-sm">{b.lifestyle_tip}</p>
                </div>
              )}
              {b.trend_context && (
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-muted-foreground" />
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Trend Context</p>
                  </div>
                  <p className="text-body-sm text-muted-foreground">{b.trend_context}</p>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
