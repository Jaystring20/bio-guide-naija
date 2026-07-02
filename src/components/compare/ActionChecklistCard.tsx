import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ListChecks, RotateCcw } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { pickNextActions } from "./PlainSummaryCard";
import type { PairDelta } from "@/lib/compare-engine";

type Props = {
  deltas: PairDelta[];
  storageKey: string;
};

type State = Record<string, boolean>;

export const ActionChecklistCard = ({ deltas, storageKey }: Props) => {
  const actions = useMemo(() => pickNextActions(deltas), [deltas]);
  const lsKey = `veridia:action-checklist:${storageKey}`;

  const [checked, setChecked] = useState<State>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(lsKey);
      setChecked(raw ? JSON.parse(raw) : {});
    } catch {
      setChecked({});
    }
  }, [lsKey]);

  const persist = (next: State) => {
    setChecked(next);
    try {
      localStorage.setItem(lsKey, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  const toggle = (key: string) => {
    persist({ ...checked, [key]: !checked[key] });
  };

  const reset = () => persist({});

  if (!actions.length) return null;

  const doneCount = actions.filter((a) => checked[a]).length;
  const allDone = doneCount === actions.length;

  return (
    <div className="rounded-2xl border-2 border-primary/25 bg-card p-4 shadow-soft space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
            <ListChecks className="w-4 h-4 text-primary" />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wide text-primary">
              Action checklist
            </p>
            <p className="text-xs text-muted-foreground">
              {doneCount} of {actions.length} done
            </p>
          </div>
        </div>
        {doneCount > 0 && (
          <button
            type="button"
            onClick={reset}
            className="text-[11px] font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1"
            aria-label="Reset checklist"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
        )}
      </div>

      <ul className="space-y-2">
        {actions.map((a, i) => {
          const id = `check-${i}`;
          const isDone = !!checked[a];
          return (
            <li key={a} className="flex items-start gap-3">
              <Checkbox
                id={id}
                checked={isDone}
                onCheckedChange={() => toggle(a)}
                className="mt-1"
              />
              <label
                htmlFor={id}
                className={`flex-1 text-sm leading-snug cursor-pointer select-none ${
                  isDone ? "text-muted-foreground line-through" : "text-foreground"
                }`}
              >
                {a}
              </label>
            </li>
          );
        })}
      </ul>

      {allDone && (
        <div className="flex items-center gap-2 rounded-lg bg-primary/10 border border-primary/25 px-3 py-2 text-xs font-semibold text-primary">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          All caught up — nice work. Re-test in a few weeks to track progress.
        </div>
      )}
    </div>
  );
};
