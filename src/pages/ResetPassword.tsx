import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { VeridiaLogo } from "@/components/VeridiaLogo";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Rule = { label: string; test: (p: string) => boolean };
const RULES: Rule[] = [
  { label: "At least 8 characters", test: (p) => p.length >= 8 },
  { label: "One uppercase letter (A-Z)", test: (p) => /[A-Z]/.test(p) },
  { label: "One lowercase letter (a-z)", test: (p) => /[a-z]/.test(p) },
  { label: "One number (0-9)", test: (p) => /\d/.test(p) },
  { label: "One symbol (!@#$…)", test: (p) => /[^A-Za-z0-9]/.test(p) },
];

const STRENGTH = [
  { label: "Too weak", color: "bg-destructive", text: "text-destructive" },
  { label: "Weak", color: "bg-destructive", text: "text-destructive" },
  { label: "Fair", color: "bg-amber-500", text: "text-amber-600" },
  { label: "Good", color: "bg-amber-500", text: "text-amber-600" },
  { label: "Strong", color: "bg-primary", text: "text-primary" },
  { label: "Very strong", color: "bg-primary", text: "text-primary" },
];

const ResetPassword = () => {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });

    // Fallback: if a session already exists (token consumed on load), allow reset
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
      else {
        // Give Supabase a moment to process the URL hash
        setTimeout(() => {
          supabase.auth.getSession().then(({ data: { session: s2 } }) => {
            if (!s2) setInvalid(true);
            else setReady(true);
          });
        }, 1500);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return toast.error("Password must be at least 6 characters");
    if (password !== confirm) return toast.error("Passwords do not match");
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      await supabase.auth.signOut();
      toast.success("Password updated — please sign in");
      navigate("/auth");
    } catch (err: any) {
      toast.error(err.message || "Could not update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <VeridiaLogo className="h-36 sm:h-40 w-auto mx-auto mb-4 drop-shadow-md" />
          <p className="text-muted-foreground mt-2">Choose a new password</p>
        </div>

        {invalid ? (
          <div className="space-y-4 text-center">
            <p className="text-body text-muted-foreground">
              This reset link is invalid or has expired.
            </p>
            <Button
              onClick={() => navigate("/auth")}
              className="w-full h-14 text-lg font-bold rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 touch-target"
            >
              Request a new link
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="password"
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-14 text-body rounded-xl"
              minLength={6}
              required
              disabled={!ready}
            />
            <Input
              type="password"
              placeholder="Confirm new password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="h-14 text-body rounded-xl"
              minLength={6}
              required
              disabled={!ready}
            />
            <Button
              type="submit"
              disabled={loading || !ready}
              className="w-full h-14 text-lg font-bold rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 touch-target"
            >
              {loading ? "Updating..." : ready ? "Update password" : "Verifying link..."}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
