import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json([]);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json([], { status: 401 });

  const { data, error } = await supabase
    .from("evaluations")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json([], { status: 500 });

  // Convert snake_case to camelCase for frontend
  const results = (data || []).map((row: any) => ({
    id: row.id,
    name: row.name,
    score: row.score,
    title: row.title,
    verdict: row.verdict,
    tasteDNA: row.taste_dna,
    crossPlatformConsistency: row.cross_platform_consistency,
    recommendations: row.recommendations || [],
    dimensions: row.dimensions,
    input: row.input,
    avatarUrl: row.avatar_url,
    screenshots: row.screenshots || [],
    scrapedData: row.scraped_data || {},
    createdAt: row.created_at,
  }));

  return NextResponse.json(results);
}
