import { useEffect, useState } from "react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { Heart, FileText, Brain, Utensils } from "lucide-react";
import { Aurora } from "./Aurora";

const PHRASES = [
  { icon: FileText, text: "Reading your lab carefully…" },
  { icon: Brain,    text: "Mapping every biomarker…" },
  { icon: Utensils, text: "Pairing it with local Nigerian foods…" },
  { icon: Heart,    text: "Almost there — preparing your plan…" },
];

interface OrbitProcessingProps {
  /** 0..steps-1 */
  step: number;
  /** Optional explicit override label */
  label?: string;
}

/**
 * Cinematic processing visual: a soft pulsing heart with an orbiting dot,
 * a drifting aurora behind, and rotating reassuring phrases. Designed to
 * keep anxious caregivers feeling cared for during the wait.
 */
export const OrbitProcessing = ({ step, label }: OrbitProcessingProps) => {
  const reduce = useReducedMotion();
  const [phraseIdx, setPhraseIdx] = useState(0);

  useEffect(() => {
    if (reduce) return;
    const t = setInterval(() => setPhraseIdx((i) => (i + 1) % PHRASES.length), 2400);
    return () => clearInterval(t);
  }, [reduce]);

  const Phrase = PHRASES[phraseIdx];
  const Icon = Phrase.icon;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-hero p-8 shadow-elevated">
      <Aurora tone="warm" intensity={1} />
      <div className="absolute inset-0 grid-bg opacity-40 pointer-events-none" />

      <div className="relative flex flex-col items-center text-center">
        {/* Orbit + heart */}
        <div className="relative w-36 h-36 mb-6">
          {/* outer breathing ring */}
          <div className={`absolute inset-0 rounded-full bg-white/15 ${reduce ? "" : "animate-breathe"}`} />
          {/* heartbeat halo */}
          <div className={`absolute inset-2 rounded-full bg-white/20 blur-xl ${reduce ? "" : "animate-heartbeat"}`} />
          {/* orbit ring */}
          <div className="absolute inset-3 rounded-full border-2 border-white/25" />
          {/* orbiting dot */}
          {!reduce && (
            <motion.div
              className="absolute inset-3"
              animate={{ rotate: 360 }}
              transition={{ duration: 3.2, ease: "linear", repeat: Infinity }}
              style={{ originX: "50%", originY: "50%" }}
            >
              <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white shadow-[0_0_18px_4px_rgba(255,255,255,0.6)]" />
            </motion.div>
          )}
          {/* central heart */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={`w-16 h-16 rounded-2xl bg-white text-primary flex items-center justify-center shadow-2xl ${reduce ? "" : "animate-heartbeat"}`}>
              <Heart className="w-8 h-8 fill-primary text-primary" />
            </div>
          </div>
        </div>

        {/* Rotating reassuring phrase */}
        <div className="h-8 relative w-full max-w-xs">
          <AnimatePresence mode="wait">
            <motion.div
              key={phraseIdx}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="absolute inset-0 flex items-center justify-center gap-2 text-primary-foreground"
            >
              <Icon className="w-4 h-4 opacity-90" />
              <span className="font-semibold text-base">{Phrase.text}</span>
            </motion.div>
          </AnimatePresence>
        </div>

        <p className="text-primary-foreground/70 text-sm mt-3 max-w-xs">
          Hang tight — your insights are nearly ready. Don't close this page.
        </p>

        {/* Step pips */}
        <div className="flex items-center gap-2 mt-6">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i <= step ? "w-8 bg-white" : "w-3 bg-white/35"
              }`}
            />
          ))}
        </div>
        {label && <p className="sr-only">{label}</p>}
      </div>
    </div>
  );
};
