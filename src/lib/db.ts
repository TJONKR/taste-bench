import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_PATH = path.join(process.cwd(), "data", "taste-bench.db");
const JSON_PATH = path.join(process.cwd(), "data", "leaderboard.json");
const PENDING_JSON_PATH = path.join(process.cwd(), "data", "pending.json");

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;

  // Ensure data directory exists
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  _db = new Database(DB_PATH);
  _db.pragma("journal_mode = WAL");
  _db.pragma("foreign_keys = ON");

  // Create tables
  _db.exec(`
    CREATE TABLE IF NOT EXISTS evaluations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      score REAL NOT NULL,
      title TEXT NOT NULL,
      verdict TEXT NOT NULL,
      level_profile TEXT,
      overall_level TEXT,
      taste_dna TEXT,
      cross_platform_consistency TEXT,
      recommendations TEXT, -- JSON array
      dimensions TEXT NOT NULL, -- JSON object
      input TEXT, -- JSON object
      data_sources TEXT,
      avatar_url TEXT,
      screenshots TEXT, -- JSON array
      scraped_data TEXT, -- JSON object
      user_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS pending_jobs (
      id TEXT PRIMARY KEY,
      input TEXT, -- JSON object
      status TEXT NOT NULL DEFAULT 'scraping-twitter',
      error TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Migrate existing tables to v2 schema
  try {
    _db.exec(`ALTER TABLE evaluations ADD COLUMN level_profile TEXT`);
  } catch {} // Column already exists
  try {
    _db.exec(`ALTER TABLE evaluations ADD COLUMN overall_level TEXT`);
  } catch {}
  try {
    _db.exec(`ALTER TABLE evaluations ADD COLUMN data_sources TEXT`);
  } catch {}

  // Migrate existing JSON data on first run
  migrateFromJson(_db);

  return _db;
}

function migrateFromJson(db: Database.Database) {
  // Only migrate if JSON file exists and DB is empty
  const count = db.prepare("SELECT COUNT(*) as c FROM evaluations").get() as { c: number };
  if (count.c > 0) return;

  // Migrate evaluations
  if (fs.existsSync(JSON_PATH)) {
    try {
      const data = JSON.parse(fs.readFileSync(JSON_PATH, "utf-8"));
      if (Array.isArray(data) && data.length > 0) {
        const insert = db.prepare(`
          INSERT OR IGNORE INTO evaluations (id, name, score, title, verdict, taste_dna, cross_platform_consistency, recommendations, dimensions, input, avatar_url, screenshots, scraped_data, created_at)
          VALUES (@id, @name, @score, @title, @verdict, @taste_dna, @cross_platform_consistency, @recommendations, @dimensions, @input, @avatar_url, @screenshots, @scraped_data, @created_at)
        `);
        const tx = db.transaction(() => {
          for (const item of data) {
            insert.run({
              id: item.id,
              name: item.name,
              score: item.score,
              title: item.title,
              verdict: item.verdict,
              taste_dna: item.tasteDNA || null,
              cross_platform_consistency: item.crossPlatformConsistency || null,
              recommendations: JSON.stringify(item.recommendations || []),
              dimensions: JSON.stringify(item.dimensions),
              input: JSON.stringify(item.input || {}),
              avatar_url: item.avatarUrl || null,
              screenshots: JSON.stringify(item.screenshots || []),
              scraped_data: JSON.stringify(item.scrapedData || {}),
              created_at: item.createdAt || new Date().toISOString(),
            });
          }
        });
        tx();
        console.log(`[db] Migrated ${data.length} evaluations from JSON to SQLite`);
      }
    } catch (e) {
      console.error("[db] Failed to migrate evaluations JSON:", e);
    }
  }

  // Migrate pending jobs
  if (fs.existsSync(PENDING_JSON_PATH)) {
    try {
      const data = JSON.parse(fs.readFileSync(PENDING_JSON_PATH, "utf-8"));
      if (Array.isArray(data) && data.length > 0) {
        const insert = db.prepare(`
          INSERT OR IGNORE INTO pending_jobs (id, input, status, error, created_at)
          VALUES (@id, @input, @status, @error, @created_at)
        `);
        const tx = db.transaction(() => {
          for (const item of data) {
            insert.run({
              id: item.id,
              input: JSON.stringify(item.input || {}),
              status: item.status,
              error: item.error || null,
              created_at: item.createdAt || new Date().toISOString(),
            });
          }
        });
        tx();
        console.log(`[db] Migrated ${data.length} pending jobs from JSON to SQLite`);
      }
    } catch (e) {
      console.error("[db] Failed to migrate pending JSON:", e);
    }
  }
}
