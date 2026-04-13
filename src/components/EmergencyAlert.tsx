import { AlertTriangle, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

type CriticalAlert = {
  biomarker: string;
  value: number;
  unit: string;
  severity: "emergency" | "urgent";
  message: string;
};

type Props = {
  alerts: CriticalAlert[];
  onAcknowledge: () => void;
};

export const EmergencyAlert = ({ alerts, onAcknowledge }: Props) => {
  const hasEmergency = alerts.some((a) => a.severity === "emergency");

  return (
    <div className="fixed inset-0 z-[100] bg-destructive flex flex-col items-center justify-center p-6 text-destructive-foreground">
      <div className="animate-pulse-gentle mb-6">
        <AlertTriangle className="w-20 h-20" />
      </div>

      <h1 className="font-display text-3xl font-bold text-center mb-4">
        {hasEmergency ? "🚨 EMERGENCY" : "⚠️ URGENT ALERT"}
      </h1>

      <p className="text-center text-lg mb-6 max-w-sm">
        {hasEmergency
          ? "Some of your lab values are dangerously abnormal. Please contact a doctor immediately."
          : "Some of your lab values need urgent medical attention."}
      </p>

      <div className="w-full max-w-sm space-y-3 mb-8">
        {alerts.map((alert, i) => (
          <div key={i} className="bg-destructive-foreground/10 rounded-lg p-4 border border-destructive-foreground/20">
            <p className="font-bold text-lg">{alert.biomarker}</p>
            <p className="text-base">
              Your value: {alert.value} {alert.unit}
            </p>
            <p className="text-body-sm opacity-90">{alert.message}</p>
          </div>
        ))}
      </div>

      <a href="tel:112" className="w-full max-w-sm mb-4">
        <Button className="w-full h-16 text-lg font-bold bg-accent-foreground text-destructive rounded-xl touch-target">
          <Phone className="w-6 h-6 mr-2" />
          Call Doctor Now
        </Button>
      </a>

      {!hasEmergency && (
        <button
          onClick={onAcknowledge}
          className="text-destructive-foreground/70 underline text-body-sm mt-2"
        >
          I understand, show me my results
        </button>
      )}
    </div>
  );
};
