import { useEffect, useState } from "react";

const checkStandalone = () => {
  if (typeof window === "undefined") return false;
  const mql = window.matchMedia?.("(display-mode: standalone)");
  if (mql?.matches) return true;
  // iOS Safari
  if ((window.navigator as unknown as { standalone?: boolean }).standalone === true) return true;
  return false;
};

/**
 * Tracks whether the app is currently running as an installed PWA
 * (launched from the home screen / app drawer in standalone mode).
 *
 * Note: there's no reliable browser API to detect "installed but currently
 * opened in a tab". We treat standalone display-mode as the source of truth.
 */
export const useInstalledStatus = () => {
  const [installed, setInstalled] = useState<boolean>(checkStandalone);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia("(display-mode: standalone)");
    const handler = () => setInstalled(checkStandalone());

    mql.addEventListener?.("change", handler);
    window.addEventListener("appinstalled", handler);
    window.addEventListener("visibilitychange", handler);

    return () => {
      mql.removeEventListener?.("change", handler);
      window.removeEventListener("appinstalled", handler);
      window.removeEventListener("visibilitychange", handler);
    };
  }, []);

  return installed;
};
