import { Loader2 } from "lucide-react";
import { Language } from "./types";

interface DietPlanSkeletonProps {
  language: Language;
}

/**
 * Skeleton shown while the diet (foods + meal plan) Gemini call is still running.
 * Mirrors the real DietPlanTab layout so the page doesn't jump when content lands.
 */
export const DietPlanSkeleton = ({ language }: DietPlanSkeletonProps) => {
  const isPidgin = language === "pidgin";

  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      {/* Status banner */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-soft flex items-center gap-3">
        <Loader2 className="w-5 h-5 animate-spin text-primary shrink-0" />
        <div className="min-w-0">
          <p className="font-semibold text-body-sm">
            {isPidgin ? "Dey cook your chop plan…" : "Cooking your diet plan…"}
          </p>
          <p className="text-xs text-muted-foreground">
            {isPidgin
              ? "Other parts don ready — you fit read dem now."
              : "Other sections are ready — feel free to read them while this finishes."}
          </p>
        </div>
      </div>

      {/* Foods to increase skeleton */}
      <div>
        <div className="h-5 w-44 bg-secondary/20 rounded-md mb-3 animate-pulse" />
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="bg-secondary/5 rounded-xl p-4 border border-secondary/15 space-y-2"
            >
              <div className="h-4 w-1/2 bg-muted rounded animate-pulse" />
              <div className="h-3 w-1/3 bg-muted/70 rounded animate-pulse" />
              <div className="h-3 w-full bg-muted/60 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      {/* Foods to reduce skeleton */}
      <div>
        <div className="h-5 w-36 bg-harvest-gold/20 rounded-md mb-3 animate-pulse" />
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="bg-harvest-gold/5 rounded-xl p-4 border border-harvest-gold/15 space-y-2"
            >
              <div className="h-4 w-2/5 bg-muted rounded animate-pulse" />
              <div className="h-3 w-3/4 bg-muted/60 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      {/* Meal ideas skeleton */}
      <div>
        <div className="h-5 w-32 bg-muted rounded-md mb-3 animate-pulse" />
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="bg-card rounded-xl p-4 border border-border space-y-2"
            >
              <div className="h-4 w-1/2 bg-muted rounded animate-pulse" />
              <div className="h-3 w-full bg-muted/60 rounded animate-pulse" />
              <div className="h-3 w-2/3 bg-muted/60 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
