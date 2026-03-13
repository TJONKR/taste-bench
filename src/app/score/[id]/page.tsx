import { redirect } from "next/navigation";
import { getScore } from "@/lib/leaderboard";

export default async function ScoreRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const score = await getScore(id);
  if (score?.slug) {
    redirect(`/@${score.slug}`);
  }

  // Fallback: try to view by id on the profile page
  redirect(`/@${id}`);
}
