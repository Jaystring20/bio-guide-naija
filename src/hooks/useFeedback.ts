import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type FeedbackCategory =
  | "bug"
  | "suggestion"
  | "praise"
  | "confusion"
  | "feature_request"
  | "other";

export interface FeedbackPayload {
  category: FeedbackCategory;
  message: string;
  rating?: number | null;
  nps?: number | null;
  screen?: string | null;
  result_id?: string | null;
}

const PROMPT_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24h

export const promptCooldownKey = (key: string) => `veridia:fb-prompt:${key}`;

export const wasPromptShownRecently = (key: string) => {
  try {
    const ts = Number(localStorage.getItem(promptCooldownKey(key)) || 0);
    return ts && Date.now() - ts < PROMPT_COOLDOWN_MS;
  } catch {
    return false;
  }
};

export const markPromptShown = (key: string) => {
  try {
    localStorage.setItem(promptCooldownKey(key), String(Date.now()));
  } catch {
    /* ignore */
  }
};

export const markPromptDismissedForever = (key: string) => {
  try {
    localStorage.setItem(promptCooldownKey(key) + ":done", "1");
  } catch {
    /* ignore */
  }
};

export const isPromptDismissedForever = (key: string) => {
  try {
    return localStorage.getItem(promptCooldownKey(key) + ":done") === "1";
  } catch {
    return false;
  }
};

const captureDeviceInfo = () => {
  if (typeof window === "undefined") return {};
  // Detect "came from email invite" — the dispatch-feedback-emails job appends ?fb=1
  // to the deep link, and the landing page sets sessionStorage so the flag survives
  // navigation between landing → opening the feedback sheet.
  let source: string | null = null;
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get("fb") === "1") source = "email_invite";
    else if (sessionStorage.getItem("veridia:fb-source") === "email_invite") source = "email_invite";
    if (source === "email_invite") sessionStorage.setItem("veridia:fb-source", "email_invite");
  } catch { /* ignore */ }
  return {
    ua: navigator.userAgent,
    viewport: { w: window.innerWidth, h: window.innerHeight },
    online: navigator.onLine,
    lang: navigator.language,
    platform: (navigator as any).platform,
    source,
    ts: new Date().toISOString(),
  };
};

export const useSubmitFeedback = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: FeedbackPayload) => {
      if (!user) throw new Error("You need to be signed in to send feedback");
      const insert = {
        user_id: user.id,
        category: payload.category,
        message: payload.message.trim(),
        rating: payload.rating ?? null,
        nps: payload.nps ?? null,
        screen: payload.screen ?? (typeof window !== "undefined" ? window.location.pathname : null),
        result_id: payload.result_id ?? null,
        device_info: captureDeviceInfo(),
      };
      const { error } = await supabase.from("feedback").insert(insert);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-feedback-count"] });
    },
    onError: (e: any) => {
      toast.error(e?.message || "Could not send feedback");
    },
  });
};

export const useMyFeedbackCount = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-feedback-count", user?.id],
    enabled: !!user,
    staleTime: 60_000,
    queryFn: async () => {
      const { count } = await supabase
        .from("feedback")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user!.id);
      return count ?? 0;
    },
  });
};
