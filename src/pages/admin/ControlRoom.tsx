import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Search,
  Loader2,
  RefreshCw,
  Activity,
  AlertTriangle,
  Eye,
  ShieldCheck,
  Filter,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type AdminResult = {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  status: string;
  has_critical_alert: boolean;
  upload_date: string;
  dependant_id: string | null;
};

type StatusFilter = "all" | "completed" | "processing" | "failed" | "critical";
type RangeFilter = "24h" | "7d" | "30d" | "all";

const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  });

const StatusBadge = ({ status, critical }: { status: string; critical: boolean }) => {
  if (critical) {
    return (
      <Badge className="bg-destructive/10 text-destructive border-destructive/30 gap-1">
        <AlertTriangle className="w-3 h-3" /> Critical
      </Badge>
    );
  }
  if (status === "completed")
    return <Badge className="bg-primary/10 text-primary border-primary/30">Completed</Badge>;
  if (status === "processing")
    return (
      <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/30 gap-1">
        <Loader2 className="w-3 h-3 animate-spin" /> Processing
      </Badge>
    );
  if (status === "failed")
    return <Badge variant="outline" className="border-destructive/30 text-destructive">Failed</Badge>;
  return <Badge variant="outline">{status}</Badge>;
};

const withinRange = (iso: string, range: RangeFilter) => {
  if (range === "all") return true;
  const ms =
    range === "24h" ? 24 * 60 * 60 * 1000 : range === "7d" ? 7 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;
  return Date.now() - new Date(iso).getTime() <= ms;
};

export default function ControlRoom() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { isAdmin } = useUserRole();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [range, setRange] = useState<RangeFilter>("7d");
  const [criticalOnly, setCriticalOnly] = useState(false);

  const resultsQ = useQuery({
    queryKey: ["control-room-results"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_recent_results", { _limit: 200 });
      if (error) throw error;
      return (data || []) as AdminResult[];
    },
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (resultsQ.data || []).filter((r) => {
      if (criticalOnly && !r.has_critical_alert) return false;
      if (status !== "all") {
        if (status === "critical" && !r.has_critical_alert) return false;
        if (status !== "critical" && r.status !== status) return false;
      }
      if (!withinRange(r.upload_date, range)) return false;
      if (!q) return true;
      return (
        r.email?.toLowerCase().includes(q) ||
        r.full_name?.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q)
      );
    });
  }, [resultsQ.data, search, status, range, criticalOnly]);

  const totals = useMemo(() => {
    const data = resultsQ.data || [];
    return {
      total: data.length,
      critical: data.filter((r) => r.has_critical_alert).length,
      processing: data.filter((r) => r.status === "processing").length,
      failed: data.filter((r) => r.status === "failed").length,
    };
  }, [resultsQ.data]);

  const openResult = (r: AdminResult) => {
    if (!isAdmin) {
      toast.error("Admin verification required");
      return;
    }
    if (r.status === "processing") {
      toast.info("This scan is still processing");
      return;
    }
    if (r.status === "failed") {
      toast.error("This scan failed and has no report to open");
      return;
    }
    navigate(`/app/result/${r.id}`);
  };

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["control-room-results"] });
    toast.success("Refreshed");
  };

  return (
    <div className="container max-w-6xl mx-auto p-4 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/app/admin")} aria-label="Back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Activity className="w-6 h-6 text-primary" />
              Control Room
            </h1>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              Verified admin · live scan feed
            </p>
          </div>
        </div>
        <Button variant="outline" className="gap-2" onClick={refresh}>
          <RefreshCw className={cn("w-4 h-4", resultsQ.isFetching && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Recent scans", value: totals.total, tone: "default" as const },
          { label: "Critical", value: totals.critical, tone: "danger" as const },
          { label: "Processing", value: totals.processing, tone: "warn" as const },
          { label: "Failed", value: totals.failed, tone: "danger" as const },
        ].map((s) => (
          <div
            key={s.label}
            className={cn(
              "rounded-2xl border bg-card p-4 shadow-soft",
              s.tone === "danger" && s.value > 0 && "border-destructive/30 bg-destructive/5",
              s.tone === "warn" && s.value > 0 && "border-amber-500/30 bg-amber-500/5"
            )}
          >
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</p>
            <p className="text-2xl font-bold mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="rounded-2xl border bg-card p-3 sm:p-4 shadow-soft space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <Filter className="w-4 h-4" /> Filters
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="relative sm:col-span-5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, or result ID"
              className="pl-9 h-11"
              aria-label="Search results"
            />
          </div>
          <div className="sm:col-span-3">
            <Select value={status} onValueChange={(v) => setStatus(v as StatusFilter)}>
              <SelectTrigger className="h-11"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="critical">Critical only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-3">
            <Select value={range} onValueChange={(v) => setRange(v as RangeFilter)}>
              <SelectTrigger className="h-11">
                <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Last 24 hours</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="all">All time (recent 200)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-1 flex">
            <Button
              type="button"
              variant={criticalOnly ? "destructive" : "outline"}
              className="h-11 w-full gap-1"
              onClick={() => setCriticalOnly((v) => !v)}
              aria-pressed={criticalOnly}
              title="Toggle critical-only"
            >
              <AlertTriangle className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Showing {filtered.length} of {resultsQ.data?.length ?? 0} recent scans
        </p>
      </div>

      {/* Table */}
      {resultsQ.isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : resultsQ.error ? (
        <p className="text-sm text-destructive">Failed to load: {(resultsQ.error as Error).message}</p>
      ) : (
        <div className="bg-card border border-border rounded-2xl shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Date</th>
                  <th className="text-left px-4 py-3 font-semibold">User</th>
                  <th className="text-left px-4 py-3 font-semibold">Status</th>
                  <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Result ID</th>
                  <th className="text-right px-4 py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const canOpen =
                    isAdmin && (r.status === "completed" || r.status === "critical" || r.has_critical_alert);
                  return (
                    <tr key={r.id} className="border-t border-border hover:bg-muted/20">
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {fmtDateTime(r.upload_date)}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold">{r.full_name || "—"}</p>
                        <p className="text-xs text-muted-foreground">{r.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={r.status} critical={r.has_critical_alert} />
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <code className="text-xs text-muted-foreground">{r.id.slice(0, 8)}…</code>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          size="sm"
                          variant={canOpen ? "default" : "ghost"}
                          className="h-8 gap-1.5"
                          disabled={!canOpen}
                          onClick={() => openResult(r)}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Open result
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-10">
              No scans match the current filters.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
