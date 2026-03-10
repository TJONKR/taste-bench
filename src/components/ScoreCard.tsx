"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { ScoreResult } from "@/lib/types";
import { useAuth } from "./AuthProvider";
import ScoreRing from "./ScoreRing";
import DimensionBar from "./DimensionBar";

export default function ScoreCard({ data }: { data: ScoreResult }) {
  const dims = Object.entries(data.dimensions) as [string, { score: number; note: string }][];
  const { user, isConfigured } = useAuth();
  const [claimed, setClaimed] = useState(false);
  const [claiming, setClaiming] = useState(false);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
  };

  const handleClaim = async () => {
    setClaiming(true);
    try {
      const res = await fetch("/api/claim-evaluation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ evaluationId: data.id }),
      });
      if (res.ok) setClaimed(true);
    } catch {}
    setClaiming(false);
  };

  const showClaim = isConfigured && user && !claimed && !(data as any).userId;

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 space-y-16">
      {/* Header — Clean, minimal */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <img src={data.avatarUrl} alt={data.name} className="w-20 h-20 rounded-full object-cover border border-border mx-auto mb-6" />
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-ink">{data.name}</h1>
        <div className="mt-6">
          <ScoreRing score={data.score} size={140} />
        </div>
        {(data as any).overallLevel && (
          <p className="mt-4 text-sm font-medium text-accent">{(data as any).overallLevel}</p>
        )}
      </motion.div>

      {/* Title & Verdict — Editorial pull quote */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-center max-w-xl mx-auto"
      >
        <p className="font-serif text-xl sm:text-2xl italic text-ink/60">
          &ldquo;{data.title}&rdquo;
        </p>
        <div className="mt-6 border-t border-border pt-6">
          <p className="text-ink/50 leading-relaxed text-sm">{data.verdict}</p>
        </div>
      </motion.div>

      {/* Dimension Breakdown */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.1 }}
      >
        <p className="text-[11px] uppercase tracking-widest text-ink/25 mb-8">Dimension Breakdown</p>
        <div className="space-y-8">
          {dims.map(([key, dim], i) => (
            <div key={key}>
              <DimensionBar dimension={key} value={dim.score} level={(dim as any).level} delay={200 + i * 100} />
              {dim.note && (
                <p className="mt-3 text-sm text-ink/40 leading-relaxed">{dim.note}</p>
              )}
            </div>
          ))}
        </div>
      </motion.section>

      {/* Evidence — Screenshots */}
      {data.screenshots && data.screenshots.length > 0 && (
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <p className="text-[11px] uppercase tracking-widest text-ink/25 mb-6">Evidence</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.screenshots.map((ss, i) => (
              <div key={i} className="bg-card-bg border border-border rounded-lg overflow-hidden shadow-card">
                <img src={ss.url} alt={ss.source} className="w-full h-44 object-cover object-top" loading="lazy" />
                <div className="px-3 py-2">
                  <p className="text-[11px] text-ink/30">{ss.source}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.section>
      )}

      {/* Taste DNA */}
      {data.tasteDNA && (
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <p className="text-[11px] uppercase tracking-widest text-ink/25 mb-4">Taste DNA</p>
          <p className="text-ink/60 leading-relaxed">{data.tasteDNA}</p>
        </motion.section>
      )}

      {/* Cross-Platform Consistency */}
      {data.crossPlatformConsistency && (
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <p className="text-[11px] uppercase tracking-widest text-ink/25 mb-4">Cross-Platform Consistency</p>
          <p className="text-ink/60 leading-relaxed">{data.crossPlatformConsistency}</p>
          {(data as any).dataSources && (data as any).dataSources.length > 0 && (
            <p className="text-[10px] text-ink/20 mt-2">
              Based on: {(data as any).dataSources.join(", ")}
            </p>
          )}
        </motion.section>
      )}

      {/* Recommendations */}
      {data.recommendations && data.recommendations.length > 0 && (
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="border-t border-border pt-12"
        >
          <p className="text-[11px] uppercase tracking-widest text-ink/25 mb-6">Recommendations</p>
          <div className="space-y-4">
            {data.recommendations.map((rec, i) => (
              <div key={i} className="flex gap-4">
                <span className="font-serif text-xl font-bold text-accent/40">{i + 1}</span>
                <p className="text-ink/60 text-sm leading-relaxed pt-1">{rec}</p>
              </div>
            ))}
          </div>
        </motion.section>
      )}

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex flex-wrap gap-3 justify-center pt-4 border-t border-border"
      >
        {showClaim && (
          <button onClick={handleClaim} disabled={claiming}
            className="px-5 py-2.5 bg-olive hover:bg-olive/80 text-white disabled:opacity-50 rounded-lg text-sm transition-colors">
            {claiming ? "Claiming..." : "Claim This Evaluation"}
          </button>
        )}
        {claimed && (
          <span className="px-5 py-2.5 text-olive text-sm font-medium">✓ Claimed</span>
        )}
        {isConfigured && !user && (
          <a href="/auth" className="px-5 py-2.5 border border-olive/30 hover:border-olive rounded-lg text-sm transition text-olive">
            Sign in to claim
          </a>
        )}
        <button onClick={copyLink} className="px-5 py-2.5 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm transition-colors">
          Share Report
        </button>
        <a href="/" className="px-5 py-2.5 border border-border hover:border-ink/20 rounded-lg text-sm text-ink/50 hover:text-ink transition">
          Back to Leaderboard
        </a>
      </motion.div>
    </div>
  );
}
