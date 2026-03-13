"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/components/AuthProvider";
import { createClient } from "@/lib/supabase-browser";

const TOTAL_STEPS = 3;

export default function EvaluatePage() {
  const router = useRouter();
  const { user, loading: authLoading, isConfigured } = useAuth();
  const supabase = createClient();

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);

  // Form data
  const [name, setName] = useState("");
  const [twitter, setTwitter] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");

  // Auth
  const [authMode, setAuthMode] = useState<"signup" | "signin">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [authLoading2, setAuthLoading2] = useState(false);

  // API key
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [hasKey, setHasKey] = useState(false);
  const [keyError, setKeyError] = useState("");
  const [keySaving, setKeySaving] = useState(false);

  // Submit
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Auto-advance past auth step if already signed in
  useEffect(() => {
    if (!authLoading && user && step === 1) {
      goForward();
    }
  }, [authLoading, user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Check if user already has API key
  useEffect(() => {
    if (user) {
      fetch("/api/settings")
        .then(r => r.json())
        .then(d => { if (d.hasKey) setHasKey(true); })
        .catch(() => {});
    }
  }, [user]);

  const goForward = () => { setDirection(1); setStep(s => Math.min(s + 1, TOTAL_STEPS - 1)); };
  const goBack = () => { setDirection(-1); setStep(s => Math.max(s - 1, 0)); };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(""); setAuthMessage(""); setAuthLoading2(true);
    if (!supabase) { setAuthError("Auth not configured"); setAuthLoading2(false); return; }

    if (authMode === "signup") {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) setAuthError(error.message);
      else setAuthMessage("Check your email for a confirmation link!");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setAuthError(error.message);
      else goForward();
    }
    setAuthLoading2(false);
  };

  const handleGoogle = async () => {
    if (!supabase) return;
    setAuthError("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/evaluate` },
    });
    if (error) setAuthError(error.message);
  };

  const handleSaveKey = async () => {
    setKeyError(""); setKeySaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ anthropicApiKey: apiKey }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setHasKey(true);
      setApiKey("");
    } catch (e: any) {
      setKeyError(e.message);
    }
    setKeySaving(false);
  };

  const handleSubmit = async () => {
    setSubmitError(""); setSubmitting(true);
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, twitter, linkedin, website, description }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push(data.slug ? `/@${data.slug}` : `/judge/${data.id}`);
    } catch (e: any) {
      setSubmitError(e.message);
      setSubmitting(false);
    }
  };

  const slideVariants = {
    enter: (d: number) => ({ x: d > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -80 : 80, opacity: 0 }),
  };

  const canProceed = () => {
    if (step === 0) return name.trim().length > 0 && !!(twitter || linkedin || website);
    if (step === 1) return !!user;
    if (step === 2) return hasKey;
    return false;
  };

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex flex-col"
    >
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <div className="h-0.5 bg-border">
          <motion.div
            className="h-full bg-accent"
            animate={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>
      </div>

      {step > 0 && (
        <div className="fixed top-6 left-6 z-40">
          <button onClick={goBack} className="text-ink/25 hover:text-ink/50 transition text-sm">← Back</button>
        </div>
      )}

      <div className="fixed top-6 right-6 z-40">
        <span className="text-ink/15 text-xs font-mono">{step + 1}/{TOTAL_STEPS}</span>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait" custom={direction}>

            {/* ── Step 1: About you ── */}
            {step === 0 && (
              <motion.div
                key="step-0"
                custom={direction}
                variants={slideVariants}
                initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="space-y-8"
              >
                <div>
                  <h1 className="font-serif text-3xl sm:text-4xl font-bold text-ink">
                    Let&apos;s see your taste
                  </h1>
                  <p className="mt-3 text-ink/35 text-sm leading-relaxed">
                    Everyone has taste. Most people never examine theirs.
                    We&apos;ll scrape your digital footprint and score you across 6 dimensions.
                  </p>
                </div>

                <div className="space-y-5">
                  <div>
                    <input
                      autoFocus
                      placeholder="Your name"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full px-0 py-3 bg-transparent border-0 border-b-2 border-border focus:border-accent focus:outline-none transition text-xl text-ink placeholder:text-ink/20 font-serif"
                    />
                  </div>

                  <div className="pt-2">
                    <p className="text-[11px] uppercase tracking-widest text-ink/25 mb-3">Where do you exist online?</p>
                    <div className="space-y-3">
                      <input
                        placeholder="@twitter or x.com/handle"
                        value={twitter}
                        onChange={e => setTwitter(e.target.value)}
                        className="w-full px-0 py-2 bg-transparent border-0 border-b border-border focus:border-accent focus:outline-none transition text-sm text-ink placeholder:text-ink/20"
                      />
                      <input
                        placeholder="LinkedIn profile URL"
                        value={linkedin}
                        onChange={e => setLinkedin(e.target.value)}
                        className="w-full px-0 py-2 bg-transparent border-0 border-b border-border focus:border-accent focus:outline-none transition text-sm text-ink placeholder:text-ink/20"
                      />
                      <input
                        placeholder="Website or portfolio"
                        value={website}
                        onChange={e => setWebsite(e.target.value)}
                        className="w-full px-0 py-2 bg-transparent border-0 border-b border-border focus:border-accent focus:outline-none transition text-sm text-ink placeholder:text-ink/20"
                      />
                    </div>
                  </div>

                  <div className="pt-1">
                    <textarea
                      placeholder="Anything the algorithm won't find? (optional)"
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      rows={2}
                      className="w-full px-0 py-2 bg-transparent border-0 border-b border-border focus:border-accent focus:outline-none transition text-sm text-ink placeholder:text-ink/20 resize-none"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={goForward}
                    disabled={!canProceed()}
                    className="px-8 py-3 bg-accent hover:bg-accent-hover disabled:opacity-30 disabled:cursor-not-allowed rounded-lg text-sm font-medium text-white transition-all"
                  >
                    Continue
                  </button>
                  {!canProceed() && name.trim() && (
                    <p className="text-ink/15 text-xs">Add at least one profile</p>
                  )}
                </div>
              </motion.div>
            )}

            {/* ── Step 2: Account ── */}
            {step === 1 && (
              <motion.div
                key="step-1"
                custom={direction}
                variants={slideVariants}
                initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="space-y-8"
              >
                {user ? (
                  <div className="text-center space-y-4">
                    <div className="w-12 h-12 rounded-full bg-olive/10 flex items-center justify-center mx-auto">
                      <span className="text-olive text-lg">✓</span>
                    </div>
                    <p className="text-ink/50 text-sm">Signed in as {user.email}</p>
                    <button onClick={goForward}
                      className="px-8 py-3 bg-accent hover:bg-accent-hover rounded-lg text-sm font-medium text-white transition-all">
                      Continue
                    </button>
                  </div>
                ) : (
                  <>
                    <div>
                      <h1 className="font-serif text-3xl sm:text-4xl font-bold text-ink">
                        Save your results
                      </h1>
                      <p className="mt-3 text-ink/35 text-sm leading-relaxed">
                        Your evaluation gets a permanent URL you can share.
                        Quick account — takes 10 seconds.
                      </p>
                    </div>

                    <div className="space-y-4">
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

                      <form onSubmit={handleAuth} className="space-y-3">
                        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required
                          className="w-full px-4 py-3 bg-canvas border border-border rounded-lg focus:outline-none focus:border-accent transition text-sm text-ink placeholder:text-ink/30" />
                        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
                          className="w-full px-4 py-3 bg-canvas border border-border rounded-lg focus:outline-none focus:border-accent transition text-sm text-ink placeholder:text-ink/30" />
                        {authError && <p className="text-score-low text-sm">{authError}</p>}
                        {authMessage && <p className="text-olive text-sm">{authMessage}</p>}
                        <button type="submit" disabled={authLoading2}
                          className="w-full py-3 bg-accent hover:bg-accent-hover disabled:opacity-50 rounded-lg font-medium text-sm text-white transition">
                          {authLoading2 ? "..." : authMode === "signup" ? "Create Account" : "Sign In"}
                        </button>
                      </form>

                      <p className="text-center text-xs text-ink/25">
                        {authMode === "signup" ? "Already have an account? " : "No account? "}
                        <button onClick={() => { setAuthMode(authMode === "signup" ? "signin" : "signup"); setAuthError(""); setAuthMessage(""); }}
                          className="text-accent hover:text-accent-hover transition">
                          {authMode === "signup" ? "Sign in" : "Sign up"}
                        </button>
                      </p>
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {/* ── Step 3: Key + Submit ── */}
            {step === 2 && (
              <motion.div
                key="step-2"
                custom={direction}
                variants={slideVariants}
                initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="space-y-8"
              >
                {!hasKey ? (
                  <>
                    <div>
                      <h1 className="font-serif text-3xl sm:text-4xl font-bold text-ink">
                        Bring your own key
                      </h1>
                      <p className="mt-3 text-ink/35 text-sm leading-relaxed">
                        Your evaluation is powered by Claude. Paste your Anthropic API key — it&apos;s encrypted and never stored in plain text.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="relative">
                        <input
                          type={showKey ? "text" : "password"}
                          placeholder="sk-ant-..."
                          value={apiKey}
                          onChange={e => setApiKey(e.target.value)}
                          className="w-full px-4 py-3 pr-16 bg-canvas border border-border rounded-lg focus:outline-none focus:border-accent transition text-sm text-ink placeholder:text-ink/30 font-mono"
                        />
                        <button type="button" onClick={() => setShowKey(!showKey)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink/30 hover:text-ink/50 transition">
                          {showKey ? "Hide" : "Show"}
                        </button>
                      </div>
                      <p className="text-xs text-ink/20">
                        Don&apos;t have one?{" "}
                        <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer"
                          className="text-accent hover:text-accent-hover transition">Get a key from Anthropic →</a>
                      </p>
                      {keyError && <p className="text-score-low text-sm">{keyError}</p>}
                      <button onClick={handleSaveKey} disabled={keySaving || !apiKey.trim()}
                        className="w-full py-3 bg-accent hover:bg-accent-hover disabled:opacity-30 disabled:cursor-not-allowed rounded-lg text-sm font-medium text-white transition-all">
                        {keySaving ? "Validating..." : "Validate & Save Key"}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <h1 className="font-serif text-3xl sm:text-4xl font-bold text-ink">
                        Ready?
                      </h1>
                      <p className="mt-3 text-ink/35 text-sm leading-relaxed">
                        200+ data points. 6 dimensions. 3 scoring passes each.
                        One brutally honest report. No appeals.
                      </p>
                    </div>

                    <div className="p-5 bg-card-bg border border-border rounded-xl space-y-2">
                      <p className="font-serif font-semibold text-ink">{name}</p>
                      <div className="text-xs text-ink/30 space-y-0.5">
                        {twitter && <p>X: {twitter}</p>}
                        {linkedin && <p>LinkedIn: {linkedin}</p>}
                        {website && <p>Web: {website}</p>}
                        {description && <p className="italic truncate">+ self-description</p>}
                      </div>
                      <div className="flex items-center gap-1.5 pt-1">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-olive" />
                        <span className="text-xs text-olive">API key ready</span>
                      </div>
                    </div>

                    {submitError && <p className="text-score-low text-sm">{submitError}</p>}

                    <button onClick={handleSubmit} disabled={submitting}
                      className="w-full py-4 bg-ink hover:bg-ink/90 disabled:opacity-50 rounded-lg font-medium text-sm text-white transition-all">
                      {submitting ? "Submitting..." : "Judge My Taste"}
                    </button>
                  </>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>

      <div className="pb-6 text-center">
        <a href="/" className="text-ink/15 text-xs hover:text-ink/30 transition">← Back to The Taste Bench</a>
      </div>
    </motion.main>
  );
}
