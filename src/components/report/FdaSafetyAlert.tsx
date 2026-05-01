import { ShieldAlert, ExternalLink } from "lucide-react";
import { Language } from "./types";
import type { FdaSafetyEntry } from "./FdaSafetyBadge";

interface FdaSafetyAlertProps {
  fdaSafety: Record<string, FdaSafetyEntry> | null | undefined;
  language: Language;
}

/**
 * Renders a prominent red alert at the top of the diet tab when the FDA layer
 * found one or more high-severity ingredients in the AI's recommendations.
 * Silent if no high/critical entries exist.
 */
export const FdaSafetyAlert = ({ fdaSafety, language }: FdaSafetyAlertProps) => {
  if (!fdaSafety) return null;
  const high = Object.entries(fdaSafety).filter(
    ([, e]) => e?.severity === "critical" || e?.severity === "high",
  );
  if (high.length === 0) return null;

  const isPidgin = language === "pidgin";

  return (
    <div
      role="alert"
      className="rounded-xl border-2 border-destructive bg-destructive/10 p-4 space-y-3"
    >
      <div className="flex items-start gap-2">
        <ShieldAlert className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="font-display font-bold text-destructive text-body">
            {isPidgin
              ? `FDA don warn about ${high.length} item${high.length > 1 ? "s" : ""} for this plan`
              : `FDA flagged ${high.length} item${high.length > 1 ? "s" : ""} in this plan`}
          </p>
          <p className="text-body-sm text-destructive/90 mt-0.5">
            {isPidgin
              ? "No use any of these without your doctor approval."
              : "Do not use any of these without consulting your doctor."}
          </p>
        </div>
      </div>

      <ul className="space-y-2 pl-7">
        {high.map(([key, e]) => (
          <li key={key} className="text-body-sm text-foreground">
            <a
              href={e.fda_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-destructive hover:underline"
            >
              {e.matched_term}
              <ExternalLink className="w-3 h-3" />
            </a>
            <span className="text-muted-foreground"> — {e.reason_short}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
