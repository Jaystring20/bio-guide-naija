import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { EmergencyAlert } from "@/components/EmergencyAlert";
import { Button } from "@/components/ui/button";
import { Loader2, Download, Share2, MessageCircle, Mail, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Biomarker, BiomarkerPidgin, DietaryPlan, DietaryPlanPidgin, ChecklistItem, ChecklistItemPidgin, Language } from "@/components/report/types";
import { SummaryTab } from "@/components/report/SummaryTab";
import { BiomarkersTab } from "@/components/report/BiomarkersTab";
import { DietPlanTab } from "@/components/report/DietPlanTab";
import { ChecklistTab } from "@/components/report/ChecklistTab";
import { generatePDF, sharePDF } from "@/components/report/PDFExport";
import { AnimatePresence, motion } from "framer-motion";
import { OrbitProcessing } from "@/components/OrbitProcessing";
import { InlineRatingPrompt } from "@/components/feedback/InlineRatingPrompt";

const TABS = ["summary", "results", "diet", "checklist"] as const;
type Tab = typeof TABS[number];

const TAB_LABELS: Record<Language, Record<Tab, string>> = {
  en: { summary: "Summary", results: "Biomarkers", diet: "Diet Plan", checklist: "Doctor Q's" },
  pidgin: { summary: "Summary", results: "Results", diet: "Chop Plan", checklist: "Doctor Q's" },
};

const ResultReport = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const navigate = useNavigate();
  const [showEmergency, setShowEmergency] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("summary");
  const [language, setLanguage] = useState<Language>("en");
  const [showShareMenu, setShowShareMenu] = useState(false);

  const { data: result, isLoading, refetch } = useQuery({
    queryKey: ["lab-result", id, isAdmin],
    queryFn: async () => {
      // Admins can view any result (RLS allows). Regular users are scoped to their own.
      let q = supabase.from("lab_results").select("*").eq("id", id!);
      if (!isAdmin) q = q.eq("user_id", user!.id);
      const { data, error } = await q.single();
      if (error) throw error;
      return data;
    },
    enabled: !!id && !!user,
    refetchInterval: (query) => {
      const data = query.state.data;
      // Keep polling while still processing or background work hasn't finished.
      if (data?.status === "processing") return 3000;
      if (data?.status === "partial") return 4000;
      return false;
    },
  });

  // If admin is viewing someone else's result, fetch the owner's name/email for context.
  const isAdminViewing = !!result && !!user && result.user_id !== user.id && isAdmin;
  const { data: ownerInfo } = useQuery({
    queryKey: ["result-owner", id],
    enabled: isAdminViewing,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_get_result_owner", { _result_id: id! });
      if (error) throw error;
      return (data && data[0]) || null;
    },
  });

  // Realtime: react to background diet/Pidgin updates without waiting for poll.
  useEffect(() => {
    if (!id || !user) return;
    const channel = supabase
      .channel(`lab-result-${id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "lab_results", filter: `id=eq.${id}` },
        () => { refetch(); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id, user, refetch]);

  useEffect(() => {
    if (result?.has_critical_alert) setShowEmergency(true);
  }, [result?.has_critical_alert]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-secondary-foreground" />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="px-5 pt-12 text-center">
        <p className="text-muted-foreground">Result not found.</p>
        <Button onClick={() => navigate("/app")} variant="outline" className="mt-4">Go Home</Button>
      </div>
    );
  }

  if (result.status === "processing") {
    return (
      <div className="px-5 pt-6 max-w-lg mx-auto">
        <OrbitProcessing step={1} label="Analyzing your results" />
      </div>
    );
  }

  if (result.status === "failed") {
    return (
      <div className="px-5 pt-12 text-center">
        <p className="text-destructive font-semibold text-body">We couldn't read your lab result</p>
        <p className="text-muted-foreground text-body-sm mt-2">Please try uploading a clearer image or PDF.</p>
        <Button onClick={() => navigate("/app/upload")} className="mt-4 bg-accent text-accent-foreground">Try Again</Button>
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
  const processingSteps = ((result as any).processing_steps as Array<{ step: string; ms?: number; ok?: boolean; model?: string; note?: string }> | null) || null;
  const biomarkersEmpty = biomarkers.length === 0;

  if (showEmergency && criticalAlerts.length > 0) {
    return (
      <EmergencyAlert alerts={criticalAlerts} onAcknowledge={() => setShowEmergency(false)} />
    );
  }

  const hasPidgin = !!biomarkersPidgin || !!aiSummaryPidgin;

  const pdfData = {
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
  };

  const handleDownloadPDF = () => {
    generatePDF(pdfData);
  };

  const handleShare = async (method: "whatsapp" | "email" | "native") => {
    setShowShareMenu(false);
    await sharePDF(pdfData, method);
  };

  return (
    <div className="px-5 pt-6 pb-4 max-w-lg mx-auto">
      <button onClick={() => navigate(-1)} className="text-muted-foreground text-body-sm mb-4 touch-target">
        ← Back
      </button>

      {isAdminViewing && (
        <div className="rounded-2xl border border-secondary/30 bg-secondary/5 p-3 mb-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-secondary/15 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4 text-secondary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] uppercase tracking-wider font-semibold text-secondary">Admin viewer · read-only</p>
            <p className="text-sm font-semibold truncate">
              {ownerInfo?.full_name || ownerInfo?.email || "Loading patient…"}
            </p>
            {ownerInfo?.email && ownerInfo?.full_name && (
              <p className="text-xs text-muted-foreground truncate">{ownerInfo.email}</p>
            )}
          </div>
        </div>
      )}

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

      {!isAdminViewing && result.status === "completed" && (
        <InlineRatingPrompt
          promptKey="post-result-v1"
          title="How was your VeriDIA report?"
          subtitle="One tap helps us improve faster — your rating goes straight to the team."
          resultId={id}
        />
      )}

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

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 14 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -14 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        >
          {activeTab === "summary" && (
            <SummaryTab biomarkers={biomarkers} aiSummary={aiSummary} aiSummaryPidgin={aiSummaryPidgin} uploadDate={result.upload_date} language={language} />
          )}
          {activeTab === "results" && (
            <BiomarkersTab biomarkers={biomarkers} biomarkersPidgin={biomarkersPidgin} language={language} />
          )}
          {activeTab === "diet" && dietaryPlan && (
            <DietPlanTab dietaryPlan={dietaryPlan} dietaryPlanPidgin={dietaryPlanPidgin} language={language} />
          )}
          {activeTab === "diet" && !dietaryPlan && (
            <div className="rounded-2xl border border-border bg-card p-6 text-center shadow-soft">
              <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-3" />
              <p className="font-semibold text-body">Cooking your diet plan…</p>
              <p className="text-muted-foreground text-body-sm mt-1">
                We're matching your results to Nigerian foods. This usually takes another 10–20 seconds.
              </p>
            </div>
          )}
          {activeTab === "checklist" && checklist.length > 0 && (
            <ChecklistTab checklist={checklist} checklistPidgin={checklistPidgin} language={language} />
          )}
          {activeTab === "checklist" && checklist.length === 0 && (
            <div className="rounded-2xl border border-border bg-card p-6 text-center shadow-soft">
              <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-3" />
              <p className="font-semibold text-body">Preparing doctor questions…</p>
              <p className="text-muted-foreground text-body-sm mt-1">
                Personalised questions will appear here in a moment.
              </p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Floating action buttons */}
      <div className="fixed bottom-24 right-4 z-40 flex flex-col items-center gap-2">
        {/* Share menu */}
        {showShareMenu && (
          <div className="flex flex-col gap-2 mb-1 animate-in slide-in-from-bottom-2 fade-in duration-200">
            <Button
              onClick={() => handleShare("whatsapp")}
              className="h-11 w-11 rounded-full bg-[hsl(142,70%,45%)] text-white shadow-md hover:bg-[hsl(142,70%,40%)]"
              size="icon"
              title="Share via WhatsApp"
            >
              <MessageCircle className="w-5 h-5" />
            </Button>
            <Button
              onClick={() => handleShare("email")}
              className="h-11 w-11 rounded-full bg-secondary text-secondary-foreground shadow-md hover:bg-secondary/90"
              size="icon"
              title="Share via Email"
            >
              <Mail className="w-5 h-5" />
            </Button>
            {typeof navigator !== "undefined" && navigator.share && (
              <Button
                onClick={() => handleShare("native")}
                className="h-11 w-11 rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90"
                size="icon"
                title="More sharing options"
              >
                <Share2 className="w-5 h-5" />
              </Button>
            )}
          </div>
        )}

        {/* Share toggle */}
        <Button
          onClick={() => setShowShareMenu(!showShareMenu)}
          className={cn(
            "h-12 w-12 rounded-full shadow-lg touch-target transition-colors",
            showShareMenu
              ? "bg-muted text-muted-foreground"
              : "bg-secondary text-secondary-foreground"
          )}
          size="icon"
        >
          <Share2 className="w-5 h-5" />
        </Button>

        {/* PDF download */}
        <div className="flex flex-col items-center gap-1">
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

      {/* Backdrop to close share menu */}
      {showShareMenu && (
        <div className="fixed inset-0 z-30" onClick={() => setShowShareMenu(false)} />
      )}
    </div>
  );
};

export default ResultReport;
