import { ArrowUp, ArrowDown, Minus, AlertCircle } from "lucide-react";
import type { PairDelta } from "@/lib/compare-engine";

const VERDICT_STYLES: Record<string, { label: string; cls: string }> = {
  improved: { label: "Improved", cls: "bg-primary/15 text-primary border-primary/30" },
  worsened: { label: "Worsened", cls: "bg-destructive/15 text-destructive border-destructive/30" },
  unchanged: { label: "Unchanged", cls: "bg-muted text-muted-foreground border-border" },
  new: { label: "New", cls: "bg-accent/15 text-secondary-foreground border-accent/30" },
  dropped: { label: "Dropped", cls: "bg-muted text-muted-foreground border-border" },
  unit_mismatch: { label: "Unit mismatch", cls: "bg-[hsl(var(--alert-amber))]/15 text-[hsl(var(--alert-amber))] border-[hsl(var(--alert-amber))]/30" },
};

function formatNum(n: number | null) {
  if (n === null) return "—";
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, "");
}

export const BiomarkerDeltaCard = ({ delta, aLabel, bLabel, highlight }: { delta: PairDelta; aLabel: string; bLabel: string; highlight?: boolean }) => {
  const v = VERDICT_STYLES[delta.verdict] || VERDICT_STYLES.unchanged;
  const arrow =
    delta.abs === null ? <Minus className="w-3 h-3" /> :
    delta.abs > 0 ? <ArrowUp className="w-3 h-3" /> :
    delta.abs < 0 ? <ArrowDown className="w-3 h-3" /> :
    <Minus className="w-3 h-3" />;

  return (
    <div className={`rounded-2xl border p-4 shadow-soft ${highlight ? "border-accent bg-accent/5" : "border-border bg-card"}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <p className="font-semibold text-body truncate">{delta.name}</p>
          {delta.unit && <p className="text-[11px] text-muted-foreground">{delta.unit}</p>}
        </div>
        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold ${v.cls}`}>
          {v.label}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-2">
        <ValueCell label={aLabel} value={delta.a} raw={delta.aRaw} status={delta.aStatus} unit={delta.unit} />
        <ValueCell label={bLabel} value={delta.b} raw={delta.bRaw} status={delta.bStatus} unit={delta.unit} newer />
      </div>

      {delta.verdict === "unit_mismatch" ? (
        <div className="mt-1 flex items-start gap-1.5 rounded-lg bg-[hsl(var(--alert-amber))]/10 px-2.5 py-2 text-[11px] text-[hsl(var(--alert-amber))]">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>Units differ between reports — can't compare safely.</span>
        </div>
      ) : delta.abs !== null && delta.pct !== null ? (
        <div className="flex items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 font-bold text-foreground">
            {arrow}
            {delta.abs > 0 ? "+" : ""}{formatNum(delta.abs)} {delta.unit}
          </span>
          <span className="text-muted-foreground">
            ({delta.pct > 0 ? "+" : ""}{delta.pct.toFixed(1)}%)
          </span>
        </div>
      ) : null}
    </div>
  );
};

const ValueCell = ({ label, value, raw, status, unit, newer }: { label: string; value: number | null; raw?: string | number; status?: string; unit: string; newer?: boolean }) => {
  const statusCls =
    status === "critical" ? "text-destructive" :
    status === "deranged-high" || status === "deranged-low" ? "text-destructive" :
    status === "borderline" ? "text-[hsl(var(--alert-amber))]" :
    status === "normal" ? "text-primary" : "text-foreground";
  return (
    <div className={`rounded-xl border ${newer ? "border-accent/30 bg-accent/5" : "border-border bg-muted/30"} px-3 py-2`}>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground truncate">{label}</p>
      <p className={`font-display text-lg font-extrabold leading-tight ${statusCls}`}>
        {value !== null ? formatNum(value) : raw !== undefined ? String(raw) : "—"}
      </p>
      {unit && <p className="text-[10px] text-muted-foreground">{unit}</p>}
    </div>
  );
};
