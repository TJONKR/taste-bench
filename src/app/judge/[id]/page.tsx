"use client";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";

const STATUS_MAP: Record<string, { step: number; label: string }> = {
  "scraping-twitter": { step: 0, label: "Scraping 200 tweets from X..." },
  "scraping-linkedin": { step: 1, label: "Reading 30 LinkedIn posts..." },
  "scraping-website": { step: 2, label: "Fetching website content..." },
  "deep-research": { step: 3, label: "Researching articles & mentions..." },
  "capturing-screenshots": { step: 4, label: "Capturing screenshots..." },
  "verifying-data": { step: 5, label: "Verifying & cleaning data..." },
  "analyzing": { step: 6, label: "Scoring taste dimensions..." },
  "writing-report": { step: 7, label: "Writing editorial report..." },
  "complete": { step: 8, label: "Done!" },
};

const steps = [
  { label: "Scraping 200 tweets from X..." },
  { label: "Reading 30 LinkedIn posts..." },
  { label: "Fetching website content..." },
  { label: "Deep research — articles & mentions..." },
  { label: "Capturing screenshots..." },
  { label: "Verifying & cleaning data..." },
  { label: "Scoring taste dimensions..." },
  { label: "Writing editorial report..." },
];

export default function JudgePage() {
  const { id } = useParams();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [statusText, setStatusText] = useState("Starting analysis...");
  const [error, setError] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    let redirected = false;

    const poll = async () => {
      try {
        const res = await fetch(`/api/status/${id}`);
        const data = await res.json();

        if (data.status === "complete" || data.status === "not-found") {
          const scoreRes = await fetch(`/api/score/${id}`);
          if (scoreRes.ok) {
            if (!redirected) {
              redirected = true;
              setCurrentStep(8);
              setStatusText("Analysis complete!");
              setTimeout(() => router.push(`/score/${id}`), 1000);
            }
            return;
          }
        }

        if (data.status === "error") {
          setError(data.error || "Something went wrong");
          return;
        }

        const mapped = STATUS_MAP[data.status];
        if (mapped) {
          setCurrentStep(mapped.step);
          setStatusText(mapped.label);
        }
      } catch {}
    };

    poll();
    pollRef.current = setInterval(poll, 2000);

    const timeout = setTimeout(() => {
      if (!redirected) { redirected = true; router.push(`/score/${id}`); }
    }, 300000); // 5 min timeout (3-pass self-consistency + vision takes longer)

    return () => { clearInterval(pollRef.current); clearTimeout(timeout); };
  }, [id, router]);

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex items-center justify-center"
    >
      <div className="max-w-md w-full px-6 text-center space-y-12">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-ink mb-2">Deep Analysis in Progress</h1>
          <p className="text-ink/30 text-sm">This takes 1–3 minutes. Each dimension is scored 3 times for consistency.</p>
        </div>

        {error ? (
          <div className="p-5 bg-score-low/10 border border-score-low/20 rounded-lg">
            <p className="text-score-low text-sm">{error}</p>
            <button onClick={() => router.push("/")} className="mt-3 text-sm text-accent hover:text-accent-hover transition">Try again</button>
          </div>
        ) : (
          <>
            <div className="space-y-2 text-left">
              {steps.map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`flex items-center gap-3 py-3 px-4 rounded-lg transition-all duration-500 ${
                    i < currentStep
                      ? "bg-olive/5"
                      : i === currentStep
                      ? "bg-accent/5"
                      : ""
                  }`}
                >
                  <span className="text-sm w-6 text-center flex-shrink-0">
                    {i < currentStep ? (
                      <span className="text-olive">✓</span>
                    ) : i === currentStep ? (
                      <span className="inline-block w-1.5 h-1.5 bg-accent rounded-full animate-pulse-subtle" />
                    ) : (
                      <span className="inline-block w-1.5 h-1.5 bg-ink/10 rounded-full" />
                    )}
                  </span>
                  <span className={`text-sm ${
                    i < currentStep ? "text-olive" :
                    i === currentStep ? "text-ink font-medium" :
                    "text-ink/20"
                  }`}>
                    {i === currentStep ? statusText : s.label}
                  </span>
                </motion.div>
              ))}
            </div>

            {/* Progress bar */}
            <div className="w-full bg-border rounded-full h-0.5 overflow-hidden">
              <motion.div
                className="h-full bg-accent rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(((currentStep + 1) / steps.length) * 100, 100)}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </>
        )}
      </div>
    </motion.main>
  );
}
