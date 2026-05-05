import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildWhatsAppUrl, type WhatsAppContext } from "@/lib/support";

interface WhatsAppSupportButtonProps extends WhatsAppContext {
  size?: "sm" | "default" | "lg";
  fullWidth?: boolean;
  className?: string;
}

export const WhatsAppSupportButton = ({
  size = "default",
  fullWidth = false,
  className = "",
  ...ctx
}: WhatsAppSupportButtonProps) => {
  const label =
    ctx.language === "pidgin"
      ? "Message us for WhatsApp"
      : "Chat with support on WhatsApp";

  // Build the URL at click time so device language reflects the latest state.
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.currentTarget.href = buildWhatsAppUrl(ctx);
  };

  return (
    <Button
      asChild
      size={size}
      variant="outline"
      className={`border-[hsl(142_70%_45%)] text-[hsl(142_70%_35%)] hover:bg-[hsl(142_70%_45%)]/10 hover:text-[hsl(142_70%_30%)] ${
        fullWidth ? "w-full" : ""
      } ${className}`}
    >
      <a
        href={buildWhatsAppUrl(ctx)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={label}
        onClick={handleClick}
      >
        <MessageCircle className="w-4 h-4 mr-1.5" />
        {label}
      </a>
    </Button>
  );
};
