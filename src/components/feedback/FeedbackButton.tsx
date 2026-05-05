import { useState } from "react";
import { useLocation } from "react-router-dom";
import { MessageSquarePlus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { FeedbackSheet } from "./FeedbackSheet";
import { cn } from "@/lib/utils";

const HIDDEN_PREFIXES = ["/app/admin", "/admin-login", "/auth", "/onboarding"];
// Routes that render their own fixed bottom action bar — lift the FAB higher so it doesn't overlap.
const LIFTED_PREFIXES = ["/app/result/", "/app/bulk-upload"];

export const FeedbackButton = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  if (!user) return null;
  if (HIDDEN_PREFIXES.some((p) => location.pathname.startsWith(p))) return null;

  const lifted = LIFTED_PREFIXES.some((p) => location.pathname.startsWith(p));

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Send feedback"
        className={cn(
          "fixed z-40 right-4 group",
          // Mobile: small icon-only circle. Desktop: labelled pill.
          "h-11 w-11 sm:w-auto sm:h-11 sm:pl-3 sm:pr-4 rounded-full bg-card border border-primary/30 text-foreground",
          "shadow-card hover:shadow-elevated transition-all hover:-translate-y-0.5",
          "flex items-center justify-center sm:justify-start gap-2 text-sm font-semibold",
          lifted ? "bottom-44 sm:bottom-28" : "bottom-28"
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
