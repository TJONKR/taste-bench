/**
 * Backfill slugs for existing evaluations that don't have one.
 * Run with: npx tsx scripts/backfill-slugs.ts
 */
import { getDb } from "../src/lib/db";
import { nameToSlug } from "../src/lib/slug";

function main() {
  const db = getDb();

  const rows = db.prepare("SELECT id, name FROM evaluations WHERE slug IS NULL").all() as { id: string; name: string }[];
  if (rows.length === 0) {
    console.log("No evaluations need slug backfill.");
    return;
  }

  console.log(`Backfilling slugs for ${rows.length} evaluations...`);

  const existingSlugs = new Set<string>();
  // Collect existing slugs
  const existing = db.prepare("SELECT slug FROM evaluations WHERE slug IS NOT NULL").all() as { slug: string }[];
  for (const row of existing) existingSlugs.add(row.slug);

  const update = db.prepare("UPDATE evaluations SET slug = ? WHERE id = ?");

  const tx = db.transaction(() => {
    for (const row of rows) {
      const base = nameToSlug(row.name);
      if (!base) {
        console.warn(`  Skipping "${row.name}" (id: ${row.id}) — produces empty slug`);
        continue;
      }

      let slug = base;
      let attempt = 1;
      while (existingSlugs.has(slug)) {
        attempt++;
        slug = `${base}-${attempt}`;
      }

      existingSlugs.add(slug);
      update.run(slug, row.id);
      console.log(`  ${row.name} → ${slug}`);
    }
  });

  tx();
  console.log("Done.");
}

main();
