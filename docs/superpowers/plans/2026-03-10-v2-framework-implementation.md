# Taste Bench v2 Framework Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the v1 scoring framework (6 old dimensions, old weights) with the v2 framework (6 new dimensions, 4 taste levels, multi-lens evaluation, level-weighted scoring, profile-first reporting) as defined in `docs/superpowers/specs/2026-03-10-taste-dimensions-v2-design.md`.

**Architecture:** The pipeline expands from 3 agents to 8: Researcher → 6 Dimension Analysts (one per dimension, run in parallel) → Writer. Each dimension analyst is a specialized agent with its full multi-lens evaluation framework (levels, tensions, philosopher checks). Types, database, and frontend are updated to use new dimension names, level fields, and decimal scoring.

**Tech Stack:** Next.js 14, TypeScript, SQLite (better-sqlite3), Anthropic SDK, Tailwind CSS, Framer Motion

**Spec:** `docs/superpowers/specs/2026-03-10-taste-dimensions-v2-design.md`

---

## Chunk 1: Types, Schema, and Data Layer

### Task 1: Update Type Definitions

**Files:**
- Modify: `src/lib/types.ts`

- [ ] **Step 1: Read the current types file**

Read `src/lib/types.ts` to confirm current state before editing.

- [ ] **Step 2: Rewrite the type definitions**

Replace the entire file with v2 types. Key changes:
- Rename dimensions: `references` → `curation`, `communication` → `restraint`, `courage` → `conviction`, `consistency` → `identity`
- Add `level` field (`"L2" | "L3" | "L4"`) to dimension objects in `AnalysisResult` and `TasteReport`
- Add `levelProfile` and `overallLevel` to `AnalysisResult` and `TasteReport`
- Add `dataSources` to `ScoreResult`
- Keep `score` as `number` throughout (float, not integer)

```typescript
export type TasteLevel = "L2" | "L3" | "L4";

export interface ScoreResult {
  id: string;
  name: string;
  score: number; // 0.00-100.00, two decimal places
  title: string;
  verdict: string;
  levelProfile: string; // e.g., "L2-L3-L3-L2-L4-L3"
  overallLevel: string; // e.g., "Level 3: Vision"
  dimensions: {
    curation: { score: number; level: TasteLevel; note: string };
    restraint: { score: number; level: TasteLevel; note: string };
    originality: { score: number; level: TasteLevel; note: string };
    conviction: { score: number; level: TasteLevel; note: string };
    identity: { score: number; level: TasteLevel; note: string };
    selfAwareness: { score: number; level: TasteLevel; note: string };
  };
  tasteDNA: string;
  crossPlatformConsistency: string;
  recommendations: string[];
  input: {
    twitter?: string;
    linkedin?: string;
    website?: string;
    description?: string;
  };
  dataSources: string[]; // e.g., ["twitter", "linkedin", "website"]
  avatarUrl: string;
  screenshots: { url: string; source: string }[];
  scrapedData: { twitter?: any; linkedin?: any; website?: string };
  createdAt: string;
}

// Agent 1 output: verified, cleaned data (unchanged from v1)
export interface VerifiedData {
  name: string;
  confidence: number;
  excludedSources: string[];
  twitter: {
    verified: boolean;
    handle: string;
    displayName?: string;
    bio?: string;
    followers?: number;
    following?: number;
    originalTweets: string[];
    retweets: string[];
    quoteTweets: string[];
    notableTweets: string[];
  } | null;
  linkedin: {
    verified: boolean;
    headline?: string;
    summary?: string;
    experience?: string[];
    posts: string[];
  } | null;
  website: {
    verified: boolean;
    content: string;
  } | null;
  selfDescription: string | null;
  webResearch: {
    url: string;
    title: string;
    relevance: string;
    keyInsight: string;
  }[];
  researcherNotes: string;
}

// Single dimension agent output
export interface DimensionResult {
  score: number; // 0.00-100.00
  level: TasteLevel;
  evidence: string[]; // 2-4 specific quotes or observations
  reasoning: string;
  tensionPositioning: string; // where they sit on the dimension's tension spectrums
  philosopherHighlights: string; // most relevant philosopher check findings
}

// Assembled from 6 dimension agent outputs + computed fields
export interface AnalysisResult {
  dimensions: {
    curation: DimensionResult;
    restraint: DimensionResult;
    originality: DimensionResult;
    conviction: DimensionResult;
    identity: DimensionResult;
    selfAwareness: DimensionResult;
  };
  compositeScore: number; // level-weighted: (Cur*0.125)+(Res*0.125)+(Ori*0.175)+(Con*0.175)+(Id*0.20)+(SA*0.20)
  levelProfile: string; // e.g., "L2-L3-L3-L2-L4-L3"
  overallLevel: string; // e.g., "Level 3: Vision"
  patterns: string[]; // computed by comparing across dimension results
  contradictions: string[];
  standoutMoments: string[];
}

// Agent 3 output: the final editorial report
export interface TasteReport {
  score: number; // pass-through from analyst compositeScore
  title: string;
  verdict: string;
  levelProfile: string;
  overallLevel: string;
  dimensions: {
    curation: { score: number; level: TasteLevel; note: string };
    restraint: { score: number; level: TasteLevel; note: string };
    originality: { score: number; level: TasteLevel; note: string };
    conviction: { score: number; level: TasteLevel; note: string };
    identity: { score: number; level: TasteLevel; note: string };
    selfAwareness: { score: number; level: TasteLevel; note: string };
  };
  tasteDNA: string;
  crossPlatformConsistency: string;
  recommendations: string[];
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | head -50`

Expected: Compilation errors in files that reference old dimension names. This is expected — we'll fix them in subsequent tasks.

- [ ] **Step 4: Commit**

```bash
git add src/lib/types.ts
git commit -m "refactor: update types for v2 scoring framework (new dimensions, levels, decimal scores)"
```

---

### Task 2: Update Database Schema

**Files:**
- Modify: `src/lib/db.ts`

- [ ] **Step 1: Read current db.ts**

Read `src/lib/db.ts` to confirm current state.

- [ ] **Step 2: Update the evaluations table schema**

Change `score INTEGER` to `score REAL` and add `level_profile` and `overall_level` columns. Add a migration for existing tables.

```typescript
// In getDb(), replace the CREATE TABLE evaluations statement:
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
    recommendations TEXT,
    dimensions TEXT NOT NULL,
    input TEXT,
    data_sources TEXT,
    avatar_url TEXT,
    screenshots TEXT,
    scraped_data TEXT,
    user_id TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS pending_jobs (
    id TEXT PRIMARY KEY,
    input TEXT,
    status TEXT NOT NULL DEFAULT 'scraping-twitter',
    error TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// After table creation, add migration for existing tables:
try {
  _db.exec(`ALTER TABLE evaluations ADD COLUMN level_profile TEXT`);
} catch {} // Column already exists
try {
  _db.exec(`ALTER TABLE evaluations ADD COLUMN overall_level TEXT`);
} catch {}
try {
  _db.exec(`ALTER TABLE evaluations ADD COLUMN data_sources TEXT`);
} catch {}
```

- [ ] **Step 3: Verify db initializes**

Run: `rm -f data/taste-bench.db && npx tsc --noEmit 2>&1 | grep db.ts`

Expected: No errors from db.ts specifically.

- [ ] **Step 4: Commit**

```bash
git add src/lib/db.ts
git commit -m "refactor: update db schema for v2 (REAL score, level_profile, overall_level, data_sources)"
```

---

### Task 3: Update Leaderboard Layer

**Files:**
- Modify: `src/lib/leaderboard.ts`

- [ ] **Step 1: Read current leaderboard.ts**

Read `src/lib/leaderboard.ts` to confirm current state.

- [ ] **Step 2: Update the toScoreResult mapper**

Add the new fields to the SQLite row mapper:

```typescript
function toScoreResult(row: any): ScoreResult {
  return {
    id: row.id,
    name: row.name,
    score: row.score, // now a float
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
```

- [ ] **Step 3: Update sqliteSaveScore**

Add `level_profile`, `overall_level`, and `data_sources` to the INSERT statement:

```typescript
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
```

- [ ] **Step 4: Update Supabase toDbRow and fromDbRow**

Add the new fields to both conversion functions:

```typescript
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
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/leaderboard.ts
git commit -m "refactor: update leaderboard layer for v2 fields (levelProfile, overallLevel, dataSources)"
```

---

## Chunk 2: Agent Architecture — 6 Specialized Dimension Agents

This is the most important and complex chunk. Instead of one Analyst agent with a massive prompt, we create **6 specialized agents** — one per dimension — each with its full multi-lens evaluation framework. They run in parallel for speed, and each is deeply focused on its dimension.

### Pipeline Architecture

```
Raw scraped data
    |
    v
[RESEARCHER] — verify, clean, organize (Haiku — unchanged)
    |
    v
Verified Data
    |
    v  (all 6 run in parallel via Promise.all)
[CURATION ANALYST]     → DimensionResult
[RESTRAINT ANALYST]    → DimensionResult
[ORIGINALITY ANALYST]  → DimensionResult
[CONVICTION ANALYST]   → DimensionResult
[IDENTITY ANALYST]     → DimensionResult
[SELF-AWARENESS ANALYST] → DimensionResult
    |
    v  (assembled + computed)
AnalysisResult (6 dimensions + compositeScore + levelProfile + overallLevel)
    |
    v
[WRITER] — editorial prose (Sonnet)
    |
    v
TasteReport
```

### Task 4: Create Dimension Agent Prompts

**Files:**
- Create: `src/lib/dimension-agents.ts` (6 specialized agent functions)
- Modify: `src/lib/agents.ts` (remove old `runAnalyst`, add assembly logic)

**Reference:** The design spec at `docs/superpowers/specs/2026-03-10-taste-dimensions-v2-design.md` contains the complete prompt blueprint for each dimension under its "Multi-Lens Evaluation" sections.

- [ ] **Step 1: Read the design spec dimensions**

Read `docs/superpowers/specs/2026-03-10-taste-dimensions-v2-design.md` fully to have the framework fresh.

- [ ] **Step 2: Create `src/lib/dimension-agents.ts`**

This file contains 6 exported functions, one per dimension. Each function:
- Takes `name: string` and `verifiedData: VerifiedData` as input
- Calls Claude Sonnet 4.6 with a focused prompt for that single dimension
- Returns a `DimensionResult` (score, level, evidence, reasoning, tensionPositioning, philosopherHighlights)

**Shared structure for each agent function:**

```typescript
import Anthropic from "@anthropic-ai/sdk";
import { VerifiedData, DimensionResult } from "./types";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function parseJsonResponse(text: string): any {
  let jsonText = text.trim();
  if (jsonText.startsWith("```")) {
    jsonText = jsonText.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
  }
  return JSON.parse(jsonText);
}
```

**Each dimension function follows this pattern** (example for Curation):

```typescript
export async function analyzeCuration(name: string, verifiedData: VerifiedData): Promise<DimensionResult> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    messages: [{
      role: "user",
      content: `You are the CURATION specialist for The Taste Bench...

[FULL prompt content from the spec's Curation section:
- Core question
- Level Detection table (L2/L3/L4)
- The Choosing Lens
- The Tensions (breadth vs depth, mainstream vs niche, discovery vs loyalty)
- Philosopher Checks (Hume, Bourdieu, Rubin, Sontag)
- Observable Evidence list
- Scoring Anchors (0-29 through 90-100)
- Philosophical safeguards (Bourdieu check, Style check, etc.)]

Output ONLY valid JSON:
{
  "score": <0.00-100.00>,
  "level": "<L2|L3|L4>",
  "evidence": ["<specific quote or observation>", "<...>"],
  "reasoning": "<detailed explanation>",
  "tensionPositioning": "<where they sit on the tension spectrums>",
  "philosopherHighlights": "<most relevant philosopher check findings>"
}

Verified data for "${name}":
${JSON.stringify(verifiedData, null, 2)}`
    }],
  });
  const content = message.content[0];
  if (content.type !== "text") throw new Error("Unexpected response from curation analyst");
  return parseJsonResponse(content.text);
}
```

**Create all 6 functions following the same pattern:**

1. `analyzeCuration(name, verifiedData)` — Full Curation section from spec
2. `analyzeRestraint(name, verifiedData)` — Full Restraint section from spec
3. `analyzeOriginality(name, verifiedData)` — Full Originality section from spec
4. `analyzeConviction(name, verifiedData)` — Full Conviction section from spec
5. `analyzeIdentity(name, verifiedData)` — Full Identity section from spec
6. `analyzeSelfAwareness(name, verifiedData)` — Full Self-Awareness section from spec

**Critical: Copy the FULL dimension definitions from the spec into each prompt.** Each agent gets:
- Its core question
- Its level detection table
- Its choosing lens
- Its tension spectrums
- Its philosopher checks (only the ones relevant to this dimension)
- Its observable evidence list
- Its scoring anchors
- The global philosophical safeguards (Bourdieu check, Style check, Performance check)

**Model choice:** All 6 use `claude-sonnet-4-6` with `max_tokens: 4096` (each only outputs one dimension result, so 4096 is sufficient).

- [ ] **Step 3: Create assembly function in agents.ts**

Add a function that runs all 6 in parallel and assembles the `AnalysisResult`:

```typescript
import {
  analyzeCuration, analyzeRestraint, analyzeOriginality,
  analyzeConviction, analyzeIdentity, analyzeSelfAwareness
} from "./dimension-agents";

const WEIGHTS = {
  curation: 0.125,
  restraint: 0.125,
  originality: 0.175,
  conviction: 0.175,
  identity: 0.20,
  selfAwareness: 0.20,
};

function computeOverallLevel(dimensions: AnalysisResult["dimensions"]): string {
  const levels = Object.values(dimensions).map(d => d.level);
  const l4Count = levels.filter(l => l === "L4").length;
  const l3PlusCount = levels.filter(l => l === "L3" || l === "L4").length;
  const topDimsAtL3Plus = (dimensions.identity.level === "L3" || dimensions.identity.level === "L4")
    && (dimensions.selfAwareness.level === "L3" || dimensions.selfAwareness.level === "L4");

  if (l4Count >= 4) return "Level 4: Identity";
  if (l3PlusCount >= 4) return "Level 3: Vision";
  if (l3PlusCount >= 3 && topDimsAtL3Plus) return "Level 3: Vision";
  return "Level 2: Discrimination";
}

export async function runDimensionAnalysts(
  name: string,
  verifiedData: VerifiedData
): Promise<AnalysisResult> {
  // Run all 6 dimension agents in parallel
  const [curation, restraint, originality, conviction, identity, selfAwareness] =
    await Promise.all([
      analyzeCuration(name, verifiedData),
      analyzeRestraint(name, verifiedData),
      analyzeOriginality(name, verifiedData),
      analyzeConviction(name, verifiedData),
      analyzeIdentity(name, verifiedData),
      analyzeSelfAwareness(name, verifiedData),
    ]);

  const dimensions = { curation, restraint, originality, conviction, identity, selfAwareness };

  // Compute composite score with level-weighted formula
  const compositeScore = parseFloat((
    curation.score * WEIGHTS.curation +
    restraint.score * WEIGHTS.restraint +
    originality.score * WEIGHTS.originality +
    conviction.score * WEIGHTS.conviction +
    identity.score * WEIGHTS.identity +
    selfAwareness.score * WEIGHTS.selfAwareness
  ).toFixed(2));

  // Build level profile
  const levelProfile = [
    curation.level, restraint.level, originality.level,
    conviction.level, identity.level, selfAwareness.level,
  ].join("-");

  const overallLevel = computeOverallLevel(dimensions);

  // Cross-dimensional patterns (computed from comparing results)
  const patterns: string[] = [];
  const contradictions: string[] = [];
  const standoutMoments: string[] = [];

  // Extract standout moments from dimension evidence
  for (const [key, dim] of Object.entries(dimensions)) {
    if (dim.score >= 85) {
      standoutMoments.push(`Exceptional ${key}: ${dim.evidence[0]}`);
    }
    if (dim.score <= 30) {
      patterns.push(`Significant gap in ${key}: ${dim.reasoning.slice(0, 100)}`);
    }
  }

  // Detect level contradictions
  const levelValues = Object.entries(dimensions);
  const highLevelDims = levelValues.filter(([, d]) => d.level === "L4");
  const lowLevelDims = levelValues.filter(([, d]) => d.level === "L2");
  if (highLevelDims.length > 0 && lowLevelDims.length > 0) {
    contradictions.push(
      `Operates at ${highLevelDims[0][1].level} on ${highLevelDims[0][0]} but ${lowLevelDims[0][1].level} on ${lowLevelDims[0][0]}`
    );
  }

  return {
    dimensions,
    compositeScore,
    levelProfile,
    overallLevel,
    patterns,
    contradictions,
    standoutMoments,
  };
}
```

- [ ] **Step 4: Remove old `runAnalyst` function from agents.ts**

Delete the old `runAnalyst` function entirely. Keep `runResearcher` and `runWriter`.

- [ ] **Step 5: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | head -30`

Expected: May show errors in judge/route.ts (still calling old `runAnalyst`). This is expected — fixed in Task 6.

- [ ] **Step 6: Commit**

```bash
git add src/lib/dimension-agents.ts src/lib/agents.ts
git commit -m "feat: add 6 specialized dimension agents with multi-lens evaluation (parallel execution)"
```

---

### Task 5: Rewrite Writer Prompt

**Files:**
- Modify: `src/lib/agents.ts` (the `runWriter` function)

- [ ] **Step 1: Rewrite the runWriter function**

Update to handle new dimension names, level fields, and profile-first output structure. The writer now receives richer input — each dimension has `tensionPositioning` and `philosopherHighlights` that should be woven into the editorial prose.

Key changes:
- Reference new dimension names in the output JSON template
- Pass through `levelProfile` and `overallLevel` from analysis
- Pass through each dimension's `level` field
- Instruct to weave `tensionPositioning` and `philosopherHighlights` from each dimension into the prose paragraphs
- Update title tier examples for v2 voice
- Add "score as reflection" framing: "Your job is to write a reflection that teaches people about their own taste, not a report card"
- Score precision: pass through decimal scores exactly
- Add instruction for level map headline

Output JSON must include:
```json
{
  "score": <analyst's compositeScore, exact decimal>,
  "title": "<max 6 words>",
  "verdict": "<3-4 lines>",
  "levelProfile": "<from analyst>",
  "overallLevel": "<from analyst>",
  "dimensions": {
    "curation": { "score": <exact>, "level": "<exact>", "note": "<full paragraph weaving in tension + philosopher insights>" },
    "restraint": { ... },
    "originality": { ... },
    "conviction": { ... },
    "identity": { ... },
    "selfAwareness": { ... }
  },
  "tasteDNA": "<5-8 sentences, reference the 4 levels and what drives their taste>",
  "crossPlatformConsistency": "<paragraph, note which platforms were available>",
  "recommendations": ["<rec 1>", "<rec 2>", "<rec 3> — focused on moving to the next level"]
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | grep agents.ts`

Expected: No errors from agents.ts.

- [ ] **Step 3: Commit**

```bash
git add src/lib/agents.ts
git commit -m "feat: rewrite writer prompt for v2 (level map, tension/philosopher prose, reflection framing)"
```

---

## Chunk 3: Pipeline and API Updates

### Task 6: Update Judge Route

**Files:**
- Modify: `src/app/api/judge/route.ts`

- [ ] **Step 1: Read current judge route**

Read `src/app/api/judge/route.ts` to confirm current state.

- [ ] **Step 2: Update imports**

Replace the old `runAnalyst` import with the new `runDimensionAnalysts`:

```typescript
import { runResearcher, runWriter } from "@/lib/agents";
import { runDimensionAnalysts } from "@/lib/agents"; // replaces runAnalyst
```

- [ ] **Step 3: Update the agent pipeline section**

Replace the old 3-step agent pipeline with the new architecture. The status updates should reflect the 6 parallel analysts:

```typescript
// Step 6: Agent pipeline - Researcher
await updatePendingStatus(id, "verifying-data");
const verifiedData = await runResearcher(name, context);

// Step 7: Agent pipeline - 6 Dimension Analysts (parallel)
await updatePendingStatus(id, "analyzing");
const analysis = await runDimensionAnalysts(name, verifiedData);

// Step 8: Agent pipeline - Writer
await updatePendingStatus(id, "writing-report");
const report = await runWriter(name, analysis);
```

- [ ] **Step 4: Update the ScoreResult construction**

Key changes:
- Remove `Math.round(report.score)` — use `report.score` directly (decimal)
- Add `levelProfile: report.levelProfile`
- Add `overallLevel: report.overallLevel`
- Add `dataSources` array built from available inputs

```typescript
const dataSources: string[] = [];
if (twitterData) dataSources.push("twitter");
if (linkedinData) dataSources.push("linkedin");
if (websiteData) dataSources.push("website");
if (researchResults.length > 0) dataSources.push("web-research");

const scoreResult: ScoreResult = {
  id,
  name,
  score: report.score, // decimal, no rounding
  title: report.title,
  verdict: report.verdict,
  levelProfile: report.levelProfile,
  overallLevel: report.overallLevel,
  dimensions: report.dimensions,
  tasteDNA: report.tasteDNA,
  crossPlatformConsistency: report.crossPlatformConsistency,
  recommendations: report.recommendations,
  input: { twitter, linkedin, website, description },
  dataSources,
  avatarUrl,
  screenshots,
  scrapedData: {
    twitter: twitterData || undefined,
    linkedin: linkedinData || undefined,
    website: websiteData || undefined,
  },
  createdAt: new Date().toISOString(),
};
```

- [ ] **Step 5: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | head -30`

Expected: No errors from judge/route.ts.

- [ ] **Step 6: Commit**

```bash
git add src/app/api/judge/route.ts
git commit -m "refactor: update judge route for v2 (6 parallel analysts, decimal scores, level profile)"
```

---

## Chunk 4: Frontend Updates

### Task 7: Update DimensionBar Component

**Files:**
- Modify: `src/components/DimensionBar.tsx`

- [ ] **Step 1: Update dimension labels and add level badge**

Replace the `labels` map and add level display:

```typescript
const labels: Record<string, string> = {
  curation: "Curation",
  restraint: "Restraint",
  originality: "Originality",
  conviction: "Conviction",
  identity: "Identity",
  selfAwareness: "Self-Awareness",
};

const levelLabels: Record<string, string> = {
  L2: "Selector",
  L3: "Creator",
  L4: "Identity",
};
```

Update the component signature to accept an optional `level` prop:

```typescript
export default function DimensionBar({ dimension, value, level, delay = 0 }: {
  dimension: string;
  value: number;
  level?: string;
  delay?: number;
}) {
```

Add level badge display next to the dimension name:

```tsx
<div className="flex justify-between items-baseline">
  <div className="flex items-center gap-2">
    <span className="font-serif text-sm font-semibold text-ink">{labels[dimension] || dimension}</span>
    {level && (
      <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/10 text-accent font-medium">
        {level}
      </span>
    )}
  </div>
  <span className={`font-serif text-xl font-bold ${scoreTextClass(value)}`}>
    {typeof value === "number" ? value.toFixed(2) : value}
  </span>
</div>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/DimensionBar.tsx
git commit -m "refactor: update DimensionBar for v2 dimensions and level badges"
```

---

### Task 8: Update ScoreCard Component

**Files:**
- Modify: `src/components/ScoreCard.tsx`

- [ ] **Step 1: Add level profile display**

After the ScoreRing, add the overall level headline and level map:

```tsx
{/* After ScoreRing */}
{data.overallLevel && (
  <p className="mt-4 text-sm font-medium text-accent">{data.overallLevel}</p>
)}
```

- [ ] **Step 2: Update dimension rendering to pass level**

Update the dimension loop to pass the `level` prop:

```tsx
{dims.map(([key, dim], i) => (
  <div key={key}>
    <DimensionBar
      dimension={key}
      value={dim.score}
      level={(dim as any).level}
      delay={200 + i * 100}
    />
    {dim.note && (
      <p className="mt-3 text-sm text-ink/40 leading-relaxed">{dim.note}</p>
    )}
  </div>
))}
```

- [ ] **Step 3: Update score display for decimals**

Update the ScoreRing call to pass the decimal score:

```tsx
<ScoreRing score={data.score} size={140} />
```

The ScoreRing component may need updating if it rounds internally — check `src/components/ScoreRing.tsx` and update if it displays `Math.round()`. Change to display with two decimal places.

- [ ] **Step 4: Add data sources transparency**

After cross-platform consistency, add data sources note:

```tsx
{data.dataSources && data.dataSources.length > 0 && (
  <p className="text-[10px] text-ink/20 mt-2">
    Based on: {data.dataSources.join(", ")}
  </p>
)}
```

- [ ] **Step 5: Commit**

```bash
git add src/components/ScoreCard.tsx
git commit -m "refactor: update ScoreCard for v2 (level map, decimal scores, data sources)"
```

---

### Task 9: Update ScoreRing for Decimal Display

**Files:**
- Modify: `src/components/ScoreRing.tsx`

- [ ] **Step 1: Read ScoreRing.tsx**

Read `src/components/ScoreRing.tsx` to understand how the score number is displayed.

- [ ] **Step 2: Update score display to show decimals**

Find where the score number is rendered and change from integer display to two decimal places:

```tsx
// Change from something like:
{score}
// To:
{score.toFixed(2)}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/ScoreRing.tsx
git commit -m "refactor: update ScoreRing to display decimal scores"
```

---

### Task 10: Update Homepage Leaderboard

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Read current page.tsx**

Read `src/app/page.tsx` to see the full leaderboard table implementation.

- [ ] **Step 2: Update SortKey type and column definitions**

Replace old dimension keys with new ones:

```typescript
type SortKey = "score" | "curation" | "restraint" | "originality" | "conviction" | "identity" | "selfAwareness";

const cols: { key: SortKey; label: string }[] = [
  { key: "score", label: "Score" },
  { key: "curation", label: "Cur" },
  { key: "restraint", label: "Res" },
  { key: "originality", label: "Orig" },
  { key: "conviction", label: "Conv" },
  { key: "identity", label: "Iden" },
  { key: "selfAwareness", label: "Self" },
];
```

- [ ] **Step 3: Update score display for decimal precision**

In the leaderboard table, update the composite score display:

```tsx
// Change from:
{item.score}
// To:
{item.score.toFixed(2)}
```

And update the avgScore calculation:

```typescript
const avgScore = totalJudged > 0
  ? (leaderboard.reduce((s, r) => s + r.score, 0) / totalJudged).toFixed(2)
  : "0.00";
```

- [ ] **Step 4: Commit**

```bash
git add src/app/page.tsx
git commit -m "refactor: update homepage leaderboard for v2 dimensions and decimal scores"
```

---

### Task 11: Update Methodology Page

**Files:**
- Modify: `src/app/methodology/page.tsx`

- [ ] **Step 1: Read current methodology page**

Read `src/app/methodology/page.tsx` fully.

- [ ] **Step 2: Update dimensions array**

Replace the old dimensions with v2:

```typescript
const dimensions = [
  {
    name: "Curation",
    weight: "12.5%",
    level: "Level 2: Selector",
    question: "What does the quality of what you choose to surface reveal about your taste?",
    high: "Curation itself is art. Cross-domain, surprising, purposeful. Clear through-line that feels authored.",
    low: "Zero curation signal. Pure algorithm output. Indistinguishable from any other account in their niche.",
  },
  {
    name: "Restraint",
    weight: "12.5%",
    level: "Level 2: Selector",
    question: "Does this person know when to stop, when to stay quiet, when less is the answer?",
    high: "Every word earns its place. You feel the editing hand. Silence is as loud as speech.",
    low: "Pure noise. Word salad. 'Thrilled to announce' energy. No evidence of editing or restraint.",
  },
  {
    name: "Originality",
    weight: "17.5%",
    level: "Level 3: Creator",
    question: "Do they add something to the world that wasn't there before?",
    high: "Genuinely creates new ideas, formats, or perspectives that others adopt. Unmistakable voice. Builds real things.",
    low: "Copy-paste culture. Could be anyone. Zero original creation. Pure redistribution.",
  },
  {
    name: "Conviction",
    weight: "17.5%",
    level: "Level 3: Creator",
    question: "Do they trust their own perception before consensus validates it?",
    high: "Genuinely convicted. Champions things early, holds positions with grace. Their conviction has been tested.",
    low: "Zero edge. Pure consensus. No detectable conviction on anything. Performative agreement with everything.",
  },
  {
    name: "Identity",
    weight: "20%",
    level: "Level 4: Identity",
    question: "Can you feel a specific, unmistakable person behind the work?",
    high: "Unmistakable. You'd recognize their work without a name. Identity feels lived-in, not performed.",
    low: "No identity signal. Could be a bot. Completely generic. No detectable person behind the output.",
  },
  {
    name: "Self-Awareness",
    weight: "20%",
    level: "Level 4: Identity",
    question: "Do they understand their own taste — what it is, where it comes from, and what its blind spots are?",
    high: "Perfectly calibrated. Self-image matches reality. Knows strengths, acknowledges weaknesses.",
    low: "Complete disconnect. Performance bears no relationship to reality. No evidence of introspection.",
  },
];
```

- [ ] **Step 3: Add the 4 Levels section**

Add a section explaining the taste levels hierarchy before or after the dimensions. Include the 4 levels table from the spec and the core philosophy quote.

- [ ] **Step 4: Update the scoring formula display**

Update the displayed formula to show v2 weights:

```
TasteScore = (Curation × 0.125) + (Restraint × 0.125) + (Originality × 0.175) + (Conviction × 0.175) + (Identity × 0.20) + (Self-Awareness × 0.20)
```

- [ ] **Step 5: Update tier table if present**

Update score tiers to show decimal ranges (90.00-100.00, etc.).

- [ ] **Step 6: Commit**

```bash
git add src/app/methodology/page.tsx
git commit -m "refactor: update methodology page for v2 framework (new dimensions, levels, weights)"
```

---

## Chunk 5: Build Verification and Cleanup

### Task 12: Full Build Check

**Files:**
- All modified files

- [ ] **Step 1: Run full TypeScript check**

Run: `npx tsc --noEmit`

Expected: Zero errors. If there are errors, fix them — they'll be in files that reference old dimension names (possibly API routes, other components, or pages not yet updated).

- [ ] **Step 2: Run Next.js build**

Run: `npm run build`

Expected: Build succeeds. This catches any runtime issues the type checker misses (dynamic imports, missing exports, etc.).

- [ ] **Step 3: Fix any remaining references to old dimension names**

Search for old dimension names across the codebase:

```bash
grep -r "references\|consistency\|communication\|courage" src/ --include="*.ts" --include="*.tsx" -l
```

Update any remaining files that still use old dimension names. Common places:
- API route handlers
- Component props
- Utility functions

- [ ] **Step 4: Delete the old SQLite database to start fresh**

```bash
rm -f data/taste-bench.db
```

v1 scores are incompatible with v2 dimensions. Fresh start.

- [ ] **Step 5: Commit all remaining fixes**

```bash
git add -A
git commit -m "fix: resolve remaining v1 dimension references and clean up for v2"
```

---

### Task 13: Smoke Test

- [ ] **Step 1: Start dev server**

Run: `npm run dev`

Expected: Server starts on port 3000 (or configured port) without errors.

- [ ] **Step 2: Verify homepage loads**

Open the homepage in browser. The leaderboard should be empty (fresh database). The submission form should work.

- [ ] **Step 3: Verify methodology page loads**

Navigate to `/methodology`. Should show the new v2 dimensions with levels and weights.

- [ ] **Step 4: Submit a test evaluation (optional)**

If API keys are configured, submit a test evaluation and verify:
- The judge pipeline runs through all 8 steps
- The score page shows decimal scores
- Level badges appear on each dimension
- Overall level headline is displayed
- Data sources are shown

- [ ] **Step 5: Final commit and push**

```bash
git add -A
git commit -m "chore: v2 framework implementation complete — smoke tested"
git push
```

---

## File Map Summary

| File | Action | What Changes |
|------|--------|-------------|
| `src/lib/types.ts` | Rewrite | New dimension names, DimensionResult type, level fields, decimal scores, dataSources |
| `src/lib/db.ts` | Modify | REAL score, new columns (level_profile, overall_level, data_sources) |
| `src/lib/leaderboard.ts` | Modify | Row mappers for new fields, both SQLite and Supabase |
| `src/lib/dimension-agents.ts` | **Create** | 6 specialized dimension agent functions (one per dimension, full multi-lens prompts) |
| `src/lib/agents.ts` | Major rewrite | Remove old `runAnalyst`, add `runDimensionAnalysts` assembly function, rewrite Writer prompt |
| `src/app/api/judge/route.ts` | Modify | Use `runDimensionAnalysts`, remove Math.round, add level/dataSources fields |
| `src/components/DimensionBar.tsx` | Modify | New dimension labels, level badge, decimal display |
| `src/components/ScoreCard.tsx` | Modify | Level map display, level props, data sources |
| `src/components/ScoreRing.tsx` | Modify | Decimal score display |
| `src/app/page.tsx` | Modify | New column keys/labels, decimal scores |
| `src/app/methodology/page.tsx` | Modify | New dimensions, levels section, weights, formula |
| `src/lib/validation.ts` | No change | Submission validation is dimension-agnostic |
