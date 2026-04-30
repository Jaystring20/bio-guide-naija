import { AlertTriangle, Phone, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";

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
  const [muted, setMuted] = useState(false);
  const intervalRef = useRef<number | null>(null);

  // Speak an audio warning when an emergency-severity alert mounts.
  // Repeats every ~12s so a caregiver across the room still hears it,
  // until the user mutes, acknowledges, or leaves the screen.
  useEffect(() => {
    if (!hasEmergency || muted) return;
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    const names = alerts
      .filter((a) => a.severity === "emergency")
      .map((a) => a.biomarker)
      .slice(0, 3)
      .join(", ");
    const phrase = names
      ? `Emergency. Contact a doctor now. Critical values detected for ${names}.`
      : "Emergency. Contact a doctor now. Critical values detected.";

    const speak = () => {
      try {
        window.speechSynthesis.cancel();
        const utt = new SpeechSynthesisUtterance(phrase);
        utt.rate = 0.95;
        utt.pitch = 1;
        utt.volume = 1;
        utt.lang = "en-NG";
        window.speechSynthesis.speak(utt);
      } catch {
        /* no-op: TTS unsupported */
      }
    };

    speak();
    intervalRef.current = window.setInterval(speak, 12000);
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      try {
        window.speechSynthesis.cancel();
      } catch {
        /* no-op */
      }
    };
  }, [hasEmergency, muted, alerts]);

  return (
    <div className="fixed inset-0 z-[100] bg-destructive flex flex-col items-center justify-center p-6 text-destructive-foreground overflow-hidden">
      {/* Empathetic ambient aura */}
      <div aria-hidden className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[120vmin] h-[120vmin] rounded-full bg-destructive-foreground/10 blur-3xl animate-heartbeat" />
      </div>

      <div className="relative mb-6">
        <span aria-hidden className="absolute inset-0 rounded-full bg-destructive-foreground/30 blur-2xl animate-heartbeat" />
        <AlertTriangle className="relative w-20 h-20" />
      </div>

      <h1 className="font-display text-3xl font-bold text-center mb-4 relative">
        {hasEmergency ? "🚨 EMERGENCY" : "⚠️ URGENT ALERT"}
      </h1>

      <p className="text-center text-lg mb-6 max-w-sm relative">
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

      <a href="tel:112" className="w-full max-w-sm mb-3">
        <Button className="w-full h-16 text-lg font-bold bg-accent-foreground text-destructive rounded-xl touch-target">
          <Phone className="w-6 h-6 mr-2" />
          Call Doctor Now
        </Button>
      </a>

      {hasEmergency && (
        <button
          onClick={() => setMuted((m) => !m)}
          className="flex items-center gap-2 text-destructive-foreground/80 text-body-sm underline mt-1 touch-target"
          aria-label={muted ? "Unmute audio warning" : "Mute audio warning"}
        >
          {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          {muted ? "Unmute audio warning" : "Mute audio warning"}
        </button>
      )}

      {hasEmergency && (
        <button
          onClick={onAcknowledge}
          className="text-destructive-foreground/70 underline text-body-sm mt-3"
        >
          I have contacted a doctor — show my results
        </button>
      )}

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
