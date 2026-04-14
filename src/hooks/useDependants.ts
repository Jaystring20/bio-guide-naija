import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type Dependant = {
  id: string;
  user_id: string;
  full_name: string;
  age: number | null;
  sex: "male" | "female" | null;
  geopolitical_zone: string | null;
  relationship: string;
  created_at: string;
  updated_at: string;
};

export type DependantInput = {
  full_name: string;
  age?: number | null;
  sex?: "male" | "female" | null;
  geopolitical_zone?: string | null;
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
      return (data || []) as Dependant[];
    },
    enabled: !!user,
  });

  const addDependant = useMutation({
    mutationFn: async (input: DependantInput) => {
      const { error } = await supabase
        .from("dependants")
        .insert({ ...input, user_id: user!.id });
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
      const { error } = await supabase
        .from("dependants")
        .update(input)
        .eq("id", id);
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
      const { error } = await supabase
        .from("dependants")
        .delete()
        .eq("id", id);
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
