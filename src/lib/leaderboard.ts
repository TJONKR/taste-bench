import { ScoreResult, StatusData, StatusResponse } from "./types";
import { supabase } from "./supabase";
import { isUUID } from "./slug";

// ============================================================
// Lookup helper — slug vs UUID disambiguation
// ============================================================

interface Lookup {
  id?: string;
  slug?: string;
}

function toLookup(idOrSlug: string): Lookup {
  return isUUID(idOrSlug) ? { id: idOrSlug } : { slug: idOrSlug };
}

// ============================================================
// Supabase helpers (snake_case ↔ camelCase conversion)
// ============================================================

type PendingStatus = "scraping-twitter" | "scraping-linkedin" | "scraping-website" | "deep-research" | "capturing-screenshots" | "verifying-data" | "analyzing" | "writing-report" | "generating-report" | "complete" | "error";

function toDbRow(score: ScoreResult) {
  return {
    id: score.id,
    name: score.name,
    slug: score.slug || null,
    score: score.score,
    title: score.title,
    verdict: score.verdict,
    level_profile: score.levelProfile,
    overall_level: score.overallLevel,
    taste_dna: score.tasteDNA,
    cross_platform_consistency: score.crossPlatformConsistency,
    recommendations: score.recommendations,
    dimensions: score.dimensions,
    input: score.input,
    data_sources: score.dataSources,
    avatar_url: score.avatarUrl,
    screenshots: score.screenshots,
    scraped_data: score.scrapedData,
    user_id: score.userId || null,
    created_at: score.createdAt,
  };
}

function fromDbRow(row: any): ScoreResult {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug || "",
    score: row.score,
    title: row.title,
    verdict: row.verdict,
    levelProfile: row.level_profile || "",
    overallLevel: row.overall_level || "",
    tasteDNA: row.taste_dna,
    crossPlatformConsistency: row.cross_platform_consistency,
    recommendations: row.recommendations || [],
    dimensions: row.dimensions,
    input: row.input,
    dataSources: row.data_sources || [],
    avatarUrl: row.avatar_url,
    screenshots: row.screenshots || [],
    scrapedData: row.scraped_data || {},
    userId: row.user_id || undefined,
    createdAt: row.created_at,
  };
}

// ============================================================
// Public API
// ============================================================

export async function getLeaderboard(): Promise<ScoreResult[]> {
  const { data, error } = await supabase.from("evaluations").select("*").order("score", { ascending: false });
  if (error) console.error("Supabase getLeaderboard error:", error);
  return !error && data ? data.map(fromDbRow) : [];
}

export async function saveScore(score: ScoreResult) {
  const { error } = await supabase.from("evaluations").upsert(toDbRow(score), { onConflict: "slug" });
  if (error) console.error("Supabase saveScore error:", error);
}

export async function getScore(idOrSlug: string): Promise<ScoreResult | undefined> {
  const lookup = toLookup(idOrSlug);
  const col = lookup.id ? "id" : "slug";
  const val = lookup.id || lookup.slug!;
  const { data, error } = await supabase.from("evaluations").select("*").eq(col, val).maybeSingle();
  if (error) console.error("Supabase getScore error:", error);
  return !error && data ? fromDbRow(data) : undefined;
}

export async function savePending(id: string, input: any, slug?: string, userId?: string) {
  const row: any = { id, input, status: "scraping-twitter" };
  if (slug) row.slug = slug;
  if (userId) row.user_id = userId;
  const { error } = await supabase.from("pending_jobs").insert(row);
  if (error) console.error("Supabase savePending error:", error);
}

export async function updatePendingStatus(id: string, status: PendingStatus, error?: string, statusData?: StatusData) {
  const update: any = { status };
  if (error) update.error = error;
  if (statusData) update.status_data = statusData;
  const { error: dbError } = await supabase.from("pending_jobs").update(update).eq("id", id);
  if (dbError) console.error("Supabase updatePendingStatus error:", dbError);
}

export async function getPendingStatus(idOrSlug: string): Promise<StatusResponse | null> {
  const lookup = toLookup(idOrSlug);
  const col = lookup.id ? "id" : "slug";
  const val = lookup.id || lookup.slug!;
  const { data, error } = await supabase
    .from("pending_jobs")
    .select("status, error, status_data, slug, input")
    .eq(col, val)
    .maybeSingle();
  if (error) console.error("Supabase getPendingStatus error:", error);
  if (!error && data) {
    const input = data.input || {};
    return {
      status: data.status,
      error: data.error ?? undefined,
      stats: data.status_data ?? undefined,
      name: typeof input === "object" ? input.name : undefined,
      slug: data.slug ?? undefined,
    };
  }
  return null;
}

export async function removePending(id: string) {
  const { error } = await supabase.from("pending_jobs").delete().eq("id", id);
  if (error) console.error("Supabase removePending error:", error);
}
