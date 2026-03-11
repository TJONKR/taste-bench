import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { saveScore, updatePendingStatus, removePending } from "@/lib/leaderboard";
import { scrapeTwitter, scrapeLinkedIn, scrapeWebsite, deepResearch, getScreenshotUrl, getAvatarUrl, fetchScreenshotAsBase64 } from "@/lib/scrape";
import { ScoreResult, ScreenshotImage } from "@/lib/types";
import { judgeSchema } from "@/lib/validation";
import { runResearcher, runDimensionAnalysts, runWriter } from "@/lib/agents";

export const maxDuration = 240; // Allow up to 4 min (3-pass self-consistency + vision)

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

    // Step 5: Screenshots (URLs for display + base64 for vision analysis)
    await updatePendingStatus(id, "capturing-screenshots");
    const screenshots: { url: string; source: string }[] = [];
    const screenshotUrls: { url: string; source: string }[] = [];
    if (twitter) {
      const clean = twitter.replace("@", "").replace(/https?:\/\/(twitter|x)\.com\//i, "").replace(/\/.*/, "");
      const twitterUrl = `https://x.com/${clean}`;
      screenshots.push({ url: getScreenshotUrl(twitterUrl), source: "Twitter/X" });
      screenshotUrls.push({ url: twitterUrl, source: "Twitter/X" });
    }
    if (linkedin) {
      screenshots.push({ url: getScreenshotUrl(linkedin), source: "LinkedIn" });
      screenshotUrls.push({ url: linkedin, source: "LinkedIn" });
    }
    if (website) {
      screenshots.push({ url: getScreenshotUrl(website), source: "Website" });
      screenshotUrls.push({ url: website, source: "Website" });
    }

    // Fetch images for Claude Vision analysis:
    // - Website: screenshot via thum.io (public page)
    // - Twitter: banner + profile pic from CDN (public URLs, no auth needed)
    // - LinkedIn: no visual (auth-walled, no public image URLs)
    const screenshotImages: ScreenshotImage[] = [];

    // Website screenshot
    if (website) {
      console.log("Fetching website screenshot for vision...");
      const wsResult = await fetchScreenshotAsBase64(website);
      if (wsResult) {
        screenshotImages.push({ source: "Website", base64: wsResult.base64, mediaType: wsResult.mediaType });
      }
    }

    // Twitter profile images (banner + avatar) — direct CDN fetches, no auth
    if (twitterData?.bannerUrl) {
      try {
        console.log("Fetching Twitter banner image for vision...");
        const bannerRes = await fetch(`${twitterData.bannerUrl}/1500x500`, { signal: AbortSignal.timeout(10000) });
        if (bannerRes.ok) {
          const buf = await bannerRes.arrayBuffer();
          const mediaType = (bannerRes.headers.get("content-type") || "image/png").split(";")[0];
          screenshotImages.push({ source: "Twitter Banner", base64: Buffer.from(buf).toString("base64"), mediaType });
          console.log(`Twitter banner captured (${Math.round(buf.byteLength / 1024)}KB)`);
        }
      } catch (e: any) {
        console.error("Twitter banner fetch failed:", e.message);
      }
    }
    if (twitterData?.avatarUrl) {
      try {
        console.log("Fetching Twitter profile pic for vision...");
        const avatarRes = await fetch(twitterData.avatarUrl, { signal: AbortSignal.timeout(10000) });
        if (avatarRes.ok) {
          const buf = await avatarRes.arrayBuffer();
          const mediaType = (avatarRes.headers.get("content-type") || "image/jpeg").split(";")[0];
          screenshotImages.push({ source: "Twitter Profile Pic", base64: Buffer.from(buf).toString("base64"), mediaType });
          console.log(`Twitter profile pic captured (${Math.round(buf.byteLength / 1024)}KB)`);
        }
      } catch (e: any) {
        console.error("Twitter avatar fetch failed:", e.message);
      }
    }

    console.log(`Vision: ${screenshotImages.length} images captured for analysis`);

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

    // Step 7: Agent pipeline - 6 parallel dimension analysts (3-pass self-consistency + vision)
    await updatePendingStatus(id, "analyzing");
    const analysis = await runDimensionAnalysts(name, verifiedData, screenshotImages);

    // Step 8: Agent pipeline - Writer
    await updatePendingStatus(id, "writing-report");
    const report = await runWriter(name, analysis);

    const scoreResult: ScoreResult = {
      id,
      name,
      score: report.score, // decimal, no rounding — v2 uses 0.00-100.00
      title: report.title,
      verdict: report.verdict,
      levelProfile: report.levelProfile,
      overallLevel: report.overallLevel,
      dimensions: report.dimensions,
      tasteDNA: report.tasteDNA,
      crossPlatformConsistency: report.crossPlatformConsistency,
      recommendations: report.recommendations,
      input: { twitter, linkedin, website, description },
      dataSources: [twitter && "twitter", linkedin && "linkedin", website && "website"].filter(Boolean) as string[],
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
