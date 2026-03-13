import { getDb } from "./db";
import { supabase, isSupabaseConfigured } from "./supabase";

/**
 * Generate a URL slug from a name.
 * "Tijs Nieuwboer" → "tijs-nieuwboer"
 * "John O'Brien"   → "john-obrien"
 * "María García"   → "maria-garcia"
 */
export function nameToSlug(name: string): string {
  // NFD decompose, strip combining marks (accents etc.)
  let slug = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // strip non-alphanumeric except spaces/hyphens
    .trim()
    .replace(/\s+/g, "-") // spaces to hyphens
    .replace(/-+/g, "-") // collapse multiple hyphens
    .replace(/^-|-$/g, ""); // trim leading/trailing hyphens

  if (!slug) return "";

  // Prefix purely numeric slugs to avoid UUID confusion
  if (/^\d+$/.test(slug)) {
    slug = `u-${slug}`;
  }

  // Cap at 60 characters
  slug = slug.slice(0, 60).replace(/-$/, "");

  return slug;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-/;

/** Returns true if the string looks like a UUID (for slug vs ID disambiguation). */
export function isUUID(s: string): boolean {
  return UUID_RE.test(s);
}

/**
 * Generate a unique slug, handling collisions by appending -2, -3, etc.
 * Checks both evaluations and pending_jobs tables.
 */
export async function generateUniqueSlug(name: string): Promise<string> {
  const base = nameToSlug(name);
  if (!base) throw new Error("Cannot generate slug: name produces empty slug after processing");

  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = attempt === 0 ? base : `${base}-${attempt + 1}`;
    const exists = await slugExists(candidate);
    if (!exists) return candidate;
  }

  throw new Error(`Slug collision: could not find unique slug for "${name}" after 10 attempts`);
}

async function slugExists(slug: string): Promise<boolean> {
  // Check Supabase first if configured
  if (isSupabaseConfigured && supabase) {
    const { data: evalData } = await supabase
      .from("evaluations")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (evalData) return true;

    const { data: pendingData } = await supabase
      .from("pending_jobs")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (pendingData) return true;

    return false;
  }

  // SQLite fallback
  const db = getDb();
  const evalRow = db.prepare("SELECT id FROM evaluations WHERE slug = ?").get(slug);
  if (evalRow) return true;
  const pendingRow = db.prepare("SELECT id FROM pending_jobs WHERE slug = ?").get(slug);
  if (pendingRow) return true;
  return false;
}
