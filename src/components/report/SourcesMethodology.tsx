import { useState } from "react";
import { ChevronDown, ChevronUp, ShieldCheck } from "lucide-react";
import { ALL_SOURCE_DOMAINS } from "@/lib/medical-citations";
import { Language } from "./types";

interface SourcesMethodologyProps {
  language: Language;
}

export const SourcesMethodology = ({ language }: SourcesMethodologyProps) => {
  const [open, setOpen] = useState(false);
  const isPidgin = language === "pidgin";

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden mt-4">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full p-4 flex items-center justify-between gap-2 touch-target tap-scale text-left"
      >
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-secondary" />
          <p className="font-display font-bold text-body">
            {isPidgin ? "Where We Get Our Info" : "Sources & Methodology"}
          </p>
        </div>
        {open ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-border space-y-3 animate-slide-up">
          <p className="text-body-sm text-muted-foreground">
            {isPidgin
              ? "VeriDIA dey use AI to read your lab paper, but every advice we give get back-up from these credible sources:"
              : "VeriDIA uses AI to interpret your lab report, but every clinical explanation and food recommendation is backed by these credible sources:"}
          </p>
          <ul className="space-y-1.5">
            {ALL_SOURCE_DOMAINS.map((src) => (
              <li key={src} className="flex items-start gap-2 text-body-sm">
                <span className="text-secondary mt-0.5">✓</span>
                <span>{src}</span>
              </li>
            ))}
          </ul>
          <div className="bg-muted/40 rounded-lg p-3 mt-2">
            <p className="text-xs text-muted-foreground leading-relaxed">
              {isPidgin
                ? "⚠️ Even though we get sources, this app no fit replace doctor. Always show your lab paper to medical doctor for proper advice."
                : "⚠️ Even with credible sources, this app does not replace medical advice. Always share your lab results with a qualified clinician for diagnosis and treatment."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
