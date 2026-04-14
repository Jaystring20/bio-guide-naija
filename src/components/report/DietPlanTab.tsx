import { useState } from "react";
import { DietaryPlan } from "./types";
import { ChevronDown, ChevronUp, Droplets, Leaf } from "lucide-react";
import { cn } from "@/lib/utils";

interface DietPlanTabProps {
  dietaryPlan: DietaryPlan;
}

export const DietPlanTab = ({ dietaryPlan }: DietPlanTabProps) => {
  const [showWeeklyPlan, setShowWeeklyPlan] = useState(false);

  return (
    <div className="space-y-6">
      {/* Foods to Increase */}
      {dietaryPlan.foods_to_increase?.length > 0 && (
        <div>
          <h3 className="font-display text-lg font-bold text-secondary mb-3">✅ Foods for You</h3>
          <div className="space-y-3">
            {dietaryPlan.foods_to_increase.map((f, i) => (
              <div key={i} className="bg-secondary/10 rounded-xl p-4 border border-secondary/20">
                <p className="font-bold text-body">{f.name}</p>
                {f.local_name && <p className="text-body-sm text-secondary italic">"{f.local_name}"</p>}
                <p className="text-body-sm text-muted-foreground mt-1">{f.benefit}</p>
                {f.preparation_tip && (
                  <p className="text-xs text-muted-foreground mt-1">💡 {f.preparation_tip}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Foods to Reduce */}
      {dietaryPlan.foods_to_reduce?.length > 0 && (
        <div>
          <h3 className="font-display text-lg font-bold text-harvest-gold mb-3">⚠️ Eat Less Of</h3>
          <div className="space-y-3">
            {dietaryPlan.foods_to_reduce.map((f, i) => (
              <div key={i} className="bg-harvest-gold/10 rounded-xl p-4 border border-harvest-gold/20">
                <p className="font-bold text-body">{f.name}</p>
                {f.local_name && <p className="text-body-sm italic text-harvest-gold">"{f.local_name}"</p>}
                <p className="text-body-sm text-muted-foreground mt-1">{f.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Foods to Avoid */}
      {dietaryPlan.foods_to_avoid?.length > 0 && (
        <div>
          <h3 className="font-display text-lg font-bold text-destructive mb-3">🚫 Avoid These</h3>
          <div className="space-y-3">
            {dietaryPlan.foods_to_avoid.map((f, i) => (
              <div key={i} className="bg-destructive/10 rounded-xl p-4 border border-destructive/20">
                <p className="font-bold text-body">{f.name}</p>
                {f.local_name && <p className="text-body-sm italic text-destructive">"{f.local_name}"</p>}
                <p className="text-body-sm text-muted-foreground mt-1">{f.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Meal Suggestions */}
      {dietaryPlan.meal_suggestions?.length > 0 && (
        <div>
          <h3 className="font-display text-lg font-bold mb-3">🍽️ Meal Ideas</h3>
          <div className="space-y-3">
            {dietaryPlan.meal_suggestions.map((m, i) => (
              <div key={i} className="bg-card rounded-xl p-4 border border-border">
                <p className="font-bold text-body">{m.meal}</p>
                <p className="text-body-sm text-muted-foreground">{m.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weekly Meal Plan */}
      {dietaryPlan.weekly_meal_plan && dietaryPlan.weekly_meal_plan.length > 0 && (
        <div>
          <button
            onClick={() => setShowWeeklyPlan(!showWeeklyPlan)}
            className="flex items-center justify-between w-full touch-target"
          >
            <h3 className="font-display text-lg font-bold">📅 7-Day Meal Plan</h3>
            {showWeeklyPlan ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          {showWeeklyPlan && (
            <div className="space-y-3 mt-3">
              {dietaryPlan.weekly_meal_plan.map((day, i) => (
                <div key={i} className="bg-card rounded-xl p-4 border border-border">
                  <p className="font-bold text-body text-accent mb-2">{day.day}</p>
                  <div className="space-y-1.5 text-body-sm">
                    <p><span className="font-semibold text-muted-foreground">🌅 Breakfast:</span> {day.breakfast}</p>
                    <p><span className="font-semibold text-muted-foreground">☀️ Lunch:</span> {day.lunch}</p>
                    <p><span className="font-semibold text-muted-foreground">🌙 Dinner:</span> {day.dinner}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Hydration Tips */}
      {dietaryPlan.hydration_tips && dietaryPlan.hydration_tips.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Droplets className="w-5 h-5 text-blue-400" />
            <h3 className="font-display text-lg font-bold">Hydration Tips</h3>
          </div>
          <div className="space-y-2">
            {dietaryPlan.hydration_tips.map((tip, i) => (
              <div key={i} className="bg-blue-500/10 rounded-xl p-3 border border-blue-500/20">
                <p className="text-body-sm">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Supplement Notes */}
      {dietaryPlan.supplement_notes && dietaryPlan.supplement_notes.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Leaf className="w-5 h-5 text-secondary" />
            <h3 className="font-display text-lg font-bold">Natural Supplements</h3>
          </div>
          <div className="space-y-2">
            {dietaryPlan.supplement_notes.map((note, i) => (
              <div key={i} className="bg-secondary/10 rounded-xl p-3 border border-secondary/20">
                <p className="text-body-sm">{note}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
