import { Loader2 } from "lucide-react";
import { Language } from "./types";

interface ChecklistSkeletonProps {
  language: Language;
}

/**
 * Skeleton shown while the doctor Q&A Gemini call is still running.
 * Mirrors the ChecklistTab list shape so layout stays stable.
 */
export const ChecklistSkeleton = ({ language }: ChecklistSkeletonProps) => {
  const isPidgin = language === "pidgin";

  return (
    <div aria-busy="true" aria-live="polite">
      <div className="rounded-2xl border border-border bg-card p-4 shadow-soft flex items-center gap-3 mb-4">
        <Loader2 className="w-5 h-5 animate-spin text-secondary-foreground shrink-0" />
        <div className="min-w-0">
          <p className="font-semibold text-body-sm">
            {isPidgin
              ? "Dey prepare your doctor questions…"
              : "Preparing your doctor's questions…"}
          </p>
          <p className="text-xs text-muted-foreground">
            {isPidgin
              ? "Other tabs don ready — check dem first."
              : "Other tabs are ready — check them while this finishes."}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-card rounded-xl border border-border p-4 flex gap-3"
          >
            <div className="w-7 h-7 rounded-full bg-muted animate-pulse shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-full bg-muted rounded animate-pulse" />
              <div className="h-3.5 w-3/4 bg-muted/70 rounded animate-pulse" />
            </div>
            <div className="h-5 w-12 rounded-full bg-muted animate-pulse shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
};
