import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Shield,
  Users,
  FileText,
  AlertTriangle,
  Activity,
  TrendingUp,
  ArrowLeft,
  Search,
  Loader2,
  RefreshCw,
  ShieldOff,
  Download,
  MessageSquare,
  Star,
  LifeBuoy,
  Ticket,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useOpenIssueCount } from "@/hooks/useIssues";

function IssuesBadge() {
  const { data } = useOpenIssueCount();
  if (!data) return null;
  return (
    <span className="ml-1 inline-flex items-center justify-center rounded-full bg-destructive/15 text-destructive text-[10px] font-bold px-1.5 min-w-[18px] h-[18px]">
      {data}
    </span>
  );
}

type Metrics = {
  total_users: number;
  total_profiles: number;
  total_dependants: number;
  total_results: number;
  results_7d: number;
  results_30d: number;
  critical_total: number;
  critical_30d: number;
  failed_30d: number;
  completed_30d: number;
  active_users_30d: number;
  feedback_total: number;
  feedback_7d: number;
  feedback_unresolved_bugs: number;
  avg_rating_30d: number | null;
  avg_nps_30d: number | null;
  daily_uploads: { day: string; count: number }[];
};

type FeedbackRow = {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  category: string;
  rating: number | null;
  nps: number | null;
  message: string;
  screen: string | null;
  result_id: string | null;
  device_info: any;
  status: string;
  admin_notes: string | null;
  created_at: string;
};

type AdminUser = {
  user_id: string;
  email: string;
  full_name: string;
  created_at: string;
  last_sign_in: string | null;
  results_count: number;
  dependants_count: number;
  last_activity: string | null;
};

type AdminResult = {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  status: string;
  has_critical_alert: boolean;
  upload_date: string;
  dependant_id: string | null;
};

const StatCard = ({
  icon: Icon,
  label,
  value,
  sub,
  tone = "default",
}: {
  icon: any;
  label: string;
  value: string | number;
  sub?: string;
  tone?: "default" | "danger" | "warn" | "success";
}) => {
  const toneCls = {
    default: "bg-secondary/10 text-secondary",
    danger: "bg-destructive/10 text-destructive",
    warn: "bg-[hsl(var(--alert-amber)/0.12)] text-[hsl(var(--alert-amber))]",
    success: "bg-primary/10 text-primary",
  }[tone];
  return (
    <div className="bg-card border border-border rounded-2xl p-4 shadow-soft">
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", toneCls)}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="font-display text-2xl font-extrabold mt-0.5">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
};

const StatusBadge = ({ status, critical }: { status: string; critical: boolean }) => {
  if (critical) return <Badge variant="destructive">Critical</Badge>;
  if (status === "completed") return <Badge className="bg-primary/15 text-primary hover:bg-primary/15 border-0">Completed</Badge>;
  if (status === "processing") return <Badge variant="secondary">Processing</Badge>;
  if (status === "failed") return <Badge variant="destructive">Failed</Badge>;
  return <Badge variant="secondary">{status}</Badge>;
};

const fmtDate = (s: string | null) =>
  s ? new Date(s).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) : "—";
const fmtDateTime = (s: string | null) =>
  s ? new Date(s).toLocaleString("en-NG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";

const csvEscape = (v: unknown): string => {
  if (v === null || v === undefined) return "";
  const s = String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const downloadCSV = (filename: string, headers: string[], rows: (string | number | null | undefined)[][]) => {
  const lines = [headers.map(csvEscape).join(","), ...rows.map((r) => r.map(csvEscape).join(","))];
  // BOM so Excel opens UTF-8 correctly
  const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const stamp = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `${filename}-${stamp}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();
  const [search, setSearch] = useState("");

  const metricsQ = useQuery({
    queryKey: ["admin-metrics"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_overview_metrics");
      if (error) throw error;
      return data as unknown as Metrics;
    },
  });

  const usersQ = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_list_users");
      if (error) throw error;
      return (data || []) as AdminUser[];
    },
  });

  const resultsQ = useQuery({
    queryKey: ["admin-recent-results"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_recent_results", { _limit: 100 });
      if (error) throw error;
      return (data || []) as AdminResult[];
    },
  });

  const feedbackQ = useQuery({
    queryKey: ["admin-feedback"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_list_feedback", { _limit: 200 });
      if (error) throw error;
      return (data || []) as FeedbackRow[];
    },
  });

  const refreshAll = () => {
    qc.invalidateQueries({ queryKey: ["admin-metrics"] });
    qc.invalidateQueries({ queryKey: ["admin-users"] });
    qc.invalidateQueries({ queryKey: ["admin-recent-results"] });
    qc.invalidateQueries({ queryKey: ["admin-feedback"] });
    toast.success("Refreshed");
  };

  const updateFeedback = async (id: string, fields: { status?: string; admin_notes?: string }) => {
    const { error } = await supabase.from("feedback").update(fields).eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Feedback updated");
      qc.invalidateQueries({ queryKey: ["admin-feedback"] });
      qc.invalidateQueries({ queryKey: ["admin-metrics"] });
    }
  };

  const promoteAdmin = async (uid: string) => {
    const { error } = await supabase.from("user_roles").insert({ user_id: uid, role: "admin" });
    if (error) toast.error(error.message);
    else {
      toast.success("Promoted to admin");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    }
  };

  const revokeAdmin = async (uid: string) => {
    if (uid === user?.id) {
      toast.error("You can't revoke your own admin access here.");
      return;
    }
    const { error } = await supabase.from("user_roles").delete().eq("user_id", uid).eq("role", "admin");
    if (error) toast.error(error.message);
    else {
      toast.success("Admin access revoked");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    }
  };

  // Roles map for users tab
  const rolesQ = useQuery({
    queryKey: ["all-admin-roles"],
    queryFn: async () => {
      const { data } = await supabase.from("user_roles").select("user_id, role").eq("role", "admin");
      return new Set((data || []).map((r) => r.user_id));
    },
  });

  // All critical results across the database (admins can read all via RLS)
  const criticalQ = useQuery({
    queryKey: ["admin-critical-user-ids"],
    queryFn: async () => {
      const { data } = await supabase
        .from("lab_results")
        .select("user_id")
        .eq("has_critical_alert", true);
      return new Set((data || []).map((r) => r.user_id));
    },
  });

  const [usersCriticalOnly, setUsersCriticalOnly] = useState(false);
  const [resultsCriticalOnly, setResultsCriticalOnly] = useState(false);

  const m = metricsQ.data;
  const filteredUsers = (usersQ.data || []).filter(
    (u) =>
      (!search ||
        u.email?.toLowerCase().includes(search.toLowerCase()) ||
        u.full_name?.toLowerCase().includes(search.toLowerCase())) &&
      (!usersCriticalOnly || criticalQ.data?.has(u.user_id))
  );
  const filteredResults = (resultsQ.data || []).filter(
    (r) => !resultsCriticalOnly || r.has_critical_alert
  );
  const failedResults = (resultsQ.data || []).filter((r) => r.status === "failed");
  const successRate30 = m && m.results_30d > 0
    ? Math.round((m.completed_30d / m.results_30d) * 100)
    : null;

  return (
    <div className="px-5 pt-4 pb-4 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigate("/app")}
          className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => navigate("/app/admin/control-room")}
            className="gap-2"
          >
            <Activity className="w-4 h-4" /> Control Room
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => navigate("/app/admin/support")}
            className="gap-2"
          >
            <LifeBuoy className="w-4 h-4" /> Support Desk
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => navigate("/app/admin/issues")}
            className="gap-2"
          >
            <Ticket className="w-4 h-4" /> Issues
            <IssuesBadge />
          </Button>
          <Button variant="outline" size="sm" onClick={refreshAll} className="gap-2">
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
        </div>
      </div>

      <div className="mb-5">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/10 px-2.5 py-1 text-[11px] font-semibold text-secondary mb-2">
          <Shield className="w-3 h-3" />
          Super Admin
        </span>
        <h1 className="font-display text-3xl font-extrabold tracking-tight">VeriDIA control room</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Read-only product analytics, user list and recent uploads. Use this to monitor reliability and growth.
        </p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
        </TabsList>

        {/* OVERVIEW */}
        <TabsContent value="overview" className="space-y-5">
          {metricsQ.isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : metricsQ.error ? (
            <p className="text-sm text-destructive">Failed to load metrics: {(metricsQ.error as Error).message}</p>
          ) : m ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard icon={Users} label="Accounts" value={m.total_users} sub={`${m.total_profiles} profiles`} />
                <StatCard icon={FileText} label="Total results" value={m.total_results} sub={`${m.total_dependants} dependants`} />
                <StatCard icon={Activity} label="Last 7 days" value={m.results_7d} sub={`${m.results_30d} in 30d`} tone="success" />
                <StatCard
                  icon={TrendingUp}
                  label="Active users 30d"
                  value={m.active_users_30d}
                  sub={successRate30 !== null ? `${successRate30}% success rate` : undefined}
                  tone="success"
                />
                <StatCard
                  icon={AlertTriangle}
                  label="Critical alerts (30d)"
                  value={m.critical_30d}
                  sub={`${m.critical_total} all time`}
                  tone="danger"
                />
                <StatCard
                  icon={ShieldOff}
                  label="Failed uploads (30d)"
                  value={m.failed_30d}
                  sub="Reliability signal"
                  tone="warn"
                />
                <StatCard icon={FileText} label="Completed (30d)" value={m.completed_30d} tone="success" />
                <StatCard
                  icon={Activity}
                  label="Avg per active user"
                  value={m.active_users_30d ? (m.results_30d / m.active_users_30d).toFixed(1) : "—"}
                  sub="Last 30 days"
                />
                <StatCard
                  icon={MessageSquare}
                  label="Feedback (7d)"
                  value={m.feedback_7d}
                  sub={`${m.feedback_total} total · ${m.feedback_unresolved_bugs} open bugs`}
                />
                <StatCard
                  icon={Star}
                  label="Avg rating (30d)"
                  value={m.avg_rating_30d ?? "—"}
                  sub={m.avg_nps_30d !== null ? `NPS avg: ${m.avg_nps_30d}` : "No NPS yet"}
                  tone="success"
                />
              </div>

              {/* Activity chart */}
              <div className="bg-card border border-border rounded-2xl p-5 shadow-soft">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-display font-bold">Daily uploads — last 30 days</p>
                </div>
                <div className="h-64 -ml-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={m.daily_uploads || []}>
                      <defs>
                        <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis
                        dataKey="day"
                        tickFormatter={(d) => new Date(d).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={11}
                      />
                      <YAxis allowDecimals={false} stroke="hsl(var(--muted-foreground))" fontSize={11} />
                      <Tooltip
                        contentStyle={{
                          background: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: 12,
                          fontSize: 12,
                        }}
                        labelFormatter={(d) => new Date(d as string).toLocaleDateString("en-NG", { day: "numeric", month: "long" })}
                      />
                      <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" fill="url(#g)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Failure log preview */}
              {failedResults.length > 0 && (
                <div className="bg-card border border-border rounded-2xl p-5 shadow-soft">
                  <p className="font-display font-bold mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-destructive" />
                    Recent failed uploads
                  </p>
                  <div className="space-y-2">
                    {failedResults.slice(0, 5).map((r) => (
                      <div key={r.id} className="flex items-center justify-between text-sm py-2 border-b border-border last:border-0">
                        <div className="min-w-0">
                          <p className="font-semibold truncate">{r.full_name || r.email}</p>
                          <p className="text-xs text-muted-foreground truncate">{r.email}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <p className="text-xs text-muted-foreground">{fmtDateTime(r.upload_date)}</p>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 gap-1"
                            onClick={() => navigate(`/app/admin/support?result_id=${r.id}`)}
                          >
                            <LifeBuoy className="w-3.5 h-3.5" /> Help
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </TabsContent>

        {/* USERS */}
        <TabsContent value="users" className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-11"
              />
            </div>
            <Button
              variant="outline"
              className="h-11 gap-2 shrink-0"
              disabled={!filteredUsers.length}
              onClick={() =>
                downloadCSV(
                  usersCriticalOnly ? "veridia-users-critical" : "veridia-users",
                  ["Name", "Email", "Joined", "Last sign in", "Last activity", "Results", "Dependants", "Admin", "User ID"],
                  filteredUsers.map((u) => [
                    u.full_name,
                    u.email,
                    u.created_at,
                    u.last_sign_in,
                    u.last_activity,
                    u.results_count,
                    u.dependants_count,
                    rolesQ.data?.has(u.user_id) ? "yes" : "no",
                    u.user_id,
                  ])
                )
              }
            >
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
          </div>

          <label
            htmlFor="users-critical-toggle"
            className={cn(
              "flex items-center justify-between gap-3 rounded-xl border px-4 py-3 cursor-pointer transition-colors",
              usersCriticalOnly
                ? "border-destructive/40 bg-destructive/5"
                : "border-border bg-card"
            )}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <AlertTriangle className={cn("w-4 h-4 shrink-0", usersCriticalOnly ? "text-destructive" : "text-muted-foreground")} />
              <div className="min-w-0">
                <p className="text-sm font-semibold">Critical alerts only</p>
                <p className="text-xs text-muted-foreground">
                  {usersCriticalOnly
                    ? `Showing ${filteredUsers.length} user${filteredUsers.length === 1 ? "" : "s"} with at least one critical result`
                    : "Filter the list and export to users who triggered critical thresholds"}
                </p>
              </div>
            </div>
            <Switch
              id="users-critical-toggle"
              checked={usersCriticalOnly}
              onCheckedChange={setUsersCriticalOnly}
              disabled={criticalQ.isLoading}
            />
          </label>

          {usersQ.isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : usersQ.error ? (
            <p className="text-sm text-destructive">Failed to load users: {(usersQ.error as Error).message}</p>
          ) : (
            <div className="bg-card border border-border rounded-2xl shadow-soft overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold">User</th>
                      <th className="text-left px-4 py-3 font-semibold">Joined</th>
                      <th className="text-left px-4 py-3 font-semibold">Last active</th>
                      <th className="text-right px-4 py-3 font-semibold">Results</th>
                      <th className="text-right px-4 py-3 font-semibold">Family</th>
                      <th className="text-right px-4 py-3 font-semibold">Admin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => {
                      const isAdmin = rolesQ.data?.has(u.user_id);
                      return (
                        <tr key={u.user_id} className="border-t border-border hover:bg-muted/20">
                          <td className="px-4 py-3">
                            <p className="font-semibold">{u.full_name || "—"}</p>
                            <p className="text-xs text-muted-foreground">{u.email}</p>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{fmtDate(u.created_at)}</td>
                          <td className="px-4 py-3 text-muted-foreground">{fmtDate(u.last_activity || u.last_sign_in)}</td>
                          <td className="px-4 py-3 text-right font-bold">{u.results_count}</td>
                          <td className="px-4 py-3 text-right">{u.dependants_count}</td>
                          <td className="px-4 py-3 text-right">
                            {isAdmin ? (
                              <Button size="sm" variant="ghost" className="text-destructive h-8" onClick={() => revokeAdmin(u.user_id)}>
                                Revoke
                              </Button>
                            ) : (
                              <Button size="sm" variant="ghost" className="h-8" onClick={() => promoteAdmin(u.user_id)}>
                                Promote
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {filteredUsers.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-8">No users found.</p>
              )}
            </div>
          )}
        </TabsContent>

        {/* RESULTS */}
        <TabsContent value="results" className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label
              htmlFor="results-critical-toggle"
              className={cn(
                "flex items-center gap-3 rounded-xl border px-4 py-2.5 cursor-pointer transition-colors",
                resultsCriticalOnly
                  ? "border-destructive/40 bg-destructive/5"
                  : "border-border bg-card"
              )}
            >
              <AlertTriangle className={cn("w-4 h-4", resultsCriticalOnly ? "text-destructive" : "text-muted-foreground")} />
              <Label htmlFor="results-critical-toggle" className="text-sm font-semibold cursor-pointer">
                Critical alerts only
              </Label>
              <Switch
                id="results-critical-toggle"
                checked={resultsCriticalOnly}
                onCheckedChange={setResultsCriticalOnly}
              />
            </label>
            <Button
              variant="outline"
              className="h-11 gap-2"
              disabled={!filteredResults.length}
              onClick={() =>
                downloadCSV(
                  resultsCriticalOnly ? "veridia-critical-results" : "veridia-recent-results",
                  ["Upload date", "User name", "Email", "Status", "Critical", "Result ID", "User ID", "Dependant ID"],
                  filteredResults.map((r) => [
                    r.upload_date,
                    r.full_name,
                    r.email,
                    r.status,
                    r.has_critical_alert ? "yes" : "no",
                    r.id,
                    r.user_id,
                    r.dependant_id,
                  ])
                )
              }
            >
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
          </div>
          {resultsCriticalOnly && (
            <p className="text-xs text-muted-foreground px-1">
              Showing the {filteredResults.length} critical {filteredResults.length === 1 ? "result" : "results"} from the most recent 100 uploads.
            </p>
          )}
          {resultsQ.isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : resultsQ.error ? (
            <p className="text-sm text-destructive">Failed to load: {(resultsQ.error as Error).message}</p>
          ) : (
            <div className="bg-card border border-border rounded-2xl shadow-soft overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold">Date</th>
                      <th className="text-left px-4 py-3 font-semibold">User</th>
                      <th className="text-left px-4 py-3 font-semibold">Status</th>
                      <th className="text-right px-4 py-3 font-semibold"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredResults.map((r) => (
                      <tr key={r.id} className="border-t border-border hover:bg-muted/20">
                        <td className="px-4 py-3 text-muted-foreground">{fmtDateTime(r.upload_date)}</td>
                        <td className="px-4 py-3">
                          <p className="font-semibold">{r.full_name || "—"}</p>
                          <p className="text-xs text-muted-foreground">{r.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={r.status} critical={r.has_critical_alert} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          {r.status === "completed" || r.status === "critical" ? (
                            <Button size="sm" variant="ghost" className="h-8" onClick={() => navigate(`/app/result/${r.id}`)}>
                              Open
                            </Button>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredResults.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-8">
                  {resultsCriticalOnly ? "No critical results in the recent window." : "No results yet."}
                </p>
              )}
            </div>
          )}
        </TabsContent>

        {/* FEEDBACK */}
        <TabsContent value="feedback" className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              Tester feedback in submission order. Update status as you triage.
            </p>
            <Button
              variant="outline"
              className="h-10 gap-2"
              disabled={!feedbackQ.data?.length}
              onClick={() =>
                downloadCSV(
                  "veridia-feedback",
                  ["Date", "User", "Email", "Category", "Rating", "NPS", "Status", "Screen", "Message", "Admin notes", "Result ID"],
                  (feedbackQ.data || []).map((f) => [
                    f.created_at,
                    f.full_name,
                    f.email,
                    f.category,
                    f.rating,
                    f.nps,
                    f.status,
                    f.screen,
                    f.message,
                    f.admin_notes,
                    f.result_id,
                  ])
                )
              }
            >
              <Download className="w-4 h-4" /> Export CSV
            </Button>
          </div>

          {feedbackQ.isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : feedbackQ.error ? (
            <p className="text-sm text-destructive">Failed to load feedback: {(feedbackQ.error as Error).message}</p>
          ) : (feedbackQ.data || []).length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-10 text-center shadow-soft">
              <MessageSquare className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
              <p className="font-semibold">No feedback yet</p>
              <p className="text-xs text-muted-foreground mt-1">As testers submit, they'll appear here.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {(feedbackQ.data || []).map((f) => (
                <div key={f.id} className="bg-card border border-border rounded-2xl p-4 shadow-soft">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className="text-[10px] capitalize">{f.category.replace("_", " ")}</Badge>
                        {f.rating != null && (
                          <span className="inline-flex items-center gap-0.5 text-xs font-bold text-[hsl(var(--alert-amber))]">
                            <Star className="w-3 h-3 fill-current" /> {f.rating}
                          </span>
                        )}
                        {f.nps != null && (
                          <Badge variant="outline" className="text-[10px]">NPS {f.nps}</Badge>
                        )}
                        <span className="text-[10px] text-muted-foreground">{fmtDateTime(f.created_at)}</span>
                      </div>
                      <p className="text-sm font-semibold mt-1.5">{f.full_name || f.email || "Anonymous"}</p>
                      {f.email && f.full_name && (
                        <p className="text-[11px] text-muted-foreground">{f.email}</p>
                      )}
                    </div>
                    <select
                      value={f.status}
                      onChange={(e) => updateFeedback(f.id, { status: e.target.value })}
                      className="h-8 rounded-md border border-border bg-card px-2 text-xs font-semibold capitalize"
                    >
                      <option value="new">New</option>
                      <option value="reviewed">Reviewed</option>
                      <option value="actioned">Actioned</option>
                      <option value="wont_fix">Won't fix</option>
                    </select>
                  </div>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{f.message}</p>
                  {f.screen && (
                    <p className="text-[11px] text-muted-foreground mt-2">Screen: <span className="font-mono">{f.screen}</span></p>
                  )}
                  {f.result_id && (
                    <Button
                      variant="link"
                      size="sm"
                      className="h-6 px-0 text-xs"
                      onClick={() => navigate(`/app/result/${f.result_id}`)}
                    >
                      Open linked report →
                    </Button>
                  )}
                  <textarea
                    defaultValue={f.admin_notes || ""}
                    placeholder="Internal admin notes (saved on blur)"
                    onBlur={(e) => {
                      const v = e.target.value.trim();
                      if (v !== (f.admin_notes || "")) {
                        updateFeedback(f.id, { admin_notes: v || null as any });
                      }
                    }}
                    className="mt-3 w-full text-xs rounded-md border border-border bg-muted/30 p-2 min-h-[44px]"
                  />
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
