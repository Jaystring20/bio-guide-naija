import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { IssueCategory, IssuePriority, IssueStatus } from "@/hooks/useIssues";

export const STATUS_LABEL: Record<IssueStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  waiting_user: "Waiting on user",
  resolved: "Resolved",
  closed: "Closed",
  reopened: "Reopened",
};

export const PRIORITY_LABEL: Record<IssuePriority, string> = {
  low: "Low",
  normal: "Normal",
  high: "High",
  urgent: "Urgent",
};

export const CATEGORY_LABEL: Record<IssueCategory, string> = {
  processing_delay: "Processing delay",
  failed_extraction: "Failed extraction",
  diet_missing: "Diet missing",
  critical_followup: "Critical follow-up",
  upload_error: "Upload error",
  account: "Account",
  other: "Other",
};

export function StatusBadge({ status, className }: { status: IssueStatus; className?: string }) {
  const cls =
    status === "open"
      ? "bg-amber-500/15 text-amber-700 border-amber-500/30"
      : status === "in_progress"
      ? "bg-secondary/15 text-secondary-foreground border-secondary/30"
      : status === "waiting_user"
      ? "bg-muted text-muted-foreground border-border"
      : status === "resolved"
      ? "bg-primary/15 text-primary border-primary/30"
      : status === "closed"
      ? "bg-muted text-muted-foreground border-border"
      : "bg-destructive/10 text-destructive border-destructive/30";
  return <Badge className={cn(cls, "border", className)}>{STATUS_LABEL[status]}</Badge>;
}

export function PriorityBadge({ priority, className }: { priority: IssuePriority; className?: string }) {
  const cls =
    priority === "urgent"
      ? "bg-destructive/10 text-destructive border-destructive/30"
      : priority === "high"
      ? "bg-amber-500/15 text-amber-700 border-amber-500/30"
      : priority === "normal"
      ? "bg-muted text-muted-foreground border-border"
      : "bg-muted/50 text-muted-foreground border-border";
  return <Badge className={cn(cls, "border", className)}>{PRIORITY_LABEL[priority]}</Badge>;
}
