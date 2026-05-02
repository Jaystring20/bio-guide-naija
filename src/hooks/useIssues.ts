import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type IssueStatus =
  | "open"
  | "in_progress"
  | "waiting_user"
  | "resolved"
  | "closed"
  | "reopened";

export type IssuePriority = "low" | "normal" | "high" | "urgent";

export type IssueCategory =
  | "processing_delay"
  | "failed_extraction"
  | "diet_missing"
  | "critical_followup"
  | "upload_error"
  | "account"
  | "other";

export type IssueListRow = {
  id: string;
  title: string;
  category: IssueCategory;
  status: IssueStatus;
  priority: IssuePriority;
  source: string;
  affected_user_id: string;
  affected_email: string | null;
  affected_name: string | null;
  lab_result_id: string | null;
  assigned_to: string | null;
  created_by: string;
  resolution_summary: string | null;
  resolution_action: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
};

export type IssueEvent = {
  id: string;
  issue_id: string;
  actor_id: string | null;
  event_type: "note" | "status_change" | "assignment" | "action_taken" | "linked_action" | "created";
  from_status: string | null;
  to_status: string | null;
  note: string | null;
  action_key: string | null;
  metadata: any;
  created_at: string;
};

/** List all issues (admin RPC). */
export function useIssuesList(limit = 200) {
  return useQuery({
    queryKey: ["admin-issues-list", limit],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_list_issues", { _limit: limit });
      if (error) throw error;
      return (data || []) as IssueListRow[];
    },
  });
}

/** Issues attached to a specific lab_result or affected user. */
export function useIssuesForContext(opts: { labResultId?: string | null; userId?: string | null }) {
  const { labResultId, userId } = opts;
  return useQuery({
    queryKey: ["admin-issues-context", labResultId || null, userId || null],
    enabled: !!(labResultId || userId),
    queryFn: async () => {
      let q = supabase
        .from("support_issues")
        .select("id,title,status,priority,category,lab_result_id,affected_user_id,created_at,updated_at,resolved_at")
        .order("created_at", { ascending: false });
      if (labResultId) q = q.eq("lab_result_id", labResultId);
      else if (userId) q = q.eq("affected_user_id", userId);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
  });
}

/** Single issue. */
export function useIssue(id: string | undefined) {
  return useQuery({
    queryKey: ["admin-issue", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_issues")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

/** Owner of the issue (email + name). */
export function useIssueOwner(userId: string | undefined) {
  return useQuery({
    queryKey: ["admin-issue-owner", userId],
    enabled: !!userId,
    queryFn: async () => {
      // Reuse admin_list_users (admin-gated) — small N for this project.
      const { data, error } = await supabase.rpc("admin_list_users");
      if (error) throw error;
      const row = (data || []).find((u: any) => u.user_id === userId);
      return row || null;
    },
  });
}

/** Timeline events. */
export function useIssueTimeline(issueId: string | undefined) {
  return useQuery({
    queryKey: ["admin-issue-events", issueId],
    enabled: !!issueId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_issue_events")
        .select("*")
        .eq("issue_id", issueId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as IssueEvent[];
    },
  });
}

/** Create a new issue. */
export function useCreateIssue() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: {
      affected_user_id: string;
      lab_result_id?: string | null;
      title: string;
      description?: string;
      category?: IssueCategory;
      priority?: IssuePriority;
      source?: string;
      metadata?: any;
    }) => {
      if (!user) throw new Error("Not signed in");
      const { data, error } = await supabase
        .from("support_issues")
        .insert({
          affected_user_id: input.affected_user_id,
          lab_result_id: input.lab_result_id ?? null,
          title: input.title,
          description: input.description ?? null,
          category: input.category ?? "other",
          priority: input.priority ?? "normal",
          source: input.source ?? "admin_created",
          created_by: user.id,
          metadata: input.metadata ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-issues-list"] });
      qc.invalidateQueries({ queryKey: ["admin-issues-context"] });
      qc.invalidateQueries({ queryKey: ["admin-open-issue-count"] });
    },
  });
}

/** Update issue (status, priority, assignee, resolution). */
export function useUpdateIssue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; patch: Partial<{
      status: IssueStatus;
      priority: IssuePriority;
      assigned_to: string | null;
      resolution_summary: string | null;
      resolution_action: string | null;
      title: string;
      description: string;
      category: IssueCategory;
    }> }) => {
      const { data, error } = await supabase
        .from("support_issues")
        .update(input.patch)
        .eq("id", input.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["admin-issues-list"] });
      qc.invalidateQueries({ queryKey: ["admin-issues-context"] });
      qc.invalidateQueries({ queryKey: ["admin-issue", vars.id] });
      qc.invalidateQueries({ queryKey: ["admin-issue-events", vars.id] });
      qc.invalidateQueries({ queryKey: ["admin-open-issue-count"] });
    },
  });
}

/** Add a free-form note to an issue's timeline. */
export function useAddIssueNote() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: { issue_id: string; note: string }) => {
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase.from("support_issue_events").insert({
        issue_id: input.issue_id,
        actor_id: user.id,
        event_type: "note",
        note: input.note,
      });
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["admin-issue-events", vars.issue_id] });
    },
  });
}

/** Count of open + in_progress + reopened issues — for header badge. */
export function useOpenIssueCount() {
  return useQuery({
    queryKey: ["admin-open-issue-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("support_issues")
        .select("id", { count: "exact", head: true })
        .in("status", ["open", "in_progress", "reopened"]);
      if (error) throw error;
      return count ?? 0;
    },
    refetchInterval: 60000,
  });
}

/** Per-user resolution history (admin RPC). */
export function useUserIssueHistory(userId: string | undefined) {
  return useQuery({
    queryKey: ["admin-user-issue-history", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_user_issue_history", { _user_id: userId! });
      if (error) throw error;
      return data || [];
    },
  });
}
