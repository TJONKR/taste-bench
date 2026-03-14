import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { saveScore, updatePendingStatus, removePending } from "@/lib/leaderboard";
import { ScoreResult } from "@/lib/types";
import { judgeSchema } from "@/lib/validation";
import { runDimensionAnalysts, runWriter } from "@/lib/agents";
import { runResearchAgent } from "@/lib/research-agent";
import { decrypt } from "@/lib/crypto";
import { supabase } from "@/lib/supabase";

export const maxDuration = 300; // 5 min (Vercel hobby plan limit)

export async function POST(req: Request) {
  let id = "";
  try {
    const body = await req.json();
    const parsed = judgeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues.map(i => i.message).join(", ") }, { status: 400 });
    }
    const { name, twitter, linkedin, website, description, slug: inputSlug, userId } = parsed.data;
    id = parsed.data.id || body.id || uuidv4();
    const slug = inputSlug || "";

    // Resolve BYOK API key if userId provided
    if (userId) {
      const { data: settings } = await supabase
        .from("user_settings")
        .select("anthropic_api_key")
        .eq("user_id", userId)
        .maybeSingle();
      if (settings?.anthropic_api_key) {
        try {
          decrypt(settings.anthropic_api_key);
          // TODO: pass to research agent and dimension analysts
        } catch {
          return NextResponse.json({ error: "Failed to decrypt API key" }, { status: 500 });
        }
      }
    }

    // ── Phase 1: Deep Research Agent ──
    // Single agentic loop replaces all fixed scrape steps + old researcher
    const research = await runResearchAgent(id, name, twitter, linkedin, website, description);

    // Fetch Twitter avatar/banner images for vision analysis + display
    if (research.twitterData?.bannerUrl) {
      try {
        console.log("Fetching Twitter banner image for vision...");
        const bannerUrl = `${research.twitterData.bannerUrl}/1500x500`;
        const bannerRes = await fetch(bannerUrl, { signal: AbortSignal.timeout(10000) });
        if (bannerRes.ok) {
          const buf = await bannerRes.arrayBuffer();
          const mediaType = (bannerRes.headers.get("content-type") || "image/png").split(";")[0];
          research.screenshotImages.push({ source: "Twitter Banner", base64: Buffer.from(buf).toString("base64"), mediaType });
          research.screenshots.push({ url: bannerUrl, source: "Twitter Banner" });
        }
      } catch (e: any) {
        console.error("Twitter banner fetch failed:", e.message);
      }
    }
    if (research.twitterData?.avatarUrl) {
      try {
        console.log("Fetching Twitter profile pic for vision...");
        // Use original size avatar for display
        const fullAvatarUrl = research.twitterData.avatarUrl.replace("_normal", "").replace("_400x400", "");
        const avatarRes = await fetch(research.twitterData.avatarUrl, { signal: AbortSignal.timeout(10000) });
        if (avatarRes.ok) {
          const buf = await avatarRes.arrayBuffer();
          const mediaType = (avatarRes.headers.get("content-type") || "image/jpeg").split(";")[0];
          research.screenshotImages.push({ source: "Twitter Profile Pic", base64: Buffer.from(buf).toString("base64"), mediaType });
          research.screenshots.push({ url: fullAvatarUrl, source: "Profile Picture" });
        }
      } catch (e: any) {
        console.error("Twitter avatar fetch failed:", e.message);
      }
    }

    console.log(`[judge] Research complete: ${research.screenshotImages.length} images, sources: ${research.stats.dataSources?.join(", ")}`);

    // ── Phase 2: Dimension Analysts (3-pass self-consistency + vision) ──
    await updatePendingStatus(id, "analyzing", undefined, research.stats);
    const analysis = await runDimensionAnalysts(name, research.verifiedData, research.screenshotImages);

    // ── Phase 3: Writer ──
    await updatePendingStatus(id, "writing-report", undefined, research.stats);
    const report = await runWriter(name, analysis);

    const scoreResult: ScoreResult = {
      id,
      name,
      slug,
      score: report.score,
      title: report.title,
      verdict: report.verdict,
      levelProfile: report.levelProfile,
      overallLevel: report.overallLevel,
      dimensions: report.dimensions,
      tasteDNA: report.tasteDNA,
      crossPlatformConsistency: report.crossPlatformConsistency,
      recommendations: report.recommendations,
      input: { twitter, linkedin, website, description },
      dataSources: research.stats.dataSources || [],
      avatarUrl: research.avatarUrl,
      screenshots: research.screenshots,
      scrapedData: {
        twitter: research.twitterData || undefined,
        linkedin: research.verifiedData?.linkedin || undefined,
        website: research.verifiedData?.website?.content || undefined,
      },
      userId: userId || undefined,
      createdAt: new Date().toISOString(),
    };

    await saveScore(scoreResult);
    console.log(`[judge] Score saved: ${scoreResult.name} = ${scoreResult.score} (${scoreResult.title})`);
    await updatePendingStatus(id, "complete");
    await removePending(id);

    return NextResponse.json({ id, slug });
  } catch (e: any) {
    console.error("Judge error:", e);
    try { await updatePendingStatus(id, "error", e.message); } catch {}
    return NextResponse.json({ error: e.message || "Failed to judge" }, { status: 500 });
  }
}
