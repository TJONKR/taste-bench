import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { v4 as uuidv4 } from "uuid";
import { saveScore, updatePendingStatus, removePending } from "@/lib/leaderboard";
import { scrapeTwitter, scrapeLinkedIn, scrapeWebsite, deepResearch, getScreenshotUrl, getAvatarUrl } from "@/lib/scrape";
import { ScoreResult } from "@/lib/types";
import { judgeSchema } from "@/lib/validation";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export const maxDuration = 120; // Allow up to 2 min

export async function POST(req: Request) {
  let id = "";
  try {
    const body = await req.json();
    const parsed = judgeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues.map(i => i.message).join(", ") }, { status: 400 });
    }
    const { name, twitter, linkedin, website, description } = parsed.data;
    id = parsed.data.id || body.id || uuidv4();

    const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

    // Step 1: Scrape Twitter
    let twitterData = null;
    await updatePendingStatus(id, "scraping-twitter");
    if (twitter) {
      twitterData = await scrapeTwitter(twitter);
    }
    await delay(3000); // Min 3s per step so user sees progress

    // Step 2: Scrape LinkedIn
    let linkedinData = null;
    await updatePendingStatus(id, "scraping-linkedin");
    if (linkedin) {
      linkedinData = await scrapeLinkedIn(linkedin);
    }
    await delay(3000);

    // Step 3: Scrape Website
    let websiteData = null;
    await updatePendingStatus(id, "scraping-website");
    if (website) {
      websiteData = await scrapeWebsite(website);
    }
    await delay(2000);

    // Step 4: Deep web research
    await updatePendingStatus(id, "deep-research");
    const researchResults = await deepResearch(name, twitter, website);
    await delay(2000);

    // Step 5: Screenshots
    await updatePendingStatus(id, "capturing-screenshots");
    await delay(2000);
    const screenshots: { url: string; source: string }[] = [];
    if (twitter) {
      const clean = twitter.replace("@", "").replace(/https?:\/\/(twitter|x)\.com\//i, "").replace(/\/.*/, "");
      screenshots.push({ url: getScreenshotUrl(`https://x.com/${clean}`), source: "Twitter/X" });
    }
    if (linkedin) screenshots.push({ url: getScreenshotUrl(linkedin), source: "LinkedIn" });
    if (website) screenshots.push({ url: getScreenshotUrl(website), source: "Website" });

    const avatarUrl = getAvatarUrl(name, twitterData?.avatarUrl, twitter);

    // Step 5: Build context and analyze
    await updatePendingStatus(id, "analyzing");
    const parts: string[] = [`Name: ${name}`];

    if (twitterData) {
      parts.push(`=== TWITTER/X PROFILE ===
Handle: @${twitterData.handle}
Display Name: ${twitterData.displayName || "Unknown"}
Bio: ${twitterData.bio || "None"}
Followers: ${twitterData.followers ?? "Unknown"} | Following: ${twitterData.following ?? "Unknown"}
Recent Tweets (${twitterData.tweets.length} captured):
${twitterData.tweets.map((t: string, i: number) => `${i + 1}. ${t}`).join("\n")}`);
    }

    if (linkedinData) {
      parts.push(`=== LINKEDIN PROFILE ===
Headline: ${linkedinData.headline || "None"}
Summary: ${linkedinData.summary || "None"}
Experience: ${(linkedinData.experience || []).join(" → ") || "None"}
Posts: ${(linkedinData.posts || []).map((p: string, i: number) => `${i + 1}. ${p}`).join("\n") || "None"}`);
    }

    if (websiteData) {
      parts.push(`=== WEBSITE/PORTFOLIO ===\n${websiteData}`);
    }

    if (description) {
      parts.push(`=== SELF-DESCRIPTION ===\n${description}`);
    }

    if (researchResults.length > 0) {
      parts.push(`=== WEB RESEARCH (articles, mentions, interviews found online) ===
${researchResults.map((r, i) => `${i + 1}. [${r.title}](${r.url})
${r.snippet}
${r.content ? `Content excerpt: ${r.content.slice(0, 1500)}` : ""}`).join("\n\n")}`);
    }

    const context = parts.join("\n\n---\n\n");

    // Step 6: Generate report
    await updatePendingStatus(id, "generating-report");
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: `You are The Taste Bench — the internet's most brutally honest, deeply analytical taste evaluator. You produce DEEP RESEARCH reports on people's taste. Think a Michelin inspector crossed with a cultural anthropologist who also happens to be devastatingly witty.

CRITICAL VERIFICATION RULES:
1. **Ownership verification**: You MUST verify that ALL data actually belongs to "${name}". If any content appears to belong to a different person, IGNORE it completely. Better a short accurate report than a long wrong one.
2. **Retweets vs originals**: Tweets marked [RETWEET] are content this person SHARED, not CREATED. Never attribute a retweet's opinion or statement to the person. Say "they shared/amplified" not "they said". Retweets reveal taste in curation, not authorship.
3. **Quote tweets**: Marked [QUOTE TWEET] — the person added their take on someone else's content. The quote is theirs, the original isn't.
4. **Job titles and roles**: Use ONLY the exact title/headline from their LinkedIn or bio. Never invent or interpret job titles. If their LinkedIn says "Founder at X" — use that. Don't call them "software engineer" if they don't call themselves that.
5. **Factual claims**: NEVER state something as fact unless the data explicitly confirms it. If you're unsure whether someone ran a café, started a company, or did anything specific — DON'T CLAIM IT. Say "based on their posts, they appear to..." or simply omit it.
6. **When in doubt**: Increase uncertainty, reduce claims. A tasteful analysis is an ACCURATE analysis. Making things up is the opposite of taste.

You will analyze a person's entire public digital presence and produce a comprehensive taste audit across 6 dimensions. This is NOT a quick score — it's a professional-grade analysis.

The 6 dimensions (each 0-100):
- **References**: Do they cite interesting, obscure, or thoughtful sources — or just whatever's trending?
- **Originality**: Are they creating new aesthetic territory or remixing what's popular?
- **Consistency**: Does their aesthetic, voice, and taste hold across platforms?
- **Communication**: Economy of words, clarity, signal-to-noise ratio.
- **Courage**: Do they have actual opinions that could get pushback?
- **Self-awareness**: Do they know what they are?

For each dimension, write a FULL PARAGRAPH (3-5 sentences) referencing specific content you observed.

Also provide:
- **tasteDNA**: 5-8 sentence analysis of their overall taste profile, influences, blind spots.
- **crossPlatformConsistency**: Paragraph on how their identity shifts across platforms.
- **recommendations**: 3 specific, actionable things to improve their taste score.

Respond with ONLY valid JSON:
{
  "score": <0-100>,
  "title": "<witty title, max 6 words>",
  "verdict": "<3-4 line brutal but insightful verdict>",
  "dimensions": {
    "references": { "score": <0-100>, "note": "<full paragraph>" },
    "originality": { "score": <0-100>, "note": "<full paragraph>" },
    "consistency": { "score": <0-100>, "note": "<full paragraph>" },
    "communication": { "score": <0-100>, "note": "<full paragraph>" },
    "courage": { "score": <0-100>, "note": "<full paragraph>" },
    "selfAwareness": { "score": <0-100>, "note": "<full paragraph>" }
  },
  "tasteDNA": "<substantial paragraph>",
  "crossPlatformConsistency": "<paragraph>",
  "recommendations": ["<rec 1>", "<rec 2>", "<rec 3>"],
  "dataVerification": "<brief note on which data sources you verified as belonging to this person and any you excluded>"
}

Person's complete public presence:

${context}`,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== "text") throw new Error("Unexpected response");

    // Strip markdown code fences if present
    let jsonText = content.text.trim();
    if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
    }
    const result = JSON.parse(jsonText);

    const scoreResult: ScoreResult = {
      id,
      name,
      score: result.score,
      title: result.title,
      verdict: result.verdict,
      dimensions: result.dimensions,
      tasteDNA: result.tasteDNA,
      crossPlatformConsistency: result.crossPlatformConsistency,
      recommendations: result.recommendations,
      input: { twitter, linkedin, website, description },
      avatarUrl,
      screenshots,
      scrapedData: {
        twitter: twitterData || undefined,
        linkedin: linkedinData || undefined,
        website: websiteData || undefined,
      },
      createdAt: new Date().toISOString(),
    };

    await saveScore(scoreResult);
    await updatePendingStatus(id, "complete");
    await removePending(id);

    return NextResponse.json({ id });
  } catch (e: any) {
    console.error("Judge error:", e);
    // Try to update pending status (id is defined in the try block scope)
    try { await updatePendingStatus(id, "error", e.message); } catch {}
    return NextResponse.json({ error: e.message || "Failed to judge" }, { status: 500 });
  }
}
