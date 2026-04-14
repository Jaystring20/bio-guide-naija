import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useDependants } from "@/hooks/useDependants";
import { Loader2, FileText, AlertTriangle, User, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

const History = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { dependants } = useDependants();
  const [personFilter, setPersonFilter] = useState<string>("all"); // "all", "myself", or dependant id

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

  const filteredResults = results?.filter((r) => {
    if (personFilter === "all") return true;
    if (personFilter === "myself") return !r.dependant_id;
    return r.dependant_id === personFilter;
  });

  const getDependantName = (depId: string | null) => {
    if (!depId) return null;
    return dependants.find((d) => d.id === depId)?.full_name || "Unknown";
  };

  return (
    <div className="px-5 pt-8 pb-4 max-w-lg mx-auto">
      <h1 className="font-display text-2xl font-bold mb-4">Your History</h1>

      {/* Person filter */}
      {dependants.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
          <button
            onClick={() => setPersonFilter("all")}
            className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
              personFilter === "all" ? "border-accent bg-accent/10 text-accent" : "border-border bg-card"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setPersonFilter("myself")}
            className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
              personFilter === "myself" ? "border-accent bg-accent/10 text-accent" : "border-border bg-card"
            }`}
          >
            Myself
          </button>
          {dependants.map((d) => (
            <button
              key={d.id}
              onClick={() => setPersonFilter(d.id)}
              className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
                personFilter === d.id ? "border-accent bg-accent/10 text-accent" : "border-border bg-card"
              }`}
            >
              {d.full_name}
            </button>
          ))}
        </div>
      )}

      {/* View Trends button */}
      <button
        onClick={() =>
          navigate(
            personFilter === "all" || personFilter === "myself"
              ? "/trends"
              : `/trends?person=${personFilter}`
          )
        }
        className="w-full flex items-center gap-3 bg-accent/10 border border-accent/30 rounded-xl p-4 mb-5 text-left"
      >
        <TrendingUp className="w-5 h-5 text-accent flex-shrink-0" />
        <div>
          <p className="font-semibold text-body text-accent">View Trends</p>
          <p className="text-body-sm text-muted-foreground">Track biomarkers over time</p>
        </div>
      </button>

      {isLoading && (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      )}

      {!isLoading && filteredResults?.length === 0 && (
        <div className="text-center py-20">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground text-body">No lab results yet</p>
          <button
            onClick={() => navigate("/upload")}
            className="text-accent underline mt-2 touch-target text-body-sm"
          >
            Upload your first result
          </button>
        </div>
      )}

      <div className="space-y-3">
        {filteredResults?.map((r) => {
          const biomarkers = (r.biomarkers as any[] | null) || [];
          const abnormalCount = biomarkers.filter((b: any) => b.status !== "normal").length;
          const depName = getDependantName(r.dependant_id);
          const displayDate = r.test_date || r.upload_date;

          return (
            <button
              key={r.id}
              onClick={() => navigate(`/result/${r.id}`)}
              className="w-full bg-card rounded-xl p-5 border border-border text-left touch-target flex items-center gap-4"
            >
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
                r.has_critical_alert ? "bg-destructive/20" : "bg-secondary/20"
              )}>
                {r.has_critical_alert ? (
                  <AlertTriangle className="w-6 h-6 text-destructive" />
                ) : (
                  <FileText className="w-6 h-6 text-secondary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-body">
                  {new Date(displayDate).toLocaleDateString("en-NG", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
                {depName && (
                  <p className="text-xs text-accent flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {depName}
                  </p>
                )}
                <p className="text-body-sm text-muted-foreground">
                  {r.status === "processing"
                    ? "Processing..."
                    : r.status === "failed"
                    ? "Failed to read"
                    : `${biomarkers.length} biomarkers • ${abnormalCount} flagged`}
                </p>
              </div>
              <span className="text-muted-foreground text-body-sm">→</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default History;
