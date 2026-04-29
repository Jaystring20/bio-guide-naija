import { useAuth } from "@/contexts/AuthContext";
import { useActiveProfile, REL_LABELS } from "@/contexts/ActiveProfileContext";
import { useNavigate } from "react-router-dom";
import { Upload, Users, ArrowUpRight, Activity, FileText, Clock, AlertTriangle, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useProfileStats } from "@/hooks/useProfileStats";
import { useDependants } from "@/hooks/useDependants";
import { motion, useReducedMotion } from "framer-motion";
import veridiaLogo from "@/assets/veridia-logo.png";
import { Aurora } from "@/components/Aurora";
import { CountUp } from "@/components/CountUp";
import { Ripple } from "@/components/Ripple";
import { cn } from "@/lib/utils";

const initials = (name?: string | null) =>
  (name || "?").split(" ").map(p => p[0]).slice(0, 2).join("").toUpperCase();

const Index = () => {
  const { profile, user } = useAuth();
  const { activeProfile, activeProfileId } = useActiveProfile();
  const { dependants } = useDependants();
  const { get } = useProfileStats();
  const navigate = useNavigate();

  const { data: lastResult } = useQuery({
    queryKey: ["last-result", user?.id, activeProfileId],
    queryFn: async () => {
      let q = supabase
        .from("lab_results")
        .select("*")
        .eq("user_id", user!.id)
        .order("upload_date", { ascending: false })
        .limit(1);
      if (activeProfileId) {
        q = q.eq("dependant_id", activeProfileId);
      } else {
        q = q.is("dependant_id", null);
      }
      const { data } = await q.maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const ownFirstName = profile?.full_name?.split(" ")[0] || "there";
  const viewingFirstName = activeProfile.name.split(" ")[0];
  const stats = get(activeProfileId);

  const fade = (delay = 0) => ({
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.45, ease: "easeOut", delay },
  });

  const reduce = useReducedMotion();

  return (
    <div className="px-5 pt-4 pb-4 max-w-lg mx-auto">
      {/* Hero gradient card */}
      <motion.div {...fade(0)} className="relative overflow-hidden rounded-3xl bg-gradient-hero p-6 mb-5 shadow-elevated">
        {/* Drifting aurora behind everything */}
        <Aurora tone="warm" intensity={0.9} />
        <div className="absolute inset-0 grid-bg opacity-50 pointer-events-none" />
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-10 w-56 h-56 rounded-full bg-secondary/30 blur-3xl pointer-events-none" />

        <div className="relative">
          <div className="flex items-center justify-between mb-7">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center ring-1 ring-white/20">
                <img src={veridiaLogo} alt="VeriDIA" className="h-5 w-auto brightness-0 invert" />
              </div>
              <span className="text-primary-foreground/80 text-sm font-semibold tracking-wide">VeriDIA</span>
            </div>
            <button
              onClick={() => navigate("/profile")}
              className="relative w-10 h-10 rounded-full bg-white/15 backdrop-blur ring-1 ring-white/20 flex items-center justify-center text-primary-foreground font-bold text-sm touch-target tap-scale"
            >
              <span aria-hidden className="absolute inset-0 rounded-full bg-white/30 animate-heartbeat" />
              <span className="relative">{initials(profile?.full_name)}</span>
            </button>
          </div>

          <p className="text-primary-foreground/75 text-sm">{greeting()},</p>
          <motion.h1
            initial={{ opacity: 0, y: 8, filter: reduce ? "none" : "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
            className="font-display text-3xl font-extrabold text-primary-foreground tracking-tight"
          >
            {ownFirstName}{" "}
            <motion.span
              initial={{ rotate: 0 }}
              animate={reduce ? {} : { rotate: [0, 14, -8, 14, 0] }}
              transition={{ duration: 1.2, delay: 0.6, ease: "easeInOut" }}
              className="inline-block origin-[70%_70%]"
            >
              👋
            </motion.span>
          </motion.h1>

          {!activeProfile.isSelf ? (
            <p className="text-primary-foreground/85 text-body-sm mt-2 max-w-[18rem]">
              Viewing <span className="font-bold">{activeProfile.name}</span>
              {" "}<span className="opacity-80">· {REL_LABELS[activeProfile.relationship] || activeProfile.relationship}{activeProfile.age ? ` · ${activeProfile.age}y` : ""}</span>
            </p>
          ) : (
            <p className="text-primary-foreground/80 text-body-sm mt-2 max-w-[18rem]">
              Turn your next lab result into a clear plan.
            </p>
          )}

          {/* Glass CTA */}
          <Ripple
            onClick={() => navigate("/upload")}
            rippleColor="hsl(0 0% 100% / 0.4)"
            className={cn(
              "group mt-6 w-full glass-card rounded-2xl p-4 flex items-center gap-4 text-left touch-target transition-all hover:bg-white/20",
              !reduce && "animate-breathe"
            )}
          >
            <div className="w-12 h-12 rounded-xl bg-white text-primary flex items-center justify-center shadow-lg shrink-0">
              <Upload className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-primary-foreground">
                {activeProfile.isSelf ? "Upload a lab result" : `Upload for ${viewingFirstName}`}
              </p>
              <p className="text-primary-foreground/75 text-xs">Photo or PDF · ~30 sec analysis</p>
            </div>
            <ArrowUpRight className={cn("w-5 h-5 text-primary-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5", !reduce && "animate-nudge-right")} />
          </Ripple>
        </div>
      </motion.div>

      {/* Family quick access */}
      {dependants.length > 0 && (
        <motion.div {...fade(0.05)} className="mb-5">
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="font-display font-bold text-base flex items-center gap-2 text-foreground">
              <Users className="w-4 h-4 text-secondary" />
              Family
            </h3>
            <button
              onClick={() => navigate("/family")}
              className="text-accent text-xs font-semibold hover:underline"
            >
              Manage →
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {dependants.slice(0, 4).map((d) => {
              const ds = get(d.id);
              return (
                <button
                  key={d.id}
                  onClick={() => navigate("/family")}
                  className="group bg-card rounded-2xl p-4 border border-border shadow-soft text-left touch-target transition-all hover:shadow-card hover:-translate-y-0.5"
                >
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="w-9 h-9 rounded-full bg-gradient-brand text-primary-foreground flex items-center justify-center text-xs font-bold shadow-soft">
                      {initials(d.full_name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm truncate">{d.full_name}</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                    {REL_LABELS[d.relationship] || d.relationship}{d.age ? ` · ${d.age}y` : ""}
                  </span>
                  <p className="text-xs text-muted-foreground mt-2">
                    {ds.total} {ds.total === 1 ? "result" : "results"}
                  </p>
                </button>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Quick stats — scoped to active profile */}
      <motion.div {...fade(0.1)} className="grid grid-cols-2 gap-3 mb-5">
        <button
          onClick={() => navigate("/history")}
          className="bg-card rounded-2xl p-5 border border-border shadow-soft text-left touch-target transition-all hover:shadow-card hover:-translate-y-0.5"
        >
          <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center mb-3">
            <Clock className="w-5 h-5 text-secondary" />
          </div>
          <p className="text-xs text-muted-foreground font-medium">Results</p>
          <p className="font-display text-lg font-bold mt-0.5">{stats.total}</p>
        </button>
        <button
          onClick={() => navigate("/trends")}
          className="bg-card rounded-2xl p-5 border border-border shadow-soft text-left touch-target transition-all hover:shadow-card hover:-translate-y-0.5"
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${stats.flagged > 0 ? "bg-destructive/10" : "bg-primary/10"}`}>
            {stats.flagged > 0 ? (
              <AlertTriangle className="w-5 h-5 text-destructive" />
            ) : (
              <TrendingUp className="w-5 h-5 text-primary" />
            )}
          </div>
          <p className="text-xs text-muted-foreground font-medium">Flagged</p>
          <p className="font-display text-lg font-bold mt-0.5">
            {stats.flagged > 0 ? stats.flagged : "All clear"}
          </p>
        </button>
      </motion.div>

      {/* Latest result for active profile */}
      {lastResult && lastResult.status === "completed" && (
        <motion.button
          {...fade(0.15)}
          onClick={() => navigate(`/result/${lastResult.id}`)}
          className="group w-full bg-card rounded-2xl p-5 border border-border shadow-soft text-left touch-target transition-all hover:shadow-card hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              Latest for {viewingFirstName}
            </span>
            <ArrowUpRight className="w-4 h-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-secondary/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-secondary" />
            </div>
            <div className="flex-1">
              <p className="font-display font-bold">
                {new Date(lastResult.upload_date).toLocaleDateString("en-NG", {
                  day: "numeric", month: "short", year: "numeric",
                })}
              </p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Activity className="w-3 h-3" />
                Tap to view full report
              </p>
            </div>
          </div>
        </motion.button>
      )}

      <p className="text-xs text-muted-foreground/80 text-center mt-8 px-4 leading-relaxed">
        VeriDIA provides nutritional guidance only and is not a substitute for professional medical advice.
      </p>
    </div>
  );
};

export default Index;
