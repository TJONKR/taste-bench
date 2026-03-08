import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { saveScore, updatePendingStatus, removePending } from "@/lib/leaderboard";
import { scrapeTwitter, scrapeLinkedIn, scrapeWebsite, deepResearch, getScreenshotUrl, getAvatarUrl } from "@/lib/scrape";
import { ScoreResult } from "@/lib/types";
import { judgeSchema } from "@/lib/validation";
import { runResearcher, runAnalyst, runWriter } from "@/lib/agents";

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

    // Step 5: Build context
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

    // Step 6: Agent pipeline - Researcher
    await updatePendingStatus(id, "verifying-data");
    const verifiedData = await runResearcher(name, context);

    // Step 7: Agent pipeline - Analyst
    await updatePendingStatus(id, "analyzing");
    const analysis = await runAnalyst(name, verifiedData);

    // Step 8: Agent pipeline - Writer
    await updatePendingStatus(id, "writing-report");
    const report = await runWriter(name, analysis);

    const scoreResult: ScoreResult = {
      id,
      name,
      score: Math.round(report.score),
      title: report.title,
      verdict: report.verdict,
      dimensions: report.dimensions,
      tasteDNA: report.tasteDNA,
      crossPlatformConsistency: report.crossPlatformConsistency,
      recommendations: report.recommendations,
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
