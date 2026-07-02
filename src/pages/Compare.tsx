import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useDependants } from "@/hooks/useDependants";
import { Loader2, Info } from "lucide-react";
import { CompareHeader } from "@/components/compare/CompareHeader";
import { CompareSummary } from "@/components/compare/CompareSummary";
import { BiomarkerDeltaCard } from "@/components/compare/BiomarkerDeltaCard";
import { TimelineRow } from "@/components/compare/TimelineRow";
import { AiVerdictPanel } from "@/components/compare/AiVerdictPanel";
import {
  alignBiomarkers,
  computeDelta,
  netDelta,
  seriesFor,
  summarize,
  type ResultLite,
  type PairDelta,
} from "@/lib/compare-engine";

const useQueryParams = () => new URLSearchParams(useLocation().search);

const Compare = () => {
  const navigate = useNavigate();
  const params = useQueryParams();
  const { user, profile } = useAuth();
  const { dependants } = useDependants();

  // Parse ids from ?ids=a,b,c (order matters: oldest → newest as user selected)
  const rawIds = (params.get("ids") || "").split(",").map((s) => s.trim()).filter(Boolean);
  const initialMode = (params.get("mode") as "side" | "timeline") || "side";
  const [mode, setMode] = useState<"side" | "timeline">(initialMode);
  const [swapped, setSwapped] = useState(false);

  const { data: results, isLoading } = useQuery({
    queryKey: ["compare-results", user?.id, rawIds.join(",")],
    queryFn: async (): Promise<ResultLite[]> => {
      if (rawIds.length < 2) return [];
      const { data, error } = await supabase
        .from("lab_results")
        .select("id, upload_date, test_date, dependant_id, biomarkers")
        .in("id", rawIds)
        .eq("user_id", user!.id);
      if (error) throw error;
      const rows = (data || []).map((r) => ({
        id: r.id,
        upload_date: r.upload_date,
        test_date: r.test_date,
        dependant_id: r.dependant_id,
        biomarkers: (r.biomarkers as any[]) || [],
      })) as ResultLite[];
      // Order chronologically by test_date fallback upload_date.
      rows.sort((a, b) => {
        const da = new Date(a.test_date || a.upload_date).getTime();
        const db = new Date(b.test_date || b.upload_date).getTime();
        return da - db;
      });
      return rows;
    },
    enabled: !!user && rawIds.length >= 2,
  });

  // Redirect to history if nothing to compare
  useEffect(() => {
    if (!isLoading && (!results || results.length < 2)) {
      const t = setTimeout(() => navigate("/app/history", { replace: true }), 1500);
      return () => clearTimeout(t);
    }
  }, [isLoading, results, navigate]);

  const ordered = useMemo(() => {
    if (!results) return [];
    return swapped && results.length === 2 ? [results[1], results[0]] : results;
  }, [results, swapped]);

  const aligned = useMemo(() => (ordered.length ? alignBiomarkers(ordered) : []), [ordered]);

  const isPair = ordered.length === 2;
  const a = ordered[0];
  const b = ordered[ordered.length - 1];

  const deltas: PairDelta[] = useMemo(() => {
    if (ordered.length < 2) return [];
    return aligned.map((x) => (isPair ? computeDelta(x, a.id, b.id) : netDelta(x, ordered)));
  }, [aligned, ordered, isPair, a, b]);

  const summary = useMemo(() => summarize(deltas), [deltas]);

  const ownerLabel = (depId: string | null | undefined) => {
    if (!depId) return profile?.full_name?.split(" ")[0] || "You";
    return dependants.find((d) => d.id === depId)?.full_name?.split(" ")[0] || "Family";
  };

  const crossProfile = useMemo(() => {
    if (ordered.length < 2) return false;
    const ids = new Set(ordered.map((r) => r.dependant_id || "self"));
    return ids.size > 1;
  }, [ordered]);

  const profileLabel = useMemo(() => {
    if (ordered.length === 0) return "";
    if (crossProfile) return "Multiple people";
    return ownerLabel(ordered[0].dependant_id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ordered, crossProfile, dependants, profile]);

  // If two results share the same test_date, append upload-time so cards are distinguishable.
  const sameDay = ordered.length === 2
    && new Date(ordered[0].test_date || ordered[0].upload_date).toDateString()
       === new Date(ordered[1].test_date || ordered[1].upload_date).toDateString();

  const formatDateLabel = (r: ResultLite | undefined) => {
    if (!r) return "";
    const d = new Date(r.test_date || r.upload_date);
    const datePart = d.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "2-digit" });
    if (!sameDay) return datePart;
    // Fall back to upload time (usually different even when test_date matches).
    const t = new Date(r.upload_date);
    const timePart = t.toLocaleTimeString("en-NG", { hour: "numeric", minute: "2-digit" });
    return `${datePart} · ${timePart}`;
  };

  // Sort deltas: worsened → improved → unit_mismatch → new/dropped → unchanged
  const sortRank = (v: string) =>
    v === "worsened" ? 0 : v === "improved" ? 1 : v === "unit_mismatch" ? 2 : v === "new" || v === "dropped" ? 3 : 4;
  const sortedDeltas = useMemo(
    () => [...deltas].sort((x, y) => sortRank(x.verdict) - sortRank(y.verdict)),
    [deltas],
  );

  const aiPayload = useMemo(() => {
    return {
      cross_profile: crossProfile,
      report_count: ordered.length,
      reports: ordered.map((r, i) => ({
        index: i,
        label: i === 0 ? "Oldest" : i === ordered.length - 1 ? "Newest" : `Report ${i + 1}`,
        date: r.test_date || r.upload_date,
        owner: ownerLabel(r.dependant_id),
      })),
      summary,
      deltas: sortedDeltas.slice(0, 24).map((d) => ({
        name: d.name,
        unit: d.unit,
        direction: d.direction,
        from: d.a,
        to: d.b,
        abs: d.abs,
        pct: d.pct,
        verdict: d.verdict,
        from_status: d.aStatus,
        to_status: d.bStatus,
      })),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ordered, crossProfile, sortedDeltas, summary]);

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!results || results.length < 2) {
    return (
      <div className="px-5 pt-6 pb-8 max-w-lg mx-auto">
        <div className="rounded-2xl border border-border bg-card p-5 text-center">
          <Info className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
          <h1 className="font-display text-lg font-extrabold">Pick 2 or more results to compare</h1>
          <p className="text-sm text-muted-foreground mt-1">Redirecting you back to your history…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 pt-4 pb-24 max-w-lg mx-auto space-y-5">
      <CompareHeader
        count={ordered.length}
        mode={mode}
        onModeChange={setMode}
        onSwap={isPair ? () => setSwapped((s) => !s) : undefined}
        crossProfile={crossProfile}
        profileLabel={profileLabel}
      />

      <CompareSummary summary={summary} />

      {mode === "side" && isPair && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2 text-center">
            <ReportChip label="Older" date={formatDateLabel(a)} owner={ownerLabel(a.dependant_id)} />
            <ReportChip label="Newer" date={formatDateLabel(b)} owner={ownerLabel(b.dependant_id)} newer />
          </div>
          <div className="space-y-2.5">
            {sortedDeltas.map((d, i) => (
              <BiomarkerDeltaCard
                key={d.key}
                delta={d}
                aLabel={formatDateLabel(a)}
                bLabel={formatDateLabel(b)}
                highlight={i < 2 && (d.verdict === "worsened" || d.verdict === "improved")}
              />
            ))}
          </div>
        </div>
      )}

      {(mode === "timeline" || !isPair) && (
        <div className="space-y-2.5">
          {aligned.map((x, i) => (
            <TimelineRow
              key={x.key}
              aligned={x}
              series={seriesFor(x, ordered)}
              net={netDelta(x, ordered)}
              dates={ordered.map((r) => r.test_date || r.upload_date)}
              highlight={i < 2}
            />
          ))}
        </div>
      )}

      <AiVerdictPanel
        resultIds={ordered.map((r) => r.id)}
        payload={aiPayload}
        cacheKey={ordered.map((r) => r.id).join("|")}
      />
    </div>
  );
};

const ReportChip = ({ label, date, owner, newer }: { label: string; date: string; owner: string; newer?: boolean }) => (
  <div className={`rounded-xl border px-3 py-2 ${newer ? "border-accent bg-accent/5" : "border-border bg-card"}`}>
    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
    <p className="font-display font-extrabold text-sm">{date}</p>
    <p className="text-[11px] text-muted-foreground truncate">{owner}</p>
  </div>
);

export default Compare;
