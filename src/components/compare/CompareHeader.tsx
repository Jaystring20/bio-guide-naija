import { ArrowLeft, ArrowLeftRight, Rows3, Columns2, AlertTriangle, ArrowUp, ArrowDown, Minus, CircleOff, HelpCircle, ChevronDown } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

type Props = {
  count: number;
  mode: "side" | "timeline";
  onModeChange: (m: "side" | "timeline") => void;
  onSwap?: () => void;
  crossProfile: boolean;
  profileLabel: string;
};

export const CompareHeader = ({ count, mode, onModeChange, onSwap, crossProfile, profileLabel }: Props) => {
  const navigate = useNavigate();
  const [helpOpen, setHelpOpen] = useState(false);
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="touch-target p-1" aria-label="Back">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-2xl font-extrabold tracking-tight">Compare results</h1>
          <p className="text-xs text-muted-foreground truncate">
            {profileLabel} · {count} result{count > 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="inline-flex p-1 rounded-xl bg-muted gap-1">
          <button
            onClick={() => onModeChange("side")}
            disabled={count < 2}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1.5 ${
              mode === "side" ? "bg-card text-foreground shadow-soft" : "text-muted-foreground"
            }`}
          >
            <Columns2 className="w-3.5 h-3.5" /> Side-by-side
          </button>
          <button
            onClick={() => onModeChange("timeline")}
            disabled={count < 2}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1.5 ${
              mode === "timeline" ? "bg-card text-foreground shadow-soft" : "text-muted-foreground"
            }`}
          >
            <Rows3 className="w-3.5 h-3.5" /> Timeline
          </button>
        </div>
        {mode === "side" && count === 2 && onSwap && (
          <button
            onClick={onSwap}
            className="ml-auto inline-flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold hover:bg-accent/10"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" /> Swap
          </button>
        )}
      </div>

      {crossProfile && (
        <div className="flex gap-2 rounded-xl border border-[hsl(var(--alert-amber))]/40 bg-[hsl(var(--alert-amber))]/10 p-3">
          <AlertTriangle className="w-4 h-4 text-[hsl(var(--alert-amber))] flex-shrink-0 mt-0.5" />
          <p className="text-xs leading-relaxed text-foreground">
            <span className="font-bold">Comparing across different people.</span>{" "}
            This isn't clinically equivalent — use as guidance, not diagnosis. Reference ranges and normal values differ per person.
          </p>
        </div>
      )}
    </div>
  );
};
