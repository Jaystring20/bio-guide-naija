import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Star, X, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  isPromptDismissedForever,
  markPromptDismissedForever,
  markPromptShown,
  useSubmitFeedback,
  wasPromptShownRecently,
} from "@/hooks/useFeedback";

interface Props {
  promptKey: string;
  title: string;
  subtitle?: string;
  resultId?: string | null;
  defaultCategory?: "praise" | "suggestion" | "bug";
}

export const InlineRatingPrompt = ({
  promptKey,
  title,
  subtitle,
  resultId,
  defaultCategory = "praise",
}: Props) => {
  const location = useLocation();
  const submit = useSubmitFeedback();
  const [visible, setVisible] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (isPromptDismissedForever(promptKey)) return;
    if (wasPromptShownRecently(promptKey)) return;
    setVisible(true);
    markPromptShown(promptKey);
  }, [promptKey]);

  if (!visible) return null;

  const send = async (stars: number) => {
    setRating(stars);
    await submit.mutateAsync({
      category: stars >= 4 ? "praise" : stars >= 3 ? "suggestion" : defaultCategory,
      rating: stars,
      message: `[Inline ${promptKey}] ${stars}-star quick rating`,
      screen: location.pathname,
      result_id: resultId ?? null,
    });
    markPromptDismissedForever(promptKey);
    setDone(true);
    setTimeout(() => setVisible(false), 2200);
  };

  const dismiss = () => {
    markPromptDismissedForever(promptKey);
    setVisible(false);
  };

  return (
    <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/5 via-card to-card p-4 shadow-soft mb-4 relative">
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        className="absolute top-2 right-2 w-7 h-7 rounded-full hover:bg-muted/50 flex items-center justify-center text-muted-foreground"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      {done ? (
        <div className="flex items-center gap-3 py-1">
          <CheckCircle2 className="w-5 h-5 text-primary" />
          <p className="text-sm font-semibold">Thanks — that helps us improve VeriDIA.</p>
        </div>
      ) : (
        <>
          <p className="font-display font-bold text-base pr-6">{title}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
          <div className="flex items-center gap-1 mt-3">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => send(n)}
                disabled={submit.isPending}
                className="touch-target p-1 transition-transform active:scale-90 disabled:opacity-50"
                aria-label={`Rate ${n} stars`}
              >
                <Star
                  className={cn(
                    "w-7 h-7",
                    (rating ?? 0) >= n
                      ? "fill-[hsl(var(--alert-amber))] text-[hsl(var(--alert-amber))]"
                      : "text-muted-foreground/40"
                  )}
                />
              </button>
            ))}
            {submit.isPending && <Loader2 className="w-4 h-4 ml-2 animate-spin text-muted-foreground" />}
          </div>
        </>
      )}
    </div>
  );
};

interface NPSProps {
  promptKey: string;
  resultId?: string | null;
}

export const InlineNPSPrompt = ({ promptKey, resultId }: NPSProps) => {
  const location = useLocation();
  const submit = useSubmitFeedback();
  const [visible, setVisible] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (isPromptDismissedForever(promptKey)) return;
    if (wasPromptShownRecently(promptKey)) return;
    setVisible(true);
    markPromptShown(promptKey);
  }, [promptKey]);

  if (!visible) return null;

  const send = async (n: number) => {
    setScore(n);
    await submit.mutateAsync({
      category: n >= 9 ? "praise" : n >= 7 ? "suggestion" : "confusion",
      nps: n,
      message: `[NPS] User scored ${n}/10`,
      screen: location.pathname,
      result_id: resultId ?? null,
    });
    markPromptDismissedForever(promptKey);
    setDone(true);
    setTimeout(() => setVisible(false), 2200);
  };

  const dismiss = () => {
    markPromptDismissedForever(promptKey);
    setVisible(false);
  };

  return (
    <div className="rounded-2xl border border-secondary/30 bg-gradient-to-br from-secondary/5 via-card to-card p-4 shadow-soft mb-4 relative">
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        className="absolute top-2 right-2 w-7 h-7 rounded-full hover:bg-muted/50 flex items-center justify-center text-muted-foreground"
      >
        <X className="w-3.5 h-3.5" />
      </button>
      {done ? (
        <div className="flex items-center gap-3 py-1">
          <CheckCircle2 className="w-5 h-5 text-primary" />
          <p className="text-sm font-semibold">Thank you! We'll keep building.</p>
        </div>
      ) : (
        <>
          <p className="font-display font-bold text-base pr-6">
            How likely are you to recommend VeriDIA to a friend or family member?
          </p>
          <div className="grid grid-cols-11 gap-1 mt-3">
            {Array.from({ length: 11 }).map((_, n) => (
              <button
                key={n}
                onClick={() => send(n)}
                disabled={submit.isPending}
                className={cn(
                  "h-9 rounded-md text-xs font-bold border transition-colors disabled:opacity-50",
                  score === n
                    ? "bg-secondary text-secondary-foreground border-secondary"
                    : "border-border bg-card hover:border-secondary/50 hover:bg-secondary/5"
                )}
              >
                {n}
              </button>
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1.5 px-0.5">
            <span>Not likely</span>
            <span>Very likely</span>
          </div>
        </>
      )}
    </div>
  );
};

// Generic launcher button used after a failed upload to open the full sheet preset to "bug".
import { FeedbackSheet } from "./FeedbackSheet";
import { Bug } from "lucide-react";
export const ReportProblemButton = ({ resultId }: { resultId?: string | null }) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="gap-2 rounded-xl"
      >
        <Bug className="w-4 h-4" />
        Tell us what happened
      </Button>
      <FeedbackSheet
        open={open}
        onOpenChange={setOpen}
        defaultCategory="bug"
        resultId={resultId}
        contextNote="Upload failed"
      />
    </>
  );
};
