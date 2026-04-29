import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useActiveProfile, REL_LABELS } from "@/contexts/ActiveProfileContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useDependants } from "@/hooks/useDependants";
import { Loader2, FileText, AlertTriangle, User, TrendingUp, ArrowUpRight, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

const History = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { dependants } = useDependants();
  const { activeProfile, activeProfileId } = useActiveProfile();

  const { data: results, isLoading } = useQuery({
    queryKey: ["lab-results", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("lab_results")
        .select("*")
        .eq("user_id", user!.id)
        .order("upload_date", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const filteredResults = results?.filter((r) =>
    activeProfileId ? r.dependant_id === activeProfileId : !r.dependant_id
  );

  const getDependantName = (depId: string | null) => {
    if (!depId) return null;
    return dependants.find((d) => d.id === depId)?.full_name || "Unknown";
  };

  return (
    <div className="px-5 pt-4 pb-4 max-w-lg mx-auto">
      <div className="mb-5">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/10 px-2.5 py-1 text-[11px] font-semibold text-secondary mb-2">
          <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
          History
        </span>
        <h1 className="font-display text-2xl font-extrabold tracking-tight">
          {activeProfile.isSelf ? "Your lab history" : `${activeProfile.name.split(" ")[0]}'s history`}
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Showing results for <span className="font-semibold text-foreground">{activeProfile.isSelf ? "you" : activeProfile.name}</span>
          {" · "}
          <span>{REL_LABELS[activeProfile.relationship] || activeProfile.relationship}</span>
          {" · use the profile pill above to switch"}
        </p>
      </div>

      {/* View Trends */}
      <button
        onClick={() =>
          navigate(activeProfileId ? `/trends?person=${activeProfileId}` : "/trends")
        }
        className="group w-full flex items-center gap-3 bg-card border border-border rounded-2xl p-4 mb-5 text-left shadow-soft transition-all hover:shadow-card hover:-translate-y-0.5"
      >
        <div className="w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-secondary-foreground" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-body">View Trends</p>
          <p className="text-xs text-muted-foreground">Track biomarkers over time</p>
        </div>
        <ArrowUpRight className="w-4 h-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </button>

      {isLoading && (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {!isLoading && filteredResults?.length === 0 && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-hero p-8 text-center shadow-elevated">
          <div className="absolute inset-0 grid-bg opacity-50 pointer-events-none" />
          <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur ring-1 ring-white/20 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-7 h-7 text-primary-foreground" />
            </div>
            <p className="font-display font-bold text-primary-foreground text-lg">No lab results yet</p>
            <p className="text-primary-foreground/80 text-sm mt-1 mb-5">
              Upload your first result to see it here.
            </p>
            <Button
              onClick={() => navigate("/upload")}
              className="bg-white text-primary hover:bg-white/90 rounded-xl font-bold h-12 px-6"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload now
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {filteredResults?.map((r, i) => {
          const biomarkers = (r.biomarkers as any[] | null) || [];
          const abnormalCount = biomarkers.filter((b: any) => b.status !== "normal").length;
          const normalCount = biomarkers.length - abnormalCount;
          const depName = getDependantName(r.dependant_id);
          const displayDate = r.test_date || r.upload_date;
          const accentColor = r.has_critical_alert
            ? "bg-destructive"
            : abnormalCount > 0
            ? "bg-[hsl(var(--alert-amber))]"
            : "bg-primary";

          return (
            <motion.button
              key={r.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: Math.min(i * 0.04, 0.3) }}
              onClick={() => navigate(`/result/${r.id}`)}
              className="group relative w-full bg-card rounded-2xl pl-5 pr-4 py-4 border border-border text-left touch-target flex items-center gap-3 overflow-hidden shadow-soft transition-all hover:shadow-card hover:-translate-y-0.5"
            >
              <span className={cn("absolute left-0 top-3 bottom-3 w-1 rounded-r-full", accentColor)} />
              <div className={cn(
                "w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0",
                r.has_critical_alert ? "bg-destructive/15" : "bg-secondary/10"
              )}>
                {r.has_critical_alert ? (
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                ) : (
                  <FileText className="w-5 h-5 text-secondary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display font-bold">
                  {new Date(displayDate).toLocaleDateString("en-NG", {
                    day: "numeric", month: "short", year: "numeric",
                  })}
                </p>
                {depName && (
                  <p className="text-xs text-accent flex items-center gap-1 mt-0.5">
                    <User className="w-3 h-3" /> {depName}
                  </p>
                )}
                {r.status === "processing" ? (
                  <p className="text-xs text-muted-foreground mt-1">Processing...</p>
                ) : r.status === "failed" ? (
                  <p className="text-xs text-destructive mt-1">Failed to read</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                      {normalCount} normal
                    </span>
                    {abnormalCount > 0 && (
                      <span className="inline-flex items-center rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-semibold text-destructive">
                        {abnormalCount} flagged
                      </span>
                    )}
                  </div>
                )}
              </div>
              <ArrowUpRight className="w-4 h-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default History;
