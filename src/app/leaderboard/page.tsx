"use client";
import { useEffect, useState } from "react";
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

export default function LeaderboardPage() {
  const router = useRouter();
  const [data, setData] = useState<ScoreResult[]>([]);
  const [sortBy, setSortBy] = useState<SortKey>("score");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");

  useEffect(() => {
    fetch("/api/leaderboard").then(r => r.json()).then(setData).catch(() => {});
  }, []);

  const sorted = [...data].sort((a, b) => {
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

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen max-w-6xl mx-auto px-6 py-12"
    >
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="font-serif text-2xl font-semibold">Taste Leaderboard</h1>
          <p className="text-ink/30 text-sm mt-1">{data.length} evaluation{data.length !== 1 ? "s" : ""} · no appeals</p>
        </div>
        <a href="/" className="text-accent hover:text-accent-hover text-sm transition">Get Judged →</a>
      </div>

      {data.length === 0 ? (
        <p className="text-ink/30 text-center py-20 font-light">No one has been judged yet.</p>
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
                <th className="text-left py-4 px-3 text-ink/30 text-[11px] uppercase tracking-widest font-normal hidden md:table-cell">Title</th>
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
                      <img src={s.avatarUrl} alt="" className="w-7 h-7 rounded-full object-cover border border-border hidden sm:block" />
                      <span className="font-medium text-ink truncate max-w-[140px]">{s.name}</span>
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
                  <td className="py-4 px-3 text-ink/30 text-xs italic truncate max-w-[180px] hidden md:table-cell">{s.title}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.main>
  );
}
