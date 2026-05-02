import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Loader2,
  Salad,
  XCircle,
  Sparkles,
  Eye,
  RotateCcw,
  CheckCircle2,
  LifeBuoy,
  Ticket,
  ShieldCheck,
  User as UserIcon,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import {
  useIssue,
  useIssueOwner,
  useUpdateIssue,
  useAddIssueNote,
  type IssuePriority,
  type IssueStatus,
} from "@/hooks/useIssues";
import { IssueTimeline } from "@/components/admin/IssueTimeline";
import { ResolveIssueDialog } from "@/components/admin/ResolveIssueDialog";
import {
  StatusBadge,
  PriorityBadge,
  CATEGORY_LABEL,
  STATUS_LABEL,
  PRIORITY_LABEL,
} from "@/components/admin/IssueBadges";

const fmt = (iso: string) => new Date(iso).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" });

export default function IssueDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const issueQ = useIssue(id);
  const ownerQ = useIssueOwner(issueQ.data?.affected_user_id);
  const update = useUpdateIssue();
  const addNote = useAddIssueNote();

  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [resolveOpen, setResolveOpen] = useState(false);

  if (issueQ.isLoading || !id) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  if (issueQ.error) {
    return <p className="container max-w-3xl mx-auto p-6 text-sm text-destructive">Failed to load: {(issueQ.error as Error).message}</p>;
  }
  const issue = issueQ.data;
  if (!issue) return null;

  const setStatus = async (status: IssueStatus) => {
    if (status === "resolved") {
      setResolveOpen(true);
      return;
    }
    try {
      await update.mutateAsync({ id, patch: { status } });
      toast.success(`Status set to ${STATUS_LABEL[status]}`);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const setPriority = async (priority: IssuePriority) => {
    try {
      await update.mutateAsync({ id, patch: { priority } });
      toast.success(`Priority set to ${PRIORITY_LABEL[priority]}`);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const submitNote = async () => {
    if (!note.trim()) return;
    try {
      await addNote.mutateAsync({ issue_id: id, note: note.trim() });
      setNote("");
      toast.success("Note added");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const runRecovery = async (action: "regenerate_diet" | "set_status_failed" | "set_status_completed", note?: string) => {
    setBusy(action);
    try {
      const { data, error } = await supabase.functions.invoke("admin-issue-action", {
        body: { issueId: id, action, note },
      });
      if (error) throw error;
      if ((data as any)?.ok === false) throw new Error((data as any)?.error || "Action failed");
      toast.success("Action ran and logged on the timeline");
      qc.invalidateQueries({ queryKey: ["admin-issue-events", id] });
      qc.invalidateQueries({ queryKey: ["admin-issue", id] });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="container max-w-5xl mx-auto p-4 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="icon" onClick={() => navigate("/app/admin/issues")} aria-label="Back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
              <Ticket className="w-6 h-6 text-primary shrink-0" />
              <span className="truncate">{issue.title}</span>
            </h1>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              {CATEGORY_LABEL[issue.category as keyof typeof CATEGORY_LABEL]} · opened {fmt(issue.created_at)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <PriorityBadge priority={issue.priority as IssuePriority} />
          <StatusBadge status={issue.status as IssueStatus} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left column: status controls + timeline */}
        <div className="lg:col-span-2 space-y-5">
          {/* Status / priority controls */}
          <div className="rounded-2xl border bg-card p-4 shadow-soft space-y-3">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Manage</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold">Status</label>
                <Select value={issue.status} onValueChange={(v) => setStatus(v as IssueStatus)}>
                  <SelectTrigger className="mt-1 h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(STATUS_LABEL) as IssueStatus[]).map((k) => (
                      <SelectItem key={k} value={k}>{STATUS_LABEL[k]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold">Priority</label>
                <Select value={issue.priority} onValueChange={(v) => setPriority(v as IssuePriority)}>
                  <SelectTrigger className="mt-1 h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(PRIORITY_LABEL) as IssuePriority[]).map((k) => (
                      <SelectItem key={k} value={k}>{PRIORITY_LABEL[k]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {(issue.status === "resolved" || issue.status === "closed") ? (
                <Button variant="outline" size="sm" className="gap-2" onClick={() => setStatus("reopened")}>
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reopen
                </Button>
              ) : (
                <Button size="sm" className="gap-2" onClick={() => setResolveOpen(true)}>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Mark resolved
                </Button>
              )}
            </div>
          </div>

          {/* Recovery actions */}
          {issue.lab_result_id && (
            <div className="rounded-2xl border bg-card p-4 shadow-soft space-y-3">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Recovery actions (logged to timeline)</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Button variant="outline" className="gap-2 justify-start h-11" disabled={!!busy} onClick={() => runRecovery("regenerate_diet")}>
                  {busy === "regenerate_diet" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Salad className="w-4 h-4" />}
                  Regenerate diet plan
                </Button>
                <Button variant="outline" className="gap-2 justify-start h-11" disabled={!!busy} onClick={() => runRecovery("set_status_failed", "from issue")}>
                  {busy === "set_status_failed" ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                  Mark report failed
                </Button>
                <Button variant="outline" className="gap-2 justify-start h-11" disabled={!!busy} onClick={() => runRecovery("set_status_completed", "from issue")}>
                  {busy === "set_status_completed" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Force-complete report
                </Button>
                <Button variant="ghost" className="gap-2 justify-start h-11" onClick={() => navigate(`/app/admin/support?result_id=${issue.lab_result_id}`)}>
                  <LifeBuoy className="w-4 h-4" />
                  Open in Support Desk
                </Button>
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="rounded-2xl border bg-card p-4 shadow-soft space-y-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Resolution history</p>
            <IssueTimeline issueId={id} />
            <div className="border-t border-border pt-3 space-y-2">
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a note (visible to all admins)…"
                className="min-h-[80px]"
              />
              <div className="flex justify-end">
                <Button size="sm" onClick={submitNote} disabled={addNote.isPending || !note.trim()}>
                  {addNote.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save note
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: meta */}
        <div className="space-y-4">
          <div className="rounded-2xl border bg-card p-4 shadow-soft">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
              <UserIcon className="w-3.5 h-3.5" /> Affected user
            </p>
            {ownerQ.isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            ) : ownerQ.data ? (
              <div>
                <p className="font-semibold">{(ownerQ.data as any).full_name || "—"}</p>
                <p className="text-sm text-muted-foreground break-all">{(ownerQ.data as any).email}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Unknown user</p>
            )}
          </div>

          {issue.lab_result_id && (
            <div className="rounded-2xl border bg-card p-4 shadow-soft">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Linked report</p>
              <code className="text-xs text-muted-foreground break-all">{issue.lab_result_id}</code>
              <div className="flex flex-col gap-2 mt-3">
                <Button variant="outline" size="sm" className="gap-2 justify-start" onClick={() => navigate(`/app/admin/support?result_id=${issue.lab_result_id}`)}>
                  <LifeBuoy className="w-3.5 h-3.5" /> Diagnose in Support Desk
                </Button>
                <Button variant="ghost" size="sm" className="gap-2 justify-start" onClick={() => navigate(`/app/result/${issue.lab_result_id}`)}>
                  <Eye className="w-3.5 h-3.5" /> Open report
                </Button>
              </div>
            </div>
          )}

          <div className="rounded-2xl border bg-card p-4 shadow-soft text-sm space-y-1.5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Details</p>
            <p><span className="text-muted-foreground">Category:</span> {CATEGORY_LABEL[issue.category as keyof typeof CATEGORY_LABEL]}</p>
            <p><span className="text-muted-foreground">Source:</span> {issue.source}</p>
            <p><span className="text-muted-foreground">Created:</span> {fmt(issue.created_at)}</p>
            <p><span className="text-muted-foreground">Updated:</span> {fmt(issue.updated_at)}</p>
            {issue.resolved_at && (
              <p><span className="text-muted-foreground">Resolved:</span> {fmt(issue.resolved_at)}</p>
            )}
            {issue.resolution_action && (
              <p><span className="text-muted-foreground">Resolution:</span> {issue.resolution_action}</p>
            )}
            {issue.resolution_summary && (
              <p className="rounded-lg bg-muted/40 p-2 mt-2 whitespace-pre-wrap">{issue.resolution_summary}</p>
            )}
          </div>

          {issue.description && (
            <div className="rounded-2xl border bg-card p-4 shadow-soft">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Original description</p>
              <p className="text-sm whitespace-pre-wrap">{issue.description}</p>
            </div>
          )}
        </div>
      </div>

      <ResolveIssueDialog open={resolveOpen} onOpenChange={setResolveOpen} issueId={id} />
    </div>
  );
}
