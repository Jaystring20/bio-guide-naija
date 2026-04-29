import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, RefreshCw, MessageSquareWarning, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FeedbackSheet } from "@/components/feedback/FeedbackSheet";
import type { Language } from "./types";

type ProcessingStep = {
  step: string;
  ms?: number;
  ok?: boolean;
  model?: string;
  note?: string;
};

interface EmptyBiomarkersBannerProps {
  status: string | null | undefined;
  processingSteps?: ProcessingStep[] | null;
  resultId?: string | null;
  language: Language;
  /** Compact = inline banner at top of report; Full = standalone tab fallback */
  variant?: "compact" | "full";
}

const COPY = {
  en: {
    titleFailed: "We couldn't read your lab values",
    titleProcessing: "Still reading your lab values…",
    titleGeneric: "Biomarker breakdown isn't available",
    bodyFailed:
      "Our AI couldn't extract the numbers from this upload. This usually means the photo was blurry, cropped, or the file wasn't a lab report.",
    bodyProcessing:
      "Hang on a moment — we're still pulling the values out of your scan. If this stays for more than a minute, please re-upload.",
    bodyGeneric:
      "Something went wrong while extracting values from your lab. Please re-upload a clearer photo or PDF.",
    reupload: "Re-upload lab",
    feedback: "Report this issue",
    showDetails: "Show technical details",
    hideDetails: "Hide technical details",
    detailsHeader: "Processing log",
    statusLabel: "Stage",
    feedbackContext:
      "Biomarker breakdown was empty on this report. Please describe what you uploaded so we can investigate.",
  },
  pidgin: {
    titleFailed: "We no fit read your lab numbers",
    titleProcessing: "We dey still read your lab…",
    titleGeneric: "Biomarker breakdown no dey here",
    bodyFailed:
      "Our AI no fit catch the numbers from this upload. Maybe the picture blur, e cut, or the file no be lab report.",
    bodyProcessing:
      "Wait small — we dey still pull the numbers comot. If e tey pass one minute, abeg upload am again.",
    bodyGeneric:
      "Something happen during processing. Abeg upload the lab result again make we read am well.",
    reupload: "Upload lab again",
    feedback: "Tell us wetin happen",
    showDetails: "Show technical details",
    hideDetails: "Hide technical details",
    detailsHeader: "Processing log",
    statusLabel: "Stage",
    feedbackContext:
      "Biomarker breakdown was empty on this report. Please describe what you uploaded so we can investigate.",
  },
} as const;

export const EmptyBiomarkersBanner = ({
  status,
  processingSteps,
  resultId,
  language,
  variant = "full",
}: EmptyBiomarkersBannerProps) => {
  const navigate = useNavigate();
  const [showDetails, setShowDetails] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const t = COPY[language === "pidgin" ? "pidgin" : "en"];

  const isFailed = status === "failed";
  const isProcessing = status === "processing" || status === "partial";

  const title = isFailed ? t.titleFailed : isProcessing ? t.titleProcessing : t.titleGeneric;
  const body = isFailed ? t.bodyFailed : isProcessing ? t.bodyProcessing : t.bodyGeneric;

  const failedStep = useMemo(
    () => processingSteps?.find((s) => s.ok === false),
    [processingSteps],
  );

  const tone = isFailed
    ? "border-destructive/40 bg-destructive/5"
    : isProcessing
    ? "border-[hsl(var(--alert-amber))]/40 bg-[hsl(var(--alert-amber))]/5"
    : "border-border bg-card";

  const iconTone = isFailed
    ? "text-destructive"
    : isProcessing
    ? "text-[hsl(var(--alert-amber))]"
    : "text-muted-foreground";

  return (
    <>
      <div
        role="alert"
        aria-live="polite"
        className={`rounded-2xl border p-4 ${tone} ${variant === "compact" ? "mb-4" : ""}`}
      >
        <div className="flex items-start gap-3">
          <div className={`shrink-0 mt-0.5 ${iconTone}`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <p className="font-display font-bold text-body leading-snug">{title}</p>
            <p className="text-body-sm text-muted-foreground">{body}</p>

            {failedStep && (
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold">{t.statusLabel}:</span>{" "}
                <code className="bg-muted/60 rounded px-1 py-0.5 text-[11px]">
                  {failedStep.step}
                  {failedStep.note ? ` — ${failedStep.note}` : ""}
                </code>
              </p>
            )}

            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                size="sm"
                onClick={() => navigate("/app/upload")}
                className="bg-primary text-primary-foreground"
              >
                <RefreshCw className="w-4 h-4 mr-1.5" />
                {t.reupload}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setFeedbackOpen(true)}
              >
                <MessageSquareWarning className="w-4 h-4 mr-1.5" />
                {t.feedback}
              </Button>
            </div>

            {processingSteps && processingSteps.length > 0 && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowDetails((v) => !v)}
                  className="text-xs font-semibold text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                >
                  {showDetails ? (
                    <>
                      <ChevronUp className="w-3.5 h-3.5" />
                      {t.hideDetails}
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3.5 h-3.5" />
                      {t.showDetails}
                    </>
                  )}
                </button>

                {showDetails && (
                  <div className="mt-2 rounded-lg bg-muted/40 border border-border p-3">
                    <p className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground mb-2">
                      {t.detailsHeader}
                    </p>
                    <ul className="space-y-1 text-xs font-mono">
                      {processingSteps.map((s, i) => (
                        <li
                          key={i}
                          className={`flex items-baseline gap-2 ${
                            s.ok === false ? "text-destructive" : "text-muted-foreground"
                          }`}
                        >
                          <span className="font-bold w-3">{s.ok === false ? "✗" : "✓"}</span>
                          <span className="font-semibold">{s.step}</span>
                          {typeof s.ms === "number" && <span>· {s.ms}ms</span>}
                          {s.model && <span>· {s.model}</span>}
                          {s.note && <span className="text-muted-foreground/80">· {s.note}</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <FeedbackSheet
        open={feedbackOpen}
        onOpenChange={setFeedbackOpen}
        defaultCategory="bug"
        resultId={resultId ?? null}
        contextNote={t.feedbackContext}
      />
    </>
  );
};
