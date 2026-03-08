"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { ScoreResult } from "@/lib/types";
import ScoreCard from "@/components/ScoreCard";

export default function ScorePage() {
  const { id } = useParams();
  const [data, setData] = useState<ScoreResult | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/score/${id}`)
      .then(r => { if (!r.ok) throw new Error("Not found"); return r.json(); })
      .then(setData)
      .catch(e => setError(e.message));
  }, [id]);

  if (error) return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="font-serif text-2xl font-semibold text-score-low">Score not found</h1>
        <a href="/" className="text-accent mt-4 inline-block hover:text-accent-hover text-sm transition">← Back home</a>
      </div>
    </main>
  );

  if (!data) return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    </main>
  );

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen py-8"
    >
      <ScoreCard data={data} />
    </motion.main>
  );
}
