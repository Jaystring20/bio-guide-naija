import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";

export const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAdmin, isLoading } = useUserRole();

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-secondary-foreground" />
      </div>
    );
  }
  if (!isAdmin) return <Navigate to="/app" replace />;
  return <>{children}</>;
};
