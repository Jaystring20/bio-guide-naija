import { useEffect, useState } from "react";
import { Download, Share, X, CloudOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IosInstallGuide } from "@/components/IosInstallGuide";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "veridia.installPromptDismissedAt";
const DISMISS_DAYS = 14;

const isStandalone = () =>
  typeof window !== "undefined" &&
  (window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari
    (window.navigator as unknown as { standalone?: boolean }).standalone === true);

const isIos = () => {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return /iPhone|iPad|iPod/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
};

const isInIframe = () => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
};

const wasRecentlyDismissed = () => {
  try {
    const ts = localStorage.getItem(DISMISS_KEY);
    if (!ts) return false;
    const ageMs = Date.now() - Number(ts);
    return ageMs < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
};

export const InstallPrompt = () => {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosTip, setShowIosTip] = useState(false);
  const [hidden, setHidden] = useState(true);
  const [guideOpen, setGuideOpen] = useState(false);
  const online = useOnlineStatus();

  useEffect(() => {
    if (isInIframe() || isStandalone() || wasRecentlyDismissed()) return;

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setHidden(false);
    };

    const onInstalled = () => {
      setDeferred(null);
      setHidden(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    if (isIos()) {
      // iOS install is fully manual via Share menu — works offline,
      // so always surface the tip regardless of connectivity.
      setShowIosTip(true);
      setHidden(false);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
    setHidden(true);
  };

  const install = async () => {
    if (!deferred) return;
    try {
      await deferred.prompt();
      await deferred.userChoice;
    } catch {
      /* user cancelled or browser rejected — keep prompt available */
      return;
    }
    setDeferred(null);
    setHidden(true);
  };

  if (hidden) {
    // Even when hidden, mount the guide so other entry points can open it.
    return <IosInstallGuide open={guideOpen} onOpenChange={setGuideOpen} />;
  }

  return (
    <>
      <div
        role="dialog"
        aria-label="Install VeriDIA"
        className="mx-4 mt-4 mb-2 rounded-2xl border-2 border-primary/30 bg-card p-4 shadow-lg"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Download className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-base font-semibold text-foreground">Install VeriDIA</p>
            {deferred ? (
              <p className="mt-1 text-sm text-muted-foreground">
                Add VeriDIA to your home screen for faster access.
              </p>
            ) : showIosTip ? (
              <p className="mt-1 text-sm text-muted-foreground">
                Tap <Share className="mx-1 inline h-4 w-4 align-text-bottom" aria-label="Share" /> then
                <span className="font-medium"> Add to Home Screen</span> to install.
              </p>
            ) : null}
            {!online && (
              <p className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-amber-500/15 px-2 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300">
                <CloudOff className="h-3.5 w-3.5" aria-hidden />
                You can still install while offline — no connection needed.
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              {deferred && (
                <Button
                  size="sm"
                  onClick={install}
                  className="h-9 rounded-full px-4 text-sm font-semibold"
                >
                  Install app
                </Button>
              )}
              {showIosTip && (
                <Button
                  size="sm"
                  variant={deferred ? "secondary" : "default"}
                  onClick={() => setGuideOpen(true)}
                  className="h-9 rounded-full px-4 text-sm font-semibold"
                >
                  Show me how
                </Button>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss install prompt"
            className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      <IosInstallGuide open={guideOpen} onOpenChange={setGuideOpen} />
    </>
  );
};

export default InstallPrompt;
