import { LineChart, Line, ResponsiveContainer, YAxis } from "recharts";
import type { AlignedBiomarker, PairDelta, SeriesPoint } from "@/lib/compare-engine";

const VERDICT_CLS: Record<string, string> = {
  improved: "bg-primary/15 text-primary border-primary/30",
  worsened: "bg-destructive/15 text-destructive border-destructive/30",
  unchanged: "bg-muted text-muted-foreground border-border",
  new: "bg-accent/15 text-secondary-foreground border-accent/30",
  dropped: "bg-muted text-muted-foreground border-border",
  unit_mismatch: "bg-[hsl(var(--alert-amber))]/15 text-[hsl(var(--alert-amber))] border-[hsl(var(--alert-amber))]/30",
};
const VERDICT_LABEL: Record<string, string> = {
  improved: "Improved", worsened: "Worse", unchanged: "Same", new: "New", dropped: "Dropped", unit_mismatch: "Units differ",
};

function formatNum(n: number | null) {
  if (n === null) return "—";
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, "");
}

export const TimelineRow = ({
  aligned,
  series,
  net,
  dates,
  highlight,
}: {
  aligned: AlignedBiomarker;
  series: SeriesPoint[];
  net: PairDelta;
  dates: string[];
  highlight?: boolean;
}) => {
  const points = series.filter((p) => p.value !== null).map((p) => ({ v: p.value }));
  const verdictCls = VERDICT_CLS[net.verdict] || VERDICT_CLS.unchanged;
  const strokeColor =
    net.verdict === "improved" ? "hsl(var(--primary))" :
    net.verdict === "worsened" ? "hsl(var(--destructive))" :
    "hsl(var(--accent))";

  return (
    <div className={`rounded-2xl border p-3 shadow-soft ${highlight ? "border-accent bg-accent/5" : "border-border bg-card"}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <p className="font-semibold text-body truncate">{aligned.name}</p>
          {aligned.unit && <p className="text-[11px] text-muted-foreground">{aligned.unit}</p>}
        </div>
        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold whitespace-nowrap ${verdictCls}`}>
          {VERDICT_LABEL[net.verdict]}
        </span>
      </div>

      <div className="grid grid-cols-[1fr_80px] gap-2 items-center">
        <div className="overflow-x-auto -mx-1 px-1">
          <div className="flex gap-2 min-w-max">
            {series.map((p, i) => (
              <div key={p.resultId} className="flex flex-col items-center w-14">
                <span className="text-[10px] text-muted-foreground mb-0.5 whitespace-nowrap">
                  {new Date(dates[i]).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}
                </span>
                <span className={`font-display font-extrabold text-sm ${
                  p.status === "critical" || p.status === "deranged-high" || p.status === "deranged-low" ? "text-destructive" :
                  p.status === "borderline" ? "text-[hsl(var(--alert-amber))]" :
                  p.status === "normal" ? "text-primary" : "text-foreground"
                }`}>
                  {formatNum(p.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="h-10">
          {points.length >= 2 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={points} margin={{ top: 4, right: 2, left: 2, bottom: 4 }}>
                <YAxis hide domain={["dataMin", "dataMax"]} />
                <Line type="monotone" dataKey="v" stroke={strokeColor} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-[10px] text-muted-foreground">—</div>
          )}
        </div>
      </div>

      {net.pct !== null && net.verdict !== "unit_mismatch" && (
        <p className="text-[11px] text-muted-foreground mt-2">
          Net change:{" "}
          <span className="font-bold text-foreground">
            {net.abs !== null ? (net.abs > 0 ? "+" : "") + formatNum(net.abs) : "—"} {aligned.unit}
          </span>{" "}
          ({net.pct > 0 ? "+" : ""}{net.pct.toFixed(1)}%)
        </p>
      )}
    </div>
  );
};
