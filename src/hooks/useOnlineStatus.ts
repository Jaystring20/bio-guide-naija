import { useEffect, useState } from "react";

/**
 * Tracks browser connectivity. Returns `true` when online, `false` when offline.
 * SSR-safe: defaults to `true` when `navigator` is unavailable.
 */
export const useOnlineStatus = () => {
  const [online, setOnline] = useState<boolean>(() =>
    typeof navigator === "undefined" ? true : navigator.onLine,
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    // Sync once in case state changed before listeners attached.
    setOnline(navigator.onLine);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  return online;
};
