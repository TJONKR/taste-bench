import { NextResponse } from "next/server";
import { getLeaderboard } from "@/lib/leaderboard";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = (await getLeaderboard()).sort((a, b) => b.score - a.score);
  return NextResponse.json(data);
}
