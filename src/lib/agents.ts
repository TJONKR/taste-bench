import Anthropic from "@anthropic-ai/sdk";
import { VerifiedData, AnalysisResult, TasteReport, DimensionResult, TasteLevel, ScreenshotImage } from "./types";
import {
  analyzeCuration,
  analyzeIntentionality,
  analyzeOriginality,
  analyzeConviction,
  analyzeIdentity,
  analyzeSelfAwareness,
} from "./dimension-agents";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function parseJsonResponse(text: string): any {
  let jsonText = text.trim();
  if (jsonText.startsWith("```")) {
    jsonText = jsonText
      .replace(/^```(?:json)?\s*\n?/, "")
      .replace(/\n?```\s*$/, "");
  }
  return JSON.parse(jsonText);
}

// Agent 1: Data verification and organization
export async function runResearcher(
  name: string,
  rawContext: string
): Promise<VerifiedData> {
  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 16384,
    messages: [
      {
        role: "user",
        content: `You are a data verification specialist for The Taste Bench — the internet's taste evaluation platform.

Your ONLY job is to verify, clean, and organize scraped data about "${name}". You do NOT interpret, analyze, or judge — you prepare data for the analyst.

VERIFICATION RULES:
1. **Ownership verification**: Verify ALL content actually belongs to "${name}". If any content appears to belong to a different person (wrong profile scraped, name mismatch, etc.), EXCLUDE it and note why in excludedSources.
2. **Tweet categorization**: Separate tweets into three categories:
   - originalTweets: Content this person wrote themselves
   - retweets: Content they shared/amplified — these are NOT their words, they reveal curation taste
   - quoteTweets: Their commentary on someone else's content (the quote is theirs, the original isn't)
3. **Notable content**: Flag standout tweets, posts, or content that the analyst should pay special attention to (unusual takes, revealing statements, strong opinions, interesting references).
4. **Data confidence**: Rate overall confidence (0-1) based on data quality, completeness, and verification certainty.
5. **Web research relevance**: For each web research result, assess whether it's actually about this specific person or a different person with the same name.
6. **Deduplication**: Remove duplicate content, clean up noise, normalize formatting.
7. **Job titles and roles**: Preserve exact titles/headlines as stated. Never invent or reinterpret them.
8. **Be concise**: Keep the BEST 50 original tweets max, 20 retweets max, 20 quote tweets max. Drop generic/low-signal content. Quality over quantity — the analyst needs signal, not noise.

Output ONLY valid JSON matching this exact structure:
{
  "name": "${name}",
  "confidence": <0-1>,
  "excludedSources": ["<reason for each excluded piece of data>"],
  "twitter": {
    "verified": <true if data appears to belong to this person>,
    "handle": "<handle>",
    "displayName": "<display name or null>",
    "bio": "<bio or null>",
    "followers": <number or null>,
    "following": <number or null>,
    "originalTweets": ["<tweet text>", ...],
    "retweets": ["<retweet text>", ...],
    "quoteTweets": ["<quote tweet text>", ...],
    "notableTweets": ["<standout tweets the analyst should focus on>", ...]
  } or null if no twitter data,
  "linkedin": {
    "verified": <true if data appears to belong to this person>,
    "headline": "<headline or null>",
    "summary": "<summary or null>",
    "experience": ["<role>", ...],
    "posts": ["<post text>", ...]
  } or null if no linkedin data,
  "website": {
    "verified": <true if site appears to belong to this person>,
    "content": "<cleaned website content>"
  } or null if no website data,
  "selfDescription": "<their self-description if provided, or null>",
  "webResearch": [
    {
      "url": "<url>",
      "title": "<title>",
      "relevance": "<high/medium/low — is this actually about this person?>",
      "keyInsight": "<what this reveals about the person>"
    }
  ],
  "researcherNotes": "<brief notes on data quality, gaps, anything the analyst should know>"
}

IMPORTANT: Do NOT analyze taste. Do NOT score anything. Just verify, clean, and organize.

Raw scraped data for "${name}":

${rawContext}`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== "text") throw new Error("Unexpected response from researcher agent");
  return parseJsonResponse(content.text);
}

// Agent 2: 6 parallel dimension analysts with 3-pass self-consistency
const WEIGHTS = {
  curation: 0.125,
  intentionality: 0.125,
  originality: 0.175,
  conviction: 0.175,
  identity: 0.20,
  selfAwareness: 0.20,
};

const CONSISTENCY_PASSES = 3;

type DimensionFn = (
  name: string,
  data: VerifiedData,
  screenshots?: ScreenshotImage[]
) => Promise<DimensionResult>;

async function runWithConsistency(
  fn: DimensionFn,
  name: string,
  data: VerifiedData,
  screenshots?: ScreenshotImage[]
): Promise<DimensionResult> {
  const results = await Promise.all(
    Array.from({ length: CONSISTENCY_PASSES }, () => fn(name, data, screenshots))
  );

  // Sort by score, take median (middle result)
  const sorted = [...results].sort((a, b) => a.score - b.score);
  const median = sorted[Math.floor(CONSISTENCY_PASSES / 2)];

  // Majority vote on level
  const levelCounts: Record<string, number> = {};
  results.forEach((r) => {
    levelCounts[r.level] = (levelCounts[r.level] || 0) + 1;
  });
  const majorityLevel = Object.entries(levelCounts).sort(
    (a, b) => b[1] - a[1]
  )[0][0] as TasteLevel;

  // Merge evidence from all passes (deduplicated, max 5)
  const allEvidence = results.flatMap((r) => r.evidence);
  const seen = new Set<string>();
  const uniqueEvidence = allEvidence.filter((e) => {
    if (seen.has(e)) return false;
    seen.add(e);
    return true;
  }).slice(0, 5);

  // Log variance for monitoring
  const scores = results.map((r) => r.score);
  const variance = Math.max(...scores) - Math.min(...scores);
  console.log(
    `Self-consistency: scores=[${scores.map((s) => s.toFixed(1)).join(", ")}] variance=${variance.toFixed(1)} median=${median.score.toFixed(2)} level=${majorityLevel}`
  );

  return {
    score: median.score,
    level: majorityLevel,
    evidence: uniqueEvidence,
    reasoning: median.reasoning,
    tensionPositioning: median.tensionPositioning,
    philosopherHighlights: median.philosopherHighlights,
  };
}

function computeOverallLevel(
  dimensions: AnalysisResult["dimensions"]
): string {
  const levels = Object.values(dimensions).map((d) => d.level);
  const l4Count = levels.filter((l) => l === "L4").length;
  const l3PlusCount = levels.filter((l) => l === "L3" || l === "L4").length;
  const topDimsAtL3Plus =
    (dimensions.identity.level === "L3" ||
      dimensions.identity.level === "L4") &&
    (dimensions.selfAwareness.level === "L3" ||
      dimensions.selfAwareness.level === "L4");

  if (l4Count >= 4) return "Level 4: Identity";
  if (l3PlusCount >= 4) return "Level 3: Vision";
  if (l3PlusCount >= 3 && topDimsAtL3Plus) return "Level 3: Vision";
  return "Level 2: Discrimination";
}

export async function runDimensionAnalysts(
  name: string,
  verifiedData: VerifiedData,
  screenshots?: ScreenshotImage[]
): Promise<AnalysisResult> {
  console.log(`Running ${CONSISTENCY_PASSES}-pass self-consistency analysis (${CONSISTENCY_PASSES * 6} total agent calls)...`);

  // All 18 calls run in parallel (3 passes × 6 dimensions)
  const [
    curation,
    intentionality,
    originality,
    conviction,
    identity,
    selfAwareness,
  ] = await Promise.all([
    runWithConsistency(analyzeCuration, name, verifiedData, screenshots),
    runWithConsistency(analyzeIntentionality, name, verifiedData),
    runWithConsistency(analyzeOriginality, name, verifiedData),
    runWithConsistency(analyzeConviction, name, verifiedData),
    runWithConsistency(analyzeIdentity, name, verifiedData, screenshots),
    runWithConsistency(analyzeSelfAwareness, name, verifiedData),
  ]);

  const dimensions = {
    curation,
    intentionality,
    originality,
    conviction,
    identity,
    selfAwareness,
  };

  const compositeScore = parseFloat(
    (
      curation.score * WEIGHTS.curation +
      intentionality.score * WEIGHTS.intentionality +
      originality.score * WEIGHTS.originality +
      conviction.score * WEIGHTS.conviction +
      identity.score * WEIGHTS.identity +
      selfAwareness.score * WEIGHTS.selfAwareness
    ).toFixed(2)
  );

  const levelProfile = [
    curation.level,
    intentionality.level,
    originality.level,
    conviction.level,
    identity.level,
    selfAwareness.level,
  ].join("-");

  const overallLevel = computeOverallLevel(dimensions);

  const patterns: string[] = [];
  const contradictions: string[] = [];
  const standoutMoments: string[] = [];

  for (const [key, dim] of Object.entries(dimensions)) {
    if (dim.score >= 85) {
      standoutMoments.push(`Exceptional ${key}: ${dim.evidence[0]}`);
    }
    if (dim.score <= 30) {
      patterns.push(
        `Significant gap in ${key}: ${dim.reasoning.slice(0, 100)}`
      );
    }
  }

  const levelValues = Object.entries(dimensions);
  const highLevelDims = levelValues.filter(([, d]) => d.level === "L4");
  const lowLevelDims = levelValues.filter(([, d]) => d.level === "L2");
  if (highLevelDims.length > 0 && lowLevelDims.length > 0) {
    contradictions.push(
      `Operates at ${highLevelDims[0][1].level} on ${highLevelDims[0][0]} but ${lowLevelDims[0][1].level} on ${lowLevelDims[0][0]}`
    );
  }

  return {
    dimensions,
    compositeScore,
    levelProfile,
    overallLevel,
    patterns,
    contradictions,
    standoutMoments,
  };
}

// Agent 3: Editorial writing
export async function runWriter(
  name: string,
  analysis: AnalysisResult
): Promise<TasteReport> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8192,
    messages: [
      {
        role: "user",
        content: `You are the editorial writer for The Taste Bench — a Michelin inspector crossed with a cultural anthropologist who is devastatingly witty.

You receive structured scores and evidence for "${name}", and your job is to write the REPORT people want to read. Your job is WRITING, not re-scoring. Trust the analyst's numbers and pass them through exactly.

COMPOSITE SCORE: ${analysis.compositeScore}

TITLE GUIDELINES (max 6 words) — reference these tiers based on the composite score:
- 90-100 Legendary: "Taste Architect", "Cultural North Star"
- 80-89 Exceptional: "Based and Curated", "Silent Tastemaker"
- 70-79 Tasteful: "Curated Chaos Agent", "Almost There, Keep Going"
- 60-69 Developing: "Vintage Soul in a TikTok World"
- 50-59 Mid: "Perfectly Adequate", "The Algorithm's Child"
- 40-49 Basic: "LinkedIn Brain", "Algorithmically Basic"
- 30-39 Struggling: "Corporate Creative", "Trying Too Hard"
- 0-29 Tasteless: "Main Character, No Plot", "NPC Energy"

WRITING INSTRUCTIONS:
1. **title**: A witty title (max 6 words) that captures "${name}"'s overall impression. Be creative — don't just copy the examples above.
2. **verdict**: 3-4 lines, brutal but insightful. This is the hook.
3. **Dimension notes**: For EACH of the 6 dimensions (curation, intentionality, originality, conviction, identity, selfAwareness), write a FULL PARAGRAPH (3-5 sentences) that references specific evidence from the analysis. Use the evidence[] and reasoning provided by the analyst, but rewrite in your editorial voice. Make it vivid and specific.
4. **tasteDNA**: 5-8 sentence analysis of their overall taste profile, influences, blind spots. This is the deep read.
5. **crossPlatformConsistency**: A paragraph on how their identity holds (or doesn't) across platforms.
6. **recommendations**: 3 specific, actionable things "${name}" can do to improve their taste score. Not generic advice — tailored to what you've seen.

CRITICAL RULES:
- Pass through the analyst's compositeScore as "score" — do NOT recalculate
- Pass through each dimension's score exactly — do NOT change them
- Your job is editorial writing, not scoring
- Be entertaining but accurate — never fabricate evidence
- Reference specific content, quotes, and observations from the evidence

Output ONLY valid JSON matching this exact structure:
{
  "score": ${analysis.compositeScore},
  "title": "<witty title, max 6 words>",
  "verdict": "<3-4 lines>",
  "levelProfile": "${analysis.levelProfile}",
  "overallLevel": "${analysis.overallLevel}",
  "dimensions": {
    "curation": { "score": ${analysis.dimensions.curation.score}, "level": "${analysis.dimensions.curation.level}", "note": "<full paragraph>" },
    "intentionality": { "score": ${analysis.dimensions.intentionality.score}, "level": "${analysis.dimensions.intentionality.level}", "note": "<full paragraph>" },
    "originality": { "score": ${analysis.dimensions.originality.score}, "level": "${analysis.dimensions.originality.level}", "note": "<full paragraph>" },
    "conviction": { "score": ${analysis.dimensions.conviction.score}, "level": "${analysis.dimensions.conviction.level}", "note": "<full paragraph>" },
    "identity": { "score": ${analysis.dimensions.identity.score}, "level": "${analysis.dimensions.identity.level}", "note": "<full paragraph>" },
    "selfAwareness": { "score": ${analysis.dimensions.selfAwareness.score}, "level": "${analysis.dimensions.selfAwareness.level}", "note": "<full paragraph>" }
  },
  "tasteDNA": "<5-8 sentences>",
  "crossPlatformConsistency": "<paragraph>",
  "recommendations": ["<specific rec 1>", "<specific rec 2>", "<specific rec 3>"]
}

Analysis data for "${name}":

${JSON.stringify(analysis, null, 2)}`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== "text") throw new Error("Unexpected response from writer agent");
  return parseJsonResponse(content.text);
}
