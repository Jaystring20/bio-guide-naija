import { useState } from "react";
import { CheckCircle2, Download, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useInstalledStatus } from "@/hooks/useInstalledStatus";
import { IosInstallGuide } from "@/components/IosInstallGuide";

interface InstalledBadgeProps {
  className?: string;
  /** Compact pill (default) vs. full-width row */
  variant?: "pill" | "row";
}

export const InstalledBadge = ({ className, variant = "pill" }: InstalledBadgeProps) => {
  const installed = useInstalledStatus();
  const [guideOpen, setGuideOpen] = useState(false);

  if (variant === "row") {
    return (
      <div
        role="status"
        aria-label={installed ? "App installed" : "App not installed"}
        className={cn(
          "rounded-2xl border-2 p-4",
          installed
            ? "border-primary/30 bg-primary/10"
            : "border-border bg-muted/40",
          className,
        )}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
              installed ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground",
            )}
          >
            {installed ? <CheckCircle2 className="h-5 w-5" /> : <Download className="h-5 w-5" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-base font-semibold text-foreground">
              {installed ? "App installed" : "App not installed"}
            </p>
            <p className="text-sm text-muted-foreground">
              {installed
                ? "VeriDIA is on your home screen."
                : "Install VeriDIA for faster, app-like access."}
            </p>
          </div>
        </div>
        {!installed && (
          <button
            type="button"
            onClick={() => setGuideOpen(true)}
            className="mt-3 flex w-full items-center justify-between rounded-xl bg-background px-3 py-2.5 text-sm font-semibold text-primary ring-1 ring-primary/20 hover:bg-primary/5 touch-target"
          >
            <span>How to install on iPhone</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
        <IosInstallGuide open={guideOpen} onOpenChange={setGuideOpen} />
      </div>
    );
  }

  return (
    <span
      role="status"
      aria-label={installed ? "App installed" : "App not installed"}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1",
        installed
          ? "bg-primary/15 text-primary ring-primary/30"
          : "bg-white/15 text-white ring-white/30",
        className,
      )}
    >
      {installed ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Download className="h-3.5 w-3.5" />}
      {installed ? "Installed" : "Not installed"}
    </span>
  );
};

export default InstalledBadge;
