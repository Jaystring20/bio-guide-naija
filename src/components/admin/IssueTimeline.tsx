import { Loader2, MessageSquare, ArrowRightLeft, UserCog, Wrench, Plus } from "lucide-react";
import { useIssueTimeline } from "@/hooks/useIssues";
import { STATUS_LABEL } from "./IssueBadges";

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" });

const ICON: Record<string, any> = {
  note: MessageSquare,
  status_change: ArrowRightLeft,
  assignment: UserCog,
  action_taken: Wrench,
  linked_action: Wrench,
  created: Plus,
};

export function IssueTimeline({ issueId }: { issueId: string }) {
  const q = useIssueTimeline(issueId);

  if (q.isLoading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const events = q.data || [];
  if (events.length === 0) {
    return <p className="text-sm text-muted-foreground py-4">No activity yet.</p>;
  }

  return (
    <ol className="relative border-l border-border pl-5 space-y-4">
      {events.map((e) => {
        const Icon = ICON[e.event_type] || MessageSquare;
        return (
          <li key={e.id} className="relative">
            <span className="absolute -left-[27px] top-1 w-5 h-5 rounded-full bg-card border border-border flex items-center justify-center">
              <Icon className="w-3 h-3 text-muted-foreground" />
            </span>
            <p className="text-xs text-muted-foreground">{fmt(e.created_at)}</p>
            <div className="text-sm mt-0.5">
              {e.event_type === "created" && (
                <span>
                  Issue created · status set to{" "}
                  <span className="font-semibold">{STATUS_LABEL[(e.to_status as any) || "open"]}</span>
                </span>
              )}
              {e.event_type === "status_change" && (
                <span>
                  Status changed{" "}
                  {e.from_status && (
                    <>
                      from <span className="font-semibold">{STATUS_LABEL[e.from_status as any] || e.from_status}</span>{" "}
                    </>
                  )}
                  to <span className="font-semibold">{STATUS_LABEL[(e.to_status as any) || ""] || e.to_status}</span>
                </span>
              )}
              {e.event_type === "assignment" && <span>Assignee changed</span>}
              {e.event_type === "action_taken" && (
                <span>
                  Recovery action: <span className="font-semibold">{e.action_key}</span>
                </span>
              )}
              {e.event_type === "note" && <span className="font-semibold">Note</span>}
            </div>
            {e.note && (
              <p className="text-sm text-foreground/90 mt-1 whitespace-pre-wrap rounded-lg bg-muted/40 p-2">
                {e.note}
              </p>
            )}
          </li>
        );
      })}
    </ol>
  );
}
