import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { EmergencyAlert } from "@/components/EmergencyAlert";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Biomarker, DietaryPlan, ChecklistItem } from "@/components/report/types";
import { SummaryTab } from "@/components/report/SummaryTab";
import { BiomarkersTab } from "@/components/report/BiomarkersTab";
import { DietPlanTab } from "@/components/report/DietPlanTab";
import { ChecklistTab } from "@/components/report/ChecklistTab";

const TABS = ["summary", "results", "diet", "checklist"] as const;
type Tab = typeof TABS[number];

const TAB_LABELS: Record<Tab, string> = {
  summary: "Summary",
  results: "Biomarkers",
  diet: "Diet Plan",
  checklist: "Doctor Q's",
};

const ResultReport = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showEmergency, setShowEmergency] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("summary");

  const { data: result, isLoading } = useQuery({
    queryKey: ["lab-result", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lab_results")
        .select("*")
        .eq("id", id!)
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id && !!user,
    refetchInterval: (query) => {
      const data = query.state.data;
      return data?.status === "processing" ? 3000 : false;
    },
  });

  useEffect(() => {
    if (result?.has_critical_alert) setShowEmergency(true);
  }, [result?.has_critical_alert]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="px-5 pt-12 text-center">
        <p className="text-muted-foreground">Result not found.</p>
        <Button onClick={() => navigate("/")} variant="outline" className="mt-4">Go Home</Button>
      </div>
    );
  }

  if (result.status === "processing") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6">
        <Loader2 className="w-12 h-12 text-accent animate-spin mb-6" />
        <p className="font-display text-lg font-semibold">Analyzing your results...</p>
        <p className="text-muted-foreground text-body-sm mt-2 text-center">
          Our AI is reading your lab result and preparing your personalized health report.
        </p>
      </div>
    );
  }

  if (result.status === "failed") {
    return (
      <div className="px-5 pt-12 text-center">
        <p className="text-destructive font-semibold text-body">We couldn't read your lab result</p>
        <p className="text-muted-foreground text-body-sm mt-2">Please try uploading a clearer image or PDF.</p>
        <Button onClick={() => navigate("/upload")} className="mt-4 bg-accent text-accent-foreground">Try Again</Button>
      </div>
    );
  }

  const biomarkers = (result.biomarkers as Biomarker[] | null) || [];
  const dietaryPlan = result.dietary_plan as DietaryPlan | null;
  const checklist = (result.consultation_checklist as ChecklistItem[] | null) || [];
  const criticalAlerts = (result.critical_alerts as any[] | null) || [];
  const aiSummary = (result as any).ai_summary as string | null;

  if (showEmergency && criticalAlerts.length > 0) {
    return (
      <EmergencyAlert alerts={criticalAlerts} onAcknowledge={() => setShowEmergency(false)} />
    );
  }

  return (
    <div className="px-5 pt-6 pb-4 max-w-lg mx-auto">
      <button onClick={() => navigate(-1)} className="text-muted-foreground text-body-sm mb-4 touch-target">
        ← Back
      </button>

      <h1 className="font-display text-2xl font-bold mb-1">Your Lab Report</h1>
      <p className="text-muted-foreground text-body-sm mb-6">
        {new Date(result.upload_date).toLocaleDateString("en-NG", {
          day: "numeric", month: "long", year: "numeric",
        })}
      </p>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-3 rounded-xl font-semibold text-body-sm whitespace-nowrap touch-target transition-colors",
              activeTab === tab
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border text-foreground"
            )}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      {activeTab === "summary" && (
        <SummaryTab biomarkers={biomarkers} aiSummary={aiSummary} uploadDate={result.upload_date} />
      )}

      {activeTab === "results" && <BiomarkersTab biomarkers={biomarkers} />}

      {activeTab === "diet" && dietaryPlan && <DietPlanTab dietaryPlan={dietaryPlan} />}

      {activeTab === "checklist" && <ChecklistTab checklist={checklist} />}
    </div>
  );
};

export default ResultReport;
