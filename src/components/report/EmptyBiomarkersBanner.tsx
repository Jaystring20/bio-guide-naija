import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, RefreshCw, MessageSquareWarning, ChevronDown, ChevronUp, Loader2, CheckCircle2, Sun, Crop, Type } from "lucide-react";
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
    titleProcessing: "Re-reading your lab values…",
    titleGeneric: "Biomarker breakdown isn't available",
    bodyFailed:
      "Our AI couldn't extract the numbers from this upload. This usually means the photo was blurry, cropped, or the file wasn't a lab report.",
    bodyProcessing:
      "Hold tight — the AI is going through your lab again. We'll unlock retry options once it finishes (usually under a minute).",
    bodyGeneric:
      "Something went wrong while extracting values from your lab. Please re-upload a clearer photo or PDF.",
    autoRetry: "Auto-retry with new photo",
    autoRetryHint: "Pick a clearer photo or PDF — we'll re-run the AI on this same report.",
    reupload: "Upload a different lab instead",
    feedback: "Report this issue",
    showDetails: "Show technical details",
    hideDetails: "Hide technical details",
    detailsHeader: "Processing log",
    statusLabel: "Stage",
    runningLabel: "Re-running AI…",
    feedbackContext:
      "Biomarker breakdown was empty on this report. Please describe what you uploaded so we can investigate.",
    checklistTitle: "Before you upload again",
    checklist: [
      { icon: "sun", text: "Bright, even lighting — no shadows or glare on the page" },
      { icon: "crop", text: "Whole page in frame — every edge of the lab report visible" },
      { icon: "type", text: "Numbers and units (mg/dL, g/dL, %) are sharp and readable" },
      { icon: "check", text: "Hold steady — wait for the camera to focus before snapping" },
    ],
    autoEnhanceNote: "We'll auto-enhance brightness and sharpness for you on upload.",
  },
  pidgin: {
    titleFailed: "We no fit read your lab numbers",
    titleProcessing: "We dey read your lab again…",
    titleGeneric: "Biomarker breakdown no dey here",
    bodyFailed:
      "Our AI no fit catch the numbers from this upload. Maybe the picture blur, e cut, or the file no be lab report.",
    bodyProcessing:
      "Hold on small — AI dey try am again. Once e finish (usually less than one minute), the buttons go open.",
    bodyGeneric:
      "Something happen during processing. Abeg upload the lab result again make we read am well.",
    autoRetry: "Auto-retry with new picture",
    autoRetryHint: "Snap am again or pick clearer file — we go run the AI for this same report.",
    reupload: "Upload different lab",
    feedback: "Tell us wetin happen",
    showDetails: "Show technical details",
    hideDetails: "Hide technical details",
    detailsHeader: "Processing log",
    statusLabel: "Stage",
    runningLabel: "AI dey run…",
    feedbackContext:
      "Biomarker breakdown was empty on this report. Please describe what you uploaded so we can investigate.",
    checklistTitle: "Before you snap again",
    checklist: [
      { icon: "sun", text: "Make light bright well — no shadow or shine for the paper" },
      { icon: "crop", text: "Make the full page enter the picture — no cut any side" },
      { icon: "type", text: "The numbers and units (mg/dL, g/dL, %) suppose clear" },
      { icon: "check", text: "Hold the phone steady — make camera focus before you snap" },
    ],
    autoEnhanceNote: "We go sharpen and brighten the picture small-small for you.",
  },
} as const;

const ICONS = { sun: Sun, crop: Crop, type: Type, check: CheckCircle2 } as const;

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

            {isProcessing ? (
              <div
                className="flex items-center gap-2 rounded-lg border border-[hsl(var(--alert-amber))]/40 bg-[hsl(var(--alert-amber))]/10 px-3 py-2"
                aria-live="polite"
              >
                <Loader2 className="w-4 h-4 animate-spin text-[hsl(var(--alert-amber))]" />
                <span className="text-body-sm font-semibold">{t.runningLabel}</span>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button
                    size="sm"
                    onClick={() =>
                      navigate(
                        resultId ? `/app/upload?retry=${resultId}` : "/app/upload",
                      )
                    }
                    className="bg-primary text-primary-foreground"
                  >
                    <RefreshCw className="w-4 h-4 mr-1.5" />
                    {t.autoRetry}
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
                <p className="text-xs text-muted-foreground">{t.autoRetryHint}</p>

                {/* Before-you-upload checklist */}
                <div className="rounded-xl border border-border bg-background/60 p-3 mt-1">
                  <p className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground mb-2">
                    {t.checklistTitle}
                  </p>
                  <ul className="space-y-1.5">
                    {t.checklist.map((item, i) => {
                      const Icon = ICONS[item.icon as keyof typeof ICONS] ?? CheckCircle2;
                      return (
                        <li key={i} className="flex items-start gap-2 text-xs text-foreground/90">
                          <Icon className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary" />
                          <span>{item.text}</span>
                        </li>
                      );
                    })}
                  </ul>
                  <p className="text-[11px] text-muted-foreground mt-2 italic">{t.autoEnhanceNote}</p>
                </div>

                <button
                  type="button"
                  onClick={() => navigate("/app/upload")}
                  className="text-xs font-semibold text-muted-foreground underline underline-offset-2 hover:text-foreground"
                >
                  {t.reupload}
                </button>

                <div className="pt-2 mt-1 border-t border-border/60">
                  <p className="text-[11px] text-muted-foreground mb-1.5">
                    {language === "pidgin"
                      ? "E never work? Talk to person."
                      : "Still not working? Talk to a human."}
                  </p>
                  <WhatsAppSupportButton
                    size="sm"
                    fullWidth
                    resultId={resultId ?? null}
                    reason={failedStep ? `Failed at: ${failedStep.step}` : "Lab result analysis failed"}
                    language={language === "pidgin" ? "pidgin" : "en"}
                  />
                </div>
              </>
            )}

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
