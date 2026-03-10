"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const labels: Record<string, string> = {
  curation: "Curation",
  restraint: "Restraint",
  originality: "Originality",
  conviction: "Conviction",
  identity: "Identity",
  selfAwareness: "Self-awareness",
};

function scoreColor(v: number): string {
  if (v >= 70) return "#B8860B";
  if (v >= 40) return "#708090";
  return "#C47D7D";
}

function scoreTextClass(v: number): string {
  if (v >= 70) return "text-score-high";
  if (v >= 40) return "text-score-mid";
  return "text-score-low";
}

export default function DimensionBar({ dimension, value, level, delay = 0 }: { dimension: string; value: number; level?: string; delay?: number }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: delay / 1000 }}
      className="space-y-2"
    >
      <div className="flex justify-between items-baseline">
        <span className="font-serif text-sm font-semibold text-ink">
          {labels[dimension] || dimension}
          {level && (
            <span className="ml-2 text-[10px] font-mono font-normal text-ink/40 border border-ink/20 rounded px-1 py-0.5">{level}</span>
          )}
        </span>
        <span className={`font-serif text-xl font-bold ${scoreTextClass(value)}`}>{value.toFixed(2)}</span>
      </div>
      <div className="h-1 bg-border rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${width}%`, backgroundColor: scoreColor(value) }}
        />
      </div>
    </motion.div>
  );
}
