import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type AppRole = "admin" | "user";

export const useUserRole = () => {
  const { user, loading: authLoading } = useAuth();

  const { data: roles = [], isLoading } = useQuery({
    queryKey: ["user-roles", user?.id],
    queryFn: async () => {
      if (!user) return [] as AppRole[];
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      return (data || []).map((r) => r.role as AppRole);
    },
    enabled: !!user && !authLoading,
    staleTime: 60_000,
  });

  return {
    roles,
    isAdmin: roles.includes("admin"),
    isLoading: authLoading || isLoading,
  };
};
