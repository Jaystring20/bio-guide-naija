import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Dependant = Tables<"dependants">;

export type DependantInput = {
  full_name: string;
  age?: number | null;
  sex?: "male" | "female" | null;
  geopolitical_zone?: "south-south" | "south-west" | "south-east" | "north-central" | "north-east" | "north-west" | null;
  relationship: string;
};

export const useDependants = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: dependants = [], isLoading } = useQuery({
    queryKey: ["dependants", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dependants")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const addDependant = useMutation({
    mutationFn: async (input: DependantInput) => {
      const row: TablesInsert<"dependants"> = {
        user_id: user!.id,
        full_name: input.full_name,
        age: input.age,
        sex: input.sex,
        geopolitical_zone: input.geopolitical_zone,
        relationship: input.relationship,
      };
      const { error } = await supabase.from("dependants").insert(row);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dependants"] });
      toast.success("Person added successfully");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const updateDependant = useMutation({
    mutationFn: async ({ id, ...input }: DependantInput & { id: string }) => {
      const updates: TablesUpdate<"dependants"> = {
        full_name: input.full_name,
        age: input.age,
        sex: input.sex,
        geopolitical_zone: input.geopolitical_zone,
        relationship: input.relationship,
      };
      const { error } = await supabase.from("dependants").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dependants"] });
      toast.success("Updated successfully");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteDependant = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("dependants").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dependants"] });
      toast.success("Person removed");
    },
    onError: (err: any) => toast.error(err.message),
  });

  return { dependants, isLoading, addDependant, updateDependant, deleteDependant };
};
