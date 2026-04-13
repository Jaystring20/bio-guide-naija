import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Loader2, FileText, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

const History = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

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

  return (
    <div className="px-5 pt-8 pb-4 max-w-lg mx-auto">
      <h1 className="font-display text-2xl font-bold mb-6">Your History</h1>

      {isLoading && (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      )}

      {!isLoading && results?.length === 0 && (
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
        {results?.map((r) => {
          const biomarkers = (r.biomarkers as any[] | null) || [];
          const abnormalCount = biomarkers.filter(
            (b: any) => b.status !== "normal"
          ).length;

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
                  {new Date(r.upload_date).toLocaleDateString("en-NG", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
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
