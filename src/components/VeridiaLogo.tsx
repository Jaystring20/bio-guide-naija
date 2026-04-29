import { cn } from "@/lib/utils";
import veridiaLogoLight from "@/assets/veridia-logo.png";
import veridiaLogoDark from "@/assets/veridia-logo-dark.png";

interface VeridiaLogoProps {
  className?: string;
  alt?: string;
}

/**
 * Theme-aware VeriDIA logo. Renders the light variant by default and swaps
 * to the dark-mode optimized variant when the `.dark` class is on <html>.
 * Both <img> tags are emitted so the swap is instant via CSS — no flash, no
 * JS theme reads required.
 */
export const VeridiaLogo = ({ className, alt = "VeriDIA" }: VeridiaLogoProps) => {
  return (
    <>
      <img
        src={veridiaLogoLight}
        alt={alt}
        className={cn("block dark:hidden", className)}
      />
      <img
        src={veridiaLogoDark}
        alt={alt}
        className={cn("hidden dark:block", className)}
        aria-hidden="true"
      />
    </>
  );
};
