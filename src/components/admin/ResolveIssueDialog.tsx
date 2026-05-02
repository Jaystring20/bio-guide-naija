import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useUpdateIssue } from "@/hooks/useIssues";

const ACTIONS = [
  { value: "regenerated_diet", label: "Regenerated diet plan" },
  { value: "rerun_interpret", label: "Re-ran interpretation" },
  { value: "manual_completed", label: "Manually marked completed" },
  { value: "manual_failed", label: "Manually marked failed" },
  { value: "user_re_uploaded", label: "Asked user to re-upload" },
  { value: "user_responded", label: "User confirmed resolved" },
  { value: "no_action", label: "No action needed" },
  { value: "other", label: "Other" },
];

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  issueId: string;
  defaultAction?: string;
};

export function ResolveIssueDialog(props: Props) {
  const [action, setAction] = useState(props.defaultAction || "no_action");
  const [summary, setSummary] = useState("");
  const update = useUpdateIssue();

  const submit = async () => {
    if (!summary.trim()) {
      toast.error("Add a short resolution summary");
      return;
    }
    try {
      await update.mutateAsync({
        id: props.issueId,
        patch: {
          status: "resolved",
          resolution_action: action,
          resolution_summary: summary.trim(),
        },
      });
      toast.success("Issue resolved");
      props.onOpenChange(false);
      setSummary("");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Resolve issue</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>What fixed it?</Label>
            <Select value={action} onValueChange={setAction}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACTIONS.map((a) => (
                  <SelectItem key={a.value} value={a.value}>
                    {a.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="res-summary">Resolution summary</Label>
            <Textarea
              id="res-summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Brief note for the history record (visible in user's history)"
              className="mt-1 min-h-[100px]"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => props.onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={update.isPending}>
            {update.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Mark resolved
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
