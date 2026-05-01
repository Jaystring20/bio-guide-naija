import { ShieldAlert, AlertTriangle, ExternalLink } from "lucide-react";
import { Language } from "./types";

export type FdaSafetyEntry = {
  matched_term: string;
  severity: "critical" | "high" | "medium";
  source: "fda_ingredient_list" | "openfda_recall";
  category?: 2 | 3 | 4 | 7;
  fda_url: string;
  reason_short: string;
  recent_class_i_recalls?: Array<{
    date: string;
    reason: string;
    firm: string;
    status: string;
  }>;
};

interface FdaSafetyBadgeProps {
  entry: FdaSafetyEntry | null | undefined;
  language: Language;
}

export const FdaSafetyBadge = ({ entry, language }: FdaSafetyBadgeProps) => {
  if (!entry) return null;
  const isPidgin = language === "pidgin";
  const isHigh = entry.severity === "critical" || entry.severity === "high";

  const label = isHigh
    ? isPidgin
      ? "FDA WARN AM"
      : "FDA SAFETY CONCERN"
    : isPidgin
      ? "FDA recall dey"
      : "FDA recall on file";

  const tooltip =
    `${entry.matched_term} — ${entry.reason_short}` +
    (entry.recent_class_i_recalls?.[0]
      ? ` (Most recent: ${entry.recent_class_i_recalls[0].firm}, ${formatYYYYMMDD(entry.recent_class_i_recalls[0].date)})`
      : "");

  const Icon = isHigh ? ShieldAlert : AlertTriangle;

  // EmergencyRed for high/critical, AlertAmber for medium — using semantic tokens.
  const styles = isHigh
    ? "bg-destructive/15 border-destructive/40 text-destructive hover:bg-destructive/25"
    : "bg-harvest-gold/15 border-harvest-gold/40 text-harvest-gold hover:bg-harvest-gold/25";

  return (
    <a
      href={entry.fda_url}
      target="_blank"
      rel="noopener noreferrer"
      className={`mt-2 ml-2 inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-[10px] font-bold uppercase tracking-wide transition-colors max-w-full ${styles}`}
      title={tooltip}
    >
      <Icon className="w-3 h-3 shrink-0" />
      <span className="truncate">{label}</span>
      <ExternalLink className="w-2.5 h-2.5 opacity-60 shrink-0" />
    </a>
  );
};

function formatYYYYMMDD(s: string): string {
  if (!s || s.length !== 8) return s;
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
}
