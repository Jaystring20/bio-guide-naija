import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Search,
  RefreshCw,
  Ticket,
  Plus,
  ShieldCheck,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useIssuesList, type IssueCategory, type IssuePriority, type IssueStatus } from "@/hooks/useIssues";
import {
  StatusBadge,
  PriorityBadge,
  CATEGORY_LABEL,
  STATUS_LABEL,
  PRIORITY_LABEL,
} from "@/components/admin/IssueBadges";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const fmt = (iso: string) => new Date(iso).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" });
const fmtAge = (iso: string) => {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
};

export default function IssueQueue() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const list = useIssuesList(300);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | IssueStatus>("all");
  const [priority, setPriority] = useState<"all" | IssuePriority>("all");
  const [category, setCategory] = useState<"all" | IssueCategory>("all");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (list.data || []).filter((i) => {
      if (status !== "all" && i.status !== status) return false;
      if (priority !== "all" && i.priority !== priority) return false;
      if (category !== "all" && i.category !== category) return false;
      if (!q) return true;
      return (
        i.title.toLowerCase().includes(q) ||
        i.affected_email?.toLowerCase().includes(q) ||
        i.affected_name?.toLowerCase().includes(q) ||
        i.id.toLowerCase().includes(q)
      );
    });
  }, [list.data, search, status, priority, category]);

  const totals = useMemo(() => {
    const data = list.data || [];
    return {
      total: data.length,
      open: data.filter((i) => i.status === "open").length,
      inProgress: data.filter((i) => i.status === "in_progress").length,
      urgent: data.filter((i) => i.priority === "urgent" && i.status !== "resolved" && i.status !== "closed").length,
    };
  }, [list.data]);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["admin-issues-list"] });
    toast.success("Refreshed");
  };

  return (
    <div className="container max-w-6xl mx-auto p-4 sm:p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/app/admin")} aria-label="Back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Ticket className="w-6 h-6 text-primary" />
              Issue Queue
            </h1>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              Track every reported issue from open to resolved
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={refresh}>
            <RefreshCw className={cn("w-4 h-4", list.isFetching && "animate-spin")} />
            Refresh
          </Button>
          <Button className="gap-2" onClick={() => navigate("/app/admin/support")}>
            <Plus className="w-4 h-4" />
            New from Support Desk
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "All issues", value: totals.total },
          { label: "Open", value: totals.open },
          { label: "In progress", value: totals.inProgress },
          { label: "Urgent (active)", value: totals.urgent, danger: totals.urgent > 0 },
        ].map((s) => (
          <div
            key={s.label}
            className={cn(
              "rounded-2xl border bg-card p-4 shadow-soft",
              s.danger && "border-destructive/30 bg-destructive/5",
            )}
          >
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</p>
            <p className="text-2xl font-bold mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="rounded-2xl border bg-card p-3 sm:p-4 shadow-soft space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="relative sm:col-span-5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title, user, or ID"
              className="pl-9 h-11"
            />
          </div>
          <div className="sm:col-span-3">
            <Select value={status} onValueChange={(v) => setStatus(v as any)}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {(Object.keys(STATUS_LABEL) as IssueStatus[]).map((k) => (
                  <SelectItem key={k} value={k}>
                    {STATUS_LABEL[k]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Select value={priority} onValueChange={(v) => setPriority(v as any)}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All priorities</SelectItem>
                {(Object.keys(PRIORITY_LABEL) as IssuePriority[]).map((k) => (
                  <SelectItem key={k} value={k}>
                    {PRIORITY_LABEL[k]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Select value={category} onValueChange={(v) => setCategory(v as any)}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {(Object.keys(CATEGORY_LABEL) as IssueCategory[]).map((k) => (
                  <SelectItem key={k} value={k}>
                    {CATEGORY_LABEL[k]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Showing {filtered.length} of {list.data?.length ?? 0} issues
        </p>
      </div>

      {list.isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : list.error ? (
        <p className="text-sm text-destructive">Failed to load: {(list.error as Error).message}</p>
      ) : (
        <div className="bg-card border border-border rounded-2xl shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Priority</th>
                  <th className="text-left px-4 py-3 font-semibold">Title</th>
                  <th className="text-left px-4 py-3 font-semibold">User</th>
                  <th className="text-left px-4 py-3 font-semibold">Status</th>
                  <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Age</th>
                  <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Updated</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((i) => (
                  <tr
                    key={i.id}
                    className="border-t border-border hover:bg-muted/20 cursor-pointer"
                    onClick={() => navigate(`/app/admin/issues/${i.id}`)}
                  >
                    <td className="px-4 py-3"><PriorityBadge priority={i.priority} /></td>
                    <td className="px-4 py-3">
                      <p className="font-semibold">{i.title}</p>
                      <p className="text-xs text-muted-foreground">{CATEGORY_LABEL[i.category]}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{i.affected_name || "—"}</p>
                      <p className="text-xs text-muted-foreground">{i.affected_email}</p>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={i.status} /></td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell whitespace-nowrap">
                      {fmtAge(i.created_at)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell whitespace-nowrap">
                      {fmt(i.updated_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-10">No issues match the current filters.</p>
          )}
        </div>
      )}
    </div>
  );
}
