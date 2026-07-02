import { useState } from "react";
import { Sparkles, Loader2, RefreshCw, AlertCircle, TrendingUp, TrendingDown, Lightbulb, ClipboardList, Stethoscope } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { WhatsAppSupportButton } from "@/components/support/WhatsAppSupportButton";

export type AiVerdict = {
  headline: string;
  wins: string[];
  concerns: string[];
  likely_drivers: string[];
  next_actions: string[];
  questions_for_doctor: string[];
};

type Props = {
  resultIds: string[];
  payload: unknown; // deltas + biomarkers summary for the model
  cacheKey: string;
};

const cache = new Map<string, AiVerdict>();

export const AiVerdictPanel = ({ resultIds, payload, cacheKey }: Props) => {
  const [verdict, setVerdict] = useState<AiVerdict | null>(cache.get(cacheKey) || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke("compare-results", {
        body: { resultIds, payload },
      });
      if (error) throw error;
      if (!data || typeof data !== "object" || !("headline" in data)) {
        throw new Error("Malformed AI response");
      }
      const v = data as AiVerdict;
      cache.set(cacheKey, v);
      setVerdict(v);
    } catch (e: any) {
      setError(e?.message || "Couldn't generate AI insights");
    } finally {
      setLoading(false);
    }
  };

  if (!verdict) {
    return (
      <div className="rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/5 to-primary/5 p-5 text-center">
        <Sparkles className="w-8 h-8 text-accent mx-auto mb-2" />
        <h3 className="font-display text-lg font-extrabold">Want a plain-language read?</h3>
        <p className="text-sm text-muted-foreground mt-1 mb-4">
          Let AI summarize what improved, what worsened, and suggest next steps.
        </p>
        <Button
          onClick={run}
          disabled={loading}
          className="bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-6 rounded-xl font-bold"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing…</>
          ) : (
            <><Sparkles className="w-4 h-4 mr-2" /> Get AI insights</>
          )}
        </Button>
        {error && (
          <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-left">
            <div className="flex items-start gap-2 text-xs text-destructive">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold mb-1">Couldn't generate insights</p>
                <p className="opacity-80">{error}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button onClick={run} className="inline-flex items-center gap-1 text-destructive underline font-semibold">
                    <RefreshCw className="w-3 h-3" /> Try again
                  </button>
                </div>
              </div>
            </div>
            <div className="mt-3">
              <WhatsAppSupportButton
                reason={`Compare AI failed: ${error}`}
                resultId={resultIds.join(", ")}
                size="sm"
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-accent/40 bg-gradient-to-br from-accent/10 to-primary/5 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-accent" />
          <span className="text-[11px] font-bold uppercase tracking-wide text-accent">AI insights</span>
        </div>
        <p className="font-display text-lg font-extrabold leading-snug">{verdict.headline}</p>
      </div>

      <Section title="What improved" tone="good" icon={<TrendingUp className="w-4 h-4" />} items={verdict.wins} />
      <Section title="What worsened or needs attention" tone="bad" icon={<TrendingDown className="w-4 h-4" />} items={verdict.concerns} />
      <Section title="Likely drivers" tone="neutral" icon={<Lightbulb className="w-4 h-4" />} items={verdict.likely_drivers} />
      <Section title="Next actions" tone="good" icon={<ClipboardList className="w-4 h-4" />} items={verdict.next_actions} />
      <Section title="Ask your doctor" tone="neutral" icon={<Stethoscope className="w-4 h-4" />} items={verdict.questions_for_doctor} />

      <p className="text-[11px] text-muted-foreground text-center px-4 mt-2">
        AI guidance based on your reports. Not a diagnosis — discuss with a clinician.
      </p>
    </div>
  );
};

const Section = ({ title, icon, items, tone }: { title: string; icon: React.ReactNode; items: string[]; tone: "good" | "bad" | "neutral" }) => {
  if (!items || items.length === 0) return null;
  const cls =
    tone === "good" ? "border-primary/20 bg-primary/5" :
    tone === "bad" ? "border-destructive/20 bg-destructive/5" :
    "border-border bg-card";
  const iconCls =
    tone === "good" ? "text-primary" :
    tone === "bad" ? "text-destructive" :
    "text-secondary-foreground";
  return (
    <div className={`rounded-2xl border p-4 ${cls}`}>
      <div className={`flex items-center gap-2 mb-2 ${iconCls}`}>
        {icon}
        <h4 className="font-bold text-sm">{title}</h4>
      </div>
      <ul className="space-y-1.5">
        {items.map((it, i) => (
          <li key={i} className="text-sm text-foreground leading-relaxed pl-3 relative">
            <span className="absolute left-0 top-2 w-1 h-1 rounded-full bg-current opacity-40" />
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
};
