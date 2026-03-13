import { redirect } from "next/navigation";
import { getScore, getPendingStatus } from "@/lib/leaderboard";

export default async function JudgeRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Try to find the slug from a completed evaluation
  const score = await getScore(id);
  if (score?.slug) {
    redirect(`/@${score.slug}`);
  }

  // Try to find it from a pending job
  const pending = await getPendingStatus(id);
  if (pending?.slug) {
    redirect(`/@${pending.slug}`);
  }

  // Fallback: redirect to the profile page using the id as slug
  // (will show "not found" if truly invalid)
  redirect(`/@${id}`);
}
