"use client";
import { motion } from "framer-motion";

const dimensions = [
  {
    name: "Curation",
    weight: "12.5%",
    level: "Level 2: Selector",
    question: "Can you recognize quality outside yourself? What do your selections — shares, references, influences — reveal about your eye?",
    high: "Extraordinary eye. Cross-domain, surprising, purposeful selections. Whether through sharing or references in their work, you discover things through them.",
    low: "Zero curation signal. No visible selection taste. Indistinguishable from any other account in their niche.",
  },
  {
    name: "Intentionality",
    weight: "12.5%",
    level: "Level 2: Selector",
    question: "Are your choices deliberate? Whether minimalist or maximalist — is there a mind behind the moves?",
    high: "Every move feels deliberate. Whether loud or quiet, you can feel the choosing mind. Nothing is accidental.",
    low: "Pure autopilot. No evidence of deliberate choice. Content happens TO them rather than being chosen BY them.",
  },
  {
    name: "Originality",
    weight: "17.5%",
    level: "Level 3: Creator",
    question: "Do they add something to the world that wasn't there before?",
    high: "Genuinely creates new ideas, formats, or perspectives that others adopt. Unmistakable voice. Builds real things.",
    low: "Copy-paste culture. Could be anyone. Zero original creation. Pure redistribution.",
  },
  {
    name: "Conviction",
    weight: "17.5%",
    level: "Level 3: Creator",
    question: "Do they trust their own perception before consensus validates it?",
    high: "Genuinely convicted. Champions things early, holds positions with grace. Their conviction has been tested.",
    low: "Zero edge. Pure consensus. No detectable conviction on anything. Performative agreement with everything.",
  },
  {
    name: "Identity",
    weight: "20%",
    level: "Level 4: Identity",
    question: "Can you feel a specific, unmistakable person behind the work?",
    high: "Unmistakable. You'd recognize their work without a name. Identity feels lived-in, not performed.",
    low: "No identity signal. Could be a bot. Completely generic. No detectable person behind the output.",
  },
  {
    name: "Self-Awareness",
    weight: "20%",
    level: "Level 4: Identity",
    question: "Do they understand their own taste — what it is, where it comes from, and what its blind spots are?",
    high: "Perfectly calibrated. Self-image matches reality. Knows strengths, acknowledges weaknesses.",
    low: "Complete disconnect. Performance bears no relationship to reality. No evidence of introspection.",
  },
];

const tiers = [
  { range: "90.00–100.00", name: "Legendary", desc: "Genuine tastemaker. Sets standards others follow. Taste as identity." },
  { range: "80.00–89.99", name: "Exceptional", desc: "Strong taste with few weaknesses. Operates at Level 3-4 consistently." },
  { range: "70.00–79.99", name: "Tasteful", desc: "Above average. Clear taste signals with room to deepen." },
  { range: "60.00–69.99", name: "Developing", desc: "Shows promise. Operates mostly at Level 2 with flashes of Level 3." },
  { range: "50.00–59.99", name: "Mid", desc: "Average. Neither impressive nor offensive. Functional discrimination." },
  { range: "40.00–49.99", name: "Basic", desc: "Following trends, not setting them. Algorithm-shaped taste." },
  { range: "30.00–39.99", name: "Struggling", desc: "Significant gaps across dimensions. More noise than signal." },
  { range: "0.00–29.99", name: "Tasteless", desc: "No detectable taste signal. Algorithmically generated persona." },
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
      <p className="text-ink/40 text-sm mb-16">How we measure taste. v2.0 — March 2026</p>

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

      {/* The 4 Levels of Taste */}
      <section className="mb-16">
        <h2 className="font-serif text-2xl font-semibold mb-4">The 4 Levels of Taste</h2>
        <p className="text-ink/50 text-[15px] leading-relaxed mb-6">
          Taste operates on a hierarchy. Each level builds on the one below it. Our 6 dimensions are organized by which level of taste they primarily measure.
        </p>
        <div className="space-y-4">
          {[
            { level: "Level 1: Preference", desc: "&ldquo;I like this.&rdquo; Raw personal response. Everyone has it. Not scored — it&apos;s the soil taste grows in." },
            { level: "Level 2: Discrimination", desc: "&ldquo;This is good, that isn&apos;t.&rdquo; You can tell quality from garbage. You have an eye. Measured by Curation and Intentionality." },
            { level: "Level 3: Vision", desc: "&ldquo;This doesn&apos;t exist yet, but it should.&rdquo; Taste becomes generative, not just selective. Measured by Originality and Conviction." },
            { level: "Level 4: Identity", desc: "&ldquo;I couldn&apos;t have made this any other way.&rdquo; Work and person are inseparable. Measured by Identity and Self-Awareness." },
          ].map((l, i) => (
            <motion.div
              key={l.level}
              initial={{ opacity: 0, x: -8 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="flex gap-4 items-start"
            >
              <span className="font-serif text-sm font-bold text-ink/30 whitespace-nowrap mt-0.5">{l.level.split(":")[0]}</span>
              <div>
                <span className="font-serif text-sm font-semibold">{l.level.split(": ")[1]}</span>
                <p className="text-ink/45 text-sm mt-0.5" dangerouslySetInnerHTML={{ __html: l.desc }} />
              </div>
            </motion.div>
          ))}
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
                {(d as any).level && <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/10 text-accent font-medium">{(d as any).level}</span>}
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
          The composite Taste Score is a level-weighted average. Identity and Self-Awareness weigh heaviest (20% each) because they represent the deepest expression of taste — taste as self. Level 3 dimensions (Originality, Conviction) carry 17.5% each, while Level 2 dimensions (Curation, Intentionality) carry 12.5% each.
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
            <li>• English-language bias in text-based scoring</li>
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
          The Taste Bench v2.0
        </p>
      </footer>
    </motion.main>
  );
}
