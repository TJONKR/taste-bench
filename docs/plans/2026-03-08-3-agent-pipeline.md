# 3-Agent Taste Pipeline Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the single mega-prompt in `/api/judge` with a 3-agent pipeline (Researcher → Analyst → Writer) for better accuracy, scoring, and writing quality.

**Architecture:** Three sequential Claude calls, each with a focused prompt. Agent 1 (Haiku 4.5) verifies and cleans scraped data. Agent 2 (Sonnet 4.6) scores the 6 dimensions with evidence. Agent 3 (Sonnet 4.6) writes the editorial report. The route orchestrates the pipeline with status updates between each step.

**Tech Stack:** Next.js API route, Anthropic SDK (`@anthropic-ai/sdk`), TypeScript, Zod

---

### Task 1: Create agent type definitions

**Files:**
- Modify: `src/lib/types.ts`

**Step 1: Add intermediate types for the pipeline**

Add these types after the existing `ScoreResult` interface:

```ts
// Agent 1 output: verified, cleaned data
export interface VerifiedData {
  name: string;
  confidence: number; // 0-1, overall data confidence
  excludedSources: string[]; // reasons for excluded data
  twitter: {
    verified: boolean;
    handle: string;
    displayName?: string;
    bio?: string;
    followers?: number;
    following?: number;
    originalTweets: string[]; // cleaned, verified as this person's
    retweets: string[]; // what they amplify
    quoteTweets: string[]; // their commentary on others
    notableTweets: string[]; // standout content flagged by researcher
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
    relevance: string; // why this is relevant to THIS person
    keyInsight: string;
  }[];
  researcherNotes: string; // free-form notes about data quality
}

// Agent 2 output: scores + evidence
export interface AnalysisResult {
  dimensions: {
    references: { score: number; evidence: string[]; reasoning: string };
    originality: { score: number; evidence: string[]; reasoning: string };
    consistency: { score: number; evidence: string[]; reasoning: string };
    communication: { score: number; evidence: string[]; reasoning: string };
    courage: { score: number; evidence: string[]; reasoning: string };
    selfAwareness: { score: number; evidence: string[]; reasoning: string };
  };
  compositeScore: number;
  patterns: string[]; // cross-cutting observations
  contradictions: string[]; // interesting tensions in their presence
  standoutMoments: string[]; // specific quotes/posts worth highlighting
}

// Agent 3 output: the final editorial report
export interface TasteReport {
  score: number;
  title: string;
  verdict: string;
  dimensions: {
    references: { score: number; note: string };
    originality: { score: number; note: string };
    consistency: { score: number; note: string };
    communication: { score: number; note: string };
    courage: { score: number; note: string };
    selfAwareness: { score: number; note: string };
  };
  tasteDNA: string;
  crossPlatformConsistency: string;
  recommendations: string[];
}
```

**Step 2: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat: add pipeline agent type definitions (VerifiedData, AnalysisResult, TasteReport)"
```

---

### Task 2: Create the agents module

**Files:**
- Create: `src/lib/agents.ts`

**Step 1: Create `src/lib/agents.ts` with the Anthropic client and 3 agent functions**

The file exports three functions:
- `runResearcher(name: string, rawContext: string): Promise<VerifiedData>`
- `runAnalyst(name: string, verifiedData: VerifiedData): Promise<AnalysisResult>`
- `runWriter(name: string, analysis: AnalysisResult): Promise<TasteReport>`

Each function:
1. Constructs its focused prompt
2. Calls the appropriate Claude model
3. Parses JSON response
4. Returns typed output

**Researcher prompt** (Haiku 4.5) should focus on:
- Verifying all content belongs to the named person
- Separating original tweets from retweets from quote tweets
- Flagging and excluding wrong-person data
- Rating confidence per source
- Extracting notable/standout content

**Analyst prompt** (Sonnet 4.6) should include:
- The full scoring rubric from the whitepaper (all 6 dimensions with ranges)
- The weighted formula
- Instructions to cite specific evidence for each score
- Pattern/contradiction detection

**Writer prompt** (Sonnet 4.6) should include:
- The scores and evidence as input (not raw data)
- Instructions for editorial voice: "Michelin inspector crossed with cultural anthropologist"
- Title generation (max 6 words, witty)
- Verdict (3-4 lines, brutal but insightful)
- tasteDNA, crossPlatformConsistency, recommendations
- The tier system for context

**Step 2: Commit**

```bash
git add src/lib/agents.ts
git commit -m "feat: add 3-agent pipeline (researcher, analyst, writer)"
```

---

### Task 3: Refactor the judge route

**Files:**
- Modify: `src/app/api/judge/route.ts`

**Step 1: Replace the single Claude call with the 3-agent pipeline**

The route should:
1. Keep all existing scraping logic unchanged (steps 1-4)
2. Keep screenshot URL generation (step 5)
3. Build the raw context string (same as now)
4. Replace the single `anthropic.messages.create()` call with:
   - `updatePendingStatus(id, "verifying-data")` → `runResearcher(name, context)`
   - `updatePendingStatus(id, "analyzing")` → `runAnalyst(name, verifiedData)`
   - `updatePendingStatus(id, "writing-report")` → `runWriter(name, analysis)`
5. Map the Writer's `TasteReport` output to `ScoreResult` (same shape)
6. Remove the Anthropic client from this file (it's now in agents.ts)
7. Remove artificial delays that are no longer needed (the 3 agent calls provide natural pacing)

**Step 2: Commit**

```bash
git add src/app/api/judge/route.ts
git commit -m "refactor: replace mega-prompt with 3-agent pipeline in judge route"
```

---

### Task 4: Update the frontend progress steps

**Files:**
- Modify: `src/app/judge/[id]/page.tsx`

**Step 1: Update STATUS_MAP and steps array**

Replace the old status mapping with:
```ts
const STATUS_MAP: Record<string, { step: number; label: string }> = {
  "scraping-twitter": { step: 0, label: "Scraping 200 tweets from X..." },
  "scraping-linkedin": { step: 1, label: "Reading 30 LinkedIn posts..." },
  "scraping-website": { step: 2, label: "Fetching website content..." },
  "deep-research": { step: 3, label: "Researching articles & mentions..." },
  "capturing-screenshots": { step: 4, label: "Capturing screenshots..." },
  "verifying-data": { step: 5, label: "Verifying data ownership..." },
  "analyzing": { step: 6, label: "Scoring 6 taste dimensions..." },
  "writing-report": { step: 7, label: "Writing editorial report..." },
  "complete": { step: 8, label: "Done!" },
};

const steps = [
  { label: "Scraping 200 tweets from X..." },
  { label: "Reading 30 LinkedIn posts..." },
  { label: "Fetching website content..." },
  { label: "Deep research — articles & mentions..." },
  { label: "Capturing screenshots..." },
  { label: "Verifying data ownership..." },
  { label: "Scoring 6 taste dimensions..." },
  { label: "Writing editorial report..." },
];
```

Update the `setCurrentStep(7)` in the completion handler to `setCurrentStep(8)`.

**Step 2: Commit**

```bash
git add src/app/judge/[id]/page.tsx
git commit -m "feat: update progress UI for 3-agent pipeline steps"
```

---

### Task 5: Smoke test

**Step 1: Run build to verify no TypeScript errors**

```bash
cd /Users/tijsnieuwboer/taste-bench && npm run build
```

Expected: Successful build with no type errors.

**Step 2: Verify the dev server starts**

```bash
cd /Users/tijsnieuwboer/taste-bench && npm run dev
```

Verify no startup errors.

**Step 3: Commit any fixes if needed**

---

## Summary

| Task | What | Files |
|------|------|-------|
| 1 | Type definitions | `src/lib/types.ts` |
| 2 | Agent functions + prompts | `src/lib/agents.ts` (new) |
| 3 | Refactor judge route | `src/app/api/judge/route.ts` |
| 4 | Update progress UI | `src/app/judge/[id]/page.tsx` |
| 5 | Smoke test | — |
