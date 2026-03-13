import { NextResponse } from "next/server";
import { getPendingStatus, getScore } from "@/lib/leaderboard";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: idOrSlug } = await params;

  // Check if already complete
  const score = await getScore(idOrSlug);
  if (score) {
    return NextResponse.json({
      status: "complete",
      name: score.name,
      slug: score.slug,
    });
  }

  // Check pending status (returns enriched StatusResponse)
  const pending = await getPendingStatus(idOrSlug);
  if (pending) return NextResponse.json(pending);

  return NextResponse.json({ status: "not-found" }, { status: 404 });
}
