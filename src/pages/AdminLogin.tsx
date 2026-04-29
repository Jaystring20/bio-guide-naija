import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Shield, Loader2, Lock } from "lucide-react";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    try {
      // Step 1: authenticate
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;
      const uid = authData.user?.id;
      if (!uid) throw new Error("Sign-in failed.");

      // Step 2: verify admin role
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", uid)
        .eq("role", "admin");
      if (rolesError) throw rolesError;

      if (!roles || roles.length === 0) {
        // Not an admin — sign back out so no privileged session lingers
        await supabase.auth.signOut();
        setErrorMsg("This account does not have Super Admin privileges.");
        toast.error("Access denied");
        return;
      }

      toast.success("Welcome back, admin");
      navigate("/app/admin");
    } catch (err: any) {
      setErrorMsg(err?.message || "Sign-in failed");
      toast.error(err?.message || "Sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary text-secondary-foreground flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-white/10 ring-1 ring-white/20 flex items-center justify-center backdrop-blur-sm">
            <Shield className="w-8 h-8" />
          </div>
          <p className="mt-4 text-[11px] uppercase tracking-[0.2em] opacity-70 font-semibold">
            VeriDIA · Control Room
          </p>
          <h1 className="font-display text-3xl font-extrabold mt-1">Super Admin Access</h1>
          <p className="text-sm opacity-80 mt-2">
            Authorized personnel only. All access is logged.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            type="email"
            placeholder="Admin email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-13 text-base rounded-xl bg-white/10 border-white/20 text-secondary-foreground placeholder:text-secondary-foreground/60 focus-visible:ring-white/40"
            required
            autoComplete="email"
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-13 text-base rounded-xl bg-white/10 border-white/20 text-secondary-foreground placeholder:text-secondary-foreground/60 focus-visible:ring-white/40"
            minLength={6}
            required
            autoComplete="current-password"
          />

          {errorMsg && (
            <div className="rounded-xl bg-destructive/15 border border-destructive/30 px-4 py-3 text-sm text-destructive-foreground/90 flex items-start gap-2">
              <Lock className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-13 text-base font-bold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow-primary"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Verifying…
              </>
            ) : (
              <>
                <Shield className="w-4 h-4 mr-2" />
                Verify & enter control room
              </>
            )}
          </Button>
        </form>

        <div className="text-center mt-6 text-xs opacity-70">
          Not an admin?{" "}
          <Link to="/auth" className="underline font-semibold">
            Back to app sign-in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
