import { CheckCircle2, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { useInstalledStatus } from "@/hooks/useInstalledStatus";

interface InstalledBadgeProps {
  className?: string;
  /** Compact pill (default) vs. full-width row */
  variant?: "pill" | "row";
}

export const InstalledBadge = ({ className, variant = "pill" }: InstalledBadgeProps) => {
  const installed = useInstalledStatus();

  if (variant === "row") {
    return (
      <div
        role="status"
        aria-label={installed ? "App installed" : "App not installed"}
        className={cn(
          "flex items-center gap-3 rounded-2xl border-2 p-4",
          installed
            ? "border-primary/30 bg-primary/10"
            : "border-border bg-muted/40",
          className,
        )}
      >
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
