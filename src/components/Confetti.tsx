import { useEffect, useState } from "react";

interface ConfettiProps {
  /** total count of particles (kept low for perf, default 10) */
  count?: number;
  /** ms before unmount */
  duration?: number;
}

/**
 * Lightweight DOM confetti — brand colors only, no canvas, no deps.
 * Mount it on a success moment; auto-cleans after `duration` ms.
 */
export const Confetti = ({ count = 10, duration = 1500 }: ConfettiProps) => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setShow(false), duration);
    return () => clearTimeout(t);
  }, [duration]);

  if (!show) return null;

  const colors = [
    "hsl(145 63% 49%)",   // vital green
    "hsl(217 60% 38%)",   // clinical navy
    "hsl(36 90% 56%)",    // alert amber
    "hsl(160 70% 55%)",   // mint
  ];

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-visible flex items-start justify-center"
    >
      {Array.from({ length: count }).map((_, i) => {
        const angle = (i / count) * Math.PI * 2;
        const dx = Math.cos(angle) * (60 + Math.random() * 60);
        const delay = Math.random() * 0.15;
        const dur = 1.1 + Math.random() * 0.6;
        const size = 6 + Math.random() * 6;
        const color = colors[i % colors.length];
        return (
          <span
            key={i}
            style={{
              position: "absolute",
              top: 0,
              left: "50%",
              width: size,
              height: size * 1.4,
              background: color,
              borderRadius: 2,
              ["--cx" as any]: `${dx}px`,
              animation: `confetti-fall ${dur}s cubic-bezier(0.22,1,0.36,1) ${delay}s forwards`,
            }}
          />
        );
      })}
    </div>
  );
};
