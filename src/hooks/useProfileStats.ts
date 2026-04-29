import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type ProfileStats = {
  total: number;
  flagged: number;
  lastDate: string | null;
};

const EMPTY: ProfileStats = { total: 0, flagged: 0, lastDate: null };

/**
 * Returns per-profile aggregate stats keyed by profile id.
 * The caregiver's own results are keyed under "self".
 */
export const useProfileStats = () => {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["profile-stats", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("lab_results")
        .select("dependant_id, biomarkers, has_critical_alert, status, upload_date, test_date")
        .eq("user_id", user!.id)
        .order("upload_date", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const map = new Map<string, ProfileStats>();
  (data || []).forEach((r: any) => {
    const key = r.dependant_id || "self";
    const cur = map.get(key) || { ...EMPTY };
    cur.total += 1;
    const bm = (r.biomarkers as any[] | null) || [];
    cur.flagged += bm.filter((b: any) => b.status && b.status !== "normal").length;
    const date = r.test_date || r.upload_date;
    if (date && (!cur.lastDate || date > cur.lastDate)) cur.lastDate = date;
    map.set(key, cur);
  });

  const get = (id: string | null): ProfileStats => map.get(id || "self") || EMPTY;

  return { get, isLoading, raw: data || [] };
};
