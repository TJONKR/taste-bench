"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  if (!supabase) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-ink/30">Authentication is not configured.</p>
      </main>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setMessage(""); setLoading(true);

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) setError(error.message);
      else setMessage("Check your email for a confirmation link!");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
      else router.push("/");
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setError("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setError(error.message);
  };

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex items-center justify-center px-6"
    >
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="font-serif text-2xl font-semibold text-ink">
            {mode === "signin" ? "Sign In" : "Create Account"}
          </h1>
          <p className="text-sm text-ink/30 mt-2">
            Sign in to claim your taste evaluation
          </p>
        </div>

        <div className="bg-card-bg border border-border rounded-xl p-6 shadow-card space-y-4">
          <button onClick={handleGoogle}
            className="w-full py-3 border border-border hover:border-ink/20 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2 text-ink/70">
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[11px] text-ink/20 uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full px-4 py-3 bg-canvas border border-border rounded-lg focus:outline-none focus:border-accent transition text-sm text-ink placeholder:text-ink/30" />
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
              className="w-full px-4 py-3 bg-canvas border border-border rounded-lg focus:outline-none focus:border-accent transition text-sm text-ink placeholder:text-ink/30" />
            {error && <p className="text-score-low text-sm">{error}</p>}
            {message && <p className="text-olive text-sm">{message}</p>}
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-accent hover:bg-accent-hover disabled:opacity-50 rounded-lg font-medium text-sm text-white transition">
              {loading ? "..." : mode === "signin" ? "Sign In" : "Sign Up"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-ink/30">
          {mode === "signin" ? "No account? " : "Already have one? "}
          <button onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(""); setMessage(""); }}
            className="text-accent hover:text-accent-hover transition">
            {mode === "signin" ? "Sign up" : "Sign in"}
          </button>
        </p>

        <a href="/" className="block text-center text-xs text-ink/20 hover:text-ink/40 transition">← Back home</a>
      </div>
    </motion.main>
  );
}
