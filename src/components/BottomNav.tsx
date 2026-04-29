import { Home, Upload, Clock, Users, UserCircle } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { motion, useReducedMotion } from "framer-motion";
import { Ripple } from "./Ripple";

const tabs = [
  { path: "/app", icon: Home, label: "Home", exact: true },
  { path: "/app/history", icon: Clock, label: "History" },
  { path: "/app/upload", icon: Upload, label: "Upload", center: true },
  { path: "/app/family", icon: Users, label: "Family" },
  { path: "/app/profile", icon: UserCircle, label: "Profile" },
];

export const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const reduce = useReducedMotion();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 border-t border-border safe-area-pb">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      <div className="flex items-center justify-around max-w-lg mx-auto px-2 py-1">
        {tabs.map((tab) => {
          const isActive = tab.exact
            ? location.pathname === tab.path
            : location.pathname === tab.path || location.pathname.startsWith(tab.path + "/");
          const Icon = tab.icon;

          if (tab.center) {
            return (
              <Ripple
                key={tab.path}
                onClick={() => navigate(tab.path)}
                rippleColor="hsl(0 0% 100% / 0.55)"
                className="touch-target flex flex-col items-center justify-center -mt-6 bg-transparent"
                aria-label="Upload"
              >
                <div className="relative">
                  <span
                    aria-hidden
                    className={cn(
                      "absolute inset-0 rounded-full bg-primary/40 blur-xl",
                      !reduce && "animate-heartbeat"
                    )}
                  />
                  <div className="relative w-14 h-14 rounded-full bg-gradient-brand text-primary-foreground flex items-center justify-center shadow-glow-primary ring-4 ring-card">
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
                <span className="text-[11px] mt-0.5 font-semibold text-primary">{tab.label}</span>
              </Ripple>
            );
          }

          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={cn(
                "touch-target flex flex-col items-center justify-center gap-0.5 transition-colors relative tap-scale",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {isActive && (
                <motion.span
                  layoutId="bottom-nav-indicator"
                  className="absolute -top-0.5 w-1.5 h-1.5 rounded-full bg-primary shadow-glow-primary"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <motion.span
                animate={isActive && !reduce ? { y: [0, -2, 0] } : { y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                <Icon className="w-6 h-6" />
              </motion.span>
              <span className="text-[11px] font-semibold">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
