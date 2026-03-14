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

  const [copied, setCopied] = useState(false);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const [generatingTweet, setGeneratingTweet] = useState(false);
  const isAdmin = user?.email === "tijs@lerai.nl";

  // Regular users: template tweet
  const shareToTwitter = () => {
    const score = Math.round(data.score);
    const url = window.location.href;
    const text = `I scored ${score}/100 on The Taste Bench — "${data.title}"\n\nCheck your own taste →`;
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(tweetUrl, "_blank", "noopener,noreferrer");
  };

  // Admin only: AI-generated provocative tweet about this person
  const adminShareToTwitter = async () => {
    setGeneratingTweet(true);
    try {
      const slug = data.slug || data.id;
      const res = await fetch(`/api/generate-tweet/${slug}`);
      if (res.ok) {
        const { tweet, url } = await res.json();
        const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet)}&url=${encodeURIComponent(url)}`;
        window.open(tweetUrl, "_blank", "noopener,noreferrer");
      }
    } catch {}
    setGeneratingTweet(false);
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
          <div className="space-y-4">
            {data.screenshots.filter(ss => !ss.source.includes("Profile Picture")).map((ss, i) => {
              const isWide = ss.source.includes("Banner") || ss.source.includes("Website") || ss.source.includes("Twitter");
              return (
                <div key={i} className={`bg-card-bg border border-border rounded-lg overflow-hidden shadow-card ${!isWide ? "max-w-sm" : ""}`}>
                  <img src={ss.url} alt={ss.source} className={`w-full ${isWide ? "h-48 sm:h-64" : "h-44"} object-cover object-top`} loading="lazy" />
                  <div className="px-3 py-2">
                    <p className="text-[11px] text-ink/30">{ss.source}</p>
                  </div>
                </div>
              );
            })}
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
        <button onClick={shareToTwitter} className="px-5 py-2.5 bg-[#0f1419] hover:bg-[#2a2a2a] text-white rounded-lg text-sm transition-colors flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          Share on X
        </button>
        {isAdmin && (
          <button onClick={adminShareToTwitter} disabled={generatingTweet} className="px-5 py-2.5 bg-accent hover:bg-accent-hover disabled:opacity-50 text-white rounded-lg text-sm transition-colors flex items-center gap-2">
            ⚡ {generatingTweet ? "AI writing..." : "AI Tweet (admin)"}
          </button>
        )}
        <button onClick={copyLink} className="px-5 py-2.5 border border-border hover:border-ink/20 rounded-lg text-sm text-ink/50 hover:text-ink transition flex items-center gap-2">
          {copied ? "✓ Copied!" : "Copy Link"}
        </button>
        <a href="/" className="px-5 py-2.5 border border-border hover:border-ink/20 rounded-lg text-sm text-ink/50 hover:text-ink transition">
          Back to Leaderboard
        </a>
      </motion.div>
    </div>
  );
}
