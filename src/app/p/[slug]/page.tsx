"use client";
import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ScoreResult, StatusResponse } from "@/lib/types";
import ScoreCard from "@/components/ScoreCard";

const STEP_ORDER = [
  "deep-research",
  "analyzing",
  "writing-report",
] as const;

const STEP_LABELS: Record<string, string> = {
  "deep-research": "Deep research in progress",
  "analyzing": "Scoring 6 taste dimensions (3x each)",
  "writing-report": "Writing editorial report",
};

function stepLabel(status: StatusResponse, stepKey: string): string {
  const base = STEP_LABELS[stepKey] || stepKey;
  if (!status.stats) return base;

  if (stepKey === "deep-research") {
    const parts: string[] = [];
    if (status.stats.tweetCount) parts.push(`${status.stats.tweetCount} tweets`);
    if (status.stats.linkedinPostCount) parts.push(`${status.stats.linkedinPostCount} posts`);
    if (status.stats.screenshotsCaptured) parts.push(`${status.stats.screenshotsCaptured} screenshots`);
    const currentAction = (status.stats as any).currentAction;
    if (currentAction) return currentAction;
    if (parts.length > 0) return `Researching — found ${parts.join(", ")} so far`;
    return "Deep research — scraping profiles, searching the web";
  }
  return base;
}

type PageState = "loading" | "in-progress" | "complete" | "not-found" | "error";

export default function ProfilePage() {
  const { slug } = useParams();
  const [pageState, setPageState] = useState<PageState>("loading");
  const [score, setScore] = useState<ScoreResult | null>(null);
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [showTransition, setShowTransition] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      // First, try to load completed score
      const scoreRes = await fetch(`/api/score/${slug}`);
      if (scoreRes.ok) {
        const data = await scoreRes.json();
        if (!cancelled) {
          setScore(data);
          setPageState("complete");
        }
        return;
      }

      // Not complete — check pending status
      const statusRes = await fetch(`/api/status/${slug}`);
      if (!statusRes.ok) {
        if (!cancelled) setPageState("not-found");
        return;
      }

      const statusData: StatusResponse = await statusRes.json();
      if (statusData.status === "complete") {
        // Just finished — fetch score
        const retryRes = await fetch(`/api/score/${slug}`);
        if (retryRes.ok) {
          const data = await retryRes.json();
          if (!cancelled) {
            setScore(data);
            setPageState("complete");
          }
          return;
        }
      }

      if (statusData.status === "error") {
        if (!cancelled) {
          setErrorMsg(statusData.error || "Something went wrong");
          setPageState("error");
        }
        return;
      }

      // In progress — start polling
      if (!cancelled) {
        setStatus(statusData);
        const idx = STEP_ORDER.indexOf(statusData.status as any);
        if (idx >= 0) setCurrentStepIdx(idx);
        setPageState("in-progress");
        startPolling();
      }
    };

    const startPolling = () => {
      pollRef.current = setInterval(async () => {
        try {
          const res = await fetch(`/api/status/${slug}`);
          if (!res.ok) return;
          const data: StatusResponse = await res.json();

          if (data.status === "complete") {
            clearInterval(pollRef.current);
            // Fetch the score
            const scoreRes = await fetch(`/api/score/${slug}`);
            if (scoreRes.ok) {
              const scoreData = await scoreRes.json();
              if (!cancelled) {
                setStatus(data);
                setCurrentStepIdx(STEP_ORDER.length);
                setShowTransition(true);
                // Brief pause for transition animation
                setTimeout(() => {
                  setScore(scoreData);
                  setPageState("complete");
                }, 1500);
              }
            }
            return;
          }

          if (data.status === "error") {
            clearInterval(pollRef.current);
            if (!cancelled) {
              setErrorMsg(data.error || "Something went wrong");
              setPageState("error");
            }
            return;
          }

          if (!cancelled) {
            setStatus(data);
            const idx = STEP_ORDER.indexOf(data.status as any);
            if (idx >= 0) setCurrentStepIdx(idx);
          }
        } catch {}
      }, 2000);
    };

    init();

    // 5-minute timeout
    const timeout = setTimeout(() => {
      clearInterval(pollRef.current);
    }, 300000);

    return () => {
      cancelled = true;
      clearInterval(pollRef.current);
      clearTimeout(timeout);
    };
  }, [slug]);

  // Loading state
  if (pageState === "loading") {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  // Not found — show as empty profile page
  if (pageState === "not-found") {
    const nameFromSlug = typeof slug === "string" ? slug.replace(/-/g, " ") : "";
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="font-serif text-2xl font-semibold text-ink capitalize">{nameFromSlug}</h1>
          <p className="text-ink/30 text-sm">No evaluation yet.</p>
          <a
            href={`/evaluate?name=${encodeURIComponent(nameFromSlug)}`}
            className="inline-block px-6 py-2.5 bg-accent hover:bg-accent-hover rounded-lg text-sm font-medium text-white transition-all"
          >
            Evaluate {nameFromSlug || "this person"}
          </a>
        </div>
      </main>
    );
  }

  // Error state
  if (pageState === "error") {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full px-6 text-center space-y-6">
          <h1 className="font-serif text-2xl font-semibold text-ink">Analysis Failed</h1>
          <div className="p-5 bg-score-low/10 border border-score-low/20 rounded-lg">
            <p className="text-score-low text-sm">{errorMsg}</p>
          </div>
          <a href="/" className="text-accent hover:text-accent-hover text-sm transition inline-block">← Try again</a>
        </div>
      </main>
    );
  }

  // Completed evaluation — full score card
  if (pageState === "complete" && score) {
    return (
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="min-h-screen py-8"
      >
        <ScoreCard data={score} />
      </motion.main>
    );
  }

  // In-progress state — progressive pipeline tracker
  const name = status?.name || (typeof slug === "string" ? slug.replace(/-/g, " ") : "");

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex items-center justify-center"
    >
      <div className="max-w-md w-full px-6 text-center space-y-12">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-ink capitalize mb-2">{name}</h1>
          <p className="text-ink/30 text-sm">Deep analysis in progress. Each dimension scored 3x for consistency.</p>
        </div>

        <AnimatePresence>
          {showTransition ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-8 text-center"
            >
              <p className="text-accent font-serif text-xl font-semibold">Analysis complete!</p>
              <p className="text-ink/30 text-sm mt-2">Loading results...</p>
            </motion.div>
          ) : (
            <div className="space-y-2 text-left">
              {STEP_ORDER.map((stepKey, i) => {
                const isCompleted = i < currentStepIdx;
                const isCurrent = i === currentStepIdx;
                const label = status
                  ? (isCompleted || isCurrent ? stepLabel(status, stepKey) : STEP_LABELS[stepKey])
                  : STEP_LABELS[stepKey];

                return (
                  <motion.div
                    key={stepKey}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`flex items-center gap-3 py-3 px-4 rounded-lg transition-all duration-500 ${
                      isCompleted
                        ? "bg-olive/5"
                        : isCurrent
                        ? "bg-accent/5"
                        : ""
                    }`}
                  >
                    <span className="text-sm w-6 text-center flex-shrink-0">
                      {isCompleted ? (
                        <span className="text-olive">✓</span>
                      ) : isCurrent ? (
                        <span className="inline-block w-1.5 h-1.5 bg-accent rounded-full animate-pulse-subtle" />
                      ) : (
                        <span className="inline-block w-1.5 h-1.5 bg-ink/10 rounded-full" />
                      )}
                    </span>
                    <span className={`text-sm ${
                      isCompleted ? "text-olive" :
                      isCurrent ? "text-ink font-medium" :
                      "text-ink/20"
                    }`}>
                      {label}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          )}
        </AnimatePresence>

        {/* Progress bar */}
        {!showTransition && (
          <div className="w-full bg-border rounded-full h-0.5 overflow-hidden">
            <motion.div
              className="h-full bg-accent rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(((currentStepIdx + 1) / STEP_ORDER.length) * 100, 100)}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
        )}
      </div>
    </motion.main>
  );
}
