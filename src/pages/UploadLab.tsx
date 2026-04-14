import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useDependants } from "@/hooks/useDependants";
import { Camera, FileUp, Loader2, Upload, RefreshCw, AlertTriangle, CalendarIcon } from "lucide-react";
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

  return (
    <div className="px-5 pt-8 pb-4 max-w-lg mx-auto">
      <h1 className="font-display text-2xl font-bold mb-2">Upload Lab Result</h1>
      <p className="text-muted-foreground text-body-sm mb-6">
        Take a photo or upload an image/PDF of your lab result. We'll read it and create your personalized diet plan.
      </p>

      {isProcessing ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-12 h-12 text-accent animate-spin mb-6" />
          <p className="font-display text-lg font-semibold text-center">{processingStep}</p>
          <p className="text-muted-foreground text-body-sm mt-2 text-center">
            This may take a moment. Don't close this page.
          </p>
        </div>
      ) : (
        <>
          {/* Person selector */}
          {hasDependants && (
            <div className="mb-5">
              <label className="text-body-sm font-medium mb-2 block">Who is this result for?</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedPerson(null)}
                  className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                    selectedPerson === null ? "border-accent bg-accent/10 text-accent" : "border-border bg-card"
                  }`}
                >
                  Myself
                </button>
                {dependants.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setSelectedPerson(d.id)}
                    className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                      selectedPerson === d.id ? "border-accent bg-accent/10 text-accent" : "border-border bg-card"
                    }`}
                  >
                    {d.full_name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Test date picker */}
          <div className="mb-5">
            <label className="text-body-sm font-medium mb-2 block">When was this test done?</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full h-12 rounded-xl justify-start text-left font-normal",
                    !testDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
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

          {/* Failed result retry banner */}
          {failedResult && file && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 mb-5 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-sm">Previous analysis failed</p>
                <p className="text-muted-foreground text-xs mt-1">
                  Your last upload couldn't be processed. Tap below to retry with the same file.
                </p>
                <Button
                  onClick={handleRetry}
                  variant="outline"
                  size="sm"
                  className="mt-3 border-destructive/40 text-destructive hover:bg-destructive/10"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry Analysis
                </Button>
              </div>
            </div>
          )}

          {!file ? (
            <div className="space-y-4">
              {failedResult && (
                <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-sm">Previous analysis failed</p>
                    <p className="text-muted-foreground text-xs mt-1">
                      Upload the same lab result again and tap "Retry Analysis" to re-process it.
                    </p>
                  </div>
                </div>
              )}

              <button
                onClick={() => cameraInputRef.current?.click()}
                className="w-full bg-primary text-primary-foreground rounded-2xl p-6 flex items-center gap-4 touch-target"
              >
                <Camera className="w-8 h-8" />
                <div className="text-left">
                  <p className="font-bold text-body">Take a Photo</p>
                  <p className="text-primary-foreground/70 text-body-sm">Use your camera to snap the result</p>
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
                className="w-full bg-card border-2 border-dashed border-border rounded-2xl p-6 flex items-center gap-4 touch-target"
              >
                <FileUp className="w-8 h-8 text-secondary" />
                <div className="text-left">
                  <p className="font-bold text-body">Upload File</p>
                  <p className="text-muted-foreground text-body-sm">JPG, PNG, or PDF (max 10MB)</p>
                </div>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic,application/pdf,.pdf"
                onChange={handleFile}
                className="hidden"
              />
            </div>
          ) : (
            <div className="space-y-4">
              {preview && (
                <img
                  src={preview}
                  alt="Lab result preview"
                  className="w-full rounded-xl border border-border max-h-64 object-contain bg-card"
                />
              )}
              {!preview && (
                <div className="w-full rounded-xl border border-border p-6 bg-card text-center">
                  <FileUp className="w-10 h-10 text-secondary mx-auto mb-2" />
                  <p className="font-semibold">{file.name}</p>
                  <p className="text-body-sm text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(1)} MB
                  </p>
                </div>
              )}

              <Button
                onClick={handleUpload}
                className="w-full h-14 text-lg font-bold rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 touch-target"
              >
                <Upload className="w-5 h-5 mr-2" />
                Analyze Lab Result
              </Button>

              <button
                onClick={() => { setFile(null); setPreview(null); }}
                className="w-full text-center text-muted-foreground touch-target"
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
