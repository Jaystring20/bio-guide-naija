import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { CompareSummary as Summary } from "@/lib/compare-engine";

export const CompareSummary = ({ summary }: { summary: Summary }) => {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-soft space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Improved" value={summary.improved} tone="good" icon={<TrendingUp className="w-4 h-4" />} />
        <Stat label="Worse" value={summary.worsened} tone="bad" icon={<TrendingDown className="w-4 h-4" />} />
        <Stat label="Same" value={summary.unchanged} tone="neutral" icon={<Minus className="w-4 h-4" />} />
      </div>

      {(summary.biggestWin || summary.biggestConcern) && (
        <div className="space-y-2 pt-1">
          {summary.biggestWin && (
            <Highlight
              tone="good"
              label="Biggest win"
              name={summary.biggestWin.name}
              a={summary.biggestWin.a}
              b={summary.biggestWin.b}
              unit={summary.biggestWin.unit}
              pct={summary.biggestWin.pct}
            />
          )}
          {summary.biggestConcern && (
            <Highlight
              tone="bad"
              label="Biggest concern"
              name={summary.biggestConcern.name}
              a={summary.biggestConcern.a}
              b={summary.biggestConcern.b}
              unit={summary.biggestConcern.unit}
              pct={summary.biggestConcern.pct}
            />
          )}
        </div>
      )}
    </div>
  );
};

const Stat = ({ label, value, tone, icon }: { label: string; value: number; tone: "good" | "bad" | "neutral"; icon: React.ReactNode }) => {
  const cls =
    tone === "good"
      ? "bg-primary/10 text-primary"
      : tone === "bad"
      ? "bg-destructive/10 text-destructive"
      : "bg-muted text-muted-foreground";
  return (
    <div className={`rounded-xl px-3 py-2.5 ${cls}`}>
      <div className="flex items-center gap-1.5 text-[11px] font-semibold opacity-80">
        {icon}
        {label}
      </div>
      <p className="font-display text-2xl font-extrabold leading-none mt-1">{value}</p>
    </div>
  );
};

const Highlight = ({
  tone, label, name, a, b, unit, pct,
}: { tone: "good" | "bad"; label: string; name: string; a: number | null; b: number | null; unit: string; pct: number | null }) => {
  const cls = tone === "good" ? "text-primary" : "text-destructive";
  const arrow = tone === "good" ? "▲" : "▼";
  return (
    <div className="text-xs text-muted-foreground">
      <span className={`font-bold ${cls}`}>{label}:</span>{" "}
      <span className="font-semibold text-foreground">{name}</span>{" "}
      <span>
        {formatNum(a)} → {formatNum(b)} {unit}
      </span>{" "}
      {pct !== null && (
        <span className={`font-bold ${cls}`}>
          ({arrow} {Math.abs(pct).toFixed(1)}%)
        </span>
      )}
    </div>
  );
};

function formatNum(n: number | null) {
  if (n === null) return "—";
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, "");
}
