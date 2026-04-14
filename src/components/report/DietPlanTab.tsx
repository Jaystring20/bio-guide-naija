import { useState } from "react";
import { DietaryPlan, DietaryPlanPidgin, Language } from "./types";
import { ChevronDown, ChevronUp, Droplets, Leaf } from "lucide-react";

interface DietPlanTabProps {
  dietaryPlan: DietaryPlan;
  dietaryPlanPidgin: DietaryPlanPidgin | null;
  language: Language;
}

export const DietPlanTab = ({ dietaryPlan, dietaryPlanPidgin, language }: DietPlanTabProps) => {
  const [showWeeklyPlan, setShowWeeklyPlan] = useState(false);
  const isPidgin = language === "pidgin";
  const pidgin = dietaryPlanPidgin;

  return (
    <div className="space-y-6">
      {dietaryPlan.foods_to_increase?.length > 0 && (
        <div>
          <h3 className="font-display text-lg font-bold text-secondary mb-3">
            {isPidgin ? "✅ Chop More Of This" : "✅ Foods for You"}
          </h3>
          <div className="space-y-3">
            {dietaryPlan.foods_to_increase.map((f, i) => {
              const pidginF = pidgin?.foods_to_increase?.[i];
              return (
                <div key={i} className="bg-secondary/10 rounded-xl p-4 border border-secondary/20">
                  <p className="font-bold text-body">{f.name}</p>
                  {f.local_name && <p className="text-body-sm text-secondary italic">"{f.local_name}"</p>}
                  <p className="text-body-sm text-muted-foreground mt-1">
                    {isPidgin && pidginF ? pidginF.benefit : f.benefit}
                  </p>
                  {f.preparation_tip && (
                    <p className="text-xs text-muted-foreground mt-1">
                      💡 {isPidgin && pidginF?.preparation_tip ? pidginF.preparation_tip : f.preparation_tip}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {dietaryPlan.foods_to_reduce?.length > 0 && (
        <div>
          <h3 className="font-display text-lg font-bold text-harvest-gold mb-3">
            {isPidgin ? "⚠️ Reduce This One" : "⚠️ Eat Less Of"}
          </h3>
          <div className="space-y-3">
            {dietaryPlan.foods_to_reduce.map((f, i) => {
              const pidginF = pidgin?.foods_to_reduce?.[i];
              return (
                <div key={i} className="bg-harvest-gold/10 rounded-xl p-4 border border-harvest-gold/20">
                  <p className="font-bold text-body">{f.name}</p>
                  {f.local_name && <p className="text-body-sm italic text-harvest-gold">"{f.local_name}"</p>}
                  <p className="text-body-sm text-muted-foreground mt-1">
                    {isPidgin && pidginF ? pidginF.reason : f.reason}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {dietaryPlan.foods_to_avoid?.length > 0 && (
        <div>
          <h3 className="font-display text-lg font-bold text-destructive mb-3">
            {isPidgin ? "🚫 No Touch This One" : "🚫 Avoid These"}
          </h3>
          <div className="space-y-3">
            {dietaryPlan.foods_to_avoid.map((f, i) => {
              const pidginF = pidgin?.foods_to_avoid?.[i];
              return (
                <div key={i} className="bg-destructive/10 rounded-xl p-4 border border-destructive/20">
                  <p className="font-bold text-body">{f.name}</p>
                  {f.local_name && <p className="text-body-sm italic text-destructive">"{f.local_name}"</p>}
                  <p className="text-body-sm text-muted-foreground mt-1">
                    {isPidgin && pidginF ? pidginF.reason : f.reason}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {dietaryPlan.meal_suggestions?.length > 0 && (
        <div>
          <h3 className="font-display text-lg font-bold mb-3">
            {isPidgin ? "🍽️ Food Ideas" : "🍽️ Meal Ideas"}
          </h3>
          <div className="space-y-3">
            {dietaryPlan.meal_suggestions.map((m, i) => {
              const pidginM = pidgin?.meal_suggestions?.[i];
              return (
                <div key={i} className="bg-card rounded-xl p-4 border border-border">
                  <p className="font-bold text-body">{m.meal}</p>
                  <p className="text-body-sm text-muted-foreground">
                    {isPidgin && pidginM ? pidginM.description : m.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {dietaryPlan.weekly_meal_plan && dietaryPlan.weekly_meal_plan.length > 0 && (
        <div>
          <button
            onClick={() => setShowWeeklyPlan(!showWeeklyPlan)}
            className="flex items-center justify-between w-full touch-target"
          >
            <h3 className="font-display text-lg font-bold">📅 {isPidgin ? "7-Day Chop Plan" : "7-Day Meal Plan"}</h3>
            {showWeeklyPlan ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          {showWeeklyPlan && (
            <div className="space-y-3 mt-3">
              {dietaryPlan.weekly_meal_plan.map((day, i) => (
                <div key={i} className="bg-card rounded-xl p-4 border border-border">
                  <p className="font-bold text-body text-accent mb-2">{day.day}</p>
                  <div className="space-y-1.5 text-body-sm">
                    <p><span className="font-semibold text-muted-foreground">🌅 {isPidgin ? "Morning:" : "Breakfast:"}</span> {day.breakfast}</p>
                    <p><span className="font-semibold text-muted-foreground">☀️ {isPidgin ? "Afternoon:" : "Lunch:"}</span> {day.lunch}</p>
                    <p><span className="font-semibold text-muted-foreground">🌙 {isPidgin ? "Night:" : "Dinner:"}</span> {day.dinner}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {dietaryPlan.hydration_tips && dietaryPlan.hydration_tips.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Droplets className="w-5 h-5 text-blue-400" />
            <h3 className="font-display text-lg font-bold">{isPidgin ? "Water Matter" : "Hydration Tips"}</h3>
          </div>
          <div className="space-y-2">
            {dietaryPlan.hydration_tips.map((tip, i) => {
              const pidginTip = pidgin?.hydration_tips?.[i];
              return (
                <div key={i} className="bg-blue-500/10 rounded-xl p-3 border border-blue-500/20">
                  <p className="text-body-sm">{isPidgin && pidginTip ? pidginTip : tip}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {dietaryPlan.supplement_notes && dietaryPlan.supplement_notes.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Leaf className="w-5 h-5 text-secondary" />
            <h3 className="font-display text-lg font-bold">{isPidgin ? "Natural Booster" : "Natural Supplements"}</h3>
          </div>
          <div className="space-y-2">
            {dietaryPlan.supplement_notes.map((note, i) => {
              const pidginNote = pidgin?.supplement_notes?.[i];
              return (
                <div key={i} className="bg-secondary/10 rounded-xl p-3 border border-secondary/20">
                  <p className="text-body-sm">{isPidgin && pidginNote ? pidginNote : note}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
