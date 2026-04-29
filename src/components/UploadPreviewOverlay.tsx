import { useEffect, useRef, useState } from "react";
import { CheckCircle2, ScanLine, AlertCircle, Loader2, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

type DetectedRegion = {
  // Normalized 0-1 coordinates relative to the rendered image
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  confidence: number;
};

type DetectionResult = {
  regions: DetectedRegion[];
  pages: number;
  isLikelyLab: boolean;
  textDensity: number; // 0-1
  resolution: { w: number; h: number };
  note: string;
};

// ---------------------------------------------------------------------------
// Persistence: cache detection results so a refresh / re-select of the same
// file skips the canvas scan. Keyed by name + size + lastModified.
// ---------------------------------------------------------------------------
const CACHE_PREFIX = "veridia:ocr-preview:";
const CACHE_VERSION = 1;
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

type CacheEntry = { v: number; t: number; result: DetectionResult };

function cacheKey(file: File): string {
  return `${CACHE_PREFIX}${file.name}|${file.size}|${file.lastModified}`;
}

function readCache(file: File): DetectionResult | null {
  try {
    const raw = localStorage.getItem(cacheKey(file));
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry;
    if (entry.v !== CACHE_VERSION) return null;
    if (Date.now() - entry.t > CACHE_TTL_MS) {
      localStorage.removeItem(cacheKey(file));
      return null;
    }
    return entry.result;
  } catch {
    return null;
  }
}

function writeCache(file: File, result: DetectionResult): void {
  try {
    const entry: CacheEntry = { v: CACHE_VERSION, t: Date.now(), result };
    localStorage.setItem(cacheKey(file), JSON.stringify(entry));
    pruneCache();
  } catch {
    /* quota exceeded — ignore */
  }
}

function pruneCache(): void {
  try {
    const now = Date.now();
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(CACHE_PREFIX)) keys.push(k);
    }
    for (const k of keys) {
      try {
        const raw = localStorage.getItem(k);
        if (!raw) continue;
        const entry = JSON.parse(raw) as CacheEntry;
        if (entry.v !== CACHE_VERSION || now - entry.t > CACHE_TTL_MS) {
          localStorage.removeItem(k);
        }
      } catch {
        localStorage.removeItem(k);
      }
    }
  } catch {
    /* ignore */
  }
}

type Props = {
  file: File;
  previewUrl: string | null;
};

/**
 * Client-side OCR-preprocessing preview.
 *
 * Mirrors what the edge function does (downscale, content detection,
 * lab-report heuristic) but visualises it BEFORE the user hits Analyze.
 *
 * - For images: runs a luminance/edge density scan in a hidden canvas to find
 *   the dense text block(s) that look like a lab table, then overlays
 *   bounding boxes on the preview.
 * - For PDFs: shows per-page placeholders (we can't render PDFs without a
 *   heavy lib) and reports estimated page count from file size.
 */
export const UploadPreviewOverlay = ({ file, previewUrl }: Props) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const cached = readCache(file);
  const [detection, setDetection] = useState<DetectionResult | null>(cached);
  const [analyzing, setAnalyzing] = useState(cached === null);
  const [fromCache, setFromCache] = useState(cached !== null);

  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

  useEffect(() => {
    // Cache hit — nothing to do, results were restored synchronously.
    const hit = readCache(file);
    if (hit) {
      setDetection(hit);
      setAnalyzing(false);
      setFromCache(true);
      return;
    }
    setFromCache(false);

    if (isPdf) {
      const estPages = Math.max(1, Math.round(file.size / (120 * 1024)));
      const result: DetectionResult = {
        regions: [],
        pages: estPages,
        isLikelyLab: true,
        textDensity: 1,
        resolution: { w: 0, h: 0 },
        note: "PDF — full content will be processed by the AI.",
      };
      setDetection(result);
      setAnalyzing(false);
      writeCache(file, result);
      return;
    }

    if (!previewUrl) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      let result: DetectionResult;
      try {
        result = analyzeImage(img);
      } catch {
        result = {
          regions: [],
          pages: 1,
          isLikelyLab: true,
          textDensity: 0.5,
          resolution: { w: img.naturalWidth, h: img.naturalHeight },
          note: "Couldn't pre-scan — AI will still process the full image.",
        };
      }
      setDetection(result);
      setAnalyzing(false);
      writeCache(file, result);
    };
    img.onerror = () => {
      setAnalyzing(false);
      setDetection({
        regions: [],
        pages: 1,
        isLikelyLab: true,
        textDensity: 0,
        resolution: { w: 0, h: 0 },
        note: "Preview unavailable.",
      });
    };
    img.src = previewUrl;
  }, [previewUrl, isPdf, file]);

  return (
    <div className="rounded-2xl overflow-hidden border border-border shadow-soft bg-card">
      {/* Status bar */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2 min-w-0">
          {analyzing ? (
            <>
              <Loader2 className="w-3.5 h-3.5 text-secondary animate-spin shrink-0" />
              <span className="text-[11px] font-semibold text-muted-foreground truncate">
                Pre-scanning lab content…
              </span>
            </>
          ) : detection?.isLikelyLab ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="text-[11px] font-semibold text-foreground truncate">
                {isPdf
                  ? `${detection.pages} page${detection.pages > 1 ? "s" : ""} detected`
                  : `${detection.regions.length} lab region${detection.regions.length === 1 ? "" : "s"} detected`}
              </span>
            </>
          ) : (
            <>
              <AlertCircle className="w-3.5 h-3.5 text-destructive shrink-0" />
              <span className="text-[11px] font-semibold text-destructive truncate">
                Low text density — try a clearer photo
              </span>
            </>
          )}
        </div>
        {detection && !analyzing && (
          <span className="text-[10px] font-medium text-muted-foreground shrink-0">
            {isPdf
              ? `${(file.size / 1024).toFixed(0)}KB`
              : `${detection.resolution.w}×${detection.resolution.h}`}
          </span>
        )}
      </div>

      {/* Preview area */}
      <div ref={containerRef} className="relative bg-card">
        {isPdf ? (
          <PdfPagePlaceholder pages={detection?.pages ?? 1} fileName={file.name} />
        ) : previewUrl ? (
          <>
            <img
              ref={imgRef}
              src={previewUrl}
              alt="Lab result preview"
              className="block w-full max-h-72 object-contain"
            />
            {/* Region overlays */}
            {!analyzing && detection?.regions.map((r, i) => (
              <div
                key={i}
                className="absolute pointer-events-none"
                style={{
                  left: `${r.x * 100}%`,
                  top: `${r.y * 100}%`,
                  width: `${r.w * 100}%`,
                  height: `${r.h * 100}%`,
                }}
              >
                <div className={cn(
                  "absolute inset-0 rounded-lg border-2 animate-pulse",
                  r.confidence > 0.7
                    ? "border-primary bg-primary/10"
                    : "border-secondary bg-secondary/10"
                )} />
                <div className={cn(
                  "absolute -top-2 left-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide flex items-center gap-1",
                  r.confidence > 0.7
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                )}>
                  <ScanLine className="w-2.5 h-2.5" />
                  {r.label}
                </div>
              </div>
            ))}
            {/* Scanning sweep while analyzing */}
            {analyzing && (
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div
                  className="absolute left-0 right-0 h-1 bg-gradient-to-b from-primary/0 via-primary to-primary/0 shadow-[0_0_18px_hsl(var(--primary))]"
                  style={{ animation: "scan-sweep 1.4s ease-in-out infinite" }}
                />
              </div>
            )}
          </>
        ) : null}
      </div>

      {/* Footer hint */}
      {detection && !analyzing && (
        <div className="px-3 py-2 border-t border-border bg-muted/20">
          <p className="text-[10px] text-muted-foreground leading-tight">
            {detection.note}
          </p>
        </div>
      )}

      <style>{`
        @keyframes scan-sweep {
          0% { top: 0%; opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
};

const PdfPagePlaceholder = ({ pages, fileName }: { pages: number; fileName: string }) => (
  <div className="p-4 grid grid-cols-3 gap-2 max-h-72 overflow-y-auto">
    {Array.from({ length: Math.min(pages, 6) }).map((_, i) => (
      <div
        key={i}
        className="aspect-[3/4] rounded-md border border-primary/30 bg-primary/5 flex flex-col items-center justify-center gap-1 relative overflow-hidden"
      >
        <FileText className="w-5 h-5 text-primary" />
        <span className="text-[9px] font-bold text-primary">Page {i + 1}</span>
        <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
      </div>
    ))}
    {pages > 6 && (
      <div className="aspect-[3/4] rounded-md border border-dashed border-border flex items-center justify-center">
        <span className="text-[10px] font-semibold text-muted-foreground">+{pages - 6}</span>
      </div>
    )}
  </div>
);

// ---------------------------------------------------------------------------
// Image analysis: find dense text regions
// ---------------------------------------------------------------------------
function analyzeImage(img: HTMLImageElement): DetectionResult {
  const W = img.naturalWidth;
  const H = img.naturalHeight;

  // Downscale to a small working canvas — same spirit as edge preprocessImage
  const MAX = 400;
  const scale = Math.min(1, MAX / Math.max(W, H));
  const cw = Math.max(1, Math.round(W * scale));
  const ch = Math.max(1, Math.round(H * scale));

  const canvas = document.createElement("canvas");
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("no canvas ctx");
  ctx.drawImage(img, 0, 0, cw, ch);
  const { data } = ctx.getImageData(0, 0, cw, ch);

  // Build a per-row "text-like density" score: count high-contrast horizontal
  // transitions per row. Lab tables have many sharp light/dark transitions.
  const rowScores = new Float32Array(ch);
  const THRESH = 35;
  for (let y = 0; y < ch; y++) {
    let transitions = 0;
    let prev = -1;
    for (let x = 0; x < cw; x++) {
      const idx = (y * cw + x) * 4;
      // luminance approx
      const lum = data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114;
      const bin = lum < 140 ? 1 : 0;
      if (prev !== -1 && bin !== prev) transitions++;
      prev = bin;
    }
    rowScores[y] = transitions / cw; // 0..1
  }

  // Smooth and threshold to find contiguous dense bands
  const smooth = new Float32Array(ch);
  const win = 5;
  for (let y = 0; y < ch; y++) {
    let sum = 0, n = 0;
    for (let k = -win; k <= win; k++) {
      const yy = y + k;
      if (yy >= 0 && yy < ch) { sum += rowScores[yy]; n++; }
    }
    smooth[y] = sum / n;
  }

  const ROW_THRESH = 0.05; // text-like rows have >5% transitions
  const bands: Array<{ y0: number; y1: number; score: number }> = [];
  let inBand = false;
  let bandStart = 0;
  let bandSum = 0;
  for (let y = 0; y < ch; y++) {
    if (smooth[y] > ROW_THRESH) {
      if (!inBand) { inBand = true; bandStart = y; bandSum = 0; }
      bandSum += smooth[y];
    } else if (inBand) {
      const len = y - bandStart;
      if (len > ch * 0.04) bands.push({ y0: bandStart, y1: y, score: bandSum / len });
      inBand = false;
    }
  }
  if (inBand) {
    const len = ch - bandStart;
    if (len > ch * 0.04) bands.push({ y0: bandStart, y1: ch, score: bandSum / len });
  }

  // Merge bands separated by tiny gaps
  const merged: typeof bands = [];
  for (const b of bands) {
    const last = merged[merged.length - 1];
    if (last && b.y0 - last.y1 < ch * 0.03) {
      last.y1 = b.y1;
      last.score = (last.score + b.score) / 2;
    } else {
      merged.push({ ...b });
    }
  }

  // Convert bands into normalized regions, find horizontal extent per band
  const regions: DetectedRegion[] = merged.slice(0, 3).map((b, i) => {
    // Find horizontal bounds within this band
    let xMin = cw, xMax = 0;
    for (let y = b.y0; y < b.y1; y += 2) {
      let firstDark = -1, lastDark = -1;
      for (let x = 0; x < cw; x++) {
        const idx = (y * cw + x) * 4;
        const lum = data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114;
        if (lum < 140) {
          if (firstDark === -1) firstDark = x;
          lastDark = x;
        }
      }
      if (firstDark !== -1) {
        if (firstDark < xMin) xMin = firstDark;
        if (lastDark > xMax) xMax = lastDark;
      }
    }
    if (xMin >= xMax) { xMin = 0; xMax = cw; }

    const pad = 4;
    const x0 = Math.max(0, xMin - pad) / cw;
    const x1 = Math.min(cw, xMax + pad) / cw;
    const y0 = Math.max(0, b.y0 - pad) / ch;
    const y1 = Math.min(ch, b.y1 + pad) / ch;

    const labels = ["Lab Table", "Results Block", "Reference Range"];
    return {
      x: x0,
      y: y0,
      w: x1 - x0,
      h: y1 - y0,
      label: labels[i] ?? `Region ${i + 1}`,
      confidence: Math.min(1, b.score * 4),
    };
  });

  // Overall density score
  const avgDensity = smooth.reduce((a, v) => a + v, 0) / ch;
  const isLikelyLab = regions.length > 0 && avgDensity > 0.02;

  const note = isLikelyLab
    ? `Image will be downscaled to ~1600px and sent to the AI. Detected ${regions.length} text-dense region${regions.length === 1 ? "" : "s"}.`
    : "We couldn't find dense text — make sure the lab table is in focus and well-lit.";

  return {
    regions,
    pages: 1,
    isLikelyLab,
    textDensity: avgDensity,
    resolution: { w: W, h: H },
    note,
  };
}
