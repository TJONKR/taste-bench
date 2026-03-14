import { Metadata } from "next";
import { getScore } from "@/lib/leaderboard";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const data = await getScore(params.slug);

  if (!data) {
    return { title: "Not Found — The Taste Bench" };
  }

  const score = Math.round(data.score);
  const title = `${data.name} scored ${score}/100 — "${data.title}"`;
  const description = data.verdict || `${data.name}'s taste evaluation on The Taste Bench.`;
  const ogImageUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "https://tastebench.ai"}/api/og/${params.slug}`;

  return {
    title: `${data.name} — The Taste Bench`,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${data.name}'s Taste Bench score: ${score}/100`,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
