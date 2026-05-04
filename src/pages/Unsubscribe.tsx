import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { VeridiaLogo } from "@/components/VeridiaLogo";
import { supabase } from "@/integrations/supabase/client";

type State =
  | { status: "loading" }
  | { status: "valid" }
  | { status: "submitting" }
  | { status: "success" }
  | { status: "already" }
  | { status: "invalid"; message: string };

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const Unsubscribe = () => {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    if (!token) {
      setState({ status: "invalid", message: "No unsubscribe token provided." });
      return;
    }
    (async () => {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`,
          { headers: { apikey: SUPABASE_ANON_KEY } }
        );
        const json = await res.json();
        if (json.valid === true) setState({ status: "valid" });
        else if (json.reason === "already_unsubscribed") setState({ status: "already" });
        else setState({ status: "invalid", message: json.error || "Invalid or expired link." });
      } catch {
        setState({ status: "invalid", message: "Could not validate this link. Please try again." });
      }
    })();
  }, [token]);

  const confirmUnsubscribe = async () => {
    if (!token) return;
    setState({ status: "submitting" });
    try {
      const { data, error } = await supabase.functions.invoke("handle-email-unsubscribe", {
        body: { token },
      });
      if (error) throw error;
      if (data?.success) setState({ status: "success" });
      else if (data?.reason === "already_unsubscribed") setState({ status: "already" });
      else setState({ status: "invalid", message: "Could not process your request." });
    } catch {
      setState({ status: "invalid", message: "Something went wrong. Please try again." });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm text-center">
        <VeridiaLogo className="h-32 w-auto mx-auto mb-6" />

        {state.status === "loading" && (
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin text-secondary-foreground" />
            <p>Checking your link…</p>
          </div>
        )}

        {state.status === "valid" && (
          <>
            <h1 className="font-display text-2xl font-bold text-secondary mb-3">
              Unsubscribe from VeriDIA emails?
            </h1>
            <p className="text-muted-foreground text-body mb-6">
              You'll stop receiving lab-result and update emails. You can still
              sign in normally — only marketing-style emails are affected.
            </p>
            <Button
              onClick={confirmUnsubscribe}
              className="w-full h-14 text-lg font-bold rounded-xl bg-accent text-accent-foreground hover:bg-accent/90"
            >
              Confirm unsubscribe
            </Button>
          </>
        )}

        {state.status === "submitting" && (
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin text-secondary-foreground" />
            <p>Processing…</p>
          </div>
        )}

        {state.status === "success" && (
          <>
            <CheckCircle2 className="w-14 h-14 text-accent mx-auto mb-4" />
            <h1 className="font-display text-2xl font-bold text-secondary mb-2">
              You've been unsubscribed
            </h1>
            <p className="text-muted-foreground text-body">
              We won't send you any more update emails. Sorry to see you go.
            </p>
          </>
        )}

        {state.status === "already" && (
          <>
            <CheckCircle2 className="w-14 h-14 text-accent mx-auto mb-4" />
            <h1 className="font-display text-2xl font-bold text-secondary mb-2">
              Already unsubscribed
            </h1>
            <p className="text-muted-foreground text-body">
              This email is already on our do-not-send list.
            </p>
          </>
        )}

        {state.status === "invalid" && (
          <>
            <XCircle className="w-14 h-14 text-destructive mx-auto mb-4" />
            <h1 className="font-display text-2xl font-bold text-secondary mb-2">
              Link not valid
            </h1>
            <p className="text-muted-foreground text-body">{state.message}</p>
          </>
        )}
      </div>
    </div>
  );
};

export default Unsubscribe;
