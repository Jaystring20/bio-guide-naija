/**
 * Client-side lab photo quality check + auto-enhancement.
 *
 * Goal: salvage borderline photos (dim, slightly blurry, low contrast) before
 * they reach the AI. Only hard-reject when the image is unusable.
 */

export type QualityIssue = "too_small" | "too_dark" | "too_blurry" | "low_contrast";

export type QualityReport = {
  width: number;
  height: number;
  brightness: number; // 0-255 mean luma
  contrast: number; // std-dev of luma
  sharpness: number; // Laplacian variance proxy
  issues: QualityIssue[];
  recoverable: boolean; // true = we can auto-enhance; false = ask for new photo
  reasonEn?: string;
  reasonPidgin?: string;
};

const MIN_SIDE = 600; // px, anything smaller is unreadable
const MIN_BRIGHTNESS = 35; // very dark
const MIN_CONTRAST = 18; // very flat
const MIN_SHARPNESS = 40; // very blurry (Laplacian variance proxy)

async function fileToImage(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Could not decode image"));
      img.src = url;
    });
    return img;
  } finally {
    // Revoke later — caller draws first; we revoke after a tick.
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }
}

function analyzeLuma(data: Uint8ClampedArray, w: number, h: number): {
  brightness: number;
  contrast: number;
  sharpness: number;
} {
  const len = w * h;
  const luma = new Float32Array(len);
  let sum = 0;
  for (let i = 0, j = 0; i < data.length; i += 4, j++) {
    const y = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
    luma[j] = y;
    sum += y;
  }
  const mean = sum / len;
  let varSum = 0;
  for (let i = 0; i < len; i++) {
    const d = luma[i] - mean;
    varSum += d * d;
  }
  const contrast = Math.sqrt(varSum / len);

  // Laplacian variance proxy — high = sharp, low = blurry. Sample stride for speed.
  let lapSum = 0;
  let lapSqSum = 0;
  let count = 0;
  const stride = 2;
  for (let y = 1; y < h - 1; y += stride) {
    for (let x = 1; x < w - 1; x += stride) {
      const i = y * w + x;
      const v =
        -luma[i - w] -
        luma[i - 1] +
        4 * luma[i] -
        luma[i + 1] -
        luma[i + w];
      lapSum += v;
      lapSqSum += v * v;
      count++;
    }
  }
  const lapMean = lapSum / count;
  const sharpness = lapSqSum / count - lapMean * lapMean;

  return { brightness: mean, contrast, sharpness };
}

export async function inspectImage(file: File): Promise<QualityReport | null> {
  if (!file.type.startsWith("image/")) return null;
  const img = await fileToImage(file);
  // Downsample to ~512px on the long edge for fast analysis
  const longSide = Math.max(img.naturalWidth, img.naturalHeight);
  const scale = Math.min(1, 512 / longSide);
  const aw = Math.max(1, Math.round(img.naturalWidth * scale));
  const ah = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = aw;
  canvas.height = ah;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, aw, ah);
  const { data } = ctx.getImageData(0, 0, aw, ah);
  const stats = analyzeLuma(data, aw, ah);

  const issues: QualityIssue[] = [];
  if (Math.min(img.naturalWidth, img.naturalHeight) < MIN_SIDE) issues.push("too_small");
  if (stats.brightness < MIN_BRIGHTNESS) issues.push("too_dark");
  if (stats.contrast < MIN_CONTRAST) issues.push("low_contrast");
  if (stats.sharpness < MIN_SHARPNESS) issues.push("too_blurry");

  // Hard-reject only when truly unusable: too small, OR severe blur + severe darkness.
  const tooSmall = issues.includes("too_small");
  const severeBlur = stats.sharpness < MIN_SHARPNESS / 2;
  const severeDark = stats.brightness < MIN_BRIGHTNESS / 2;
  const recoverable = !tooSmall && !(severeBlur && severeDark);

  let reasonEn: string | undefined;
  let reasonPidgin: string | undefined;
  if (tooSmall) {
    reasonEn = "Photo is too small / low resolution to read the lab values.";
    reasonPidgin = "The picture too small — we no fit read the numbers.";
  } else if (severeBlur && severeDark) {
    reasonEn = "Photo is too blurry and too dark — please retake in good light.";
    reasonPidgin = "The picture blur and dark too much — abeg snap am again for better light.";
  } else if (issues.length > 0) {
    reasonEn = "Photo quality is borderline — we'll auto-enhance it before reading.";
    reasonPidgin = "The picture no too clear — we go sharpen am small before AI read am.";
  }

  return {
    width: img.naturalWidth,
    height: img.naturalHeight,
    brightness: stats.brightness,
    contrast: stats.contrast,
    sharpness: stats.sharpness,
    issues,
    recoverable,
    reasonEn,
    reasonPidgin,
  };
}

/**
 * Auto-enhance: contrast stretch, gentle brightness lift, and unsharp mask.
 * Also downscales huge images so the edge function payload stays small.
 * Returns a new File (jpeg) or the original if no improvement is needed.
 */
export async function enhanceImage(file: File, report?: QualityReport | null): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  try {
    const img = await fileToImage(file);
    // Cap long edge at 1800px — plenty for OCR, much smaller payload
    const MAX_EDGE = 1800;
    const longSide = Math.max(img.naturalWidth, img.naturalHeight);
    const scale = Math.min(1, MAX_EDGE / longSide);
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, w, h);

    const imageData = ctx.getImageData(0, 0, w, h);
    const data = imageData.data;

    // 1) Per-channel min/max stretch (auto white-balance + contrast)
    let rMin = 255, rMax = 0, gMin = 255, gMax = 0, bMin = 255, bMax = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] < rMin) rMin = data[i];
      if (data[i] > rMax) rMax = data[i];
      if (data[i + 1] < gMin) gMin = data[i + 1];
      if (data[i + 1] > gMax) gMax = data[i + 1];
      if (data[i + 2] < bMin) bMin = data[i + 2];
      if (data[i + 2] > bMax) bMax = data[i + 2];
    }
    const stretch = (v: number, lo: number, hi: number) =>
      hi - lo < 5 ? v : Math.max(0, Math.min(255, ((v - lo) * 255) / (hi - lo)));

    // Lift mid-tones a touch if the image is dark
    const dark = report ? report.brightness < 90 : false;
    const gamma = dark ? 0.85 : 1; // <1 brightens midtones

    for (let i = 0; i < data.length; i += 4) {
      let r = stretch(data[i], rMin, rMax);
      let g = stretch(data[i + 1], gMin, gMax);
      let b = stretch(data[i + 2], bMin, bMax);
      if (gamma !== 1) {
        r = 255 * Math.pow(r / 255, gamma);
        g = 255 * Math.pow(g / 255, gamma);
        b = 255 * Math.pow(b / 255, gamma);
      }
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
    }

    // 2) Unsharp mask (3x3 sharpen) — only when blurry/borderline
    const needsSharpen =
      !report || report.sharpness < MIN_SHARPNESS * 2.5 || report.issues.includes("too_blurry");
    if (needsSharpen) {
      const src = new Uint8ClampedArray(data);
      const k = [0, -0.6, 0, -0.6, 3.4, -0.6, 0, -0.6, 0]; // mild sharpen
      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          const i = (y * w + x) * 4;
          for (let c = 0; c < 3; c++) {
            const v =
              k[0] * src[i - w * 4 - 4 + c] +
              k[1] * src[i - w * 4 + c] +
              k[2] * src[i - w * 4 + 4 + c] +
              k[3] * src[i - 4 + c] +
              k[4] * src[i + c] +
              k[5] * src[i + 4 + c] +
              k[6] * src[i + w * 4 - 4 + c] +
              k[7] * src[i + w * 4 + c] +
              k[8] * src[i + w * 4 + 4 + c];
            data[i + c] = Math.max(0, Math.min(255, v));
          }
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);

    const blob: Blob = await new Promise((resolve, reject) =>
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("Canvas export failed"))),
        "image/jpeg",
        0.92,
      ),
    );
    const baseName = file.name.replace(/\.[^.]+$/, "");
    return new File([blob], `${baseName}-enhanced.jpg`, { type: "image/jpeg" });
  } catch (e) {
    console.warn("[imageQuality] enhance failed, using original", e);
    return file;
  }
}
