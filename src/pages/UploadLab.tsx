import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useDependants } from "@/hooks/useDependants";
import { Camera, FileUp, Loader2, Upload, RefreshCw, AlertTriangle, CalendarIcon, Layers } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const UploadLab = () => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [processingStep, setProcessingStep] = useState("");
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null); // null = myself
  const [testDate, setTestDate] = useState<Date | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { dependants } = useDependants();

  const { data: failedResult } = useQuery({
    queryKey: ["failed-result", user?.id],
    queryFn: async () => {
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

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const f = e.target.files?.[0];
      if (!f) return;
      if (f.size > 10 * 1024 * 1024) { toast.error("File too large. Max 10MB."); return; }
      const validTypes = ["image/jpeg", "image/png", "image/webp", "image/heic", "application/pdf"];
      const isValidType = validTypes.includes(f.type) || f.name.match(/\.(jpg|jpeg|png|webp|heic|pdf)$/i);
      if (!isValidType) { toast.error("Unsupported file type. Please use JPG, PNG, or PDF."); return; }
      setFile(f);
      if (f.type.startsWith("image/")) { setPreview(URL.createObjectURL(f)); } else { setPreview(null); }
    } catch (err) {
      console.error("File selection error:", err);
      toast.error("Could not read that file. Please try a different one.");
    }
  };

  const handleUpload = async () => {
    if (!file || !user) return;
    setUploading(true);

    try {
      setProcessingStep("Uploading your lab result...");
      const filePath = `${user.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from("lab-uploads").upload(filePath, file);
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

      setProcessingStep("AI is reading your lab result...");
      const { data: interpretData, error: fnError } = await supabase.functions.invoke(
        "interpret-lab",
        { body: { labResultId: labResult.id, filePath } }
      );

      if (fnError) throw fnError;
      if (interpretData?.error) {
        await supabase.storage.from("lab-uploads").remove([filePath]);
        handleAiError(interpretData);
        return;
      }

      await supabase.storage.from("lab-uploads").remove([filePath]);
      setProcessingStep("Almost done...");
      queryClient.invalidateQueries({ queryKey: ["failed-result"] });
      navigate(`/result/${labResult.id}`);
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
    setRetrying(true);

    try {
      setProcessingStep("Re-uploading your lab result...");
      const filePath = `${user.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from("lab-uploads").upload(filePath, file);
      if (uploadError) throw uploadError;

      setProcessingStep("AI is re-reading your lab result...");
      await supabase.from("lab_results").update({ status: "processing" }).eq("id", failedResult.id);

      const { data: interpretData, error: fnError } = await supabase.functions.invoke(
        "interpret-lab",
        { body: { labResultId: failedResult.id, filePath } }
      );

      if (fnError) throw fnError;
      if (interpretData?.error) {
        await supabase.storage.from("lab-uploads").remove([filePath]);
        handleAiError(interpretData);
        return;
      }

      await supabase.storage.from("lab-uploads").remove([filePath]);
      setProcessingStep("Almost done...");
      queryClient.invalidateQueries({ queryKey: ["failed-result"] });
      queryClient.invalidateQueries({ queryKey: ["last-result"] });
      navigate(`/result/${failedResult.id}`);
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
      toast.error("The AI model is busy right now. Please retry in a few minutes.");
    } else {
      toast.error(interpretData.message || "Something went wrong with the analysis.");
    }
    queryClient.invalidateQueries({ queryKey: ["failed-result"] });
  };

  const isProcessing = uploading || retrying;
  const hasDependants = dependants.length > 0;

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
        <div className="bg-card border border-border rounded-3xl p-8 shadow-card">
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-6">
              <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl" />
              <div className="relative w-16 h-16 rounded-2xl bg-gradient-brand flex items-center justify-center shadow-glow-primary">
                <Loader2 className="w-7 h-7 text-primary-foreground animate-spin" />
              </div>
            </div>
            <p className="font-display text-lg font-bold">{processingStep || "Working..."}</p>
            <p className="text-muted-foreground text-body-sm mt-1.5">Hang tight — don't close this page.</p>

            <div className="mt-7 w-full">
              <div className="flex items-center justify-between gap-2">
                {steps.map((s, i) => {
                  const done = i < activeStepIndex;
                  const active = i === activeStepIndex;
                  return (
                    <div key={s.key} className="flex-1 flex flex-col items-center">
                      <div className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold border-2 transition-all",
                        done && "bg-primary border-primary text-primary-foreground",
                        active && "bg-primary/15 border-primary text-primary animate-pulse",
                        !done && !active && "border-border text-muted-foreground"
                      )}>
                        {done ? "✓" : i + 1}
                      </div>
                      <span className={cn(
                        "text-[11px] mt-1.5 font-medium",
                        active ? "text-foreground" : "text-muted-foreground"
                      )}>{s.label}</span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-brand transition-all duration-500"
                  style={{ width: `${((activeStepIndex + 1) / steps.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Person selector — segmented control */}
          {hasDependants && (
            <div className="mb-5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">For whom?</label>
              <div className="flex flex-wrap gap-2 p-1 bg-muted rounded-2xl">
                <button
                  onClick={() => setSelectedPerson(null)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-sm font-semibold transition-all",
                    selectedPerson === null ? "bg-card text-foreground shadow-soft" : "text-muted-foreground"
                  )}
                >
                  Myself
                </button>
                {dependants.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setSelectedPerson(d.id)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-sm font-semibold transition-all",
                      selectedPerson === d.id ? "bg-card text-foreground shadow-soft" : "text-muted-foreground"
                    )}
                  >
                    {d.full_name.split(" ")[0]}
                  </button>
                ))}
              </div>
            </div>
          )}

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
              </div>
            </div>
          )}

          {!file ? (
            <div className="space-y-3">
              {failedResult && (
                <div className="bg-destructive/10 border border-destructive/30 rounded-2xl p-4 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-sm">Previous analysis failed</p>
                    <p className="text-muted-foreground text-xs mt-1">
                      Re-upload the same lab result to retry.
                    </p>
                  </div>
                </div>
              )}

              <button
                onClick={() => cameraInputRef.current?.click()}
                className="group relative w-full overflow-hidden bg-gradient-hero rounded-3xl p-6 flex items-center gap-4 touch-target shadow-elevated transition-transform hover:scale-[1.01]"
              >
                <div className="absolute inset-0 grid-bg opacity-50 pointer-events-none" />
                <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/10 blur-2xl pointer-events-none" />
                <div className="relative w-14 h-14 rounded-2xl bg-white/15 backdrop-blur ring-1 ring-white/20 flex items-center justify-center">
                  <Camera className="w-7 h-7 text-primary-foreground" />
                </div>
                <div className="relative text-left flex-1">
                  <p className="font-bold text-primary-foreground text-lg">Take a Photo</p>
                  <p className="text-primary-foreground/80 text-body-sm">Snap with your camera</p>
                </div>
              </button>
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                capture="user"
                onChange={handleFile}
                className="hidden"
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                className="group w-full bg-card border-2 border-dashed border-secondary/30 rounded-3xl p-6 flex items-center gap-4 touch-target transition-all hover:border-secondary/60 hover:bg-secondary/5"
              >
                <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center">
                  <FileUp className="w-7 h-7 text-secondary" />
                </div>
                <div className="text-left flex-1">
                  <p className="font-bold text-body">Upload a File</p>
                  <p className="text-muted-foreground text-body-sm">JPG, PNG or PDF · max 10MB</p>
                </div>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic,application/pdf,.pdf"
                onChange={handleFile}
                className="hidden"
              />

              <button
                onClick={() => navigate("/bulk-upload")}
                className="w-full bg-card border border-border rounded-2xl p-4 flex items-center gap-3 touch-target shadow-soft transition-all hover:shadow-card"
              >
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <Layers className="w-5 h-5 text-accent" />
                </div>
                <div className="text-left flex-1">
                  <p className="font-semibold text-body-sm">Add Past Results</p>
                  <p className="text-muted-foreground text-xs">Upload multiple results at once</p>
                </div>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {preview && (
                <div className="rounded-2xl overflow-hidden border border-border shadow-soft bg-card">
                  <img
                    src={preview}
                    alt="Lab result preview"
                    className="w-full max-h-72 object-contain"
                  />
                </div>
              )}
              {!preview && (
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

              <Button
                onClick={handleUpload}
                className="w-full h-14 text-base font-bold rounded-2xl bg-gradient-brand text-primary-foreground hover:opacity-95 shadow-glow-primary touch-target border-0"
              >
                <Upload className="w-5 h-5 mr-2" />
                Analyze Lab Result
              </Button>

              <button
                onClick={() => { setFile(null); setPreview(null); }}
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
