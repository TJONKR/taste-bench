# Progressive Profile Page + BYOK Design

**Date:** 2026-03-11
**Status:** Approved

## Overview

Replace the current 3-page flow (homepage → judge progress page → score page) with a single progressive profile page at `/@{slug}`. Add BYOK (Bring Your Own Key) authentication so users provide their own Anthropic API key to run evaluations.

## URL Structure

- **`/@{slug}`** — the profile/score page (e.g., `/@tijs-nieuwboer`)
- Slug generated from name: lowercase, spaces to hyphens, strip special chars, trim trailing hyphens
- Slug stored on the pending_jobs record (and later on the evaluation record when scoring completes)
- If slug collision, append short numeric suffix (`/@tijs-nieuwboer-2`)
- Old `/score/{id}` redirects to `/@{slug}` (backwards compat)
- Old `/judge/{id}` redirects to `/@{slug}` (backwards compat)

### Slug Generation

```
"Tijs Nieuwboer"  → "tijs-nieuwboer"
"John O'Brien"    → "john-obrien"
"María García"    → "maria-garcia"
"  Extra  Spaces" → "extra-spaces"
""                → (rejected — name is required)
"🎨🎭"            → (rejected — no latin characters remain after stripping)
"42"              → "u-42" (prefixed to avoid confusion with UUIDs)
```

Edge cases:
- Empty string after processing → reject submission with validation error
- Length cap: slugs truncated to 60 characters (before collision suffix)
- Unicode normalization: NFD decompose, strip combining marks, then strip non-alphanumeric except hyphens
- Purely numeric slugs: prefix with `u-` to avoid UUID/ID confusion in API routes
- Slug collision handling: if INSERT fails with unique constraint violation, retry with incremented suffix (`-2`, `-3`, ...) up to 10 attempts

### Routing Implementation

**Problem:** Next.js App Router reserves the `@` prefix for parallel routes. `src/app/@[slug]/page.tsx` won't work.

**Solution:** Use Next.js middleware to rewrite `/@{slug}` URLs to an internal route.

- File system route: `src/app/p/[slug]/page.tsx` (using `/p/` to avoid conflict with existing `/profile` dashboard page)
- User-facing URL: `/@tijs-nieuwboer` (unchanged in browser)
- Middleware rewrites: `/@{slug}` → `/p/{slug}` (internal only)

```typescript
// middleware.ts (added to existing middleware)
if (pathname.startsWith('/@')) {
  const slug = pathname.slice(2); // strip "/@"
  const url = request.nextUrl.clone();
  url.pathname = `/p/${slug}`;
  return NextResponse.rewrite(url);
}
```

Links in the app always use `/@{slug}` format. The rewrite is invisible to the user.

**Existing `/profile` page:** The current `src/app/profile/page.tsx` (authenticated "my evaluations" dashboard) remains unchanged. It is a separate page from the public profile at `/@{slug}`. Its evaluation links will be updated to use `/@{slug}` format instead of `/score/{id}`.

## Single Profile Page (`/@{slug}`)

One page, three states:

### State 1: Evaluation In Progress

Shown immediately after submission. The page IS the progress tracker.

**Layout:**
- Name + avatar at top (available immediately from form input)
- Pipeline step checklist with real stats appearing as steps complete:
  - ✓ Scraped 142 tweets + 8 LinkedIn posts
  - ✓ Captured website screenshot
  - ✓ Verified data integrity
  - ● Scoring 6 dimensions (3x each)...
  - ○ Writing editorial report
  - ○ Final score
- Skeleton dimension bars below the checklist
- Polls `/api/status/{slug}` every 2 seconds

**Step completion data:** The status API returns richer data than just a string — it includes stats from completed steps (tweet count, post count, data sources found). These populate the checklist with real numbers.

**How the page determines its state:**
1. Call `/api/score/{slug}` — if data returned, render State 3
2. If 404, call `/api/status/{slug}` — if status exists:
   - If `status === "complete"`: fetch `/api/score/{slug}` again, render State 2 (animated transition) or State 3
   - If `status === "error"`: render Error State
   - Otherwise: render State 1 (polling continues)
3. If both return 404: show "Evaluation not found" message

### State 2: Evaluation Complete (Transition)

When the pipeline finishes (detected via polling):
- Step checklist fades out
- Score ring animates in with the final score
- Dimension bars fill with actual scores (animated)
- Report text, recommendations, screenshots fade in
- Full ScoreCard component renders

### State 3: Existing Evaluation (Direct Visit)

When visiting a completed evaluation directly (e.g., shared link):
- Loads instantly with all data
- No loading states, no skeleton
- Same ScoreCard layout as today

### Error State

When the pipeline fails:
- Step checklist shows which step failed
- Error message displayed with "Try again" link back to homepage
- Error info comes from `/api/status/{slug}` returning `{ status: "error", error: "..." }`

## Authentication + BYOK

### Access Levels

| Action | Auth Required | API Key Required |
|--------|:---:|:---:|
| Browse leaderboard | No | No |
| View existing scores | No | No |
| Submit new evaluation | Yes | Yes |

### BYOK Flow

1. User signs in (existing Supabase auth — email/password or Google OAuth)
2. User navigates to `/settings` and pastes their Anthropic API key
3. Key is pre-validated (format check: must start with `sk-ant-`) then validated via a lightweight Anthropic API call
4. Key is encrypted and stored in `user_settings` table
5. User can now submit evaluations from the homepage
6. Each evaluation uses the user's own key (decrypted server-side in the judge route)

### Settings Page (`/settings`)

- Anthropic API key input (password-masked, with show/hide toggle)
- "Validate Key" button — pre-checks format, then makes a lightweight Anthropic API call to verify
- Status indicator: "Key valid" / "Key invalid" / "No key saved"
- Key stored in Supabase `user_settings` table (encrypted)
- Option to delete/replace key

### Submission Form Changes

- If not signed in: form fields visible but submit button says "Sign in to evaluate" → redirects to `/auth`
- If signed in but no API key: submit button says "Add API key in Settings" → links to `/settings`
- If signed in + key saved: submit works normally

### Auth Enforcement

Protected routes are enforced at the API level:
- `/api/submit`, `/api/settings` — check Supabase session via `createClient` from `@/lib/supabase-server.ts`
- Return 401 if no valid session
- Frontend checks auth state via Supabase client and adjusts UI accordingly (button text, links)

## Data Model Changes

### New Table: `user_settings`

```sql
CREATE TABLE user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  anthropic_api_key TEXT, -- encrypted: "iv:authTag:ciphertext" in hex
  key_validated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: users can only read/write their own settings
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own settings"
  ON user_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON user_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own settings"
  ON user_settings FOR DELETE
  USING (auth.uid() = user_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_user_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_user_settings_updated_at();
```

BYOK requires Supabase auth — not available in SQLite-only mode. The settings page shows an appropriate message when running without Supabase.

### Evaluations Table Changes

```sql
ALTER TABLE evaluations ADD COLUMN slug TEXT UNIQUE;
ALTER TABLE evaluations ADD COLUMN user_id UUID REFERENCES auth.users(id);
CREATE INDEX idx_evaluations_slug ON evaluations(slug);
```

### Pending Jobs Changes

```sql
ALTER TABLE pending_jobs ADD COLUMN slug TEXT UNIQUE;
ALTER TABLE pending_jobs ADD COLUMN status_data TEXT; -- JSON with step stats
ALTER TABLE pending_jobs ADD COLUMN user_id UUID REFERENCES auth.users(id);
CREATE INDEX idx_pending_jobs_slug ON pending_jobs(slug);
```

The slug is set on the pending_jobs record at job creation. This allows the status API to look up in-progress jobs by slug.

### SQLite Schema Updates

SQLite schema is managed in `src/lib/db.ts`, not via migration files. Two changes needed:

1. **`CREATE TABLE` statements** — add `slug TEXT UNIQUE`, `status_data TEXT` to both tables (note: `evaluations` already has `user_id TEXT`)
2. **Migration try/catch blocks** — add `ALTER TABLE` statements for existing databases, following the existing pattern (e.g., the `level_profile`/`overall_level`/`data_sources` migrations)

```sql
-- evaluations: add slug (user_id already exists in SQLite schema)
ALTER TABLE evaluations ADD COLUMN slug TEXT UNIQUE;

-- pending_jobs: add slug, status_data, user_id
ALTER TABLE pending_jobs ADD COLUMN slug TEXT UNIQUE;
ALTER TABLE pending_jobs ADD COLUMN status_data TEXT;
ALTER TABLE pending_jobs ADD COLUMN user_id TEXT;
```

### Status Data Example

```json
{
  "tweetCount": 142,
  "linkedinPostCount": 8,
  "dataSources": ["twitter", "linkedin", "website"],
  "screenshotsCaptured": 2
}
```

## API Changes

### Modified Endpoints

**`POST /api/submit`**
- Requires authentication (check Supabase session via `createClient`)
- Reads user's API key from `user_settings` (decrypts server-side)
- Generates slug from name, handles collisions with retry-on-unique-violation
- Creates pending_jobs record with slug + user_id + name
- Calls judge route internally, passing full input data (`name`, `twitter`, `linkedin`, `website`, `description`) plus `userId` (not the raw key)
- Returns `{ slug, id }` — frontend redirects to `/@{slug}`
- Rate limited: rejects if user has ≥10 evaluations created in the last hour (counted from `evaluations` table by `user_id` + `created_at`)

**Note:** The evaluations record is NOT created at submit time. It is created by the judge route after scoring completes (via `saveScore()`), at which point the slug is copied from the pending_jobs record to the evaluation. This preserves the existing NOT NULL constraints on `evaluations.score` and `evaluations.dimensions`.

**`POST /api/judge`**
- Accepts full input data (`name`, `twitter`, `linkedin`, `website`, `description`) plus `userId` and `slug`
- Decrypts API key from `user_settings` table using `userId`
- Creates Anthropic client with the user's key
- Updates pending_jobs status with richer data (step stats via `status_data` column)
- When building the `ScoreResult` object, includes `slug` on it so `saveScore()` persists the slug on the evaluation record
- If key becomes invalid mid-evaluation (e.g., revoked, quota exceeded): marks job as error with descriptive message

**`GET /api/status/[id]/route.ts`** (existing file, updated to handle both slug and UUID)
- Directory stays as `[id]` (Next.js param name is a local convention, does not affect URL behavior)
- Disambiguation: if param matches UUID format (`/^[0-9a-f]{8}-[0-9a-f]{4}-/`), query by `id`; otherwise query by `slug`
- Returns: `{ status, step, stats: { tweetCount, ... }, name, slug }`
- `name` and `slug` included so the profile page can render the header and construct canonical URLs
- Public (no auth required — status is not sensitive)
- Underlying `getPendingStatus()` in `leaderboard.ts` updated to accept a `{ id?: string; slug?: string }` param and query the appropriate column

**`GET /api/score/[id]/route.ts`** (existing file, updated to handle both slug and UUID)
- Same UUID-vs-slug disambiguation as status
- Returns full evaluation data (same shape as current response), now including `slug` field
- Returns 404 if no completed evaluation exists
- Public (no auth required)
- Underlying `getScore()` in `leaderboard.ts` updated to accept `{ id?: string; slug?: string }` and query accordingly

### New Endpoints

**`GET /api/settings`**
- Requires auth (Supabase session)
- Returns `{ hasKey: boolean, keyValidatedAt: string | null }`
- Never returns the actual key

**`POST /api/settings`**
- Requires auth
- Body: `{ anthropicApiKey: string }`
- Pre-validates format (must start with `sk-ant-`)
- Validates via lightweight Anthropic API call (Messages API with `max_tokens: 1`)
- Encrypts and stores key, returns `{ valid: boolean }`

**`DELETE /api/settings`**
- Requires auth
- Removes stored API key

## Page Routing Changes

### New Routes

- `/@{slug}` → `src/app/p/[slug]/page.tsx` (via middleware rewrite)
- `/settings` → `src/app/settings/page.tsx` — API key management

### Redirects (via page server components, not middleware)

Old routes become server components that look up the slug and redirect:

- `src/app/score/[id]/page.tsx` → fetches slug from DB by id, returns `redirect('/@{slug}')`
- `src/app/judge/[id]/page.tsx` → fetches slug from DB by id, returns `redirect('/@{slug}')`

These use server-side `redirect()` from `next/navigation`, not Edge Middleware (which cannot access the database).

### Kept Routes

- `/` — homepage (form + leaderboard)
- `/leaderboard` — full leaderboard
- `/methodology` — methodology page
- `/profile` — authenticated dashboard (my evaluations) — links updated to `/@{slug}`
- `/auth` — sign in/up
- `/auth/callback` — OAuth callback

## Security Considerations

### API Key Storage

- Keys encrypted at rest using AES-256-GCM
- Encryption key stored in environment variable (`ENCRYPTION_KEY`, 32-byte hex string)
- Encryption/decryption utility: `src/lib/crypto.ts`
- Ciphertext format stored in DB: `iv:authTag:ciphertext` (all hex-encoded)
  - 12-byte random IV generated per encryption (never reused)
  - 16-byte auth tag appended by GCM
  - Ciphertext is the encrypted API key
- Key never returned via API after storage (only `hasKey: boolean`)
- Key only decrypted server-side in the judge route when creating the Anthropic client

### API Key in Transit

- Submit route passes `userId` to judge route — never the raw API key
- Judge route decrypts the key from `user_settings` using the `userId`
- Key never sent to the browser after initial submission to `/api/settings`
- Key never logged or stored in evaluation results

### Rate Limiting

- Rate limit evaluations per user: 10 per hour
- Enforced in `/api/submit` by counting `evaluations` rows where `user_id` matches and `created_at > now() - 1 hour`
- Prevents abuse of scraping infrastructure (Apify credits are platform cost)

## TypeScript Types

```typescript
// Added to src/lib/types.ts

export interface StatusData {
  tweetCount?: number;
  linkedinPostCount?: number;
  dataSources?: string[];
  screenshotsCaptured?: number;
}

export type EvaluationStatus =
  | "scraping-twitter"
  | "scraping-linkedin"
  | "scraping-website"
  | "deep-research"
  | "capturing-screenshots"
  | "verifying-data"
  | "analyzing"
  | "writing-report"
  | "complete"
  | "error";

export interface StatusResponse {
  status: EvaluationStatus;
  step?: number;
  stats?: StatusData;
  name?: string;
  error?: string;
}

export interface SettingsResponse {
  hasKey: boolean;
  keyValidatedAt: string | null;
}
```

### Updated Existing Types

```typescript
// ScoreResult gains slug field (src/lib/types.ts)
export interface ScoreResult {
  // ... existing fields ...
  slug: string; // NEW — set by judge route, persisted by saveScore()
  userId?: string; // NEW — optional, set when evaluation is user-triggered
}
```

`toScoreResult()` / `fromDbRow()` in `leaderboard.ts` must map the `slug` field.

### Data Access Layer Updates (`src/lib/leaderboard.ts`)

The following functions need slug-based query support:
- `getScore(lookup: { id?: string; slug?: string })` — query by id or slug
- `getPendingStatus(lookup: { id?: string; slug?: string })` — query by id or slug
- `savePending(...)` — accepts slug + user_id params
- `updatePendingStatus(...)` — add `statusData?: StatusData` param for enriched status
- `saveScore(...)` — persists slug from ScoreResult

## What Gets Removed

- `/judge/[id]` page component — replaced by server redirect to `/@{slug}`
- `/score/[id]` page component — replaced by server redirect to `/@{slug}`
- Platform Anthropic API key no longer used for user-triggered evaluations
- Artificial `delay()` calls in judge route (no longer needed — progress is real)

## Migration

Migration file: `supabase/migrations/004_progressive_profile_byok.sql`

Steps:
1. Add slug + user_id columns to evaluations and pending_jobs (SQL migration)
2. Create user_settings table with RLS (SQL migration)
3. Generate slugs retroactively for existing evaluations — requires a one-time TypeScript migration script (`scripts/backfill-slugs.ts`) since slug generation logic (unicode normalization, collision handling) cannot be done purely in SQL
4. Backfill: existing evaluations have no `user_id` — this is fine (they were system-generated)
5. Update `src/lib/db.ts` to include new columns in SQLite CREATE TABLE statements + migration blocks

New env var needed: `ENCRYPTION_KEY` (generate via `openssl rand -hex 32`)

The `.env.local` `ANTHROPIC_API_KEY` is kept for development/testing but not used in production user-triggered evaluations.
