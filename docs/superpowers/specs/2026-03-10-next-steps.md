# Taste Bench v2 — Next Steps

## Context

The v2 scoring framework design spec is complete at `2026-03-10-taste-dimensions-v2-design.md`. It defines 6 new dimensions, 4 taste levels, multi-lens evaluation, level-weighted scoring, and profile-first reporting. None of this is implemented yet — the codebase still runs the v1 framework.

This document outlines what needs to happen to bring the code in line with the spec.

---

## Phase 1: Core Framework Update

The foundation. Everything else depends on this.

### 1.1 Update Type Definitions (`src/lib/types.ts`)

- Rename dimensions: `references` → `curation`, `communication` → `restraint`, `courage` → `conviction`, `consistency` → `identity`
- Add `level` field (L2/L3/L4) to each dimension in `AnalysisResult` and `TasteReport`
- Add `levelProfile` string field to `TasteReport` (e.g., "L2-L3-L3-L2-L4-L3")
- Add `overallLevel` field to `TasteReport` (e.g., "Level 3: Vision")
- Add `dataSources` array to `TasteReport` (e.g., ["twitter", "linkedin", "website"])
- Update `ScoreResult` to store score as float (not integer)

### 1.2 Update Validation Schemas (`src/lib/validation.ts`)

- Update any dimension-referencing validation to use new names

### 1.3 Update Database Schema (`src/lib/db.ts`)

- Update column references for new dimension names
- Store score as REAL instead of INTEGER
- Add level_profile and overall_level columns to evaluations table
- Handle migration from v1 schema (either add columns or recreate)

### 1.4 Update Leaderboard Layer (`src/lib/leaderboard.ts`)

- Update dimension field names in queries and mappings
- Update score handling for decimal precision

---

## Phase 2: Agent Prompt Rewrite

The biggest piece of work. The Analyst prompt needs a complete rewrite.

### 2.1 Rewrite Researcher Prompt (`src/lib/agents.ts` — Agent 1)

- Mostly unchanged, but update output structure if dimension-relevant fields changed
- Keep Haiku model (cost optimization for data verification)

### 2.2 Rewrite Analyst Prompt (`src/lib/agents.ts` — Agent 2)

This is the core change. The analyst prompt must include for EACH of the 6 dimensions:

- The core question
- Level detection criteria (L2/L3/L4 descriptions)
- The Choosing lens
- The Tensions (spectrums to position on)
- The Philosopher checks (Hume, Bourdieu, Rubin, Kant, Sontag, Manidis, Rams, Zhuo — as relevant per dimension)
- Observable evidence markers
- Scoring anchors (0-29, 30-49, 50-69, 70-89, 90-100)
- The composite formula with new weights (0.125, 0.125, 0.175, 0.175, 0.20, 0.20)

The prompt will be long. Consider whether to:
- Put it all in one system prompt (simpler, current approach)
- Or break into a system prompt + reference document approach

Output must include: score (0.00-100.00), level (L2/L3/L4), evidence, and reasoning per dimension, plus compositeScore, levelProfile, overallLevel, patterns, contradictions, standoutMoments.

### 2.3 Rewrite Writer Prompt (`src/lib/agents.ts` — Agent 3)

- Update for new output structure (level map, overall level, tier)
- Instruct to weave tension positioning and philosopher highlights into prose paragraphs (not separate fields)
- Update title tier examples for new dimension names
- Add data sources transparency note to output
- Update editorial voice guidance for profile-first framing ("the score is a reflection, not a judgment")

### 2.4 Update Output JSON Schemas

- Update the expected JSON shapes in each agent's prompt
- Make sure the pipeline data flow (Researcher → Analyst → Writer) is consistent with new fields

---

## Phase 3: Pipeline Updates

### 3.1 Update Judge Route (`src/app/api/judge/route.ts`)

- Update score storage: remove `Math.round()`, store as float
- Map new fields (levelProfile, overallLevel, dataSources) to database
- Update status step names if needed

### 3.2 Update Score API (`src/app/api/score/[id]/route.ts`)

- Return new fields (levelProfile, overallLevel, dataSources)

### 3.3 Update Leaderboard API (`src/app/api/leaderboard/route.ts`)

- Include level profile data in leaderboard responses

---

## Phase 4: Frontend Updates

### 4.1 Score Page (`src/app/score/[id]/page.tsx`)

- Display new dimension names
- Add level map visualization (showing L2/L3/L4 per dimension)
- Display overall level headline ("You operate at Level 3: Vision")
- Show composite score with decimal precision
- Show data sources ("Based on Twitter, LinkedIn, and website")
- Update dimension bars/cards for new names

### 4.2 Homepage / Leaderboard

- Update dimension column names
- Consider adding level profile to leaderboard entries

### 4.3 Methodology Page

- Update to reflect v2 framework, new dimensions, levels, philosophical grounding

---

## Phase 5: Quality & Polish

### 5.1 Calibration Testing

- Run 3-5 evaluations through the new pipeline
- Compare against the calibration examples in the spec (Excellent Curator ~68, Visionary Builder ~81, Identity Master ~90)
- Adjust scoring anchors or prompt language if scores cluster too tightly or too loosely

### 5.2 Edge Case Testing

- Test with single-platform data (Twitter only)
- Test with minimal data (<10 tweets)
- Test with accounts that have heavy retweet ratios
- Verify missing data handling works as spec describes

### 5.3 Whitepaper Update

- Update WHITEPAPER.md to reflect v2 dimensions, levels, and philosophical framework
- Add Bourdieu acknowledgment (currently missing from whitepaper)

---

## Key Files to Touch

| File | Change |
|------|--------|
| `src/lib/types.ts` | Dimension renames, add level fields, update ScoreResult |
| `src/lib/agents.ts` | Complete Analyst prompt rewrite, Writer prompt update |
| `src/lib/validation.ts` | Update dimension references |
| `src/lib/db.ts` | Schema migration, decimal score, new columns |
| `src/lib/leaderboard.ts` | Update field mappings |
| `src/app/api/judge/route.ts` | Remove Math.round, map new fields |
| `src/app/api/score/[id]/route.ts` | Return new fields |
| `src/app/api/leaderboard/route.ts` | Include level data |
| `src/app/score/[id]/page.tsx` | Level map, new dimension names, decimal scores |
| `src/app/page.tsx` | Leaderboard dimension columns |
| `src/app/methodology/page.tsx` | V2 framework description |
| `WHITEPAPER.md` | Full update to v2 |

---

## Reference Documents

- **Design Spec**: `docs/superpowers/specs/2026-03-10-taste-dimensions-v2-design.md`
- **Research Bible**: `docs/research/TASTE-RESEARCH.md`
- **AI Perspective**: `docs/ai-perspective/` (3 files)
- **Brainstorm Sessions**: `docs/brainstorms/` (3 sessions + unsaved insights)
- **Current Implementation Plan**: `docs/plans/2026-03-08-3-agent-pipeline.md` (v1 — superseded by this spec)

---

## Priority Order

If time is limited, do this in order:

1. **Phase 1 + Phase 2** together — types, schema, and prompts are tightly coupled
2. **Phase 3** — pipeline updates to wire it all together
3. **Phase 4** — frontend to display the new data
4. **Phase 5** — testing and calibration

Phase 2.2 (Analyst prompt rewrite) is the single most important and most complex task. The design spec contains the full multi-lens framework for each dimension — it's essentially the prompt blueprint. The analyst prompt should be built directly from the spec's dimension sections.
