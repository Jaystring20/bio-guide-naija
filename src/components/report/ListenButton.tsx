import { useSpeech } from "@/hooks/useSpeech";
import { Button } from "@/components/ui/button";
import { Headphones, Pause, Play, Square } from "lucide-react";
import { Language } from "./types";
import { cn } from "@/lib/utils";

interface ListenButtonProps {
  /** Function returning the text to read. Called on tap so it always reflects
   *  the latest tab state (e.g. expanded/collapsed biomarkers). */
  getText: () => string;
  language: Language;
  className?: string;
  /** Short descriptor used in the idle button label, e.g. "summary", "diet plan". */
  label?: string;
}

const SPEEDS: number[] = [0.85, 1, 1.15, 1.3];

export const ListenButton = ({ getText, language, className, label }: ListenButtonProps) => {
  // Browsers don't have a Pidgin voice, so we use English for both — the
  // phonetic spelling reads acceptably with an en-NG / en-US voice.
  const { status, supported, rate, setRate, speak, pause, resume, stop } = useSpeech("en-NG");
  const isPidgin = language === "pidgin";

  if (!supported) return null;

  const idleLabel = isPidgin
    ? `🔊 Make AI read am${label ? ` (${label})` : ""}`
    : `Listen${label ? ` to ${label}` : ""}`;

  const handlePrimary = () => {
    if (status === "idle") speak(getText());
    else if (status === "playing") pause();
    else resume();
  };

  const cycleSpeed = () => {
    const idx = SPEEDS.indexOf(rate);
    const next = SPEEDS[(idx + 1) % SPEEDS.length] ?? 1;
    setRate(next);
    // If currently playing, restart with the new rate so the change is audible.
    if (status !== "idle") {
      stop();
      // Small delay so cancel() finishes before speak() on Safari.
      setTimeout(() => speak(getText()), 60);
    }
  };

  const isActive = status !== "idle";

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-2xl border bg-card p-2",
        isActive ? "border-secondary/40 bg-secondary/5" : "border-border",
        className,
      )}
      role="group"
      aria-label={isPidgin ? "Audio player" : "Audio reader"}
    >
      <Button
        type="button"
        onClick={handlePrimary}
        className={cn(
          "flex-1 h-11 rounded-xl touch-target",
          isActive
            ? "bg-secondary text-secondary-foreground hover:bg-secondary/90"
            : "bg-primary text-primary-foreground hover:bg-primary/90",
        )}
        aria-label={status === "playing" ? "Pause" : status === "paused" ? "Resume" : idleLabel}
      >
        {status === "idle" && (
          <>
            <Headphones className="w-4 h-4 mr-2" /> {idleLabel}
          </>
        )}
        {status === "playing" && (
          <>
            <Pause className="w-4 h-4 mr-2" /> {isPidgin ? "Hold first" : "Pause"}
          </>
        )}
        {status === "paused" && (
          <>
            <Play className="w-4 h-4 mr-2" /> {isPidgin ? "Continue" : "Resume"}
          </>
        )}
      </Button>

      <button
        type="button"
        onClick={cycleSpeed}
        className="h-11 px-3 rounded-xl border border-border bg-background text-xs font-bold tabular-nums touch-target"
        aria-label={`Playback speed ${rate}x. Tap to change.`}
        title="Playback speed"
      >
        {rate}x
      </button>

      {isActive && (
        <button
          type="button"
          onClick={stop}
          className="h-11 w-11 rounded-xl border border-border bg-background flex items-center justify-center touch-target"
          aria-label={isPidgin ? "Stop" : "Stop"}
        >
          <Square className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
