"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/components/AuthProvider";

export default function SettingsPage() {
  const router = useRouter();
  const { user, loading: authLoading, isConfigured } = useAuth();
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [hasKey, setHasKey] = useState(false);
  const [keyValidatedAt, setKeyValidatedAt] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!authLoading && !user && isConfigured) {
      router.push("/auth");
    }
  }, [authLoading, user, isConfigured, router]);

  useEffect(() => {
    if (user) {
      fetch("/api/settings")
        .then(r => r.json())
        .then(data => {
          setHasKey(data.hasKey);
          setKeyValidatedAt(data.keyValidatedAt);
        })
        .catch(() => {});
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ anthropicApiKey: apiKey }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setHasKey(true);
      setKeyValidatedAt(new Date().toISOString());
      setApiKey("");
      setSuccess("API key validated and saved!");
    } catch (e: any) {
      setError(e.message);
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    setError("");
    setSuccess("");
    setDeleting(true);
    try {
      const res = await fetch("/api/settings", { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete key");
      setHasKey(false);
      setKeyValidatedAt(null);
      setSuccess("API key removed.");
    } catch (e: any) {
      setError(e.message);
    }
    setDeleting(false);
  };

  if (authLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  if (!isConfigured) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-serif text-2xl font-semibold text-ink/60">Authentication not configured</h1>
          <p className="text-ink/30 text-sm mt-2">Settings require Supabase authentication.</p>
          <a href="/" className="text-accent mt-4 inline-block hover:text-accent-hover text-sm transition">← Back home</a>
        </div>
      </main>
    );
  }

  if (!user) return null; // Redirect in progress

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen py-16"
    >
      <div className="max-w-lg mx-auto px-6">
        <h1 className="font-serif text-3xl font-bold text-ink mb-2">Settings</h1>
        <p className="text-ink/40 text-sm mb-10">Manage your API key for running taste evaluations.</p>

        {/* Current status */}
        <div className="p-5 bg-card-bg border border-border rounded-xl mb-8">
          <p className="text-[11px] uppercase tracking-widest text-ink/25 mb-3">Anthropic API Key</p>
          {hasKey ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-olive" />
                <span className="text-sm text-olive font-medium">Key saved and validated</span>
              </div>
              {keyValidatedAt && (
                <p className="text-xs text-ink/25">Validated {new Date(keyValidatedAt).toLocaleDateString()}</p>
              )}
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="text-score-low text-xs hover:underline mt-2 disabled:opacity-50"
              >
                {deleting ? "Removing..." : "Remove key"}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-ink/20" />
              <span className="text-sm text-ink/40">No key saved</span>
            </div>
          )}
        </div>

        {/* Add / Replace key form */}
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm text-ink/60 mb-1.5">
              {hasKey ? "Replace API Key" : "Add Anthropic API Key"}
            </label>
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                placeholder="sk-ant-..."
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                className="w-full px-4 py-3 pr-16 bg-canvas border border-border rounded-lg focus:outline-none focus:border-accent transition text-sm text-ink placeholder:text-ink/30 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink/30 hover:text-ink/50 transition"
              >
                {showKey ? "Hide" : "Show"}
              </button>
            </div>
            <p className="text-xs text-ink/20 mt-1.5">
              Your key is encrypted at rest and never returned via the API.
              {" "}
              <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" className="text-accent hover:text-accent-hover transition">
                Get a key →
              </a>
            </p>
          </div>

          {error && <p className="text-score-low text-sm">{error}</p>}
          {success && <p className="text-olive text-sm">{success}</p>}

          <button
            type="submit"
            disabled={saving || !apiKey.trim()}
            className="w-full py-3 bg-accent hover:bg-accent-hover disabled:opacity-50 rounded-lg font-medium text-sm text-white transition-colors"
          >
            {saving ? "Validating..." : "Validate & Save Key"}
          </button>
        </form>

        <div className="mt-12 pt-8 border-t border-border">
          <a href="/" className="text-ink/30 hover:text-ink/50 text-sm transition">← Back to leaderboard</a>
        </div>
      </div>
    </motion.main>
  );
}
