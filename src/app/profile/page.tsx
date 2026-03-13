"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/components/AuthProvider";
import { ScoreResult } from "@/lib/types";

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [evaluations, setEvaluations] = useState<ScoreResult[]>([]);
  const [loadingEvals, setLoadingEvals] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push("/auth");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    fetch("/api/my-evaluations")
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setEvaluations(data); })
      .catch(() => {})
      .finally(() => setLoadingEvals(false));
  }, [user]);

  if (loading || !user) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen max-w-3xl mx-auto px-6 py-12"
    >
      <h1 className="font-serif text-2xl font-semibold mb-1">Your Profile</h1>
      <p className="text-sm text-ink/30 mb-10">{user.email}</p>

      <p className="text-[11px] uppercase tracking-widest text-ink/25 mb-6">Your Evaluations</p>

      {loadingEvals ? (
        <p className="text-ink/30 text-sm">Loading...</p>
      ) : evaluations.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-ink/30">No evaluations claimed yet.</p>
          <p className="text-sm text-ink/20 mt-2">Get judged and claim your evaluation to see it here.</p>
          <a href="/" className="inline-block mt-4 text-accent hover:text-accent-hover text-sm transition">Get Judged →</a>
        </div>
      ) : (
        <div className="space-y-3">
          {evaluations.map((ev, i) => (
            <motion.div
              key={ev.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => router.push(ev.slug ? `/@${ev.slug}` : `/score/${ev.id}`)}
              className="flex items-center gap-4 p-5 bg-card-bg border border-border rounded-xl cursor-pointer hover:shadow-card-hover transition shadow-card"
            >
              <img src={ev.avatarUrl} alt="" className="w-12 h-12 rounded-full object-cover border border-border" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-ink truncate">{ev.name}</p>
                <p className="text-xs text-ink/30 italic truncate">{ev.title}</p>
              </div>
              <div className="font-serif text-2xl font-bold text-score-high">{ev.score}</div>
            </motion.div>
          ))}
        </div>
      )}

      <div className="mt-10 text-center">
        <a href="/" className="text-sm text-ink/25 hover:text-accent transition">← Back home</a>
      </div>
    </motion.main>
  );
}
