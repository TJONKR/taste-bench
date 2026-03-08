import Anthropic from "@anthropic-ai/sdk";
import { VerifiedData, AnalysisResult, TasteReport } from "./types";

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

// Agent 2: Scoring and evidence extraction
export async function runAnalyst(
  name: string,
  verifiedData: VerifiedData
): Promise<AnalysisResult> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8192,
    messages: [
      {
        role: "user",
        content: `You are the scoring analyst for The Taste Bench — the internet's taste evaluation platform.

You receive verified, clean data about "${name}" and must score 6 dimensions independently. Be rigorous and honest — do NOT inflate scores. Your job is structured scoring and evidence, NOT prose writing.

IMPORTANT DISTINCTIONS:
- Retweets reveal taste in CURATION, not authorship. They show what someone amplifies, not what they think.
- Original tweets reveal voice, opinions, and communication style.
- Quote tweets show how they engage with others' ideas.
- Data confidence from researcher: ${verifiedData.confidence}
${verifiedData.researcherNotes ? `- Researcher notes: ${verifiedData.researcherNotes}` : ""}

SCORING RUBRICS — score each dimension independently:

**References** (weight 15%): Quality and originality of intellectual inputs
- 90-100: Consistently surfaces things others haven't seen. Cross-domain references. Primary sources.
- 70-89: Good mix of mainstream and niche. Occasionally surprising.
- 50-69: Mostly mainstream but shows some independent discovery.
- 30-49: Algorithm-driven consumption. Predictable references.
- 0-29: Exclusively trending content. Zero original discovery.

**Originality** (weight 20%): Creating the wave or riding it?
- 90-100: Genuinely creates new ideas, formats, or perspectives. Unmistakable voice.
- 70-89: Strong personal voice with occasional truly original takes.
- 50-69: Has a voice but operates within established frameworks.
- 30-49: Follows trends with personal flavor. Hard to distinguish from peers.
- 0-29: Copy-paste culture. Could be anyone.

**Consistency** (weight 15%): Does taste hold across platforms?
- 90-100: Perfect cross-platform coherence. Same person everywhere.
- 70-89: Mostly consistent with appropriate platform adaptation.
- 50-69: Some inconsistencies but core identity is traceable.
- 30-49: Noticeably different personas across platforms.
- 0-29: Completely fragmented identity.

**Communication** (weight 20%): Economy of language, clarity, signal-to-noise
- 90-100: Every post is tight. Memorable phrasing. Says what others can't articulate.
- 70-89: Generally clear and well-written. Occasional filler.
- 50-69: Competent but unremarkable.
- 30-49: Verbose or unclear. Buzzwords. Corporate speak.
- 0-29: Noise. Word salad. "Thrilled to announce" energy.

**Courage** (weight 15%): Actual opinions or safe takes?
- 90-100: Genuinely controversial positions, well-defended. Intellectual courage.
- 70-89: Takes real positions but picks battles wisely.
- 50-69: Has opinions but stays within safe boundaries.
- 30-49: Crowd-pleasing. Avoids anything that might get pushback.
- 0-29: Zero edge. Pure consensus.

**Self-Awareness** (weight 15%): Do they know what they are?
- 90-100: Perfectly calibrated self-image.
- 70-89: Generally self-aware with occasional blind spots.
- 50-69: Some mismatch between self-image and reality.
- 30-49: Significant delusion in one or more areas.
- 0-29: Complete disconnect. Performance ≠ reality.

For EACH dimension:
- Provide a score (0-100)
- Cite 2-4 specific evidence items (direct quotes, specific observations)
- Write detailed reasoning explaining the score

Then calculate compositeScore using the EXACT weighted formula:
compositeScore = (References × 0.15) + (Originality × 0.20) + (Consistency × 0.15) + (Communication × 0.20) + (Courage × 0.15) + (Self-Awareness × 0.15)

Also identify:
- patterns: Cross-cutting themes across dimensions
- contradictions: Places where the person's presence contradicts itself
- standoutMoments: The most memorable/notable things you observed

Output ONLY valid JSON matching this exact structure:
{
  "dimensions": {
    "references": { "score": <0-100>, "evidence": ["<specific quote or observation>", ...], "reasoning": "<detailed explanation>" },
    "originality": { "score": <0-100>, "evidence": ["<specific quote or observation>", ...], "reasoning": "<detailed explanation>" },
    "consistency": { "score": <0-100>, "evidence": ["<specific quote or observation>", ...], "reasoning": "<detailed explanation>" },
    "communication": { "score": <0-100>, "evidence": ["<specific quote or observation>", ...], "reasoning": "<detailed explanation>" },
    "courage": { "score": <0-100>, "evidence": ["<specific quote or observation>", ...], "reasoning": "<detailed explanation>" },
    "selfAwareness": { "score": <0-100>, "evidence": ["<specific quote or observation>", ...], "reasoning": "<detailed explanation>" }
  },
  "compositeScore": <weighted average>,
  "patterns": ["<cross-cutting theme>", ...],
  "contradictions": ["<contradiction>", ...],
  "standoutMoments": ["<notable moment>", ...]
}

Do NOT write prose or editorial content — that's the Writer's job. Focus on structured scoring and evidence.

Verified data for "${name}":

${JSON.stringify(verifiedData, null, 2)}`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== "text") throw new Error("Unexpected response from analyst agent");
  return parseJsonResponse(content.text);
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
3. **Dimension notes**: For EACH of the 6 dimensions, write a FULL PARAGRAPH (3-5 sentences) that references specific evidence from the analysis. Use the evidence[] and reasoning provided by the analyst, but rewrite in your editorial voice. Make it vivid and specific.
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
  "dimensions": {
    "references": { "score": ${analysis.dimensions.references.score}, "note": "<full paragraph>" },
    "originality": { "score": ${analysis.dimensions.originality.score}, "note": "<full paragraph>" },
    "consistency": { "score": ${analysis.dimensions.consistency.score}, "note": "<full paragraph>" },
    "communication": { "score": ${analysis.dimensions.communication.score}, "note": "<full paragraph>" },
    "courage": { "score": ${analysis.dimensions.courage.score}, "note": "<full paragraph>" },
    "selfAwareness": { "score": ${analysis.dimensions.selfAwareness.score}, "note": "<full paragraph>" }
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
