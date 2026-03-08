"use client";
import { motion } from "framer-motion";

const dimensions = [
  {
    name: "References",
    weight: "15%",
    question: "Do you cite interesting sources or just trending ones?",
    high: "Surfaces things others haven't seen. Cross-domain references. Primary sources.",
    low: "Exclusively trending content. Zero original discovery.",
  },
  {
    name: "Originality",
    weight: "20%",
    question: "Are you setting trends or following?",
    high: "Genuinely creates new ideas, formats, or perspectives. Unmistakable voice.",
    low: "Copy-paste culture. Could be anyone.",
  },
  {
    name: "Consistency",
    weight: "15%",
    question: "Does your aesthetic hold across platforms?",
    high: "Perfect cross-platform coherence. Same person everywhere.",
    low: "Completely fragmented identity. Platform-dependent personality.",
  },
  {
    name: "Communication",
    weight: "20%",
    question: "Economy of words, clarity vs noise?",
    high: "Every post is tight. Memorable phrasing. Says what others can't articulate.",
    low: "Noise. Word salad. 'Thrilled to announce' energy.",
  },
  {
    name: "Courage",
    weight: "15%",
    question: "Do you have actual opinions or just safe takes?",
    high: "Genuinely controversial positions, well-defended. Intellectual courage.",
    low: "Zero edge. Pure consensus. 'I love this community' energy.",
  },
  {
    name: "Self-Awareness",
    weight: "15%",
    question: "Do you know what you are?",
    high: "Perfectly calibrated self-image. Knows exactly what they are.",
    low: "Complete disconnect. Performance ≠ reality.",
  },
];

const tiers = [
  { range: "90–100", name: "Legendary", desc: "Genuine tastemaker. Sets the standard." },
  { range: "80–89", name: "Exceptional", desc: "Strong taste with few weaknesses." },
  { range: "70–79", name: "Tasteful", desc: "Above average with room to sharpen." },
  { range: "60–69", name: "Developing", desc: "Shows promise but inconsistent." },
  { range: "50–59", name: "Mid", desc: "Neither impressive nor offensive." },
  { range: "40–49", name: "Basic", desc: "Following trends, not setting them." },
  { range: "30–39", name: "Struggling", desc: "Significant taste gaps across dimensions." },
  { range: "0–29", name: "Tasteless", desc: "Algorithmically generated persona." },
];

export default function MethodologyPage() {
  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen max-w-3xl mx-auto px-6 py-16"
    >
      <a href="/" className="text-ink/25 text-sm hover:text-ink/40 transition">← Back</a>

      <h1 className="font-serif text-4xl sm:text-5xl font-bold mt-8 mb-4">Methodology</h1>
      <p className="text-ink/40 text-sm mb-16">How we measure taste. v0.1 — March 2026</p>

      {/* What Is Taste */}
      <section className="mb-16">
        <h2 className="font-serif text-2xl font-semibold mb-4">What Is Taste?</h2>
        <div className="space-y-4 text-ink/55 text-[15px] leading-relaxed">
          <p>
            Taste is the invisible hand behind every choice you make in public. It&apos;s not about what you like — it&apos;s about <em>how</em> you like it, <em>why</em> you like it, and whether those choices form a coherent identity.
          </p>
          <p>
            Taste has been the last unquantified human quality. We measure IQ, EQ, credit scores, follower counts, engagement rates — but nobody has tried to systematically evaluate the <em>quality</em> of someone&apos;s digital presence. Until now.
          </p>
        </div>
      </section>

      {/* The Six Dimensions */}
      <section className="mb-16">
        <h2 className="font-serif text-2xl font-semibold mb-8">The Six Dimensions</h2>
        <div className="space-y-8">
          {dimensions.map((d, i) => (
            <motion.div
              key={d.name}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="border-l-2 border-border pl-6"
            >
              <div className="flex items-baseline gap-3">
                <h3 className="font-serif text-lg font-semibold">{d.name}</h3>
                <span className="text-ink/20 text-xs font-mono">{d.weight}</span>
              </div>
              <p className="text-ink/50 text-sm italic mt-1">{d.question}</p>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-score-high/5 rounded-lg">
                  <span className="text-score-high font-medium">90–100:</span>
                  <span className="text-ink/45 ml-1">{d.high}</span>
                </div>
                <div className="p-3 bg-score-low/5 rounded-lg">
                  <span className="text-score-low font-medium">0–29:</span>
                  <span className="text-ink/45 ml-1">{d.low}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Composite Score */}
      <section className="mb-16">
        <h2 className="font-serif text-2xl font-semibold mb-4">Composite Score</h2>
        <p className="text-ink/50 text-[15px] leading-relaxed mb-6">
          The composite Taste Score is a weighted average. Originality and Communication weigh heaviest (20% each) because they represent the core of taste — what you create and how you express it.
        </p>
        <div className="border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-ink/30 text-[11px] uppercase tracking-widest font-normal">Score</th>
                <th className="text-left py-3 px-4 text-ink/30 text-[11px] uppercase tracking-widest font-normal">Tier</th>
                <th className="text-left py-3 px-4 text-ink/30 text-[11px] uppercase tracking-widest font-normal hidden sm:table-cell">Description</th>
              </tr>
            </thead>
            <tbody>
              {tiers.map((t) => (
                <tr key={t.range} className="border-b border-border/50">
                  <td className="py-2.5 px-4 font-mono text-xs text-ink/40">{t.range}</td>
                  <td className="py-2.5 px-4 font-serif font-semibold text-sm">{t.name}</td>
                  <td className="py-2.5 px-4 text-ink/40 text-xs hidden sm:table-cell">{t.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Data Collection */}
      <section className="mb-16">
        <h2 className="font-serif text-2xl font-semibold mb-4">Data Collection</h2>
        <div className="space-y-4 text-ink/50 text-[15px] leading-relaxed">
          <p>We collect data from up to four sources per evaluation:</p>
          <ul className="space-y-2 pl-4">
            <li className="flex gap-2"><span className="text-ink/25">01</span> <span><strong className="text-ink/70">Twitter/X</strong> — Up to 200 recent tweets, profile bio, engagement patterns, retweets vs originals</span></li>
            <li className="flex gap-2"><span className="text-ink/25">02</span> <span><strong className="text-ink/70">LinkedIn</strong> — Up to 30 posts, headline, experience</span></li>
            <li className="flex gap-2"><span className="text-ink/25">03</span> <span><strong className="text-ink/70">Website</strong> — Content, copy quality, what you choose to show</span></li>
            <li className="flex gap-2"><span className="text-ink/25">04</span> <span><strong className="text-ink/70">Web Research</strong> — Google search for articles, interviews, mentions</span></li>
          </ul>
          <p>
            All data is publicly available. We only analyze what you&apos;ve chosen to put into the world. Screenshots are captured as evidence.
          </p>
        </div>
      </section>

      {/* AI Judge */}
      <section className="mb-16">
        <h2 className="font-serif text-2xl font-semibold mb-4">The AI Judge</h2>
        <div className="space-y-4 text-ink/50 text-[15px] leading-relaxed">
          <p>
            We use Claude (Anthropic) as the primary judge. Same input data will produce similar but not identical scores on re-evaluation (±5 points). This reflects the inherent subjectivity of taste — even human judges would show similar variance.
          </p>
          <p>
            Every claim in the report must be verifiable from the scraped data. Retweets are clearly distinguished from original content. Job titles and roles are taken verbatim from profiles, never interpreted or invented.
          </p>
        </div>
      </section>

      {/* Limitations */}
      <section className="mb-16">
        <h2 className="font-serif text-2xl font-semibold mb-4">Limitations</h2>
        <div className="space-y-4 text-ink/50 text-[15px] leading-relaxed">
          <p>We&apos;re honest about what this is and isn&apos;t:</p>
          <ul className="space-y-1.5 pl-4 text-sm">
            <li>• Single-point-in-time evaluation — taste evolves</li>
            <li>• English-language bias in communication scoring</li>
            <li>• Western-centric aesthetic norms in some dimensions</li>
            <li>• AI judge is consistent but not objective</li>
            <li>• Text-heavy analysis — limited visual scoring currently</li>
          </ul>
          <p>
            We don&apos;t claim to be objective — taste is inherently subjective. But we claim to be <em>consistent</em>, <em>insightful</em>, and <em>useful</em>.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border pt-8 mt-16">
        <p className="text-ink/20 text-xs">
          <a href="/" className="hover:text-ink/40 transition">← Back to leaderboard</a>
          {" · "}
          The Taste Bench v0.1
        </p>
      </footer>
    </motion.main>
  );
}
