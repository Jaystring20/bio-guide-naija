import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useDependants } from "@/hooks/useDependants";
import { useRegenerateDiet } from "@/hooks/useRegenerateDiet";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { EmergencyAlert } from "@/components/EmergencyAlert";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Loader2, Download, Mail, Share2, MoreHorizontal, ShieldCheck, RefreshCw, AlertTriangle } from "lucide-react";
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
import { EmptyBiomarkersBanner } from "@/components/report/EmptyBiomarkersBanner";
import { DietPlanSkeleton } from "@/components/report/DietPlanSkeleton";

const TABS = ["summary", "results", "diet", "checklist"] as const;
type Tab = typeof TABS[number];

const TAB_LABELS: Record<Language, Record<Tab, string>> = {
  en: { summary: "Summary", results: "Biomarkers", diet: "Diet Plan", checklist: "Doctor Q's" },
  pidgin: { summary: "Summary", results: "Results", diet: "Chop Plan", checklist: "Doctor Q's" },
};

const isTab = (v: string | null): v is Tab =>
  !!v && (TABS as readonly string[]).includes(v);

const ResultReport = () => {
  const { id } = useParams<{ id: string }>();
  const { user, profile } = useAuth();
  const { isAdmin } = useUserRole();
  const { dependants } = useDependants();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showEmergency, setShowEmergency] = useState(false);

  // Active tab is persisted in the URL (?tab=...) so it survives refresh,
  // back/forward, deep-links, and reconnections without any extra storage.
  const tabParam = searchParams.get("tab");
  const activeTab: Tab = isTab(tabParam) ? tabParam : "summary";
  const setActiveTab = useCallback(
    (next: Tab) => {
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          if (next === "summary") params.delete("tab");
          else params.set("tab", next);
          return params;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const [language, setLanguage] = useState<Language>("en");

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
      const data: any = query.state.data;
      if (!data) return 3000;
      // Keep polling while OCR is running.
      if (data.status === "processing") return 3000;
      // Once OCR is done, keep polling while EITHER diet OR checklist is still in flight.
      // diet_status / checklist_status are each one of: 'pending' | 'done' | 'failed'.
      if (data.diet_status === "pending" || data.checklist_status === "pending") return 4000;
      return false;
    },
  });

  const { regenerate: regenerateDiet, loading: regenerating } = useRegenerateDiet(id, () => refetch());

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

  // ----- Diet/checklist generation lifecycle -----
  // diet_status is the source of truth (added in 2026-04 migration). For legacy
  // rows that predate the column, infer: if status is terminal AND the report is
  // older than 5 minutes, treat null diet as 'failed' (worth offering regenerate)
  // rather than spinning forever.
  const rawDietStatus = (result as any).diet_status as "pending" | "done" | "failed" | undefined;
  const ageMs = Date.now() - new Date(result.upload_date).getTime();
  const inferredDietStatus: "pending" | "done" | "failed" =
    rawDietStatus
      ? rawDietStatus
      : dietaryPlan
        ? "done"
        : (result.status === "completed" || result.status === "critical") && ageMs > 5 * 60 * 1000
          ? "failed"
          : "pending";
  const dietPending = inferredDietStatus === "pending";
  const dietFailed = inferredDietStatus === "failed";

  // Mirror the same lifecycle for the doctor's checklist (now generated by an
  // independent Gemini call). Same legacy-row inference rules.
  const rawChecklistStatus = (result as any).checklist_status as "pending" | "done" | "failed" | undefined;
  const inferredChecklistStatus: "pending" | "done" | "failed" =
    rawChecklistStatus
      ? rawChecklistStatus
      : checklist.length > 0
        ? "done"
        : (result.status === "completed" || result.status === "critical") && ageMs > 5 * 60 * 1000
          ? "failed"
          : "pending";

  if (showEmergency && criticalAlerts.length > 0) {
    return (
      <EmergencyAlert alerts={criticalAlerts} onAcknowledge={() => setShowEmergency(false)} />
    );
  }

  const hasPidgin = !!biomarkersPidgin || !!aiSummaryPidgin;

  // Resolve the patient/dependant name for the PDF cover.
  const patientName = (() => {
    if (result.dependant_id) {
      const dep = dependants.find((d) => d.id === result.dependant_id);
      if (dep?.full_name) return dep.full_name;
    }
    if (isAdminViewing) return ownerInfo?.full_name || ownerInfo?.email || null;
    return profile?.full_name || null;
  })();

  const pdfData = {
    language,
    uploadDate: result.upload_date,
    patientName,
    testDate: (result as any).test_date as string | null,
    hasCriticalAlert: result.has_critical_alert,
    criticalAlerts,
    aiSummary,
    aiSummaryPidgin,
    biomarkers,
    biomarkersPidgin,
    dietaryPlan,
    dietaryPlanPidgin,
    checklist,
    checklistPidgin,
    nutritionCitations: ((result as any).nutrition_citations as any[] | null) ?? null,
    nafdacCitations: ((result as any).nafdac_citations as Record<string, any> | null) ?? null,
    fdaSafety: ((result as any).fda_safety as Record<string, any> | null) ?? null,
    reportUrl: typeof window !== "undefined" ? `${window.location.origin}/app/result/${id}` : null,
  };

  const handleDownloadPDF = () => {
    generatePDF(pdfData);
  };

  const handleShare = async (method: "whatsapp" | "email" | "native") => {
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

      {biomarkersEmpty && result.status !== "processing" && (
        <EmptyBiomarkersBanner
          variant="compact"
          status={result.status}
          processingSteps={processingSteps}
          resultId={id ?? null}
          language={language}
        />
      )}

      {/* Tabs */}
      <div className="grid grid-cols-2 gap-2 mb-6">
        {TABS.map((tab) => {
          const tabPending =
            (tab === "diet" && dietPending && !dietaryPlan) ||
            (tab === "checklist" && inferredChecklistStatus === "pending" && checklist.length === 0);
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-3 py-3 rounded-xl font-semibold text-body-sm text-center touch-target transition-colors relative",
                activeTab === tab
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border text-foreground"
              )}
              aria-label={tabPending ? `${TAB_LABELS[language][tab]} (still loading)` : TAB_LABELS[language][tab]}
            >
              <span className="inline-flex items-center gap-1.5">
                {TAB_LABELS[language][tab]}
                {tabPending && (
                  <span className="relative flex h-2 w-2" aria-hidden="true">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
                  </span>
                )}
              </span>
            </button>
          );
        })}
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
            <BiomarkersTab
              biomarkers={biomarkers}
              biomarkersPidgin={biomarkersPidgin}
              language={language}
              status={result.status}
              processingSteps={processingSteps}
              resultId={id ?? null}
            />
          )}
          {activeTab === "diet" && criticalAlerts.some((a: any) => a?.severity === "emergency") && (
            <div className="rounded-2xl border-2 border-destructive bg-destructive/10 p-6 shadow-soft">
              <div className="flex items-start gap-3 mb-3">
                <AlertTriangle className="w-6 h-6 text-destructive shrink-0 mt-0.5 animate-heartbeat" />
                <div>
                  <p className="font-display font-bold text-lg text-destructive">
                    {language === "pidgin" ? "Diet advice no dey available" : "Diet advice is paused"}
                  </p>
                  <p className="text-body-sm mt-2 leading-relaxed">
                    {language === "pidgin"
                      ? "Your results show emergency values. Diet plan no fit replace doctor wahala. Abeg call your doctor first — once dem clear you, your diet plan go come back."
                      : "Your results contain emergency-level values. A diet plan is not a substitute for medical care right now. Please contact a doctor first — your personalised diet plan will be available again once a clinician has reviewed your results."}
                  </p>
                </div>
              </div>
              <a href="tel:112" className="block">
                <Button className="w-full h-12 bg-destructive text-destructive-foreground touch-target">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  {language === "pidgin" ? "Call Doctor Now" : "Call Doctor Now"}
                </Button>
              </a>
            </div>
          )}
          {activeTab === "diet" && !criticalAlerts.some((a: any) => a?.severity === "emergency") && dietaryPlan && (
            <DietPlanTab
              dietaryPlan={dietaryPlan}
              dietaryPlanPidgin={dietaryPlanPidgin}
              language={language}
              nutritionCitations={(result as any).nutrition_citations as Record<string, any> | null}
              nutritionStatus={(result as any).nutrition_status as "pending" | "done" | "failed" | null}
              nafdacCitations={(result as any).nafdac_citations as Record<string, any> | null}
              nafdacStatus={(result as any).nafdac_status as "pending" | "done" | "failed" | null}
              fdaSafety={(result as any).fda_safety as Record<string, any> | null}
              fdaSafetyStatus={(result as any).fda_safety_status as "pending" | "done" | "failed" | null}
            />
          )}
          {activeTab === "diet" && !criticalAlerts.some((a: any) => a?.severity === "emergency") && !dietaryPlan && dietPending && !regenerating && (
            <DietPlanSkeleton language={language} />
          )}
          {activeTab === "diet" && !criticalAlerts.some((a: any) => a?.severity === "emergency") && !dietaryPlan && (dietFailed || regenerating) && (
            <div className="rounded-2xl border border-amber-300/50 bg-amber-50 dark:bg-amber-950/20 p-6 shadow-soft">
              <div className="flex items-start gap-3 mb-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-body">Diet plan didn't finish</p>
                  <p className="text-muted-foreground text-body-sm mt-1">
                    The AI couldn't write a full diet plan for this report. Tap below to try again — your biomarkers are saved.
                  </p>
                </div>
              </div>
              <Button
                onClick={regenerateDiet}
                disabled={regenerating}
                className="w-full bg-primary text-primary-foreground touch-target"
              >
                {regenerating ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Regenerating…</>
                ) : (
                  <><RefreshCw className="w-4 h-4 mr-2" /> Regenerate diet & doctor questions</>
                )}
              </Button>
            </div>
          )}
          {activeTab === "checklist" && (
            <ChecklistTab
              checklist={checklist}
              checklistPidgin={checklistPidgin}
              language={language}
              status={inferredChecklistStatus}
              onRegenerate={regenerateDiet}
              regenerating={regenerating}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Spacer so the fixed bottom action bar doesn't cover content */}
      <div className="h-28" aria-hidden="true" />

      {/* Sticky bottom action bar — WhatsApp share is the obvious one-tap action */}
      <div className="fixed left-0 right-0 bottom-20 z-40 px-3 pointer-events-none">
        <div className="max-w-lg mx-auto pointer-events-auto">
          <div className="rounded-2xl bg-card/95 backdrop-blur border border-border shadow-lg p-2 flex items-center gap-2">
            <Button
              onClick={() => handleShare("whatsapp")}
              className="flex-1 h-12 rounded-xl bg-[hsl(142,70%,45%)] text-white hover:bg-[hsl(142,70%,40%)] font-semibold touch-target"
            >
              {/* WhatsApp glyph */}
              <svg viewBox="0 0 24 24" className="w-5 h-5 mr-2 fill-current" aria-hidden="true">
                <path d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.59-5.945C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 0 1 8.413 3.488 11.82 11.82 0 0 1 3.48 8.414c-.003 6.555-5.338 11.892-11.893 11.892a11.9 11.9 0 0 1-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 0 0 1.51 5.26l-.999 3.648 3.978-1.607zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z" />
              </svg>
              {language === "pidgin" ? "Send to WhatsApp" : "Send to WhatsApp"}
            </Button>

            <Button
              onClick={handleDownloadPDF}
              variant="outline"
              className="h-12 px-4 rounded-xl touch-target"
              title={language === "pidgin" ? "Download PDF" : "Download PDF"}
            >
              <Download className="w-4 h-4 mr-1.5" />
              <span className="text-sm font-semibold">PDF</span>
            </Button>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 rounded-xl touch-target"
                  aria-label={language === "pidgin" ? "More share options" : "More share options"}
                >
                  <MoreHorizontal className="w-5 h-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" side="top" className="w-56 p-2">
                <button
                  onClick={() => handleShare("email")}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted text-left text-sm"
                >
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  {language === "pidgin" ? "Send by Email" : "Send by Email"}
                </button>
                {typeof navigator !== "undefined" && (navigator as any).share && (
                  <button
                    onClick={() => handleShare("native")}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted text-left text-sm"
                  >
                    <Share2 className="w-4 h-4 text-muted-foreground" />
                    {language === "pidgin" ? "Other apps" : "Other apps"}
                  </button>
                )}
                <button
                  onClick={handleDownloadPDF}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted text-left text-sm"
                >
                  <Download className="w-4 h-4 text-muted-foreground" />
                  {language === "pidgin" ? "Download PDF" : "Download PDF"}
                </button>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultReport;
