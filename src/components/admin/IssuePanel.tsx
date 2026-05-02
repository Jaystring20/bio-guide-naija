import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, ExternalLink, Ticket } from "lucide-react";
import { useIssuesForContext, type IssueCategory, type IssuePriority } from "@/hooks/useIssues";
import { StatusBadge, PriorityBadge, CATEGORY_LABEL } from "./IssueBadges";
import { NewIssueDialog } from "./NewIssueDialog";

const fmtAge = (iso: string) => {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
};

type Props = {
  affectedUserId: string;
  labResultId?: string | null;
  defaultTitle?: string;
  defaultDescription?: string;
  defaultCategory?: IssueCategory;
  defaultPriority?: IssuePriority;
};

export function IssuePanel(props: Props) {
  const navigate = useNavigate();
  const [openNew, setOpenNew] = useState(false);
  const q = useIssuesForContext({
    labResultId: props.labResultId,
    userId: props.labResultId ? undefined : props.affectedUserId,
  });

  return (
    <div className="rounded-2xl border bg-card p-4 shadow-soft space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Ticket className="w-3.5 h-3.5" />
          Issues for this {props.labResultId ? "report" : "user"}
        </p>
        <Button size="sm" variant="outline" className="gap-1.5 h-8" onClick={() => setOpenNew(true)}>
          <Plus className="w-3.5 h-3.5" />
          Log issue
        </Button>
      </div>

      {q.isLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        </div>
      ) : (q.data || []).length === 0 ? (
        <p className="text-sm text-muted-foreground">No issues logged yet.</p>
      ) : (
        <ul className="space-y-2">
          {(q.data || []).map((i: any) => (
            <li key={i.id}>
              <button
                type="button"
                onClick={() => navigate(`/app/admin/issues/${i.id}`)}
                className="w-full text-left rounded-xl border p-3 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{i.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {CATEGORY_LABEL[i.category as IssueCategory]} · opened {fmtAge(i.created_at)} ago
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <PriorityBadge priority={i.priority} />
                    <StatusBadge status={i.status} />
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      <NewIssueDialog
        open={openNew}
        onOpenChange={setOpenNew}
        affectedUserId={props.affectedUserId}
        labResultId={props.labResultId}
        defaultTitle={props.defaultTitle}
        defaultDescription={props.defaultDescription}
        defaultCategory={props.defaultCategory}
        defaultPriority={props.defaultPriority}
        onCreated={(id) => navigate(`/app/admin/issues/${id}`)}
      />
    </div>
  );
}
