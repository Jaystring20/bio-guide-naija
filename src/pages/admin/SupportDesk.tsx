import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ArrowLeft,
  Search,
  Loader2,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Eye,
  LifeBuoy,
  Salad,
  XCircle,
  ClipboardCopy,
  ShieldCheck,
  Sparkles,
  User as UserIcon,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PLAYBOOK, fillReply, type PlaybookEntry } from "@/data/supportPlaybook";

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

type ResultDetail = {
  id: string;
  user_id: string;
  status: string;
  has_critical_alert: boolean;
  upload_date: string;
  updated_at: string;
  biomarkers: any;
  dietary_plan: any;
  consultation_checklist: any;
  diet_status: string;
  checklist_status: string;
  fda_safety_status: string;
  nafdac_status: string;
  nutrition_status: string;
  processing_steps: any;
  ai_summary: string | null;
};

const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" });

const minutesSince = (iso: string) => Math.floor((Date.now() - new Date(iso).getTime()) / 60000);

type Diagnosis = {
  level: "ok" | "warn" | "danger";
  label: string;
  detail: string;
  suggestedPlaybookId: string;
};

const diagnose = (r: ResultDetail): Diagnosis => {
  const ageMin = minutesSince(r.upload_date);
  const biomarkersOk = Array.isArray(r.biomarkers) && r.biomarkers.length > 0;
  const dietOk = !!r.dietary_plan;

  if (r.status === "processing" && ageMin >= 5) {
    return {
      level: "danger",
      label: `Stuck in processing · ${ageMin} min old`,
      detail:
        "Orbit screen is probably still spinning for the user. Mark this attempt as failed and ask them to re-upload.",
      suggestedPlaybookId: "stuck-processing",
    };
  }
  if (r.status === "processing") {
    return {
      level: "warn",
      label: `Processing · ${ageMin} min old`,
      detail: "Still within normal window. Give it another minute before intervening.",
      suggestedPlaybookId: "stuck-processing",
    };
  }
  if (r.status === "failed") {
    return {
      level: "danger",
      label: "Status: failed",
      detail: "Cleanest path is to ask the user to re-upload.",
      suggestedPlaybookId: "failed-status",
    };
  }
  if (r.has_critical_alert) {
    return {
      level: "danger",
      label: "Critical alert flagged",
      detail: "Send the urgent follow-up reply with the report link.",
      suggestedPlaybookId: "critical-unread",
    };
  }
  if (biomarkersOk && !dietOk) {
    return {
      level: "warn",
      label: "Biomarkers ready, diet plan missing",
      detail: "Tap 'Regenerate diet' — runs from existing biomarkers, no new upload needed.",
      suggestedPlaybookId: "diet-missing",
    };
  }
  if (r.status === "completed" && !biomarkersOk) {
    return {
      level: "warn",
      label: "Completed but biomarkers empty",
      detail: "Photo was unreadable. Ask the user to re-take it in good light.",
      suggestedPlaybookId: "empty-biomarkers",
    };
  }
  return {
    level: "ok",
    label: "Looks healthy",
    detail: "All stages in good state. Use this if you just want to confirm with the user.",
    suggestedPlaybookId: "manual-recovery",
  };
};

const StageDot = ({ ok, label }: { ok: boolean; label: string }) => (
  <div
    className={cn(
      "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border",
      ok
        ? "border-primary/30 bg-primary/10 text-primary"
        : "border-amber-500/30 bg-amber-500/10 text-amber-600",
    )}
  >
    {ok ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3 animate-pulse" />}
    {label}
  </div>
);

export default function SupportDesk() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { isAdmin } = useUserRole();
  const [params, setParams] = useSearchParams();

  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(params.get("result_id"));
  const [busyAction, setBusyAction] = useState<string | null>(null);

  // Recent results pool — same RPC used by Control Room.
  const resultsQ = useQuery({
    queryKey: ["support-desk-results"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_recent_results", { _limit: 200 });
      if (error) throw error;
      return (data || []) as AdminResult[];
    },
  });

  // Detail row for the selected result.
  const detailQ = useQuery({
    queryKey: ["support-desk-detail", selectedId],
    enabled: !!selectedId,
    refetchInterval: 5000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lab_results")
        .select(
          "id,user_id,status,has_critical_alert,upload_date,updated_at,biomarkers,dietary_plan,consultation_checklist,diet_status,checklist_status,fda_safety_status,nafdac_status,nutrition_status,processing_steps,ai_summary",
        )
        .eq("id", selectedId!)
        .single();
      if (error) throw error;
      return data as ResultDetail;
    },
  });

  // Owner email/name for the selected result (admin RPC).
  const ownerQ = useQuery({
    queryKey: ["support-desk-owner", selectedId],
    enabled: !!selectedId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_get_result_owner", {
        _result_id: selectedId!,
      });
      if (error) throw error;
      const row = (data || [])[0] as { user_id: string; email: string; full_name: string } | undefined;
      return row || null;
    },
  });

  useEffect(() => {
    if (selectedId) setParams({ result_id: selectedId }, { replace: true });
  }, [selectedId, setParams]);

  const filteredResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return (resultsQ.data || []).slice(0, 25);
    return (resultsQ.data || []).filter(
      (r) =>
        r.email?.toLowerCase().includes(q) ||
        r.full_name?.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q),
    );
  }, [resultsQ.data, search]);

  const detail = detailQ.data;
  const owner = ownerQ.data;
  const diagnosis = detail ? diagnose(detail) : null;

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["support-desk-results"] });
    qc.invalidateQueries({ queryKey: ["support-desk-detail", selectedId] });
    toast.success("Refreshed");
  };

  const reportLink = selectedId
    ? `${window.location.origin}/app/result/${selectedId}`
    : "";

  const runAction = async (key: string, fn: () => Promise<void>) => {
    if (!isAdmin) return;
    setBusyAction(key);
    try {
      await fn();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusyAction(null);
    }
  };

  const actionRegenerateDiet = () =>
    runAction("regenerate_diet", async () => {
      if (!selectedId) return;
      const { data, error } = await supabase.functions.invoke("admin-regenerate-diet", {
        body: { labResultId: selectedId },
      });
      if (error) throw error;
      if ((data as any)?.ok === false) throw new Error("Regeneration call failed");
      toast.success("Diet plan regeneration triggered");
      qc.invalidateQueries({ queryKey: ["support-desk-detail", selectedId] });
    });

  const actionSetStatus = (status: "failed" | "completed", note?: string) =>
    runAction(status === "failed" ? "mark_failed" : "force_complete", async () => {
      if (!selectedId) return;
      const { data, error } = await supabase.functions.invoke("admin-set-status", {
        body: { labResultId: selectedId, status, note },
      });
      if (error) throw error;
      if ((data as any)?.ok === false) throw new Error("Status update failed");
      toast.success(status === "failed" ? "Marked as failed" : "Force-completed");
      qc.invalidateQueries({ queryKey: ["support-desk-detail", selectedId] });
      qc.invalidateQueries({ queryKey: ["support-desk-results"] });
    });

  const copyReply = async (entry: PlaybookEntry) => {
    const text = fillReply(entry.reply, {
      name: owner?.full_name || null,
      resultLink: reportLink || null,
    });
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Reply copied to clipboard");
    } catch {
      toast.error("Could not copy — long-press to select instead");
    }
  };

  return (
    <div className="container max-w-4xl mx-auto p-4 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/app/admin")} aria-label="Back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <LifeBuoy className="w-6 h-6 text-primary" />
              Support Desk
            </h1>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              Diagnose stuck reports · rescue customers in one tap
            </p>
          </div>
        </div>
        <Button variant="outline" className="gap-2" onClick={refresh}>
          <RefreshCw className={cn("w-4 h-4", (resultsQ.isFetching || detailQ.isFetching) && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Search */}
      <div className="rounded-2xl border bg-card p-3 sm:p-4 shadow-soft space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by email, name, or result ID"
            className="pl-9 h-11"
            aria-label="Search results"
          />
        </div>

        {resultsQ.isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid gap-2 max-h-72 overflow-y-auto">
            {filteredResults.map((r) => {
              const isSelected = r.id === selectedId;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSelectedId(r.id)}
                  className={cn(
                    "text-left rounded-xl border p-3 transition-colors",
                    isSelected
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border bg-background hover:bg-muted/30",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{r.full_name || "—"}</p>
                      <p className="text-xs text-muted-foreground truncate">{r.email}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {r.has_critical_alert && (
                        <Badge variant="destructive" className="gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Critical
                        </Badge>
                      )}
                      <Badge variant="outline" className="capitalize">
                        {r.status}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {fmtDateTime(r.upload_date)}
                  </p>
                </button>
              );
            })}
            {filteredResults.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">No matches.</p>
            )}
          </div>
        )}
      </div>

      {/* Detail panel */}
      {!selectedId ? (
        <div className="rounded-2xl border-2 border-dashed border-border bg-card/50 p-8 text-center">
          <UserIcon className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            Pick a user above to diagnose their report and choose a fix.
          </p>
        </div>
      ) : detailQ.isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : detailQ.error ? (
        <p className="text-sm text-destructive">
          Failed to load detail: {(detailQ.error as Error).message}
        </p>
      ) : detail ? (
        <div className="space-y-4">
          {/* User card */}
          <div className="rounded-2xl border bg-card p-4 shadow-soft">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">User</p>
                <p className="font-bold text-lg truncate">{owner?.full_name || "—"}</p>
                <p className="text-sm text-muted-foreground truncate">{owner?.email || "—"}</p>
              </div>
              <code className="text-[10px] text-muted-foreground shrink-0">
                {detail.id.slice(0, 8)}…
              </code>
            </div>
          </div>

          {/* Diagnosis */}
          {diagnosis && (
            <div
              className={cn(
                "rounded-2xl border p-4 shadow-soft",
                diagnosis.level === "danger" && "border-destructive/40 bg-destructive/5",
                diagnosis.level === "warn" && "border-amber-500/40 bg-amber-500/5",
                diagnosis.level === "ok" && "border-primary/30 bg-primary/5",
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                {diagnosis.level === "ok" ? (
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                ) : (
                  <AlertTriangle
                    className={cn(
                      "w-4 h-4",
                      diagnosis.level === "danger" ? "text-destructive" : "text-amber-600",
                    )}
                  />
                )}
                <p className="font-bold">{diagnosis.label}</p>
              </div>
              <p className="text-sm text-muted-foreground">{diagnosis.detail}</p>
            </div>
          )}

          {/* Stage strip */}
          <div className="rounded-2xl border bg-card p-4 shadow-soft space-y-3">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Stages</p>
            <div className="flex flex-wrap gap-2">
              <StageDot
                ok={Array.isArray(detail.biomarkers) && detail.biomarkers.length > 0}
                label="Biomarkers"
              />
              <StageDot ok={detail.diet_status === "completed" || !!detail.dietary_plan} label="Diet" />
              <StageDot
                ok={detail.checklist_status === "completed" || !!detail.consultation_checklist}
                label="Checklist"
              />
              <StageDot ok={detail.fda_safety_status === "completed"} label="FDA" />
              <StageDot ok={detail.nafdac_status === "completed"} label="NAFDAC" />
              <StageDot ok={detail.nutrition_status === "completed"} label="USDA" />
            </div>
            <p className="text-xs text-muted-foreground">
              Uploaded {fmtDateTime(detail.upload_date)} · last updated {fmtDateTime(detail.updated_at)}
            </p>
          </div>

          {/* Actions */}
          <div className="rounded-2xl border bg-card p-4 shadow-soft space-y-3">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Admin actions</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Button
                variant="default"
                className="gap-2 justify-start h-11"
                disabled={!!busyAction}
                onClick={actionRegenerateDiet}
              >
                {busyAction === "regenerate_diet" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Salad className="w-4 h-4" />
                )}
                Regenerate diet plan
              </Button>
              <Button
                variant="outline"
                className="gap-2 justify-start h-11"
                disabled={!!busyAction || detail.status === "failed"}
                onClick={() => actionSetStatus("failed", "support-desk")}
              >
                {busyAction === "mark_failed" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                Mark as failed
              </Button>
              <Button
                variant="outline"
                className="gap-2 justify-start h-11"
                disabled={!!busyAction || detail.status === "completed"}
                onClick={() => actionSetStatus("completed", "support-desk-manual")}
              >
                {busyAction === "force_complete" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                Force-complete
              </Button>
              <Button
                variant="ghost"
                className="gap-2 justify-start h-11"
                onClick={() => navigate(`/app/result/${detail.id}`)}
              >
                <Eye className="w-4 h-4" />
                Open report as admin
              </Button>
            </div>
          </div>

          {/* Playbook */}
          <div className="rounded-2xl border bg-card p-4 shadow-soft">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
              Playbook · suggested replies
            </p>
            <Accordion
              type="single"
              collapsible
              defaultValue={diagnosis?.suggestedPlaybookId}
            >
              {PLAYBOOK.map((entry) => {
                const isSuggested = entry.id === diagnosis?.suggestedPlaybookId;
                return (
                  <AccordionItem key={entry.id} value={entry.id}>
                    <AccordionTrigger className="text-left hover:no-underline">
                      <div className="flex items-center gap-2 pr-2">
                        {isSuggested && (
                          <Badge className="bg-primary/15 text-primary border-0 hover:bg-primary/15">
                            Suggested
                          </Badge>
                        )}
                        <span className="font-semibold">{entry.title}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3">
                      <div>
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">
                          Cause
                        </p>
                        <p className="text-sm">{entry.cause}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">
                          Fix
                        </p>
                        <p className="text-sm">{entry.fix}</p>
                      </div>
                      <div className="rounded-xl border bg-muted/30 p-3">
                        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                          Reply to user
                        </p>
                        <p className="text-sm whitespace-pre-wrap">
                          {fillReply(entry.reply, {
                            name: owner?.full_name || null,
                            resultLink: reportLink || null,
                          })}
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-2 gap-2"
                          onClick={() => copyReply(entry)}
                        >
                          <ClipboardCopy className="w-3.5 h-3.5" />
                          Copy reply
                        </Button>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </div>
        </div>
      ) : null}
    </div>
  );
}
