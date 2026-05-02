import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  useCreateIssue,
  type IssueCategory,
  type IssuePriority,
} from "@/hooks/useIssues";
import { CATEGORY_LABEL, PRIORITY_LABEL } from "./IssueBadges";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  affectedUserId: string;
  labResultId?: string | null;
  defaultTitle?: string;
  defaultDescription?: string;
  defaultCategory?: IssueCategory;
  defaultPriority?: IssuePriority;
  onCreated?: (id: string) => void;
};

export function NewIssueDialog(props: Props) {
  const [title, setTitle] = useState(props.defaultTitle || "");
  const [description, setDescription] = useState(props.defaultDescription || "");
  const [category, setCategory] = useState<IssueCategory>(props.defaultCategory || "other");
  const [priority, setPriority] = useState<IssuePriority>(props.defaultPriority || "normal");
  const create = useCreateIssue();

  useEffect(() => {
    if (props.open) {
      setTitle(props.defaultTitle || "");
      setDescription(props.defaultDescription || "");
      setCategory(props.defaultCategory || "other");
      setPriority(props.defaultPriority || "normal");
    }
  }, [props.open, props.defaultTitle, props.defaultDescription, props.defaultCategory, props.defaultPriority]);

  const submit = async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    try {
      const row = await create.mutateAsync({
        affected_user_id: props.affectedUserId,
        lab_result_id: props.labResultId ?? null,
        title: title.trim(),
        description: description.trim(),
        category,
        priority,
      });
      toast.success("Issue logged");
      props.onCreated?.(row.id);
      props.onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Log a new issue</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="issue-title">Title</Label>
            <Input
              id="issue-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Stuck on processing for 25 minutes"
              className="mt-1"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as IssueCategory)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(CATEGORY_LABEL) as IssueCategory[]).map((k) => (
                    <SelectItem key={k} value={k}>
                      {CATEGORY_LABEL[k]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as IssuePriority)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(PRIORITY_LABEL) as IssuePriority[]).map((k) => (
                    <SelectItem key={k} value={k}>
                      {PRIORITY_LABEL[k]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="issue-desc">Description</Label>
            <Textarea
              id="issue-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is the user reporting? What did the diagnosis show?"
              className="mt-1 min-h-[120px]"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => props.onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={create.isPending}>
            {create.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Create issue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
