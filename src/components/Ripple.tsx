import React, { useCallback, useState } from "react";
import { cn } from "@/lib/utils";

type RippleType = { id: number; x: number; y: number; size: number };

interface RippleProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  rippleColor?: string;
  as?: "button" | "div";
}

/**
 * Tap ripple wrapper. Use as a <button> with the same API; emits a
 * radial ripple from the touch point. Decorative, GPU-friendly.
 */
export const Ripple = React.forwardRef<HTMLButtonElement, RippleProps>(
  ({ children, className, rippleColor = "hsl(0 0% 100% / 0.45)", onPointerDown, ...rest }, ref) => {
    const [ripples, setRipples] = useState<RippleType[]>([]);

    const handleDown = useCallback(
      (e: React.PointerEvent<HTMLButtonElement>) => {
        const target = e.currentTarget;
        const rect = target.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const size = Math.max(rect.width, rect.height) * 1.2;
        const id = Date.now() + Math.random();
        setRipples((r) => [...r, { id, x, y, size }]);
        setTimeout(() => setRipples((r) => r.filter((rp) => rp.id !== id)), 650);
        onPointerDown?.(e);
      },
      [onPointerDown]
    );

    return (
      <button
        ref={ref}
        onPointerDown={handleDown}
        className={cn("relative overflow-hidden tap-scale", className)}
        {...rest}
      >
        {children}
        {ripples.map((r) => (
          <span
            key={r.id}
            aria-hidden
            style={{
              position: "absolute",
              left: r.x - r.size / 2,
              top: r.y - r.size / 2,
              width: r.size,
              height: r.size,
              borderRadius: "50%",
              background: rippleColor,
              pointerEvents: "none",
              animation: "ripple-out 600ms ease-out forwards",
            }}
          />
        ))}
      </button>
    );
  }
);
Ripple.displayName = "Ripple";
