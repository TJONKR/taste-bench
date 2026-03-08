"use client";
import { useEffect, useState } from "react";

function getScoreColor(v: number): string {
  if (v >= 70) return "#B8860B";
  if (v >= 40) return "#708090";
  return "#C47D7D";
}

export default function ScoreRing({ score, size = 180 }: { score: number; size?: number }) {
  const [displayed, setDisplayed] = useState(0);
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (displayed / 100) * circumference;
  const color = getScoreColor(displayed);

  useEffect(() => {
    let current = 0;
    const interval = setInterval(() => {
      current += 1;
      if (current > score) { clearInterval(interval); return; }
      setDisplayed(current);
    }, 20);
    return () => clearInterval(interval);
  }, [score]);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={radius} stroke="#E8E5E0" strokeWidth={strokeWidth} fill="none" />
        <circle
          cx={size/2} cy={size/2} r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          style={{ transition: "stroke-dashoffset 0.1s ease, stroke 0.3s ease" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="font-serif text-5xl font-bold" style={{ color }}>{displayed}</span>
        <span className="text-[10px] text-ink/25 uppercase tracking-widest">/ 100</span>
      </div>
    </div>
  );
}
