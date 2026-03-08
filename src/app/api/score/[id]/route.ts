import { NextResponse } from "next/server";
import { getScore } from "@/lib/leaderboard";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const score = await getScore(params.id);
  if (!score) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(score);
}
