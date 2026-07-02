import { ArrowUp, ArrowDown, Sparkles, ClipboardList } from "lucide-react";
import type { PairDelta } from "@/lib/compare-engine";

type Props = {
  deltas: PairDelta[];
  aLabel: string;
  bLabel: string;
};

function formatNum(n: number | null) {
  if (n === null) return "—";
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, "");
}

// Pick the 3 biggest real changes (improved or worsened), ranked by |pct|.
function pickBiggestChanges(deltas: PairDelta[]): PairDelta[] {
  return deltas
    .filter(
      (d) =>
        (d.verdict === "improved" || d.verdict === "worsened") &&
        d.pct !== null &&
        Number.isFinite(d.pct),
    )
    .sort((x, y) => Math.abs(y.pct as number) - Math.abs(x.pct as number))
    .slice(0, 3);
}

// Rule-based next actions from the deltas — no AI required.
export function pickNextActions(deltas: PairDelta[]): string[] {
  const actions: string[] = [];
  const seen = new Set<string>();
  const push = (a: string) => {
    if (!seen.has(a)) {
      seen.add(a);
      actions.push(a);
    }
  };

  // 1. Worsened + newly critical or deranged → book a doctor
  const critical = deltas.filter(
    (d) =>
      d.verdict === "worsened" &&
      (d.bStatus === "critical" || d.bStatus === "deranged-high" || d.bStatus === "deranged-low"),
  );
  if (critical.length) {
    const names = critical.slice(0, 2).map((d) => d.name).join(" and ");
    push(`Book a doctor visit soon to review ${names}.`);
  }

  // 2. Worsened borderline → recheck in a few weeks
  const borderline = deltas.filter(
    (d) => d.verdict === "worsened" && d.bStatus === "borderline",
  );
  if (borderline.length) {
    push(`Recheck ${borderline[0].name} in 4–6 weeks to see if it settles.`);
  }

  // 3. Improved → reinforce habits
  const improved = deltas
    .filter((d) => d.verdict === "improved" && d.pct !== null)
    .sort((x, y) => Math.abs(y.pct as number) - Math.abs(x.pct as number));
  if (improved.length) {
    push(`Keep the habits that helped ${improved[0].name} improve — it's working.`);
  }

  // 4. Fallback if nothing worsened and nothing improved
  if (!actions.length) {
    push("Save these results and re-test in 3 months to spot early trends.");
  }

  return actions.slice(0, 3);
}

export const PlainSummaryCard = ({ deltas, aLabel, bLabel }: Props) => {
  const biggest = pickBiggestChanges(deltas);
  const actions = pickNextActions(deltas);

  // Nothing meaningful to summarise (all unchanged / non-comparable)
  if (!biggest.length && actions.length === 1) {
    return null;
  }

  return (
    <div className="rounded-2xl border-2 border-primary/25 bg-gradient-to-br from-primary/5 via-card to-accent/5 p-4 shadow-soft space-y-4">
      <div className="flex items-center gap-2">
        <span className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-4 h-4 text-primary" />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wide text-primary">In one glance</p>
          <p className="text-xs text-muted-foreground truncate">{aLabel} → {bLabel}</p>
        </div>
      </div>

      {biggest.length > 0 && (
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-2">
            3 biggest changes
          </p>
          <ul className="space-y-2">
            {biggest.map((d) => {
              const up = (d.pct ?? 0) > 0;
              const good = d.verdict === "improved";
              const toneCls = good ? "text-primary bg-primary/10 border-primary/25" : "text-destructive bg-destructive/10 border-destructive/25";
              const Icon = up ? ArrowUp : ArrowDown;
              return (
                <li key={d.key} className="flex items-start gap-2.5">
                  <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full border ${toneCls} flex-shrink-0`}>
                    <Icon className="w-3.5 h-3.5" />
                  </span>
                  <div className="min-w-0 flex-1 text-sm leading-snug">
                    <span className="font-bold text-foreground">{d.name}</span>{" "}
                    <span className="text-muted-foreground">
                      {formatNum(d.a)} → {formatNum(d.b)} {d.unit}
                    </span>
                    <span className={`ml-1 font-bold ${good ? "text-primary" : "text-destructive"}`}>
                      ({up ? "+" : ""}{(d.pct as number).toFixed(1)}%)
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div>
        <div className="flex items-center gap-1.5 mb-2 text-primary">
          <ClipboardList className="w-3.5 h-3.5" />
          <p className="text-[11px] font-bold uppercase tracking-wide">Most important next steps</p>
        </div>
        <ol className="space-y-1.5">
          {actions.map((a, i) => (
            <li key={i} className="flex items-start gap-2 text-sm leading-snug">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[11px] font-bold flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              <span className="text-foreground">{a}</span>
            </li>
          ))}
        </ol>
      </div>

      <p className="text-[10px] text-muted-foreground italic">
        Quick read only — see the full breakdown below.
      </p>
    </div>
  );
};
