import { NextResponse } from "next/server";
import { getPendingStatus, getScore } from "@/lib/leaderboard";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  // Check if already complete
  const score = await getScore(id);
  if (score) return NextResponse.json({ status: "complete" });

  // Check pending status
  const pending = await getPendingStatus(id);
  if (pending) return NextResponse.json(pending);

  return NextResponse.json({ status: "not-found" }, { status: 404 });
}
