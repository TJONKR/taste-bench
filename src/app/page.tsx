"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ScoreResult } from "@/lib/types";

type SortKey = "score" | "curation" | "intentionality" | "originality" | "conviction" | "identity" | "selfAwareness";
const dimKey = (k: SortKey) => k as keyof ScoreResult["dimensions"];

function scoreColor(v: number): string {
  if (v >= 70) return "text-score-high";
  if (v >= 40) return "text-score-mid";
  return "text-score-low";
}

export default function Home() {
  const router = useRouter();
  const [leaderboard, setLeaderboard] = useState<ScoreResult[]>([]);
  const [sortBy, setSortBy] = useState<SortKey>("score");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");

  useEffect(() => {
    fetch("/api/leaderboard").then(r => r.json()).then(setLeaderboard).catch(() => {});
  }, []);

  const totalJudged = leaderboard.length;
  const avgScore = totalJudged > 0
    ? (leaderboard.reduce((s, r) => s + r.score, 0) / totalJudged).toFixed(2)
    : "0.00";

  const sorted = [...leaderboard].sort((a, b) => {
    const av = sortBy === "score" ? a.score : (a.dimensions[dimKey(sortBy)]?.score ?? 0);
    const bv = sortBy === "score" ? b.score : (b.dimensions[dimKey(sortBy)]?.score ?? 0);
    return sortDir === "desc" ? bv - av : av - bv;
  });

  const handleSort = (key: SortKey) => {
    if (sortBy === key) setSortDir(d => d === "desc" ? "asc" : "desc");
    else { setSortBy(key); setSortDir("desc"); }
  };

  const rankLabel = (i: number) => {
    if (i === 0) return "border-l-2 border-l-score-high";
    if (i === 1) return "border-l-2 border-l-score-mid";
    if (i === 2) return "border-l-2 border-l-[#CD7F32]";
    return "";
  };

  const cols: { key: SortKey; label: string }[] = [
    { key: "score", label: "Score" },
    { key: "curation", label: "Cur" },
    { key: "intentionality", label: "Int" },
    { key: "originality", label: "Orig" },
    { key: "conviction", label: "Conv" },
    { key: "identity", label: "Iden" },
    { key: "selfAwareness", label: "Self" },
  ];

  // Featured evaluation (highest scored)
  const featured = leaderboard.length > 0 ? [...leaderboard].sort((a, b) => b.score - a.score)[0] : null;

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen"
    >
      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-20 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="font-serif text-5xl sm:text-6xl lg:text-7xl font-bold text-ink tracking-tight"
        >
          The Taste Bench
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mt-4 text-ink/40 text-lg sm:text-xl font-light"
        >
          How good is your taste, really?
        </motion.p>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8"
        >
          <a
            href="/evaluate"
            className="text-accent hover:text-accent-hover transition text-sm font-medium tracking-wide inline-flex items-center gap-1.5"
          >
            Get Judged <span className="text-base">→</span>
          </a>
        </motion.div>

        {totalJudged > 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-3 text-ink/25 text-xs tracking-wide"
          >
            {totalJudged} evaluated · avg {avgScore}/100 · 6 dimensions · no appeals
          </motion.p>
        )}
      </section>

      {/* Leaderboard Section */}
      <section className="max-w-6xl mx-auto px-6 pb-16">
        {leaderboard.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-ink/30 text-lg font-light">No one has been judged yet.</p>
            <a href="/evaluate" className="mt-4 text-accent hover:text-accent-hover text-sm transition inline-block">
              Be the first →
            </a>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-4 px-3 text-ink/30 text-[11px] uppercase tracking-widest font-normal w-12">#</th>
                  <th className="text-left py-4 px-3 text-ink/30 text-[11px] uppercase tracking-widest font-normal">Name</th>
                  {cols.map(c => (
                    <th key={c.key} onClick={() => handleSort(c.key)}
                      className="text-right py-4 px-3 text-ink/30 text-[11px] uppercase tracking-widest font-normal cursor-pointer hover:text-ink transition whitespace-nowrap select-none">
                      {c.label} {sortBy === c.key ? (sortDir === "desc" ? "↓" : "↑") : ""}
                    </th>
                  ))}
                  <th className="text-left py-4 px-3 text-ink/30 text-[11px] uppercase tracking-widest font-normal hidden lg:table-cell">Title</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((s, i) => (
                  <motion.tr
                    key={s.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.04 }}
                    onClick={() => router.push(s.slug ? `/@${s.slug}` : `/score/${s.id}`)}
                    className={`border-b border-border/50 cursor-pointer hover:bg-ink/[0.02] transition ${rankLabel(i)}`}
                  >
                    <td className="py-4 px-3 font-serif font-bold text-ink/40 text-center">{i + 1}</td>
                    <td className="py-4 px-3">
                      <div className="flex items-center gap-3">
                        <img src={s.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover border border-border" />
                        <div className="min-w-0">
                          <p className="font-medium text-ink truncate max-w-[160px]">{s.name}</p>
                        </div>
                      </div>
                    </td>
                    {cols.map(c => {
                      const v = c.key === "score" ? s.score : (s.dimensions[dimKey(c.key)]?.score ?? 0);
                      return (
                        <td key={c.key} className={`py-4 px-3 text-right font-serif font-bold ${c.key === "score" ? "text-base" : "text-xs"} ${scoreColor(v)}`}>
                          {typeof v === "number" ? v.toFixed(2) : v}
                        </td>
                      );
                    })}
                    <td className="py-4 px-3 text-ink/35 text-xs italic truncate max-w-[200px] hidden lg:table-cell">{s.title}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* What Is Taste? — Manifesto */}
      <section className="max-w-3xl mx-auto px-6 py-20 border-t border-border">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="font-serif text-3xl font-semibold text-center mb-8">What Is Taste?</h2>
          <div className="space-y-4 text-ink/50 text-[15px] leading-relaxed">
            <p>
              Taste is the invisible hand behind every choice you make in public. It&apos;s not about what you like — it&apos;s about <em className="text-ink/70">how</em> you like it, <em className="text-ink/70">why</em> you like it, and whether those choices form a coherent identity.
            </p>
            <p>
              In the digital age, taste is expressed through what you post and what you don&apos;t. What you share, retweet, and amplify. How you write — word choice, economy, tone. Your visual aesthetic. Your references. Your opinions.
            </p>
            <p>
              Everyone has taste. Most people&apos;s is unconscious. The Taste Bench makes it visible.
            </p>
            <p className="text-ink/30 text-sm pt-2">
              We evaluate across six dimensions: Curation, Intentionality, Originality, Conviction, Identity, and Self-Awareness.
              {" "}
              <a href="/methodology" className="text-accent hover:text-accent-hover transition underline underline-offset-2">Read our full methodology →</a>
            </p>
          </div>
        </motion.div>
      </section>

      {/* How It Works */}
      {leaderboard.length > 0 && (
        <section className="max-w-4xl mx-auto px-6 py-20 border-t border-border">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="font-serif text-2xl font-semibold text-center mb-12"
          >
            How It Works
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { num: "01", title: "Submit", desc: "Share your name and public profiles — Twitter, LinkedIn, website, anything." },
              { num: "02", title: "Deep Research", desc: "AI scrapes 200+ posts, captures screenshots, and researches your digital footprint." },
              { num: "03", title: "The Verdict", desc: "A brutally honest taste audit across 6 dimensions. No appeals, no refunds." },
            ].map((s, i) => (
              <motion.div
                key={s.num}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <span className="font-serif text-4xl font-bold text-ink/10">{s.num}</span>
                <h3 className="font-serif text-lg font-semibold mt-2 mb-2">{s.title}</h3>
                <p className="text-ink/40 text-sm leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Featured Evaluation */}
      {featured && (
        <section className="max-w-4xl mx-auto px-6 py-16 border-t border-border">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-[11px] uppercase tracking-widest text-ink/25 mb-6 text-center">Highest Scored</p>
            <div
              onClick={() => router.push(featured.slug ? `/@${featured.slug}` : `/score/${featured.id}`)}
              className="bg-card-bg border border-border rounded-xl p-8 shadow-card hover:shadow-card-hover transition cursor-pointer"
            >
              <div className="flex items-start gap-6">
                <img src={featured.avatarUrl} alt="" className="w-16 h-16 rounded-full object-cover border border-border" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-4">
                    <h3 className="font-serif text-xl font-semibold">{featured.name}</h3>
                    <span className="font-serif text-2xl font-bold text-score-high">{featured.score.toFixed(2)}</span>
                  </div>
                  <p className="font-serif text-sm italic text-ink/40 mt-1">&ldquo;{featured.title}&rdquo;</p>
                  <p className="text-sm text-ink/50 mt-3 leading-relaxed line-clamp-3">{featured.verdict}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </section>
      )}

      {/* Footer */}
      <footer className="max-w-6xl mx-auto px-6 py-12 border-t border-border text-center">
        <p className="text-ink/20 text-xs tracking-wide">
          <a href="/methodology" className="hover:text-ink/40 transition">Methodology</a>
          {" · "}
          {totalJudged} evaluation{totalJudged !== 1 ? "s" : ""} and counting
          {" · "}
          <span>Built with Claude</span>
        </p>
      </footer>
    </motion.main>
  );
}
