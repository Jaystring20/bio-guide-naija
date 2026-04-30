import { useEffect, useState } from "react";
import { CloudOff, CheckCircle2 } from "lucide-react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { cn } from "@/lib/utils";

/**
 * Global connectivity banner.
 * - Sticks to the top of the viewport while offline.
 * - Briefly shows a "Back online — syncing" confirmation when connectivity returns.
 */
export const OfflineBanner = () => {
  const online = useOnlineStatus();
  const [showReconnected, setShowReconnected] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!online) {
      setWasOffline(true);
      setShowReconnected(false);
      return;
    }
    if (wasOffline) {
      setShowReconnected(true);
      const t = setTimeout(() => setShowReconnected(false), 3500);
      return () => clearTimeout(t);
    }
  }, [online, wasOffline]);

  if (online && !showReconnected) return null;

  const offline = !online;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "sticky top-0 z-50 w-full border-b text-sm font-semibold shadow-sm",
        offline
          ? "bg-amber-500 text-white border-amber-600"
          : "bg-primary text-primary-foreground border-primary/60",
      )}
    >
      <div className="mx-auto flex max-w-2xl items-center gap-2 px-4 py-2">
        {offline ? (
          <>
            <CloudOff className="h-4 w-4 shrink-0" aria-hidden />
            <span className="truncate">
              You’re offline — changes will sync when you’re back online.
            </span>
          </>
        ) : (
          <>
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
            <span className="truncate">Back online — syncing your latest changes.</span>
          </>
        )}
      </div>
    </div>
  );
};

export default OfflineBanner;
