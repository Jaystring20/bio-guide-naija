import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { VeridiaLogo } from "@/components/VeridiaLogo";

type Mode = "signin" | "signup" | "reset";

const Auth = () => {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        await signUp(email, password, fullName);
        toast.success("Account created! Check your email to verify.");
      } else if (mode === "signin") {
        await signIn(email, password);
        navigate("/app");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("If that email exists, a reset link is on the way.");
        setMode("signin");
      }
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const tagline =
    mode === "reset" ? "Reset your password" : "Your lab-to-nutrition companion";

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <VeridiaLogo className="h-36 sm:h-40 w-auto mx-auto mb-4 drop-shadow-md" />
          <p className="text-muted-foreground mt-2">{tagline}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <Input
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="h-14 text-body rounded-xl"
              required
            />
          )}
          <Input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-14 text-body rounded-xl"
            required
          />
          {mode !== "reset" && (
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-14 text-body rounded-xl"
              minLength={6}
              required
            />
          )}
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-14 text-lg font-bold rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 touch-target"
          >
            {loading
              ? "Please wait..."
              : mode === "signup"
              ? "Create Account"
              : mode === "signin"
              ? "Sign In"
              : "Send reset link"}
          </Button>
        </form>

        {mode === "signin" && (
          <button
            onClick={() => setMode("reset")}
            className="w-full text-center mt-4 text-primary underline text-body-sm touch-target"
          >
            Forgot password?
          </button>
        )}

        {mode === "reset" ? (
          <button
            onClick={() => setMode("signin")}
            className="w-full text-center mt-6 text-primary underline text-body-sm touch-target"
          >
            Back to sign in
          </button>
        ) : (
          <button
            onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
            className="w-full text-center mt-6 text-primary underline text-body-sm touch-target"
          >
            {mode === "signup"
              ? "Already have an account? Sign in"
              : "Don't have an account? Sign up"}
          </button>
        )}
      </div>
    </div>
  );
};

export default Auth;
