import { ScoreResult } from "./types";
import { supabase, isSupabaseConfigured } from "./supabase";
import { getDb } from "./db";

// ============================================================
// SQLite helpers
// ============================================================

interface PendingJob {
  id: string;
  input: any;
  status: "scraping-twitter" | "scraping-linkedin" | "scraping-website" | "deep-research" | "capturing-screenshots" | "verifying-data" | "analyzing" | "writing-report" | "generating-report" | "complete" | "error";
  error?: string;
  createdAt: string;
}

function toScoreResult(row: any): ScoreResult {
  return {
    id: row.id,
    name: row.name,
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
    INSERT OR REPLACE INTO evaluations (id, name, score, title, verdict, level_profile, overall_level, taste_dna, cross_platform_consistency, recommendations, dimensions, input, data_sources, avatar_url, screenshots, scraped_data, created_at)
    VALUES (@id, @name, @score, @title, @verdict, @level_profile, @overall_level, @taste_dna, @cross_platform_consistency, @recommendations, @dimensions, @input, @data_sources, @avatar_url, @screenshots, @scraped_data, @created_at)
  `).run({
    id: score.id,
    name: score.name,
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
    created_at: score.createdAt,
  });
}

function sqliteGetScore(id: string): ScoreResult | undefined {
  const db = getDb();
  const row = db.prepare("SELECT * FROM evaluations WHERE id = ?").get(id);
  return row ? toScoreResult(row) : undefined;
}

function sqliteSavePending(id: string, input: any) {
  const db = getDb();
  db.prepare("INSERT OR REPLACE INTO pending_jobs (id, input, status, created_at) VALUES (?, ?, 'scraping-twitter', datetime('now'))").run(id, JSON.stringify(input));
}

function sqliteUpdatePendingStatus(id: string, status: PendingJob["status"], error?: string) {
  const db = getDb();
  if (error) {
    db.prepare("UPDATE pending_jobs SET status = ?, error = ? WHERE id = ?").run(status, error, id);
  } else {
    db.prepare("UPDATE pending_jobs SET status = ? WHERE id = ?").run(status, id);
  }
}

function sqliteGetPendingStatus(id: string): { status: string; error?: string } | null {
  const db = getDb();
  const row = db.prepare("SELECT status, error FROM pending_jobs WHERE id = ?").get(id) as any;
  if (!row) return null;
  return { status: row.status, error: row.error ?? undefined };
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
    created_at: score.createdAt,
  };
}

function fromDbRow(row: any): ScoreResult {
  return {
    id: row.id,
    name: row.name,
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
    createdAt: row.created_at,
  };
}

// ============================================================
// Public API — delegates to Supabase or SQLite (default)
// ============================================================

export async function getLeaderboard(): Promise<ScoreResult[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from("evaluations").select("*").order("score", { ascending: false });
    if (!error) return (data || []).map(fromDbRow);
    console.error("Supabase getLeaderboard error:", error);
  }
  return sqliteGetLeaderboard();
}

export async function saveScore(score: ScoreResult) {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from("evaluations").insert(toDbRow(score));
    if (!error) return;
    console.error("Supabase saveScore error:", error);
  }
  sqliteSaveScore(score);
}

export async function getScore(id: string): Promise<ScoreResult | undefined> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from("evaluations").select("*").eq("id", id).single();
    if (!error && data) return fromDbRow(data);
    if (error) console.error("Supabase getScore error:", error);
  }
  return sqliteGetScore(id);
}

export async function savePending(id: string, input: any) {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from("pending_jobs").insert({ id, input, status: "scraping-twitter" });
    if (!error) return;
    console.error("Supabase savePending error:", error);
  }
  sqliteSavePending(id, input);
}

export async function updatePendingStatus(id: string, status: PendingJob["status"], error?: string) {
  if (isSupabaseConfigured && supabase) {
    const update: any = { status };
    if (error) update.error = error;
    const { error: dbError } = await supabase.from("pending_jobs").update(update).eq("id", id);
    if (!dbError) return;
    console.error("Supabase updatePendingStatus error:", dbError);
  }
  sqliteUpdatePendingStatus(id, status, error);
}

export async function getPendingStatus(id: string): Promise<{ status: string; error?: string } | null> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from("pending_jobs").select("status, error").eq("id", id).single();
    if (!error && data) return { status: data.status, error: data.error ?? undefined };
    if (error) console.error("Supabase getPendingStatus error:", error);
  }
  return sqliteGetPendingStatus(id);
}

export async function removePending(id: string) {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from("pending_jobs").delete().eq("id", id);
    if (!error) return;
    console.error("Supabase removePending error:", error);
  }
  sqliteRemovePending(id);
}
