import { useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useActiveProfile, REL_LABELS } from "@/contexts/ActiveProfileContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Camera, FileUp, Loader2, Upload, RefreshCw, AlertTriangle, CalendarIcon, Layers, User, Sun, Crop, Type, CheckCircle2, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { OrbitProcessing } from "@/components/OrbitProcessing";
import { Ripple } from "@/components/Ripple";
import { UploadPreviewOverlay } from "@/components/UploadPreviewOverlay";
import { ReportProblemButton } from "@/components/feedback/InlineRatingPrompt";
import { inspectImage, enhanceImage, type QualityReport } from "@/lib/imageQuality";
import { waitForFirstPaint } from "@/hooks/useFirstPaintWaiter";

const FIRST_PAINT_TIMEOUT_MS = 60_000;

const UploadLab = () => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [processingStep, setProcessingStep] = useState("");
  const [testDate, setTestDate] = useState<Date | undefined>(undefined);
  const [quality, setQuality] = useState<QualityReport | null>(null);
  const [inspecting, setInspecting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { activeProfile, activeProfileId } = useActiveProfile();
  const selectedPerson = activeProfileId;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const explicitRetryId = searchParams.get("retry");

  const { data: failedResult } = useQuery({
    queryKey: ["failed-result", user?.id, explicitRetryId],
    queryFn: async () => {
      // If the user clicked "Auto-retry" from a result, target that exact row.
      if (explicitRetryId) {
        const { data } = await supabase
          .from("lab_results")
          .select("*")
          .eq("id", explicitRetryId)
          .eq("user_id", user!.id)
          .single();
        return data;
      }
      // Otherwise, surface the most recent generic failure.
      const { data } = await supabase
        .from("lab_results")
        .select("*")
        .eq("user_id", user!.id)
        .eq("status", "failed")
        .order("upload_date", { ascending: false })
        .limit(1)
        .single();
      return data;
    },
    enabled: !!user,
  });

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const f = e.target.files?.[0];
      if (!f) return;
      if (f.size > 10 * 1024 * 1024) { toast.error("File too large. Max 10MB."); return; }
      const validTypes = ["image/jpeg", "image/png", "image/webp", "image/heic", "application/pdf"];
      const isValidType = validTypes.includes(f.type) || f.name.match(/\.(jpg|jpeg|png|webp|heic|pdf)$/i);
      if (!isValidType) { toast.error("Unsupported file type. Please use JPG, PNG, or PDF."); return; }
      setFile(f);
      setQuality(null);
      if (f.type.startsWith("image/")) {
        setPreview(URL.createObjectURL(f));
        // Run quality inspection in the background
        setInspecting(true);
        try {
          const report = await inspectImage(f);
          setQuality(report);
          if (report && !report.recoverable) {
            toast.error(report.reasonEn ?? "Photo quality is too low. Please retake.");
          } else if (report && report.issues.length > 0) {
            toast.message("We'll auto-enhance this photo before reading it.");
          }
        } catch (err) {
          console.warn("Quality inspect failed", err);
        } finally {
          setInspecting(false);
        }
      } else {
        setPreview(null);
      }
    } catch (err) {
      console.error("File selection error:", err);
      toast.error("Could not read that file. Please try a different one.");
    }
  };

  // Kicks off the edge function but does NOT await it for navigation.
  // The function streams biomarkers to the DB ~10–30s in via a partial write,
  // and finishes diet/checklist/Pidgin in the background via EdgeRuntime.waitUntil.
  // We navigate as soon as the partial write lands.
  const fireInterpret = (labResultId: string, filePath: string) => {
    const p = supabase.functions.invoke("interpret-lab", {
      body: { labResultId, filePath },
    });
    // Always clean up the storage object once the function returns, regardless
    // of where the user is. Errors here are harmless (storage TTL handles it).
    p.then(({ data, error }) => {
      supabase.storage.from("lab-uploads").remove([filePath]).catch(() => {});
      if (error) console.error("interpret-lab invoke error:", error);
      else if ((data as any)?.error) console.warn("interpret-lab returned error:", data);
    }).catch((err) => {
      console.error("interpret-lab threw:", err);
      supabase.storage.from("lab-uploads").remove([filePath]).catch(() => {});
    });
    return p;
  };

  const raceForFirstPaint = async (labResultId: string, filePath: string) => {
    setProcessingStep("AI is reading your lab result...");
    fireInterpret(labResultId, filePath);

    let outcome = await waitForFirstPaint(labResultId, FIRST_PAINT_TIMEOUT_MS);

    if (outcome === "timeout") {
      // Auto-retry once — reset the row and re-invoke.
      toast.message("Connection was slow — re-running the analysis.");
      setProcessingStep("Taking longer than usual — retrying...");
      await supabase.from("lab_results").update({ status: "processing" }).eq("id", labResultId);
      fireInterpret(labResultId, filePath);
      outcome = await waitForFirstPaint(labResultId, FIRST_PAINT_TIMEOUT_MS);
    }

    return outcome;
  };

  const handleUpload = async () => {
    if (!file || !user) return;
    if (quality && !quality.recoverable) {
      toast.error(quality.reasonEn ?? "Please retake a clearer photo before uploading.");
      return;
    }
    setUploading(true);

    try {
      setProcessingStep("Enhancing your photo...");
      const uploadFile = file.type.startsWith("image/") ? await enhanceImage(file, quality) : file;

      setProcessingStep("Uploading your lab result...");
      const filePath = `${user.id}/${Date.now()}-${uploadFile.name}`;
      const { error: uploadError } = await supabase.storage.from("lab-uploads").upload(filePath, uploadFile);
      if (uploadError) throw uploadError;

      setProcessingStep("Creating your record...");
      const insertData: any = { user_id: user.id, status: "processing" };
      if (selectedPerson) insertData.dependant_id = selectedPerson;
      if (testDate) insertData.test_date = format(testDate, "yyyy-MM-dd");

      const { data: labResult, error: insertError } = await supabase
        .from("lab_results")
        .insert(insertData)
        .select()
        .single();
      if (insertError) throw insertError;

      const outcome = await raceForFirstPaint(labResult.id, filePath);

      queryClient.invalidateQueries({ queryKey: ["failed-result"] });

      if (outcome === "ready") {
        navigate(`/result/${labResult.id}`);
      } else if (outcome === "failed") {
        toast.error("We couldn't read this lab result. Please try a clearer photo or PDF.");
      } else {
        // Still nothing after two tries — drop the user on the report page anyway,
        // where the empty-biomarkers banner + regenerate flow takes over.
        toast.message("Still working in the background — opening your report.");
        navigate(`/result/${labResult.id}`);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Something went wrong. Please try again.");
    } finally {
      setUploading(false);
      setProcessingStep("");
    }
  };

  const handleRetry = async () => {
    if (!failedResult || !file || !user) return;
    if (quality && !quality.recoverable) {
      toast.error(quality.reasonEn ?? "Please retake a clearer photo before retrying.");
      return;
    }
    setRetrying(true);

    try {
      setProcessingStep("Enhancing your photo...");
      const uploadFile = file.type.startsWith("image/") ? await enhanceImage(file, quality) : file;

      setProcessingStep("Re-uploading your lab result...");
      const filePath = `${user.id}/${Date.now()}-${uploadFile.name}`;
      const { error: uploadError } = await supabase.storage.from("lab-uploads").upload(filePath, uploadFile);
      if (uploadError) throw uploadError;

      await supabase.from("lab_results").update({ status: "processing" }).eq("id", failedResult.id);

      const outcome = await raceForFirstPaint(failedResult.id, filePath);

      queryClient.invalidateQueries({ queryKey: ["failed-result"] });
      queryClient.invalidateQueries({ queryKey: ["last-result"] });

      if (outcome === "ready") {
        navigate(`/result/${failedResult.id}`);
      } else if (outcome === "failed") {
        toast.error("We couldn't read this lab result. Please try a clearer photo or PDF.");
      } else {
        toast.message("Still working in the background — opening your report.");
        navigate(`/result/${failedResult.id}`);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Retry failed. Please try again.");
    } finally {
      setRetrying(false);
      setProcessingStep("");
    }
  };

  const handleAiError = (interpretData: any) => {
    if (interpretData.error === "AI_CREDITS_EXHAUSTED") {
      toast.error("AI service is temporarily unavailable. Please try again later.");
    } else if (interpretData.error === "RATE_LIMITED") {
      toast.error("Too many requests. Please wait a moment and try again.");
    } else if (interpretData.error === "MODEL_UNAVAILABLE") {
      toast.error(interpretData.message || "We couldn't read the lab result. Please try a clearer photo or PDF.");
    } else if (interpretData.error === "NOT_A_LAB_REPORT") {
      toast.error(interpretData.message || "This doesn't look like a lab report. Please upload a clear photo of your lab result.");
    } else {
      toast.error(interpretData.message || "Something went wrong with the analysis.");
    }
    queryClient.invalidateQueries({ queryKey: ["failed-result"] });
  };

  const isProcessing = uploading || retrying;

  const steps = [
    { key: "upload", label: "Uploading" },
    { key: "read", label: "Reading" },
    { key: "finalize", label: "Finalizing" },
  ];
  const activeStepIndex = (() => {
    const s = processingStep.toLowerCase();
    if (s.includes("almost") || s.includes("final")) return 2;
    if (s.includes("ai") || s.includes("read")) return 1;
    return 0;
  })();

  return (
    <div className="px-5 pt-6 pb-4 max-w-lg mx-auto">
      <div className="mb-6">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          Lab upload
        </span>
        <h1 className="font-display text-2xl font-extrabold tracking-tight">Upload a lab result</h1>
        <p className="text-muted-foreground text-body-sm mt-1">
          Snap or upload an image / PDF — we'll read it and build a personalized plan.
        </p>
      </div>

      {isProcessing ? (
        <OrbitProcessing step={activeStepIndex} label={processingStep} />
      ) : (
        <>
          {/* Active profile chip — driven by switcher at top */}
          <div className="mb-5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">For whom?</label>
            <div className={cn(
              "flex items-center gap-3 rounded-2xl border p-3",
              activeProfile.isSelf ? "border-secondary/30 bg-secondary/5" : "border-primary/30 bg-primary/5"
            )}>
              <div className={cn(
                "w-10 h-10 rounded-full text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0",
                activeProfile.isSelf ? "bg-gradient-navy" : "bg-gradient-brand"
              )}>
                <User className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">
                  {activeProfile.isSelf ? "Yourself" : activeProfile.name}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {REL_LABELS[activeProfile.relationship] || activeProfile.relationship}
                  {activeProfile.age ? ` · ${activeProfile.age}y` : ""}
                  {" · use the profile pill at the top to switch"}
                </p>
              </div>
            </div>
          </div>

          {/* Test date */}
          <div className="mb-5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">Test date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full h-13 rounded-2xl justify-start text-left font-medium border-border bg-card shadow-soft",
                    !testDate && "text-muted-foreground"
                  )}
                >
                  <span className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center mr-2.5">
                    <CalendarIcon className="h-4 w-4 text-secondary" />
                  </span>
                  {testDate ? format(testDate, "PPP") : "Today (default)"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={testDate}
                  onSelect={setTestDate}
                  disabled={(date) => date > new Date()}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Failed retry banner */}
          {failedResult && file && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-2xl p-4 mb-5 flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-destructive/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">Previous analysis failed</p>
                <p className="text-muted-foreground text-xs mt-1">
                  Tap below to retry with the same file.
                </p>
                <Button
                  onClick={handleRetry}
                  variant="outline"
                  size="sm"
                  className="mt-3 border-destructive/40 text-destructive hover:bg-destructive/10 rounded-xl"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry Analysis
                </Button>
                <div className="mt-2">
                  <ReportProblemButton resultId={failedResult.id} />
                </div>
              </div>
            </div>
          )}

          {!file ? (
            <div className="space-y-3">
              {failedResult && (
                <div className="bg-destructive/10 border border-destructive/30 rounded-2xl p-4 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-sm">
                      {explicitRetryId ? "Retrying lab analysis" : "Previous analysis failed"}
                    </p>
                    <p className="text-muted-foreground text-xs mt-1">
                      {explicitRetryId
                        ? "Pick a clearer photo or PDF — we'll re-run the AI on your existing report."
                        : "Re-upload the same lab result to retry."}
                    </p>
                  </div>
                </div>
              )}

              {/* Before-you-upload checklist */}
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                <p className="text-[11px] uppercase tracking-wider font-bold text-primary mb-2.5">
                  Before you upload
                </p>
                <ul className="space-y-2">
                  {[
                    { Icon: Sun, text: "Bright, even light — no shadows or glare" },
                    { Icon: Crop, text: "Whole page in frame — every edge visible" },
                    { Icon: Type, text: "Numbers and units (mg/dL, %) sharp & readable" },
                    { Icon: CheckCircle2, text: "Hold steady — let the camera focus first" },
                  ].map(({ Icon, text }, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-foreground/90">
                      <Icon className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
                      <span>{text}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-[11px] text-muted-foreground mt-2.5 italic flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3" />
                  We'll auto-enhance brightness and sharpness on upload.
                </p>
              </div>

              <Ripple
                onClick={() => cameraInputRef.current?.click()}
                rippleColor="hsl(0 0% 100% / 0.45)"
                className="group relative w-full overflow-hidden bg-gradient-hero rounded-3xl p-6 flex items-center gap-4 touch-target shadow-elevated transition-transform hover:scale-[1.01] animate-breathe"
              >
                <div className="absolute inset-0 grid-bg opacity-50 pointer-events-none" />
                <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/10 blur-2xl pointer-events-none" />
                <div className="relative w-14 h-14 rounded-2xl bg-white/15 backdrop-blur ring-1 ring-white/20 flex items-center justify-center shrink-0">
                  <Camera className="w-7 h-7 text-primary-foreground" />
                </div>
                <div className="relative text-left flex-1">
                  <p className="font-bold text-primary-foreground text-lg">Take a Photo</p>
                  <p className="text-primary-foreground/80 text-body-sm">Snap with your camera</p>
                </div>
              </Ripple>
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                capture="user"
                onChange={handleFile}
                className="hidden"
              />

              <Ripple
                onClick={() => fileInputRef.current?.click()}
                rippleColor="hsl(217 60% 27% / 0.18)"
                className="group w-full bg-card border-2 border-dashed border-secondary/30 rounded-3xl p-6 flex items-center gap-4 touch-target transition-all hover:border-secondary/60 hover:bg-secondary/5"
              >
                <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center shrink-0">
                  <FileUp className="w-7 h-7 text-secondary" />
                </div>
                <div className="text-left flex-1">
                  <p className="font-bold text-body">Upload a File</p>
                  <p className="text-muted-foreground text-body-sm">JPG, PNG or PDF · max 10MB</p>
                </div>
              </Ripple>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic,application/pdf,.pdf"
                onChange={handleFile}
                className="hidden"
              />

              <button
                onClick={() => navigate("/app/bulk-upload")}
                className="w-full bg-card border border-border rounded-2xl p-4 flex items-center gap-3 touch-target shadow-soft transition-all hover:shadow-card"
              >
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <Layers className="w-5 h-5 text-secondary-foreground" />
                </div>
                <div className="text-left flex-1">
                  <p className="font-semibold text-body-sm">Add Past Results</p>
                  <p className="text-muted-foreground text-xs">Upload multiple results at once</p>
                </div>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {(preview || file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) && (
                <UploadPreviewOverlay file={file} previewUrl={preview} />
              )}
              {!preview && !(file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) && (
                <div className="w-full rounded-2xl border border-border p-6 bg-card text-center shadow-soft">
                  <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center mx-auto mb-3">
                    <FileUp className="w-6 h-6 text-secondary" />
                  </div>
                  <p className="font-semibold">{file.name}</p>
                  <p className="text-body-sm text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(1)} MB
                  </p>
                </div>
              )}

              {/* Quality inspection result */}
              {inspecting && (
                <div className="rounded-2xl border border-border bg-card p-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Checking photo quality…
                </div>
              )}
              {quality && !inspecting && (
                <div
                  className={cn(
                    "rounded-2xl border p-3.5 text-xs",
                    !quality.recoverable
                      ? "border-destructive/40 bg-destructive/5 text-destructive"
                      : quality.issues.length > 0
                      ? "border-[hsl(var(--alert-amber))]/40 bg-[hsl(var(--alert-amber))]/5"
                      : "border-primary/30 bg-primary/5",
                  )}
                >
                  <p className="font-bold flex items-center gap-1.5">
                    {!quality.recoverable ? (
                      <AlertTriangle className="w-4 h-4" />
                    ) : quality.issues.length > 0 ? (
                      <Sparkles className="w-4 h-4 text-[hsl(var(--alert-amber))]" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                    )}
                    {!quality.recoverable
                      ? "Photo too low quality"
                      : quality.issues.length > 0
                      ? "We'll auto-enhance this photo"
                      : "Photo looks good"}
                  </p>
                  {quality.reasonEn && (
                    <p className="mt-1 text-foreground/80">{quality.reasonEn}</p>
                  )}
                  {!quality.recoverable && (
                    <button
                      onClick={() => { setFile(null); setPreview(null); setQuality(null); }}
                      className="mt-2 font-semibold underline underline-offset-2"
                    >
                      Retake / pick another file
                    </button>
                  )}
                </div>
              )}

              <Button
                onClick={handleUpload}
                disabled={inspecting || (!!quality && !quality.recoverable)}
                className="w-full h-14 text-base font-bold rounded-2xl bg-gradient-brand text-primary-foreground hover:opacity-95 shadow-glow-primary touch-target border-0 disabled:opacity-50"
              >
                <Upload className="w-5 h-5 mr-2" />
                Analyze Lab Result
              </Button>

              <button
                onClick={() => { setFile(null); setPreview(null); setQuality(null); }}
                className="w-full text-center text-muted-foreground touch-target text-sm font-medium hover:text-foreground transition-colors"
              >
                Choose a different file
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default UploadLab;
