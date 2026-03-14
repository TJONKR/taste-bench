import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getScore, getLeaderboard } from "@/lib/leaderboard";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const data = await getScore(params.slug);
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Get leaderboard for ranking context
  const leaderboard = await getLeaderboard();
  const rank = leaderboard.findIndex((e) => e.slug === params.slug) + 1;
  const total = leaderboard.length;

  // Find interesting comparisons
  const comparisons = leaderboard
    .filter((e) => e.slug !== params.slug)
    .map((e) => ({
      name: e.name,
      score: Math.round(e.score),
      handle: e.input?.twitter ? `@${e.input.twitter.replace(/^@/, "")}` : null,
    }))
    .slice(0, 20);

  const handle = data.input?.twitter
    ? `@${data.input.twitter.replace(/^@/, "")}`
    : data.name;

  const profileUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "https://tastebench.ai"}/p/${params.slug}`;

  const dims = Object.entries(data.dimensions) as [
    string,
    { score: number; level: string; note: string }
  ][];

  const highestDim = dims.reduce((a, b) => (a[1].score > b[1].score ? a : b));
  const lowestDim = dims.reduce((a, b) => (a[1].score < b[1].score ? a : b));

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 500,
    messages: [
      {
        role: "user",
        content: `Generate a tweet for sharing someone's Taste Bench result. Make it ATTENTION-GRABBING and specific to this person.

PERSON:
- Name: ${data.name}
- Handle: ${handle}
- Score: ${Math.round(data.score)}/100
- Title: "${data.title}"
- Level: ${data.overallLevel || "N/A"}
- Rank: #${rank} of ${total} people evaluated
- Strongest dimension: ${highestDim[0]} (${Math.round(highestDim[1].score)})
- Weakest dimension: ${lowestDim[0]} (${Math.round(lowestDim[1].score)})
- Verdict: ${data.verdict}
- Taste DNA: ${data.tasteDNA || "N/A"}

LEADERBOARD CONTEXT (for comparisons):
${comparisons.map((c) => `${c.name}${c.handle ? ` (${c.handle})` : ""}: ${c.score}/100`).join("\n")}

RULES:
1. Start with something PROVOCATIVE or SURPRISING — a comparison, a ranking shock, a specific insight
2. Examples of good hooks:
   - "${handle} just outscored Elon Musk in taste. By a lot."
   - "A random founder from Amsterdam has better taste than half of Silicon Valley."
   - "#${rank} on the Taste Bench. ${handle}'s ${highestDim[0]} score is insane."
3. Include their score and title
4. Use specific details from their evaluation — what makes THEM unique
5. Keep it under 240 chars (leave room for the URL)
6. End with a CTA — either "Check your own taste →" or "Full breakdown →"
7. Don't use hashtags
8. Be witty, not corporate
9. If they scored higher than someone notable on the leaderboard, USE THAT

Output ONLY the tweet text, nothing else. No quotes around it.`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== "text") {
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }

  const tweet = content.text.trim();

  return NextResponse.json({
    tweet,
    url: profileUrl,
    handle,
    fullTweet: `${tweet}\n\n${profileUrl}`,
  });
}
