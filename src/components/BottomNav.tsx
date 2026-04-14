import { Home, Upload, Clock, TrendingUp, UserCircle } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const tabs = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/upload", icon: Upload, label: "Upload", center: true },
  { path: "/history", icon: Clock, label: "History" },
  { path: "/trends", icon: TrendingUp, label: "Trends" },
  { path: "/profile", icon: UserCircle, label: "Profile" },
];

export const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-area-pb">
      <div className="flex items-center justify-around max-w-lg mx-auto px-2 py-1">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          const Icon = tab.icon;

          if (tab.center) {
            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className="touch-target flex flex-col items-center justify-center -mt-5"
              >
                <div className={cn(
                  "w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-colors",
                  "bg-accent text-accent-foreground"
                )}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-xs mt-0.5 font-medium text-accent">{tab.label}</span>
              </button>
            );
          }

          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={cn(
                "touch-target flex flex-col items-center justify-center gap-0.5 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
