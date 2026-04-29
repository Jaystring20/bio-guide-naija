import { useState } from "react";
import { useLocation } from "react-router-dom";
import { MessageSquarePlus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { FeedbackSheet } from "./FeedbackSheet";
import { cn } from "@/lib/utils";

const HIDDEN_PREFIXES = ["/app/admin", "/admin-login", "/auth", "/onboarding"];

export const FeedbackButton = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  if (!user) return null;
  if (HIDDEN_PREFIXES.some((p) => location.pathname.startsWith(p))) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Send feedback"
        className={cn(
          "fixed z-40 right-4 bottom-24 group",
          "h-11 pl-3 pr-4 rounded-full bg-card border border-primary/30 text-foreground",
          "shadow-card hover:shadow-elevated transition-all hover:-translate-y-0.5",
          "flex items-center gap-2 text-sm font-semibold"
        )}
      >
        <span className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center">
          <MessageSquarePlus className="w-4 h-4 text-primary" />
        </span>
        <span className="hidden sm:inline">Feedback</span>
      </button>
      <FeedbackSheet open={open} onOpenChange={setOpen} />
    </>
  );
};
