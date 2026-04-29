import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Re-runs diet plan + consultation checklist generation for an existing lab_result.
 * Used when the original diet generation failed silently (e.g. Gemini returned
 * text instead of a function call) or for legacy reports that never got a diet.
 */
export function useRegenerateDiet(resultId: string | null | undefined, onDone?: () => void) {
  const [loading, setLoading] = useState(false);

  const regenerate = async () => {
    if (!resultId || loading) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("regenerate-diet", {
        body: { resultId },
      });
      if (error) throw error;
      if ((data as any)?.error) {
        toast.error((data as any).message || "Couldn't regenerate the diet plan. Please try again.");
        return;
      }
      toast.success("Fresh diet plan and doctor questions ready.");
      onDone?.();
    } catch (e) {
      console.error("regenerate-diet failed:", e);
      toast.error("Network hiccup. Please try again in a moment.");
    } finally {
      setLoading(false);
    }
  };

  return { regenerate, loading };
}
