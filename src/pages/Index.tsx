import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Upload, Leaf, TrendingUp, Clock, Users, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useDependants } from "@/hooks/useDependants";

const Index = () => {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const { dependants } = useDependants();

  const { data: lastResult } = useQuery({
    queryKey: ["last-result", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("lab_results")
        .select("*")
        .eq("user_id", user!.id)
        .order("upload_date", { ascending: false })
        .limit(1)
        .single();
      return data;
    },
    enabled: !!user,
  });

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const firstName = profile?.full_name?.split(" ")[0] || "there";

  return (
    <div className="px-5 pt-8 pb-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
          <Leaf className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <p className="text-body-sm text-muted-foreground">{greeting()}</p>
          <h1 className="font-display text-2xl font-bold">{firstName} 👋</h1>
        </div>
      </div>

      {/* Upload CTA */}
      <div className="bg-primary rounded-2xl p-6 mb-6 text-primary-foreground">
        <h2 className="font-display text-xl font-bold mb-2">
          Understand your lab results
        </h2>
        <p className="text-primary-foreground/80 text-body-sm mb-5">
          Snap or upload your lab result and get a personalized diet plan with Nigerian foods.
        </p>
        <Button
          onClick={() => navigate("/upload")}
          className="h-14 px-6 text-body font-bold rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 touch-target"
        >
          <Upload className="w-5 h-5 mr-2" />
          Upload Lab Result
        </Button>
      </div>

      {/* People I manage */}
      {dependants.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-bold text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-secondary" />
              {profile?.user_role === "professional" ? "Patients" : "People"}
            </h3>
            <button
              onClick={() => navigate("/profile")}
              className="text-accent text-body-sm font-medium"
            >
              Manage
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {dependants.slice(0, 4).map((d) => (
              <button
                key={d.id}
                onClick={() => navigate("/upload")}
                className="bg-card rounded-xl p-4 border border-border text-left touch-target"
              >
                <p className="font-semibold text-body-sm truncate">{d.full_name}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {d.relationship}{d.age ? ` • ${d.age}yrs` : ""}
                </p>
                <div className="flex items-center gap-1 mt-2 text-accent text-xs font-medium">
                  <Upload className="w-3 h-3" />
                  Upload
                  <ChevronRight className="w-3 h-3" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <button
          onClick={() => navigate("/history")}
          className="bg-card rounded-xl p-5 border border-border text-left touch-target"
        >
          <Clock className="w-6 h-6 text-secondary mb-2" />
          <p className="text-body-sm text-muted-foreground">Past results</p>
          <p className="font-display text-xl font-bold">{lastResult ? "View" : "None yet"}</p>
        </button>
        <button
          onClick={() => navigate("/history")}
          className="bg-card rounded-xl p-5 border border-border text-left touch-target"
        >
          <TrendingUp className="w-6 h-6 text-accent mb-2" />
          <p className="text-body-sm text-muted-foreground">Health trend</p>
          <p className="font-display text-xl font-bold">{lastResult ? "Tracking" : "Start now"}</p>
        </button>
      </div>

      {/* Last result preview */}
      {lastResult && lastResult.status === "completed" && (
        <button
          onClick={() => navigate(`/result/${lastResult.id}`)}
          className="w-full bg-card rounded-xl p-5 border border-border text-left touch-target"
        >
          <p className="text-body-sm text-muted-foreground mb-1">Latest result</p>
          <p className="font-display font-bold text-lg">
            {new Date(lastResult.upload_date).toLocaleDateString("en-NG", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
          <p className="text-body-sm text-secondary mt-1">Tap to view details →</p>
        </button>
      )}

      {/* Disclaimer */}
      <p className="text-xs text-muted-foreground text-center mt-8 px-4">
        VeriDIA provides nutritional guidance only and is not a substitute for professional medical advice.
        Always consult your doctor.
      </p>
    </div>
  );
};

export default Index;
