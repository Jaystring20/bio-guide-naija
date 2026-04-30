import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Copy, Share, Plus, Home, ChevronLeft, ChevronRight, CloudOff } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

interface IosInstallGuideProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const APP_URL = "https://getveridia.app";

/* ---------- Illustrations (inline SVG, no external assets) ---------- */

const PhoneFrame = ({ children }: { children: React.ReactNode }) => (
  <div className="mx-auto w-[220px]">
    <div className="relative rounded-[28px] border-[6px] border-foreground/80 bg-background shadow-lg">
      <div className="absolute left-1/2 top-1.5 h-1 w-12 -translate-x-1/2 rounded-full bg-foreground/60" />
      <div className="overflow-hidden rounded-[20px] bg-gradient-to-b from-primary/10 to-background pt-5">
        {children}
      </div>
    </div>
  </div>
);

const SafariBar = ({ highlightShare = false }: { highlightShare?: boolean }) => (
  <div className="mx-3 mt-2 mb-2 flex items-center gap-2 rounded-xl bg-muted px-2 py-1.5 text-[10px] text-muted-foreground">
    <span className="truncate">getveridia.app</span>
    <span
      className={cn(
        "ml-auto inline-flex h-6 w-6 items-center justify-center rounded-md transition-all",
        highlightShare && "bg-primary text-primary-foreground ring-2 ring-primary/40 animate-pulse",
      )}
      aria-hidden
    >
      <Share className="h-3.5 w-3.5" />
    </span>
  </div>
);

const StepOneIllustration = () => (
  <PhoneFrame>
    <SafariBar highlightShare />
    <div className="px-3 pb-4">
      <div className="rounded-lg bg-primary/15 p-3">
        <div className="h-2 w-1/2 rounded bg-primary/40" />
        <div className="mt-2 h-2 w-3/4 rounded bg-primary/30" />
        <div className="mt-2 h-2 w-2/3 rounded bg-primary/20" />
      </div>
      <div className="mt-3 flex items-center justify-center gap-1 text-[10px] font-bold text-primary">
        <ChevronRight className="h-3 w-3" />
        Tap the Share icon
      </div>
    </div>
  </PhoneFrame>
);

const StepTwoIllustration = () => (
  <PhoneFrame>
    <div className="px-3 pb-3">
      <div className="rounded-xl bg-card p-2 shadow-inner ring-1 ring-border">
        <div className="flex items-center gap-2 px-1 py-1.5">
          <div className="h-6 w-6 rounded bg-muted" />
          <div className="h-2 flex-1 rounded bg-muted" />
        </div>
        <div className="my-1 h-px bg-border" />
        <div className="space-y-1.5">
          {["Copy", "Add to Reading List", "Add Bookmark"].map((label) => (
            <div key={label} className="flex items-center justify-between rounded-md px-1.5 py-1 text-[10px] text-muted-foreground">
              <span>{label}</span>
              <div className="h-3 w-3 rounded bg-muted" />
            </div>
          ))}
          <div className="flex items-center justify-between rounded-md bg-primary/15 px-1.5 py-1.5 text-[10px] font-bold text-primary ring-2 ring-primary/40">
            <span>Add to Home Screen</span>
            <Plus className="h-3.5 w-3.5" />
          </div>
        </div>
      </div>
    </div>
  </PhoneFrame>
);

const StepThreeIllustration = () => (
  <PhoneFrame>
    <div className="px-3 pb-3">
      <div className="rounded-xl bg-card p-3 shadow-inner ring-1 ring-border">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground text-[10px] font-extrabold">
            V
          </div>
          <div className="flex-1">
            <p className="text-[11px] font-bold leading-tight text-foreground">VeriDIA</p>
            <p className="text-[9px] text-muted-foreground">getveridia.app</p>
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <span className="rounded-md bg-primary px-2 py-1 text-[10px] font-bold text-primary-foreground ring-2 ring-primary/40 animate-pulse">
            Add
          </span>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-center gap-1 text-[10px] font-bold text-primary">
        <Home className="h-3 w-3" />
        Now on your home screen
      </div>
    </div>
  </PhoneFrame>
);

/* ---------- Steps ---------- */

const STEPS = [
  {
    title: "Open in Safari",
    body: "Make sure you're using Safari on iPhone or iPad. Then tap the Share icon at the bottom of the screen.",
    Illustration: StepOneIllustration,
    icon: Share,
  },
  {
    title: "Tap Add to Home Screen",
    body: "Scroll down in the Share menu and tap Add to Home Screen.",
    Illustration: StepTwoIllustration,
    icon: Plus,
  },
  {
    title: "Tap Add to confirm",
    body: "Confirm by tapping Add. The VeriDIA icon will appear on your home screen, ready to launch like an app.",
    Illustration: StepThreeIllustration,
    icon: Home,
  },
] as const;

export const IosInstallGuide = ({ open, onOpenChange }: IosInstallGuideProps) => {
  const [step, setStep] = useState(0);
  const [copied, setCopied] = useState(false);
  const online = useOnlineStatus();

  useEffect(() => {
    if (!open) {
      setStep(0);
      setCopied(false);
    }
  }, [open]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(APP_URL);
      setCopied(true);
      toast.success("Link copied — open it in Safari on your iPhone");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Couldn't copy. Long-press to copy: " + APP_URL);
    }
  };

  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];
  const Illustration = current.Illustration;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="font-display text-2xl font-extrabold">
            Install VeriDIA on iPhone
          </DialogTitle>
          <DialogDescription>
            Step {step + 1} of {STEPS.length} · Safari only
          </DialogDescription>
        </DialogHeader>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-1.5 pb-2">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === step ? "w-6 bg-primary" : "w-1.5 bg-muted",
              )}
            />
          ))}
        </div>

        {/* Illustration */}
        <div className="bg-gradient-to-b from-primary/10 to-background px-6 py-4">
          <Illustration />
        </div>

        {/* Step content */}
        <div className="px-6 py-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <current.icon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-base font-bold text-foreground">{current.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{current.body}</p>
            </div>
          </div>

          {/* Copy link helper */}
          <div className="mt-4 rounded-2xl border border-border bg-muted/40 p-3">
            <p className="text-xs font-semibold text-muted-foreground">
              On a different device? Copy the link and open it in Safari on your iPhone.
            </p>
            <div className="mt-2 flex items-center gap-2">
              <code className="flex-1 truncate rounded-lg bg-background px-3 py-2 text-xs">
                {APP_URL}
              </code>
              <Button
                size="sm"
                variant={copied ? "default" : "secondary"}
                onClick={copyLink}
                className="h-9 shrink-0 gap-1.5 rounded-full px-3 text-xs font-semibold"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy link"}
              </Button>
            </div>
          </div>
        </div>

        {/* Footer nav */}
        <div className="flex items-center justify-between gap-2 border-t border-border bg-muted/30 px-6 py-3">
          <Button
            variant="ghost"
            size="sm"
            disabled={step === 0}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            className="gap-1 rounded-full"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </Button>
          {isLast ? (
            <Button
              size="sm"
              onClick={() => onOpenChange(false)}
              className="rounded-full px-5 font-semibold"
            >
              Done
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
              className="gap-1 rounded-full px-4 font-semibold"
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default IosInstallGuide;
