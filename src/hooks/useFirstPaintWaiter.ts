import { supabase } from "@/integrations/supabase/client";

/**
 * Polls a lab_results row until the AI has produced *something the user can see*
 * (biomarkers extracted, or status flipped to completed/critical/failed) or the
 * timeout elapses. Used by the upload flow to navigate to the report page as
 * soon as the first paint is ready, without waiting for diet/checklist/Pidgin.
 *
 * Returns:
 *   - "ready"    -> biomarkers exist or status is terminal (completed/critical)
 *   - "failed"   -> the edge function explicitly marked it failed
 *   - "timeout"  -> nothing usable landed within `timeoutMs`
 */
export type FirstPaintResult = "ready" | "failed" | "timeout";

export async function waitForFirstPaint(
  resultId: string,
  timeoutMs = 60_000,
  pollMs = 1500,
): Promise<FirstPaintResult> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const { data, error } = await supabase
      .from("lab_results")
      .select("status, biomarkers")
      .eq("id", resultId)
      .single();

    if (!error && data) {
      const bios = (data as any).biomarkers as unknown[] | null;
      if (data.status === "completed" || data.status === "critical") return "ready";
      if (data.status === "failed") return "failed";
      if (Array.isArray(bios) && bios.length > 0) return "ready";
    }

    await new Promise((r) => setTimeout(r, pollMs));
  }
  return "timeout";
}
