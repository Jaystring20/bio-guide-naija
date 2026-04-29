import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useDependants } from "@/hooks/useDependants";
import { FileUp, Loader2, Plus, CalendarIcon, Check, X, AlertTriangle, ArrowLeft, Layers } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type QueueItem = {
  id: string;
  file: File;
  preview: string | null;
  personId: string | null; // null = myself
  testDate: Date | undefined;
  status: "queued" | "uploading" | "done" | "failed";
  resultId?: string;
};

const BulkUpload = () => {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [processing, setProcessing] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { dependants } = useDependants();

  const addFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/heic", "application/pdf"];
    const newItems: QueueItem[] = [];

    for (const f of files) {
      if (f.size > 10 * 1024 * 1024) {
        toast.error(`${f.name} is too large (max 10MB), skipped.`);
        continue;
      }
      const isValid = validTypes.includes(f.type) || f.name.match(/\.(jpg|jpeg|png|webp|heic|pdf)$/i);
      if (!isValid) {
        toast.error(`${f.name} is not supported, skipped.`);
        continue;
      }
      newItems.push({
        id: crypto.randomUUID(),
        file: f,
        preview: f.type.startsWith("image/") ? URL.createObjectURL(f) : null,
        personId: null,
        testDate: undefined,
        status: "queued",
      });
    }

    if (newItems.length > 0) {
      setQueue((prev) => [...prev, ...newItems]);
      toast.success(`${newItems.length} file${newItems.length > 1 ? "s" : ""} added`);
    }
    if (e.target) e.target.value = "";
  };

  const updateItem = (id: string, updates: Partial<QueueItem>) => {
    setQueue((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  };

  const removeItem = (id: string) => {
    setQueue((prev) => prev.filter((item) => item.id !== id));
  };

  const getPersonName = (personId: string | null) => {
    if (!personId) return "Myself";
    return dependants.find((d) => d.id === personId)?.full_name || "Unknown";
  };

  const processQueue = async () => {
    if (!user || queue.length === 0) return;
    setProcessing(true);

    const items = queue.filter((q) => q.status === "queued");

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      setCurrentIndex(queue.findIndex((q) => q.id === item.id));
      updateItem(item.id, { status: "uploading" });

      try {
        const filePath = `${user.id}/${Date.now()}-${item.file.name}`;
        const { error: uploadError } = await supabase.storage.from("lab-uploads").upload(filePath, item.file);
        if (uploadError) throw uploadError;

        const insertData: any = { user_id: user.id, status: "processing" };
        if (item.personId) insertData.dependant_id = item.personId;
        if (item.testDate) insertData.test_date = format(item.testDate, "yyyy-MM-dd");

        const { data: labResult, error: insertError } = await supabase
          .from("lab_results")
          .insert(insertData)
          .select()
          .single();
        if (insertError) throw insertError;

        const { data: interpretData, error: fnError } = await supabase.functions.invoke(
          "interpret-lab",
          { body: { labResultId: labResult.id, filePath } }
        );

        await supabase.storage.from("lab-uploads").remove([filePath]);

        if (fnError || interpretData?.error) {
          updateItem(item.id, { status: "failed" });
        } else {
          updateItem(item.id, { status: "done", resultId: labResult.id });
        }
      } catch (err: any) {
        console.error(`Bulk upload error for ${item.file.name}:`, err);
        updateItem(item.id, { status: "failed" });
      }
    }

    setProcessing(false);
    setCurrentIndex(-1);
    queryClient.invalidateQueries({ queryKey: ["lab-results"] });
    queryClient.invalidateQueries({ queryKey: ["last-result"] });
    queryClient.invalidateQueries({ queryKey: ["failed-result"] });
    toast.success("Bulk upload complete!");
  };

  const queuedCount = queue.filter((q) => q.status === "queued").length;
  const doneCount = queue.filter((q) => q.status === "done").length;
  const failedCount = queue.filter((q) => q.status === "failed").length;
  const allDone = queue.length > 0 && queuedCount === 0 && !processing;

  return (
    <div className="px-5 pt-8 pb-24 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <button onClick={() => navigate("/upload")} className="touch-target">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-display text-2xl font-bold">Add Past Results</h1>
      </div>
      <p className="text-muted-foreground text-body-sm mb-6">
        Upload multiple lab results at once. Tag each with a date and who it belongs to.
      </p>

      {/* Add files button */}
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={processing}
        className="w-full bg-card border-2 border-dashed border-border rounded-2xl p-5 flex items-center gap-4 touch-target mb-5 disabled:opacity-50"
      >
        <Plus className="w-7 h-7 text-secondary-foreground" />
        <div className="text-left">
          <p className="font-bold text-body">Add Lab Results</p>
          <p className="text-muted-foreground text-body-sm">Select multiple images or PDFs</p>
        </div>
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,application/pdf,.pdf"
        multiple
        onChange={addFiles}
        className="hidden"
      />

      {/* Queue */}
      {queue.length === 0 ? (
        <div className="text-center py-12">
          <Layers className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-body-sm">No files added yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {queue.map((item, idx) => (
            <div
              key={item.id}
              className={cn(
                "bg-card rounded-xl border p-4 transition-all",
                item.status === "uploading" && "border-accent ring-1 ring-accent/30",
                item.status === "done" && "border-green-500/40 bg-green-500/5",
                item.status === "failed" && "border-destructive/40 bg-destructive/5",
                item.status === "queued" && "border-border"
              )}
            >
              {/* File info row */}
              <div className="flex items-center gap-3 mb-3">
                {item.status === "uploading" ? (
                  <Loader2 className="w-5 h-5 text-secondary-foreground animate-spin flex-shrink-0" />
                ) : item.status === "done" ? (
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                ) : item.status === "failed" ? (
                  <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0" />
                ) : (
                  <FileUp className="w-5 h-5 text-secondary flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{item.file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(item.file.size / 1024 / 1024).toFixed(1)} MB
                    {item.status === "uploading" && " • Processing..."}
                    {item.status === "done" && " • Done ✓"}
                    {item.status === "failed" && " • Failed"}
                  </p>
                </div>
                {item.status === "queued" && !processing && (
                  <button onClick={() => removeItem(item.id)} className="touch-target p-1">
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                )}
                {item.status === "done" && item.resultId && (
                  <button
                    onClick={() => navigate(`/result/${item.resultId}`)}
                    className="text-accent text-xs font-medium"
                  >
                    View →
                  </button>
                )}
              </div>

              {/* Editable fields (only when queued and not processing) */}
              {item.status === "queued" && !processing && (
                <div className="space-y-3 pt-2 border-t border-border">
                  {/* Person selector */}
                  {dependants.length > 0 && (
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">For:</label>
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          onClick={() => updateItem(item.id, { personId: null })}
                          className={`px-3 py-1 rounded-lg border text-xs font-medium transition-all ${
                            item.personId === null ? "border-accent bg-accent/10 text-accent" : "border-border bg-background"
                          }`}
                        >
                          Myself
                        </button>
                        {dependants.map((d) => (
                          <button
                            key={d.id}
                            onClick={() => updateItem(item.id, { personId: d.id })}
                            className={`px-3 py-1 rounded-lg border text-xs font-medium transition-all ${
                              item.personId === d.id ? "border-accent bg-accent/10 text-accent" : "border-border bg-background"
                            }`}
                          >
                            {d.full_name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Date picker */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Test date:</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className={cn(
                            "w-full h-9 rounded-lg justify-start text-left text-xs font-normal",
                            !item.testDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                          {item.testDate ? format(item.testDate, "PPP") : "Today (default)"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={item.testDate}
                          onSelect={(d) => updateItem(item.id, { testDate: d })}
                          disabled={(date) => date > new Date()}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              )}

              {/* Summary for non-queued */}
              {item.status !== "queued" && (
                <div className="text-xs text-muted-foreground">
                  {getPersonName(item.personId)}
                  {item.testDate ? ` • ${format(item.testDate, "dd MMM yyyy")}` : ""}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Progress summary */}
      {allDone && (
        <div className="mt-6 bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-center">
          <Check className="w-8 h-8 text-green-500 mx-auto mb-2" />
          <p className="font-semibold text-body-sm">All done!</p>
          <p className="text-xs text-muted-foreground mt-1">
            {doneCount} processed{failedCount > 0 ? ` • ${failedCount} failed` : ""}
          </p>
          <Button
            onClick={() => navigate("/history")}
            className="mt-3 h-10 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90"
            size="sm"
          >
            View History
          </Button>
        </div>
      )}

      {/* Start processing button */}
      {queuedCount > 0 && !processing && (
        <div className="fixed bottom-20 left-0 right-0 px-5 pb-4 max-w-lg mx-auto">
          <Button
            onClick={processQueue}
            className="w-full h-14 text-lg font-bold rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 touch-target shadow-lg"
          >
            <Layers className="w-5 h-5 mr-2" />
            Process {queuedCount} Result{queuedCount > 1 ? "s" : ""}
          </Button>
        </div>
      )}

      {/* Processing indicator */}
      {processing && (
        <div className="fixed bottom-20 left-0 right-0 px-5 pb-4 max-w-lg mx-auto">
          <div className="bg-card rounded-xl border border-accent p-4 flex items-center gap-3 shadow-lg">
            <Loader2 className="w-5 h-5 text-accent animate-spin" />
            <div>
              <p className="font-semibold text-sm">
                Processing {currentIndex + 1} of {queue.length}...
              </p>
              <p className="text-xs text-muted-foreground">Don't close this page</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkUpload;
