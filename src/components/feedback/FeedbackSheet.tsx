import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Bug, Lightbulb, Heart, HelpCircle, Sparkles, MessageSquare, Star, Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSubmitFeedback, type FeedbackCategory } from "@/hooks/useFeedback";
import { Confetti } from "@/components/Confetti";

const CATEGORIES: { id: FeedbackCategory; label: string; icon: any; tone: string }[] = [
  { id: "bug", label: "Bug", icon: Bug, tone: "text-destructive" },
  { id: "confusion", label: "Confusing", icon: HelpCircle, tone: "text-[hsl(var(--alert-amber))]" },
  { id: "suggestion", label: "Suggestion", icon: Lightbulb, tone: "text-secondary" },
  { id: "feature_request", label: "Feature", icon: Sparkles, tone: "text-secondary" },
  { id: "praise", label: "Praise", icon: Heart, tone: "text-primary" },
  { id: "other", label: "Other", icon: MessageSquare, tone: "text-muted-foreground" },
];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultCategory?: FeedbackCategory;
  resultId?: string | null;
  contextNote?: string;
}

export const FeedbackSheet = ({ open, onOpenChange, defaultCategory, resultId, contextNote }: Props) => {
  const location = useLocation();
  const submit = useSubmitFeedback();
  const [category, setCategory] = useState<FeedbackCategory>(defaultCategory || "suggestion");
  const [rating, setRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (open) {
      setCategory(defaultCategory || "suggestion");
      setRating(null);
      setMessage("");
      setDone(false);
    }
  }, [open, defaultCategory]);

  const send = async () => {
    if (!message.trim()) return;
    await submit.mutateAsync({
      category,
      rating,
      message,
      screen: location.pathname,
      result_id: resultId ?? null,
    });
    setDone(true);
    setTimeout(() => onOpenChange(false), 1700);
  };

  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const deviceShort =
    /iPhone/i.test(ua) ? "iPhone" :
    /iPad/i.test(ua) ? "iPad" :
    /Android/i.test(ua) ? "Android" :
    /Macintosh/i.test(ua) ? "Mac" :
    /Windows/i.test(ua) ? "Windows" : "Web";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[92vh] overflow-y-auto px-5 pt-5 pb-8">
        {done ? (
          <div className="py-12 text-center relative">
            <Confetti />
            <div className="w-14 h-14 rounded-full bg-primary/15 mx-auto flex items-center justify-center mb-4">
              <CheckCircle2 className="w-7 h-7 text-primary" />
            </div>
            <p className="font-display text-xl font-extrabold">Thank you!</p>
            <p className="text-muted-foreground text-sm mt-1">Your voice shapes VeriDIA.</p>
          </div>
        ) : (
          <>
            <SheetHeader className="text-left mb-4">
              <SheetTitle className="font-display text-2xl font-extrabold">Share feedback</SheetTitle>
              <SheetDescription className="text-sm">
                You're helping us build a tool Nigerian families can trust. Even one sentence helps.
              </SheetDescription>
            </SheetHeader>

            {/* Category chips */}
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              What kind of feedback?
            </p>
            <div className="grid grid-cols-3 gap-2 mb-5">
              {CATEGORIES.map((c) => {
                const Icon = c.icon;
                const active = category === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategory(c.id)}
                    className={cn(
                      "rounded-xl border px-2 py-2.5 flex flex-col items-center gap-1 text-xs font-semibold transition-all",
                      active
                        ? "border-primary bg-primary/10 text-foreground shadow-soft"
                        : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    )}
                  >
                    <Icon className={cn("w-4 h-4", active ? c.tone : "")} />
                    {c.label}
                  </button>
                );
              })}
            </div>

            {/* Rating */}
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              How was your experience? (optional)
            </p>
            <div className="flex items-center gap-1.5 mb-5">
              {[1, 2, 3, 4, 5].map((n) => {
                const filled = (hoverRating ?? rating ?? 0) >= n;
                return (
                  <button
                    key={n}
                    type="button"
                    onMouseEnter={() => setHoverRating(n)}
                    onMouseLeave={() => setHoverRating(null)}
                    onClick={() => setRating(rating === n ? null : n)}
                    className="touch-target p-1 transition-transform active:scale-90"
                    aria-label={`Rate ${n} stars`}
                  >
                    <Star
                      className={cn(
                        "w-7 h-7 transition-colors",
                        filled ? "fill-[hsl(var(--alert-amber))] text-[hsl(var(--alert-amber))]" : "text-muted-foreground/40"
                      )}
                    />
                  </button>
                );
              })}
            </div>

            {/* Message */}
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Tell us more
            </p>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell us what worked or what tripped you up — even one sentence helps."
              className="min-h-[110px] rounded-xl text-base"
              maxLength={2000}
            />
            <p className="text-[11px] text-muted-foreground mt-1 mb-4 text-right">
              {message.length}/2000
            </p>

            {/* Context badges */}
            <div className="flex flex-wrap gap-1.5 mb-5">
              {contextNote && (
                <Badge variant="secondary" className="text-[11px]">
                  {contextNote}
                </Badge>
              )}
              <Badge variant="secondary" className="text-[11px]">Screen: {location.pathname}</Badge>
              <Badge variant="secondary" className="text-[11px]">Device: {deviceShort}</Badge>
              {resultId && <Badge variant="secondary" className="text-[11px]">Linked report</Badge>}
            </div>

            <Button
              onClick={send}
              disabled={!message.trim() || submit.isPending}
              className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold text-base hover:bg-primary/90"
            >
              {submit.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending…</>
              ) : (
                "Send feedback"
              )}
            </Button>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};
