import { biomarkerKey, getDirection, type Direction } from "./biomarker-direction";

export type RawBiomarker = {
  name: string;
  value: number | string;
  unit?: string;
  reference_range?: string;
  status?: string;
};

export type ResultLite = {
  id: string;
  test_date?: string | null;
  upload_date: string;
  biomarkers: RawBiomarker[];
  dependant_id?: string | null;
};

export type Verdict = "improved" | "worsened" | "unchanged" | "new" | "dropped" | "unit_mismatch";

export type AlignedBiomarker = {
  key: string;
  name: string;              // display name (from most recent)
  unit: string;
  direction: Direction;
  refRange?: string;
  /** Values indexed by result id. undefined = missing on that report. */
  values: Record<string, { value: number | null; raw: string | number; status?: string; unit?: string }>;
};

export type PairDelta = {
  key: string;
  name: string;
  unit: string;
  direction: Direction;
  a: number | null;
  b: number | null;
  aStatus?: string;
  bStatus?: string;
  aRaw?: string | number;
  bRaw?: string | number;
  abs: number | null;
  pct: number | null;
  verdict: Verdict;
};

export type CompareSummary = {
  improved: number;
  worsened: number;
  unchanged: number;
  biggestWin?: PairDelta;
  biggestConcern?: PairDelta;
};

const NUMBER_RE = /-?\d+(?:\.\d+)?/;

export function parseNumeric(v: number | string | null | undefined): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "number") return isFinite(v) ? v : null;
  const s = String(v);
  const m = s.match(NUMBER_RE);
  if (!m) return null;
  const n = parseFloat(m[0]);
  return isFinite(n) ? n : null;
}

function normalizeUnit(u?: string): string {
  return (u || "").toLowerCase().replace(/\s+/g, "").replace(/µ/g, "u");
}

/** Align biomarkers across N results by canonical name. */
export function alignBiomarkers(results: ResultLite[]): AlignedBiomarker[] {
  const map = new Map<string, AlignedBiomarker>();
  results.forEach((r) => {
    (r.biomarkers || []).forEach((b) => {
      if (!b || !b.name) return;
      const key = biomarkerKey(b.name);
      if (!key) return;
      let entry = map.get(key);
      if (!entry) {
        entry = {
          key,
          name: b.name,
          unit: b.unit || "",
          direction: getDirection(b.name),
          refRange: b.reference_range,
          values: {},
        };
        map.set(key, entry);
      } else {
        // Prefer latest display name / unit
        entry.name = b.name;
        if (b.unit) entry.unit = b.unit;
        if (b.reference_range) entry.refRange = b.reference_range;
      }
      entry.values[r.id] = {
        value: parseNumeric(b.value),
        raw: b.value,
        status: b.status,
        unit: b.unit,
      };
    });
  });
  return Array.from(map.values()).sort((x, y) => x.name.localeCompare(y.name));
}

/** Build 2-way delta between result A (older) and B (newer). */
export function computeDelta(
  aligned: AlignedBiomarker,
  aId: string,
  bId: string,
): PairDelta {
  const a = aligned.values[aId];
  const b = aligned.values[bId];
  const base: PairDelta = {
    key: aligned.key,
    name: aligned.name,
    unit: aligned.unit,
    direction: aligned.direction,
    a: a?.value ?? null,
    b: b?.value ?? null,
    aStatus: a?.status,
    bStatus: b?.status,
    aRaw: a?.raw,
    bRaw: b?.raw,
    abs: null,
    pct: null,
    verdict: "unchanged",
  };

  if (!a && !b) return base;
  if (!a) return { ...base, verdict: "new" };
  if (!b) return { ...base, verdict: "dropped" };

  // Unit mismatch → skip math to avoid false verdicts
  if (a.unit && b.unit && normalizeUnit(a.unit) !== normalizeUnit(b.unit)) {
    return { ...base, verdict: "unit_mismatch" };
  }

  if (a.value === null || b.value === null) {
    return { ...base, verdict: "unchanged" };
  }

  const abs = b.value - a.value;
  const pct = a.value !== 0 ? (abs / Math.abs(a.value)) * 100 : null;
  base.abs = abs;
  base.pct = pct;

  // Very small changes = unchanged. Threshold: 2% or absolute 0.05 whichever bigger.
  const magnitude = Math.abs(pct ?? 0);
  if (magnitude < 2 && Math.abs(abs) < 0.05) {
    base.verdict = "unchanged";
    return base;
  }

  const dir = aligned.direction;
  if (dir === "lower_is_better") {
    base.verdict = abs < 0 ? "improved" : "worsened";
  } else if (dir === "higher_is_better") {
    base.verdict = abs > 0 ? "improved" : "worsened";
  } else {
    // in_range: verdict = whichever value sits closer to (or inside) the reference range
    const range = parseRefRange(aligned.refRange);
    if (range) {
      const dA = distanceToRange(a.value, range);
      const dB = distanceToRange(b.value, range);
      if (dB < dA) base.verdict = "improved";
      else if (dB > dA) base.verdict = "worsened";
      else base.verdict = "unchanged";
    } else {
      // No reference — use status transition as a hint
      base.verdict = statusVerdict(a.status, b.status);
    }
  }
  return base;
}

function parseRefRange(range?: string): { min: number | null; max: number | null } | null {
  if (!range) return null;
  const s = range.toLowerCase().replace(/–/g, "-");
  if (s.includes("<")) {
    const n = parseFloat((s.match(NUMBER_RE) || [""])[0]);
    if (isFinite(n)) return { min: null, max: n };
  }
  if (s.includes(">")) {
    const n = parseFloat((s.match(NUMBER_RE) || [""])[0]);
    if (isFinite(n)) return { min: n, max: null };
  }
  const parts = s.split("-").map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) {
    const min = parseFloat((parts[0].match(NUMBER_RE) || [""])[0]);
    const max = parseFloat((parts[1].match(NUMBER_RE) || [""])[0]);
    if (isFinite(min) && isFinite(max)) return { min, max };
  }
  return null;
}

function distanceToRange(v: number, r: { min: number | null; max: number | null }): number {
  if (r.min !== null && v < r.min) return r.min - v;
  if (r.max !== null && v > r.max) return v - r.max;
  return 0;
}

function statusVerdict(a?: string, b?: string): Verdict {
  const rank = (s?: string) => {
    if (!s) return 1;
    if (s === "normal") return 0;
    if (s === "borderline") return 1;
    if (s === "critical") return 3;
    return 2; // deranged
  };
  const ra = rank(a);
  const rb = rank(b);
  if (rb < ra) return "improved";
  if (rb > ra) return "worsened";
  return "unchanged";
}

export function summarize(deltas: PairDelta[]): CompareSummary {
  let improved = 0, worsened = 0, unchanged = 0;
  let biggestWin: PairDelta | undefined;
  let biggestConcern: PairDelta | undefined;

  deltas.forEach((d) => {
    if (d.verdict === "improved") {
      improved++;
      if (d.pct !== null && (!biggestWin || Math.abs(d.pct) > Math.abs(biggestWin.pct ?? 0))) {
        biggestWin = d;
      }
    } else if (d.verdict === "worsened") {
      worsened++;
      if (d.pct !== null && (!biggestConcern || Math.abs(d.pct) > Math.abs(biggestConcern.pct ?? 0))) {
        biggestConcern = d;
      }
    } else if (d.verdict === "unchanged") {
      unchanged++;
    }
  });

  return { improved, worsened, unchanged, biggestWin, biggestConcern };
}

/** Timeline series for a single biomarker across N ordered results. */
export type SeriesPoint = { resultId: string; value: number | null; status?: string; date: string };

export function seriesFor(
  aligned: AlignedBiomarker,
  orderedResults: ResultLite[],
): SeriesPoint[] {
  return orderedResults.map((r) => {
    const v = aligned.values[r.id];
    return {
      resultId: r.id,
      value: v?.value ?? null,
      status: v?.status,
      date: r.test_date || r.upload_date,
    };
  });
}

/** Net delta from first→last across a series, reusing pair logic. */
export function netDelta(aligned: AlignedBiomarker, orderedResults: ResultLite[]): PairDelta {
  const first = orderedResults[0];
  const last = orderedResults[orderedResults.length - 1];
  return computeDelta(aligned, first.id, last.id);
}
