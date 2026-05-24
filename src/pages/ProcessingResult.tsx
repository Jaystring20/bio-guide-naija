import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { OrbitProcessing } from "@/components/OrbitProcessing";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { WhatsAppSupportButton } from "@/components/support/WhatsAppSupportButton";

const SOFT_TIMEOUT_MS = 60_000;
const HARD_TIMEOUT_MS = 3 * 60_000;

/**
 * Dedicated waiting room for an in-flight lab analysis.
 * Polls + realtime-subscribes to the lab_results row and auto-redirects
 * once the report is renderable (or to upload-retry on failure).
 */
const ProcessingResult = () => {
  const { id } = useParams<{ id: string }>();
  const { user, profile } = useAuth();
  const { isAdmin } = useUserRole();
  const navigate = useNavigate();
  const [startedAt] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());

  // 1s tick so the soft/hard timeout banners appear without manual refresh.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const elapsed = now - startedAt;
  const softElapsed = elapsed > SOFT_TIMEOUT_MS;
  const hardElapsed = elapsed > HARD_TIMEOUT_MS;

  const { data: result, refetch, error, failureCount } = useQuery({
    queryKey: ["processing-result", id, isAdmin],
    queryFn: async () => {
      let q = supabase.from("lab_results").select("id,status,biomarkers,upload_date").eq("id", id!);
      if (!isAdmin) q = q.eq("user_id", user!.id);
      const { data, error } = await q.maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("not-found-yet");
      return data;
    },
    enabled: !!id && !!user,
    retry: (count, err: any) => (err?.message === "not-found-yet" ? count < 15 : count < 3),
    retryDelay: (count) => Math.min(1000 + count * 500, 3000),
    refetchInterval: () => (hardElapsed ? false : 2000),
  });

  // Realtime: react instantly when the row updates.
  useEffect(() => {
    if (!id || !user) return;
    const channel = supabase
      .channel(`processing-${id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "lab_results", filter: `id=eq.${id}` },
        () => { refetch(); },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id, user, refetch]);

  // Auto-redirect when the row is renderable or terminally failed.
  useEffect(() => {
    if (!result || !id) return;
    const bios = (result as any).biomarkers as unknown[] | null;
    const renderable =
      result.status === "completed" ||
      result.status === "critical" ||
      (Array.isArray(bios) && bios.length > 0);
    if (renderable) {
      navigate(`/app/result/${id}`, { replace: true });
      return;
    }
    if (result.status === "failed") {
      navigate(`/app/upload?retry=${id}`, { replace: true });
    }
  }, [result, id, navigate]);

  const { step, statusLabel } = useMemo(() => {
    const bios = (result as any)?.biomarkers as unknown[] | null;
    if (Array.isArray(bios) && bios.length > 0) {
      return { step: 2, statusLabel: "Finalising your plan…" };
    }
    if (result?.status === "processing") {
      return { step: 0, statusLabel: "Reading your lab…" };
    }
    return { step: 1, statusLabel: "Mapping biomarkers…" };
  }, [result]);

  const stillResolvingRow =
    !!error && (error as any)?.message === "not-found-yet" && failureCount < 15;

  if (hardElapsed && !result) {
    // Row never appeared at all — treat as a hard failure.
    return (
      <Fallback id={id} userName={profile?.full_name} />
    );
  }

  if (hardElapsed) {
    return <Fallback id={id} userName={profile?.full_name} />;
  }

  return (
    <div className="px-5 pt-6 max-w-lg mx-auto">
      <OrbitProcessing step={step} label={statusLabel} />
      <p className="text-center text-sm text-muted-foreground mt-5">
        {statusLabel}
      </p>
      {softElapsed && (
        <p className="text-center text-xs text-muted-foreground mt-2 italic">
          Taking a little longer than usual — hang tight, we're still on it.
        </p>
      )}
      {stillResolvingRow && (
        <p className="text-center text-xs text-muted-foreground mt-2">
          Syncing your upload…
        </p>
      )}
    </div>
  );
};

const Fallback = ({ id, userName }: { id?: string; userName?: string | null }) => {
  const navigate = useNavigate();
  return (
    <div className="px-5 pt-12 text-center max-w-sm mx-auto">
      <p className="text-foreground font-semibold text-body">
        This is taking longer than expected
      </p>
      <p className="text-muted-foreground text-body-sm mt-2">
        Your analysis is still running in the background. You can wait, retry, or check back later in your history.
      </p>
      <div className="mt-4 flex flex-col gap-2">
        <Button onClick={() => window.location.reload()} variant="default">
          <RefreshCw className="w-4 h-4 mr-2" />
          Keep waiting
        </Button>
        <Button onClick={() => navigate("/app/upload")} variant="outline">
          Try a clearer photo
        </Button>
        <Button onClick={() => navigate("/app/history")} variant="ghost">
          View history
        </Button>
      </div>
      <div className="mt-6 pt-5 border-t border-border">
        <p className="text-xs text-muted-foreground mb-2">Still stuck? Talk to a human.</p>
        <WhatsAppSupportButton
          fullWidth
          name={userName ?? undefined}
          resultId={id ?? null}
          reason="Processing screen exceeded 3 minutes without completion"
          uploadDate={new Date().toISOString()}
          biomarkerCount={0}
        />
      </div>
    </div>
  );
};

export default ProcessingResult;
