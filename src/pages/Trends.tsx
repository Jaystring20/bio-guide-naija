import { useMemo, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useActiveProfile } from "@/contexts/ActiveProfileContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useDependants } from "@/hooks/useDependants";
import { Loader2, TrendingUp, ArrowLeft } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceArea,
  ResponsiveContainer,
} from "recharts";

type BiomarkerPoint = {
  date: string;
  dateLabel: string;
  value: number;
  status: string;
};

type BiomarkerTrend = {
  name: string;
  unit: string;
  refMin: number | null;
  refMax: number | null;
  points: BiomarkerPoint[];
};

function parseRefRange(range: string): { min: number | null; max: number | null } {
  if (!range) return { min: null, max: null };
  const cleaned = range.replace(/[^0-9.\-–]/g, (c) => (c === "–" ? "-" : ""));
  const parts = cleaned.split("-").filter(Boolean);
  if (parts.length === 2) {
    return { min: parseFloat(parts[0]), max: parseFloat(parts[1]) };
  }
  if (range.toLowerCase().includes("<")) {
    const num = parseFloat(range.replace(/[^0-9.]/g, ""));
    return { min: null, max: isNaN(num) ? null : num };
  }
  if (range.toLowerCase().includes(">")) {
    const num = parseFloat(range.replace(/[^0-9.]/g, ""));
    return { min: isNaN(num) ? null : num, max: null };
  }
  return { min: null, max: null };
}

const statusColor = (status: string) => {
  if (status === "normal") return "hsl(var(--secondary))";
  if (status === "borderline") return "hsl(var(--warning, 45 93% 47%))";
  return "hsl(var(--destructive))";
};

const CustomDot = (props: any) => {
  const { cx, cy, payload } = props;
  if (!cx || !cy) return null;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={5}
      fill={statusColor(payload.status)}
      stroke="hsl(var(--background))"
      strokeWidth={2}
    />
  );
};

const Trends = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const personParam = searchParams.get("person");
  const { dependants } = useDependants();
  const { activeProfileId, setActiveProfileId } = useActiveProfile();

  // Sync deep-link ?person= into context once on mount
  useEffect(() => {
    if (personParam && personParam !== activeProfileId) {
      setActiveProfileId(personParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedPerson = activeProfileId || "myself";

  const { data: results, isLoading } = useQuery({
    queryKey: ["lab-results-trends", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("lab_results")
        .select("*")
        .eq("user_id", user!.id)
        .eq("status", "done")
        .order("test_date", { ascending: true });
      return data || [];
    },
    enabled: !!user,
  });

  const personResults = useMemo(() => {
    if (!results) return [];
    return results.filter((r) => {
      if (selectedPerson === "myself") return !r.dependant_id;
      return r.dependant_id === selectedPerson;
    });
  }, [results, selectedPerson]);

  const trends: BiomarkerTrend[] = useMemo(() => {
    const map = new Map<string, BiomarkerTrend>();

    personResults.forEach((r) => {
      const biomarkers = (r.biomarkers as any[] | null) || [];
      const displayDate = r.test_date || r.upload_date;

      biomarkers.forEach((b: any) => {
        const val = parseFloat(b.value);
        if (isNaN(val) || !b.name) return;

        const key = b.name.toLowerCase().trim();
        if (!map.has(key)) {
          const { min, max } = parseRefRange(b.reference_range || "");
          map.set(key, {
            name: b.name,
            unit: b.unit || "",
            refMin: min,
            refMax: max,
            points: [],
          });
        }

        map.get(key)!.points.push({
          date: displayDate,
          dateLabel: new Date(displayDate).toLocaleDateString("en-NG", {
            day: "numeric",
            month: "short",
            year: "2-digit",
          }),
          value: val,
          status: b.status || "normal",
        });
      });
    });

    return Array.from(map.values()).filter((t) => t.points.length >= 2);
  }, [personResults]);

  const personLabel =
    selectedPerson === "myself"
      ? "You"
      : dependants.find((d) => d.id === selectedPerson)?.full_name || "Unknown";

  return (
    <div className="px-5 pt-6 pb-28 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => navigate("/history")} className="touch-target p-1">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="font-display text-2xl font-bold">Health Trends</h1>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setActiveProfileId(null)}
          className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
            selectedPerson === "myself"
              ? "border-accent bg-accent/10 text-secondary-foreground"
              : "border-border bg-card"
          }`}
        >
          Myself
        </button>
        {dependants.map((d) => (
          <button
            key={d.id}
            onClick={() => setActiveProfileId(d.id)}
            className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
              selectedPerson === d.id
                ? "border-accent bg-accent/10 text-secondary-foreground"
                : "border-border bg-card"
            }`}
          >
            {d.full_name}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-secondary-foreground" />
        </div>
      )}

      {!isLoading && personResults.length < 2 && (
        <div className="text-center py-16">
          <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground text-body font-medium">
            Need at least 2 results for {personLabel}
          </p>
          <p className="text-muted-foreground text-body-sm mt-1">
            Upload more lab results to see trends over time
          </p>
          <button
            onClick={() => navigate("/upload")}
            className="text-secondary-foreground underline mt-3 touch-target text-body-sm"
          >
            Upload a result
          </button>
        </div>
      )}

      {!isLoading && personResults.length >= 2 && trends.length === 0 && (
        <div className="text-center py-16">
          <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground text-body">
            No trackable biomarkers found across results
          </p>
        </div>
      )}

      <div className="space-y-6">
        {trends.map((trend) => {
          const allValues = trend.points.map((p) => p.value);
          const minVal = Math.min(...allValues);
          const maxVal = Math.max(...allValues);
          const padding = (maxVal - minVal) * 0.2 || maxVal * 0.1 || 1;
          let yMin = minVal - padding;
          let yMax = maxVal + padding;

          if (trend.refMin !== null) yMin = Math.min(yMin, trend.refMin - padding);
          if (trend.refMax !== null) yMax = Math.max(yMax, trend.refMax + padding);

          return (
            <div key={trend.name} className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-baseline justify-between mb-3">
                <h3 className="font-semibold text-body">{trend.name}</h3>
                {trend.unit && (
                  <span className="text-body-sm text-muted-foreground">{trend.unit}</span>
                )}
              </div>

              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trend.points} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="dateLabel"
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      domain={[Math.floor(yMin), Math.ceil(yMax)]}
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "13px",
                      }}
                      formatter={(value: number) => [`${value} ${trend.unit}`, trend.name]}
                      labelFormatter={(label: string) => label}
                    />
                    {trend.refMin !== null && trend.refMax !== null && (
                      <ReferenceArea
                        y1={trend.refMin}
                        y2={trend.refMax}
                        fill="hsl(var(--secondary))"
                        fillOpacity={0.15}
                        stroke="none"
                      />
                    )}
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="hsl(var(--accent))"
                      strokeWidth={2}
                      dot={<CustomDot />}
                      activeDot={{ r: 7 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {trend.refMin !== null && trend.refMax !== null && (
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Normal range: {trend.refMin}–{trend.refMax} {trend.unit}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Trends;
