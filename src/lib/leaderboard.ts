import { ScoreResult, StatusData, StatusResponse } from "./types";
import { supabase, isSupabaseConfigured } from "./supabase";
import { getDb } from "./db";
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
// SQLite helpers
// ============================================================

interface PendingJob {
  id: string;
  input: any;
  slug?: string;
  status: "scraping-twitter" | "scraping-linkedin" | "scraping-website" | "deep-research" | "capturing-screenshots" | "verifying-data" | "analyzing" | "writing-report" | "generating-report" | "complete" | "error";
  statusData?: StatusData;
  error?: string;
  name?: string;
  userId?: string;
  createdAt: string;
}

function toScoreResult(row: any): ScoreResult {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug || "",
    score: row.score,
    title: row.title,
    verdict: row.verdict,
    levelProfile: row.level_profile || "",
    overallLevel: row.overall_level || "",
    tasteDNA: row.taste_dna || "",
    crossPlatformConsistency: row.cross_platform_consistency || "",
    recommendations: JSON.parse(row.recommendations || "[]"),
    dimensions: JSON.parse(row.dimensions),
    input: JSON.parse(row.input || "{}"),
    dataSources: JSON.parse(row.data_sources || "[]"),
    avatarUrl: row.avatar_url || "",
    screenshots: JSON.parse(row.screenshots || "[]"),
    scrapedData: JSON.parse(row.scraped_data || "{}"),
    userId: row.user_id || undefined,
    createdAt: row.created_at,
  };
}

function sqliteGetLeaderboard(): ScoreResult[] {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM evaluations ORDER BY score DESC").all();
  return rows.map(toScoreResult);
}

function sqliteSaveScore(score: ScoreResult) {
  const db = getDb();
  db.prepare(`
    INSERT OR REPLACE INTO evaluations (id, name, slug, score, title, verdict, level_profile, overall_level, taste_dna, cross_platform_consistency, recommendations, dimensions, input, data_sources, avatar_url, screenshots, scraped_data, user_id, created_at)
    VALUES (@id, @name, @slug, @score, @title, @verdict, @level_profile, @overall_level, @taste_dna, @cross_platform_consistency, @recommendations, @dimensions, @input, @data_sources, @avatar_url, @screenshots, @scraped_data, @user_id, @created_at)
  `).run({
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
    recommendations: JSON.stringify(score.recommendations),
    dimensions: JSON.stringify(score.dimensions),
    input: JSON.stringify(score.input),
    data_sources: JSON.stringify(score.dataSources),
    avatar_url: score.avatarUrl,
    screenshots: JSON.stringify(score.screenshots),
    scraped_data: JSON.stringify(score.scrapedData),
    user_id: score.userId || null,
    created_at: score.createdAt,
  });
}

function sqliteGetScore(lookup: Lookup): ScoreResult | undefined {
  const db = getDb();
  const row = lookup.id
    ? db.prepare("SELECT * FROM evaluations WHERE id = ?").get(lookup.id)
    : db.prepare("SELECT * FROM evaluations WHERE slug = ?").get(lookup.slug);
  return row ? toScoreResult(row) : undefined;
}

function sqliteSavePending(id: string, input: any, slug?: string, userId?: string) {
  const db = getDb();
  db.prepare(
    "INSERT OR REPLACE INTO pending_jobs (id, input, slug, status, user_id, created_at) VALUES (?, ?, ?, 'scraping-twitter', ?, datetime('now'))"
  ).run(id, JSON.stringify(input), slug || null, userId || null);
}

function sqliteUpdatePendingStatus(id: string, status: PendingJob["status"], error?: string, statusData?: StatusData) {
  const db = getDb();
  const statusDataJson = statusData ? JSON.stringify(statusData) : null;
  if (error) {
    db.prepare("UPDATE pending_jobs SET status = ?, error = ?, status_data = ? WHERE id = ?").run(status, error, statusDataJson, id);
  } else {
    db.prepare("UPDATE pending_jobs SET status = ?, status_data = ? WHERE id = ?").run(status, statusDataJson, id);
  }
}

function sqliteGetPendingStatus(lookup: Lookup): StatusResponse | null {
  const db = getDb();
  const row = (lookup.id
    ? db.prepare("SELECT status, error, status_data, slug, input FROM pending_jobs WHERE id = ?").get(lookup.id)
    : db.prepare("SELECT status, error, status_data, slug, input FROM pending_jobs WHERE slug = ?").get(lookup.slug)) as any;
  if (!row) return null;
  const input = row.input ? JSON.parse(row.input) : {};
  return {
    status: row.status,
    error: row.error ?? undefined,
    stats: row.status_data ? JSON.parse(row.status_data) : undefined,
    name: input.name,
    slug: row.slug ?? undefined,
  };
}

function sqliteRemovePending(id: string) {
  const db = getDb();
  db.prepare("DELETE FROM pending_jobs WHERE id = ?").run(id);
}

// ============================================================
// Supabase helpers (snake_case ↔ camelCase conversion)
// ============================================================

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
// Public API — delegates to Supabase or SQLite (default)
// ============================================================

export async function getLeaderboard(): Promise<ScoreResult[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from("evaluations").select("*").order("score", { ascending: false });
    if (!error && data && data.length > 0) return data.map(fromDbRow);
    if (error) console.error("Supabase getLeaderboard error:", error);
    // Fall through to SQLite if Supabase returned empty or errored
  }
  return sqliteGetLeaderboard();
}

export async function saveScore(score: ScoreResult) {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from("evaluations").upsert(toDbRow(score), { onConflict: "slug" });
    if (!error) return;
    console.error("Supabase saveScore error:", error);
  }
  sqliteSaveScore(score);
}

export async function getScore(idOrSlug: string): Promise<ScoreResult | undefined> {
  const lookup = toLookup(idOrSlug);

  if (isSupabaseConfigured && supabase) {
    const col = lookup.id ? "id" : "slug";
    const val = lookup.id || lookup.slug!;
    const { data, error } = await supabase.from("evaluations").select("*").eq(col, val).maybeSingle();
    if (!error && data) return fromDbRow(data);
    if (error) console.error("Supabase getScore error:", error);
  }
  return sqliteGetScore(lookup);
}

export async function savePending(id: string, input: any, slug?: string, userId?: string) {
  if (isSupabaseConfigured && supabase) {
    const row: any = { id, input, status: "scraping-twitter" };
    if (slug) row.slug = slug;
    if (userId) row.user_id = userId;
    const { error } = await supabase.from("pending_jobs").insert(row);
    if (!error) return;
    console.error("Supabase savePending error:", error);
  }
  sqliteSavePending(id, input, slug, userId);
}

export async function updatePendingStatus(id: string, status: PendingJob["status"], error?: string, statusData?: StatusData) {
  if (isSupabaseConfigured && supabase) {
    const update: any = { status };
    if (error) update.error = error;
    if (statusData) update.status_data = statusData;
    const { error: dbError } = await supabase.from("pending_jobs").update(update).eq("id", id);
    if (!dbError) return;
    console.error("Supabase updatePendingStatus error:", dbError);
  }
  sqliteUpdatePendingStatus(id, status, error, statusData);
}

export async function getPendingStatus(idOrSlug: string): Promise<StatusResponse | null> {
  const lookup = toLookup(idOrSlug);

  if (isSupabaseConfigured && supabase) {
    const col = lookup.id ? "id" : "slug";
    const val = lookup.id || lookup.slug!;
    const { data, error } = await supabase
      .from("pending_jobs")
      .select("status, error, status_data, slug, input")
      .eq(col, val)
      .maybeSingle();
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
    if (error) console.error("Supabase getPendingStatus error:", error);
  }
  return sqliteGetPendingStatus(lookup);
}

export async function removePending(id: string) {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from("pending_jobs").delete().eq("id", id);
    if (!error) return;
    console.error("Supabase removePending error:", error);
  }
  sqliteRemovePending(id);
}
