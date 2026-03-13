import { NextResponse } from "next/server";
import { getScore } from "@/lib/leaderboard";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: idOrSlug } = await params;
  const score = await getScore(idOrSlug);
  if (!score) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(score);
}
