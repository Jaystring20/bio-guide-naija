import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { EmergencyAlert } from "@/components/EmergencyAlert";
import { Button } from "@/components/ui/button";
import { Loader2, Download, Share2, MessageCircle, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { Biomarker, BiomarkerPidgin, DietaryPlan, DietaryPlanPidgin, ChecklistItem, ChecklistItemPidgin, Language } from "@/components/report/types";
import { SummaryTab } from "@/components/report/SummaryTab";
import { BiomarkersTab } from "@/components/report/BiomarkersTab";
import { DietPlanTab } from "@/components/report/DietPlanTab";
import { ChecklistTab } from "@/components/report/ChecklistTab";
import { generatePDF, sharePDF } from "@/components/report/PDFExport";

const TABS = ["summary", "results", "diet", "checklist"] as const;
type Tab = typeof TABS[number];

const TAB_LABELS: Record<Language, Record<Tab, string>> = {
  en: { summary: "Summary", results: "Biomarkers", diet: "Diet Plan", checklist: "Doctor Q's" },
  pidgin: { summary: "Summary", results: "Results", diet: "Chop Plan", checklist: "Doctor Q's" },
};

const ResultReport = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showEmergency, setShowEmergency] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("summary");
  const [language, setLanguage] = useState<Language>("en");

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

  const biomarkers = (result.biomarkers as unknown as Biomarker[] | null) || [];
  const biomarkersPidgin = (result.biomarkers_pidgin as unknown as BiomarkerPidgin[] | null) || null;
  const dietaryPlan = result.dietary_plan as unknown as DietaryPlan | null;
  const dietaryPlanPidgin = result.dietary_plan_pidgin as unknown as DietaryPlanPidgin | null;
  const checklist = (result.consultation_checklist as unknown as ChecklistItem[] | null) || [];
  const checklistPidgin = (result.consultation_checklist_pidgin as unknown as ChecklistItemPidgin[] | null) || null;
  const criticalAlerts = (result.critical_alerts as any[] | null) || [];
  const aiSummary = result.ai_summary as string | null;
  const aiSummaryPidgin = (result as any).ai_summary_pidgin as string | null;

  if (showEmergency && criticalAlerts.length > 0) {
    return (
      <EmergencyAlert alerts={criticalAlerts} onAcknowledge={() => setShowEmergency(false)} />
    );
  }

  const hasPidgin = !!biomarkersPidgin || !!aiSummaryPidgin;

  const handleDownloadPDF = () => {
    generatePDF({
      language,
      uploadDate: result.upload_date,
      aiSummary,
      aiSummaryPidgin,
      biomarkers,
      biomarkersPidgin,
      dietaryPlan,
      dietaryPlanPidgin,
      checklist,
      checklistPidgin,
    });
  };

  return (
    <div className="px-5 pt-6 pb-4 max-w-lg mx-auto">
      <button onClick={() => navigate(-1)} className="text-muted-foreground text-body-sm mb-4 touch-target">
        ← Back
      </button>

      <div className="mb-1">
        <h1 className="font-display text-2xl font-bold">
          {language === "pidgin" ? "Your Lab Report" : "Your Lab Report"}
        </h1>
        {hasPidgin && (
          <div className="flex bg-muted rounded-full p-0.5 mt-2 w-fit">
            <button
              onClick={() => setLanguage("en")}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-bold transition-colors",
                language === "en" ? "bg-accent text-accent-foreground" : "text-muted-foreground"
              )}
            >
              🇬🇧 English
            </button>
            <button
              onClick={() => setLanguage("pidgin")}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-bold transition-colors",
                language === "pidgin" ? "bg-accent text-accent-foreground" : "text-muted-foreground"
              )}
            >
              🇳🇬 Pidgin
            </button>
          </div>
        )}
      </div>
      <p className="text-muted-foreground text-body-sm mb-6">
        {new Date(result.upload_date).toLocaleDateString("en-NG", {
          day: "numeric", month: "long", year: "numeric",
        })}
      </p>

      {/* Tabs */}
      <div className="grid grid-cols-2 gap-2 mb-6">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-3 py-3 rounded-xl font-semibold text-body-sm text-center touch-target transition-colors",
              activeTab === tab
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border text-foreground"
            )}
          >
            {TAB_LABELS[language][tab]}
          </button>
        ))}
      </div>

      {activeTab === "summary" && (
        <SummaryTab biomarkers={biomarkers} aiSummary={aiSummary} aiSummaryPidgin={aiSummaryPidgin} uploadDate={result.upload_date} language={language} />
      )}

      {activeTab === "results" && (
        <BiomarkersTab biomarkers={biomarkers} biomarkersPidgin={biomarkersPidgin} language={language} />
      )}

      {activeTab === "diet" && dietaryPlan && (
        <DietPlanTab dietaryPlan={dietaryPlan} dietaryPlanPidgin={dietaryPlanPidgin} language={language} />
      )}

      {activeTab === "checklist" && (
        <ChecklistTab checklist={checklist} checklistPidgin={checklistPidgin} language={language} />
      )}

      {/* Floating PDF Download */}
      <div className="fixed bottom-24 right-4 z-40 flex flex-col items-center gap-1">
        <Button
          onClick={handleDownloadPDF}
          className="h-14 w-14 rounded-full bg-accent text-accent-foreground shadow-lg hover:shadow-xl touch-target"
          size="icon"
        >
          <Download className="w-6 h-6" />
        </Button>
        <span className="text-[10px] font-semibold text-muted-foreground">PDF</span>
      </div>
    </div>
  );
};

export default ResultReport;
