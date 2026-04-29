import { useMemo } from "react";

/**
 * Drifting aurora gradient backdrop. Mount inside a relatively-positioned
 * container with `overflow-hidden`. Pure decoration — pointer-events:none.
 *
 * Tones:
 *  - "brand" (default): green + navy + mint
 *  - "warm": green + amber + navy (used on hero/upload success)
 *  - "calm": navy + mint
 */
export const Aurora = ({
  tone = "brand",
  intensity = 1,
  className = "",
}: {
  tone?: "brand" | "warm" | "calm";
  intensity?: number;
  className?: string;
}) => {
  const blobs = useMemo(() => {
    if (tone === "warm")
      return [
        { cls: "aurora-green", size: 380, top: "-10%", left: "-15%", anim: "animate-aurora-1" },
        { cls: "aurora-amber", size: 320, top: "20%", left: "55%", anim: "animate-aurora-2" },
        { cls: "aurora-navy",  size: 420, top: "60%", left: "10%", anim: "animate-aurora-3" },
      ];
    if (tone === "calm")
      return [
        { cls: "aurora-navy", size: 460, top: "-5%", left: "-10%", anim: "animate-aurora-1" },
        { cls: "aurora-mint", size: 360, top: "40%", left: "50%", anim: "animate-aurora-2" },
      ];
    return [
      { cls: "aurora-green", size: 440, top: "-15%", left: "-10%", anim: "animate-aurora-1" },
      { cls: "aurora-navy",  size: 380, top: "30%",  left: "55%", anim: "animate-aurora-2" },
      { cls: "aurora-mint",  size: 320, top: "60%",  left: "10%", anim: "animate-aurora-3" },
    ];
  }, [tone]);

  return (
    <div
      aria-hidden
      className={`aurora-layer ${className}`}
      style={{ opacity: 0.55 * intensity }}
    >
      {blobs.map((b, i) => (
        <span
          key={i}
          className={`aurora-blob ${b.cls} ${b.anim}`}
          style={{
            width: b.size,
            height: b.size,
            top: b.top,
            left: b.left,
          }}
        />
      ))}
    </div>
  );
};
