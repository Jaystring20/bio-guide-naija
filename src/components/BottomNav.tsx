import { Home, Upload, Clock, Users, UserCircle } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const tabs = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/history", icon: Clock, label: "History" },
  { path: "/upload", icon: Upload, label: "Upload", center: true },
  { path: "/family", icon: Users, label: "Family" },
  { path: "/profile", icon: UserCircle, label: "Profile" },
];

export const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 border-t border-border safe-area-pb">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      <div className="flex items-center justify-around max-w-lg mx-auto px-2 py-1">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          const Icon = tab.icon;

          if (tab.center) {
            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className="touch-target flex flex-col items-center justify-center -mt-6"
              >
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-primary/30 blur-xl" />
                  <div className="relative w-14 h-14 rounded-full bg-gradient-brand text-primary-foreground flex items-center justify-center shadow-glow-primary ring-4 ring-card">
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
                <span className="text-[11px] mt-0.5 font-semibold text-primary">{tab.label}</span>
              </button>
            );
          }

          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={cn(
                "touch-target flex flex-col items-center justify-center gap-0.5 transition-colors relative",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {isActive && (
                <span className="absolute -top-0.5 w-1 h-1 rounded-full bg-primary" />
              )}
              <Icon className="w-6 h-6" />
              <span className="text-[11px] font-semibold">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
