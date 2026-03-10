# Taste Bench Scoring Framework v2

## Design Spec — March 10, 2026

**Status: DESIGN — Not yet implemented.** The current codebase still uses the v1 framework (6 original dimensions with different names, weights, and rubrics). This spec defines the target state.

This document defines the complete scoring framework for The Taste Bench, synthesized from all brainstorm sessions, the research bible (TASTE-RESEARCH.md), AI perspective docs, whitepaper, and implementation analysis.

---

## Core Philosophy

**Taste is the gap between what you could do and what you choose to do, filtered through who you actually are.**

This framework measures taste through 6 dimensions, each evaluated through multiple theoretical lenses. It uses the 4 Levels of Taste as an organizing hierarchy, not just a conceptual backdrop.

### The 4 Levels of Taste

| Level | Name | Definition | What It Looks Like |
|-------|------|------------|--------------------|
| 1 | **Preference** | "I like this" | Raw personal response. Everyone has it. NOT taste — it's the soil taste grows in. We don't score this. |
| 2 | **Discrimination** | "This is good, that isn't" | You can tell quality from garbage. You have an eye. You can articulate why. You're a selector, a filter, a curator. Most tech discourse lives here. |
| 3 | **Vision** | "This doesn't exist yet, but it should" | You're not choosing between options — you see what's missing. Taste becomes generative, not just selective. You build the cathedral, not just critique the blueprints. |
| 4 | **Identity** | "I couldn't have made this any other way" | Work and person are inseparable. Not applying taste TO something — your taste IS you. The accumulation of every choice, every "no," every return. |

### Key Principles

- **Style is not taste.** Minimalism isn't a taste signal — it's a style. We score intention and ownership underneath any aesthetic.
- **Score choices, not vocabulary.** Avoid the Bourdieu trap: measure quality of discernment regardless of cultural access or background.
- **The score is a reflection, not a judgment.** The number hooks you, the profile teaches you something about yourself.
- **Embrace structured subjectivity.** Same input produces similar (+-5 points) but not identical scores. Feature, not bug.
- **AI judges with honest uncertainty.** A judge deeply fascinated by taste and transparent about blind spots is more credible than one claiming to understand it fully.

---

## The 6 Dimensions

Six qualities that emerged independently across every theoretical framework we explored. Two per scored level (Levels 2, 3, and 4 — Level 1 "Preference" is not scored).

### Level 2 Dimensions (The Selector)

These measure discrimination ability — can you tell good from bad? Do you have an eye?

---

### 1. CURATION (What you amplify)

**Weight: 12.5%**

**Core question:** What does the quality of what you choose to surface reveal about your taste?

#### Level Detection

| Level | What It Looks Like |
|-------|-------------------|
| L2 | Good filter. Shares quality content. Has an eye for what deserves attention. Can tell signal from noise. |
| L3 | Curation so intentional it becomes creative. The selection itself is the art — like a DJ set, a reading list, a gallery show. The through-line connecting choices reveals something original. |
| L4 | What they curate is inseparable from who they are. You could identify them by their shares alone. Their curation IS their fingerprint. |

#### Multi-Lens Evaluation

**The Choosing Lens:**
What do they choose to amplify, and what does that choice reveal? Are they surfacing things that matter or passing along what the algorithm fed them? Is there a through-line connecting seemingly disparate shares?

**The Tensions:**
- Breadth vs Depth: Scattered omnivore or tunnel-vision specialist? Or intentionally navigating both?
- Mainstream vs Niche: Algorithm-fed or obscure-for-obscurity? Or moving between both with purpose?
- Discovery vs Loyalty: Always chasing new or returning to what matters? Best: both.

**The Philosopher Checks:**
- *Hume*: Does their curation show refined perception? Practice and comparison across domains?
- *Bourdieu*: Is this cultural capital (educated person citing educated sources) or genuine discernment? Someone curating brilliantly from mainstream content shows MORE taste than someone citing obscure references nobody engages with. Score quality of selection, not obscurity.
- *Rubin*: Does their curation feel like someone with taste? Is there a through-line you can sense but can't quite name?
- *Sontag*: Do they curate across high and low culture with awareness? Is there camp sensibility?

**Observable Evidence:**
- Retweets and shares — what they choose to amplify
- Who they engage with and why
- Links, recommendations, reading lists
- Breadth of references across domains
- Ratio of algorithmic content vs independent discovery
- The through-line connecting varied interests

#### Scoring Anchors

- **90-100**: Curation itself is art. Cross-domain, surprising, purposeful. You discover things through them you'd never find alone. Clear through-line that feels authored.
- **70-89**: Strong eye. Good mix of expected and surprising. Shares quality across domains. Occasionally surfaces something genuinely new.
- **50-69**: Mostly mainstream but shows some independent selection. Functional filter. Nothing that makes you stop and think "who IS this person?"
- **30-49**: Algorithm-driven sharing. Predictable for their circle. Retweets whatever's trending in their bubble.
- **0-29**: Zero curation signal. Pure algorithm output. Indistinguishable from any other account in their niche.

---

### 2. RESTRAINT (What you leave out)

**Weight: 12.5%**

**Core question:** Does this person know when to stop, when to stay quiet, when less is the answer?

#### Level Detection

| Level | What It Looks Like |
|-------|-------------------|
| L2 | Knows what's bad and avoids it. Doesn't overshare. Reasonable signal-to-noise. |
| L3 | The edit is visible. You can feel what was removed. The silence is as intentional as the speech. Every word earns its place. |
| L4 | Their restraint IS their style. Unmistakably them in what they choose NOT to do. The negative space is a fingerprint. |

#### Multi-Lens Evaluation

**The Choosing Lens:**
What do they choose to leave out? In a world of infinite posting, what topics do they NOT touch despite being in their space? How much do they resist the temptation to weigh in on everything?

**The Tensions:**
- Speaking vs Silence: Noise or invisible? Or precisely calibrated presence?
- Polish vs Rawness: Over-produced or sloppy? Or raw where it serves, polished where it matters?
- Quantity vs Quality: Posts every thought or once a month? And which serves their taste better?
- Completeness vs Economy: Over-explains everything or trusts the audience? Best: says enough, trusts you for the rest.

**The Philosopher Checks:**
- *Kant*: Is the restraint disinterested — do they edit for the work's sake, not for how it makes them look?
- *Bourdieu*: Is this restraint learned from elite culture (minimalism as class marker) or genuine editing? Someone from a maximalist culture showing restraint WITHIN maximalism is equally tasteful. Don't reward Western minimalism as default "good taste."
- *Rubin*: The "reducer" philosophy — do they strip to the essential? Can you feel the editing hand?
- *Sontag*: Is apparent excess actually camp or playful maximalism? Conversely, is their restraint actually repression of something interesting? The tension between seriousness and playfulness matters here.
- *Rams*: "Less, but better" — does what remains justify its existence?

**Observable Evidence:**
- Post frequency and word economy
- Signal-to-noise ratio in their content
- Topics they DON'T touch despite being in their space
- Thread length — do they know when to stop?
- Bio/headline economy — tight or bloated?
- Editing quality — polished output vs first-draft energy
- How much they resist trend-jumping and hot takes

#### Scoring Anchors

- **90-100**: Every word earns its place. You feel the editing hand. Silence is as loud as speech. Their restraint is unmistakable and intentional.
- **70-89**: Generally economical. Knows their lane. Occasional filler or over-explanation but core output is tight.
- **50-69**: Average signal-to-noise. Some excess but not offensive. Neither tight nor bloated.
- **30-49**: Verbose. Over-shares. Weighs in on everything. Buzzwords. Corporate energy. Could cut 50% and improve.
- **0-29**: Pure noise. Word salad. "Thrilled to announce" energy. No evidence of editing or restraint whatsoever.

---

### Level 3 Dimensions (The Creator)

These measure generative ability — do you make what doesn't exist? Do you act on your taste?

---

### 3. ORIGINALITY (What you create)

**Weight: 17.5%**

**Core question:** Do they add something to the world that wasn't there before?

#### Level Detection

| Level | What It Looks Like |
|-------|-------------------|
| L2 | Has a distinct voice within existing frameworks. Recognizable style but operating within established lanes. |
| L3 | Creates genuinely new ideas, formats, perspectives. Makes things that didn't exist. Breaks rules because they know them deeply enough to feel where the break works (Intuitive Transgression). |
| L4 | "I couldn't have made this any other way." Their creation IS them. The output is a fingerprint no one could replicate. |

#### Multi-Lens Evaluation

**The Choosing Lens:**
What do they choose to create, and what does that choice reveal? Among infinite things they COULD make, why THIS? The choice of what to bring into the world is itself a taste signal.

**The Tensions:**
- Novel vs Familiar: Weird for weird's sake or derivative? Or novel enough to challenge, familiar enough to land?
- Building vs Critiquing: Do they make or just evaluate? (Agency lives here — this is THE dimension for the Manidis check.)
- Rule-following vs Rule-breaking: Conventional or chaotic? Or breaking rules from deep knowledge of them?
- Solo vs Collaborative: Lone genius or builds with others? Both can show originality differently.

**The Philosopher Checks:**
- *Manidis*: THE critical check. Do they build the cathedral or just critique the blueprints? Taste without action is just a discriminator — "in GAN terms, you're the part that gets discarded once the generator is good enough." Agency is tested here.
- *Sontag*: Is apparent "bad taste" actually camp/irony? Is rule-breaking intentional and sophisticated? Don't penalize strategic transgression.
- *Hume*: Is there evidence of practice and comparison behind the originality? Informed originality vs random noise.
- *Zhuo*: Does their creation move the culture? Do they make things that shift what others think is possible?

**Observable Evidence:**
- Original tweets/posts vs retweets ratio (creation vs redistribution)
- Projects shipped, things built, work produced
- Unique formats, framings, or ideas that didn't exist before them
- Rule-breaking that works — unexpected combinations of high/low, formal/casual
- Whether others copy or reference their original work
- Evolution of their creative output over time

#### Scoring Anchors

- **90-100**: Genuinely creates new ideas, formats, or perspectives that others adopt. Unmistakable voice. You know their work without seeing their name. Builds real things.
- **70-89**: Strong personal voice with regular original contributions. Ships work. Occasionally creates something genuinely new. More builder than critic.
- **50-69**: Has a voice but operates within established frameworks. Creates content but doesn't really add anything new. Some building, mostly within templates.
- **30-49**: Follows trends with personal flavor. Hard to distinguish from peers. More critic/commenter than creator. Taste without action.
- **0-29**: Copy-paste culture. Could be anyone. Zero original creation. Pure redistribution or derivation.

---

### 4. CONVICTION (What you stand for)

**Weight: 17.5%**

**Core question:** Do they trust their own perception before consensus validates it?

#### Level Detection

| Level | What It Looks Like |
|-------|-------------------|
| L2 | Has opinions. Can tell you what's good and bad. Takes some positions. |
| L3 | Champions things before consensus. Holds positions others aren't ready for. Picks battles wisely. Has the grace to be wrong publicly and the courage to be right early. |
| L4 | Their convictions are indistinguishable from their identity. Not positions they hold — positions that hold them. You couldn't imagine them believing otherwise. |

#### Multi-Lens Evaluation

**The Choosing Lens:**
What do they choose to stand for? What hills do they pick? The choice of WHICH battles to fight reveals as much as the positions themselves.

**The Tensions:**
- Confidence vs Doubt: Arrogant or paralyzed? Or holds positions while remaining genuinely open?
- Contrarian vs Consensus: Edge lord or crowd-pleaser? Or independently arrived at whatever they believe, regardless of where consensus sits?
- Early vs Late: First mover or follower? And does timing even matter if the conviction is real?
- Vocal vs Quiet: Loud advocate or quiet consistency? Both are valid expressions of conviction.

**The Philosopher Checks:**
- *Hume*: Is this refined judgment born from practice, comparison, and broad experience? Or uninformed hot takes?
- *Bourdieu*: Is their conviction possible because they're insulated from consequences (privilege allows risk) or despite real risk? Don't reward safe contrarianism from protected positions.
- *Kant*: Is the conviction disinterested — do they believe it because it's right, not because it gets engagement?
- *Rubin*: Can you feel genuine conviction behind the positions? Or is it performance? Rubin's gut check.
- *Manidis*: Do they ACT on their convictions or just voice them? Conviction expressed through building and doing is higher than conviction expressed through posting. Talk is Level 2; action is Level 3.

**Observable Evidence:**
- Positions taken before they were popular (and proven right or held anyway)
- Stances maintained under criticism or social pressure
- Topics they engage on vs avoid — do they pick meaningful battles?
- How they handle disagreement — grace or defensiveness?
- Consistency of positions over time vs flip-flopping
- Willingness to be wrong publicly
- Do they champion others' work before it's trendy?

#### Scoring Anchors

- **90-100**: Genuinely convicted. Champions things early, holds positions with grace, handles disagreement with substance. You know exactly what they stand for. Their conviction has been tested.
- **70-89**: Takes real positions. Picks battles wisely. Generally consistent. Some early calls that proved right. Handles disagreement well.
- **50-69**: Has opinions but stays within safe boundaries. Rarely the first to take a position. Follows opinion leaders more than leads.
- **30-49**: Crowd-pleasing. Avoids anything that might get pushback. Opinions mirror their circle's consensus. Safe takes only.
- **0-29**: Zero edge. Pure consensus. "I love this community" energy. No detectable conviction on anything. Performative agreement with everything.

---

### Level 4 Dimensions (The Identity)

These measure taste as self — is the person inseparable from their taste?

---

### 5. IDENTITY (Who you are)

**Weight: 20%**

**Core question:** Can you feel a specific, unmistakable person behind the work?

#### Level Detection

| Level | What It Looks Like |
|-------|-------------------|
| L2 | Has a recognizable presence. You can tell their posts apart from a generic account. There's a person here. |
| L3 | Their identity actively shapes what they create. The work feels authored. You'd notice if they suddenly changed. |
| L4 | Work and person are inseparable. You'd recognize them without a byline. "I couldn't have done this differently." Their taste IS them. |

#### Multi-Lens Evaluation

**The Choosing Lens:**
What does the accumulation of ALL their choices reveal? Not any single choice — the pattern. The person that emerges when you step back and look at everything together.

**The Tensions:**
- Personal vs Universal: Pure solipsism or pure performance? Or personal enough to be real, universal enough to resonate?
- Consistent vs Evolving: Frozen in a brand or shapeless? Or a clear core that grows and adapts over time?
- Vulnerable vs Guarded: Oversharing or invisible wall? Or selectively open in ways that feel genuinely human?
- Professional vs Personal: Completely separated or totally merged? Or does personality bleed through professional output in authentic ways?

**The Philosopher Checks:**
- *Rubin*: THE primary check for this dimension. Does this feel like a specific person? Not "a human" — THAT human. The inarticulate gut signal that says "this person is real."
- *Hume*: Has their identity been developed through broad experience and practice? A well-travelled aesthetic identity (tested across domains, contexts, time) runs deeper than an untested default.
- *Bourdieu*: Is this identity performed (class markers, aesthetic tribe signaling) or genuine? Style is not taste — score the person underneath the aesthetic.
- *Kant*: Is their identity expression disinterested — are they being themselves for its own sake, or curating an identity for audience approval?

**The "Return To" Signal:**
If detectable: do they return to the same themes, references, aesthetics, people over time? Repeated patterns across months/years reveal what they actually value vs what they perform. Loyalty to a choice over time, through changing contexts, when easier options exist — that's the deepest taste signal.

**Style vs Taste Check:**
Critical: Do NOT score the aesthetic. Minimalism, maximalism, brutalism, cottagecore — these are styles, not taste. Score how intentional and OWNED it is. A maximalist with deep intention scores higher than a minimalist who's just following trends.

**Observable Evidence:**
- Cross-platform coherence — does the same person show up everywhere?
- Voice consistency across different contexts and topics
- Thematic through-lines that persist over time
- Personal details that bleed through professional output (the "soul" signal)
- The "byline test" — would you recognize their work unsigned?
- Repeated references, themes, or aesthetics over time (the "return to" signal)
- Whether their identity feels performed or lived-in

#### Scoring Anchors

- **90-100**: Unmistakable. You'd recognize their work without a name. Cross-platform coherent. Identity feels lived-in, not performed. Clear core that has evolved over time. A specific person, not a brand.
- **70-89**: Strong identity signal. Recognizable voice and aesthetic. Mostly coherent across platforms. Some personal authenticity bleeding through. You can feel someone specific.
- **50-69**: There's a person here, but not a distinctive one. Could be several people in their niche. Some platform fragmentation. Identity exists but doesn't stand out.
- **30-49**: Noticeably different personas across platforms. Feels more like a brand than a person. Hard to pin down who they actually are. Performance outweighs authenticity.
- **0-29**: No identity signal. Could be a bot. Completely generic. Fragmented across platforms. No detectable person behind the output.

---

### 6. SELF-AWARENESS (What you know about yourself)

**Weight: 20%**

**Core question:** Do they understand their own taste — what it is, where it comes from, and what its blind spots are?

#### Level Detection

| Level | What It Looks Like |
|-------|-------------------|
| L2 | Knows what they like and can say so. Basic self-knowledge. Reasonable alignment between self-image and reality. |
| L3 | Can articulate their aesthetic philosophy without being pretentious. Knows their influences. Acknowledges growth and evolution. Understands their strengths AND weaknesses. |
| L4 | Deeply calibrated. Knows exactly what they are, what they're not, where they came from, and where they're still growing. Self-image and reality are in near-perfect alignment. |

#### Multi-Lens Evaluation

**The Choosing Lens:**
What does the gap (or alignment) between who they CLAIM to be and who they SHOW themselves to be reveal? Self-awareness is the meta-choice: choosing to see yourself clearly.

**The Tensions:**
- Humble vs Confident: Self-deprecating or delusional? Or accurately calibrated to their actual abilities?
- Articulate vs Inarticulate: Can explain everything or can't explain anything? Note: inarticulate self-awareness is valid (Rubin can't explain his taste but clearly knows what he's doing). Don't penalize people who feel their way.
- Fixed vs Growing: "I've always been this way" or "I'm still figuring it out"? And which is honest?
- Public vs Private: Do they share their self-reflection or keep it internal? Both are valid.

**The Philosopher Checks:**
- *Bourdieu*: Do they acknowledge their own privilege, access, and cultural position? Or do they present learned/inherited taste as innate genius? This is the most important check — genuine self-awareness includes awareness of your own advantages.
- *Hume*: Do they show "freedom from prejudice" — can they see beyond their own biases? Do they acknowledge limitations in their perspective?
- *Kant*: Do they understand the difference between personal preference and genuine aesthetic judgment? Can they separate "I like this" from "this is good"?

**The Meta Check:**
This dimension references ALL other dimensions. Is their self-image aligned with what Curation, Restraint, Originality, Conviction, and Identity actually show? For example:
- Someone who claims to be a "builder" but only curates (high Curation, low Originality) has a self-awareness gap
- Someone who claims humility but shows high Conviction consistently has good self-awareness
- Someone whose bio says "thought leader" but whose Identity score is low has a major calibration problem

**Observable Evidence:**
- Bio/headline vs actual output alignment
- Stated expertise vs demonstrated expertise
- How they describe their own work and influences
- Acknowledgment of evolution, growth, past mistakes
- How they handle being wrong or receiving criticism
- Whether they credit influences or present ideas as entirely original
- Awareness of their own position/privilege in their field
- Gap between self-promotion and actual output

#### Scoring Anchors

- **90-100**: Perfectly calibrated. Self-image matches reality. Knows strengths, acknowledges weaknesses. Articulates (or demonstrates) aesthetic philosophy honestly. Credits influences. Acknowledges privilege where relevant.
- **70-89**: Generally self-aware. Reasonable alignment between claims and reality. Some blind spots but aware they exist. Handles criticism with openness.
- **50-69**: Some blind spots but mostly functional self-knowledge. May overstate in some areas while undervaluing genuine strengths. Not delusional, just not fully calibrated.
- **30-49**: Significant gap between self-image and reality. "Thought leader" who hasn't led. "Creative" who hasn't created. Blind spots they can't see.
- **0-29**: Complete disconnect. Performance bears no relationship to reality. Self-description is fiction. No evidence of introspection or honest self-assessment.

---

## Scoring System

### Composite Score

**Formula:**
```
TasteScore = (Curation x 0.125) + (Restraint x 0.125) + (Originality x 0.175) + (Conviction x 0.175) + (Identity x 0.20) + (Self-Awareness x 0.20)
```

**Weight rationale:**
- Level 2 dimensions (25% total): Discrimination is the floor. Essential but not sufficient.
- Level 3 dimensions (35% total): Vision and agency separate taste-havers from tastemakers.
- Level 4 dimensions (40% total): Identity is the ceiling. Taste as self is the highest expression.

**Precision:** 0.00-100.00 (two decimal places). The decimals are cosmetic, not informational — they exist to create diversity and personality in scores, not to imply measurement accuracy beyond the +-5 point variance. "73.42" feels more personal than "73." Every score feels unique, like a fingerprint. The reflections and level profile do the heavy lifting on meaning, not the decimal places.

### Score Tiers

| Score | Tier | Interpretation |
|-------|------|----------------|
| 90.00-100.00 | **Legendary** | Genuine tastemaker. Sets standards others follow. Taste as identity. |
| 80.00-89.99 | **Exceptional** | Strong taste with few weaknesses. Operates at Level 3-4 consistently. |
| 70.00-79.99 | **Tasteful** | Above average. Clear taste signals with room to deepen. |
| 60.00-69.99 | **Developing** | Shows promise. Operates mostly at Level 2 with flashes of Level 3. |
| 50.00-59.99 | **Mid** | Average. Neither impressive nor offensive. Functional discrimination. |
| 40.00-49.99 | **Basic** | Following trends, not setting them. Algorithm-shaped taste. |
| 30.00-39.99 | **Struggling** | Significant gaps across dimensions. More noise than signal. |
| 0.00-29.99 | **Tasteless** | No detectable taste signal. Algorithmically generated persona. |

### Level Profile

In addition to the composite score, each evaluation produces a **Level Profile** — the detected level (2/3/4) for each dimension:

```
Example: "L2-L3-L3-L2-L4-L3"
(Curation: L2, Restraint: L3, Originality: L3, Conviction: L2, Identity: L4, Self-Awareness: L3)
```

This captures complexity that a single number can't. Someone might be L4 on Identity but L2 on Originality (they know exactly who they are but only curate, never create). The profile tells that story.

**Overall Level:** Determined by a weighted assessment of level distribution:

| Condition | Overall Level |
|-----------|--------------|
| 4+ dimensions at L4 | **Level 4: Identity** |
| 4+ dimensions at L3 or above | **Level 3: Vision** |
| 3 dimensions at L3+ AND highest-weighted dimensions (Identity, Self-Awareness) at L3+ | **Level 3: Vision** |
| All other combinations | **Level 2: Discrimination** |

Tiebreaker: when the level split is ambiguous (e.g., 3 at L3, 3 at L2), the Level 4 dimensions (Identity, Self-Awareness) break the tie because they carry the most weight and represent the deepest taste signal.

This becomes a headline in the report: "You operate at Level 3: Vision."

**Note:** A high composite score with a low Overall Level is possible and meaningful — it means someone is an excellent discriminator (Level 2) who hasn't yet moved into creation or identity. The Level Profile captures this nuance where a single number cannot.

---

## Output Structure

### Primary Output: The Taste Profile (The Reflection)

The report leads with the profile — this is what teaches people about themselves. The tier labels (Legendary, Tasteless, etc.) are intentionally provocative — they're the hook that makes people share. The profile underneath is the reflection that teaches. Both serve the project: entertainment gets people in, insight keeps them thinking.

```
1. TASTE PROFILE
   - Overall Level: "Level 3: Vision"
   - Level Map (structured):
     {
       "curation": "L2",
       "restraint": "L3",
       "originality": "L3",
       "conviction": "L2",
       "identity": "L4",
       "selfAwareness": "L3"
     }
   - Level Profile String: "L2-L3-L3-L2-L4-L3" (compact format for display)
   - Composite Score: 73.42
   - Tier: "Tasteful"
   - Data Sources: ["twitter", "linkedin", "website"] (transparency)

2. THE VERDICT
   - Title: Max 6 words, witty, tier-appropriate
   - Verdict: 3-4 lines, brutal but insightful

3. DIMENSION DEEP-DIVES (x6)
   For each dimension:
   - Score (0.00-100.00)
   - Detected Level (L2/L3/L4)
   - Full paragraph evaluation (referencing specific evidence)
   - Key tension positioning (woven into the paragraph prose,
     not as separate structured fields — the tensions inform
     the writing, they don't need their own JSON)
   - Philosopher highlights (the most relevant 1-2 checks for
     this specific person, woven into the paragraph — e.g.,
     "The Bourdieu check flags that..." when relevant)

4. TASTE DNA
   - 5-8 sentence psychological profile
   - What drives their taste
   - Their relationship to the 4 levels

5. CROSS-PLATFORM CONSISTENCY
   - Paragraph analyzing presence across platforms
   - Notes which platforms were available

6. RECOMMENDATIONS
   - 3 specific, actionable items tailored to findings
   - Focused on moving to the next level where relevant
```

### Secondary Output: The Score (The Hook)

The composite score + tier for leaderboard and shareability. This gets people in the door. The profile is the actual value.

---

## Data Requirements

### Minimum Data Threshold

Not all evaluations have equal data. The system must handle partial information gracefully:

| Available Data | Approach |
|----------------|----------|
| **3+ sources** (e.g., Twitter + LinkedIn + website) | Full evaluation. All 6 dimensions scored normally. |
| **2 sources** | Full evaluation, but Identity dimension notes limited cross-platform evidence. Confidence flag in report. |
| **1 source only** | Evaluation proceeds but Identity scored with explicit caveat: "Based on single-platform data — cross-platform coherence cannot be assessed." Score capped context noted in report. |
| **Fewer than 10 original posts/tweets total** | Insufficient data. System declines to score or marks evaluation as "Limited Data Profile" with wider confidence band. |

### Missing Platform Handling

When a platform is absent (e.g., no LinkedIn):
- Do NOT penalize dimensions for missing data. Score based on what IS available.
- Identity dimension: assess coherence within available platforms. Note the gap explicitly.
- Self-Awareness: if bio/headline comparison is impossible due to missing platform, rely on other evidence (how they describe their work in posts, how they handle criticism).
- The report should transparently note which platforms were available: "This evaluation is based on Twitter and personal website. LinkedIn was not available."

### The "Return To" Signal — Current Limitation

The Identity dimension references "return to" patterns (repeated themes/references over time). With current single-snapshot scraping (~200 tweets, ~30 LinkedIn posts), this signal is partially detectable through:
- Repeated references to the same thinkers, tools, or aesthetic touchpoints within the scraped window
- Thematic consistency across different posts over the scraped timeframe

It is NOT fully detectable (years-long loyalty to choices). The evaluation should note when return-to evidence is found but not penalize its absence, since the data window is limited.

---

## Calibration Examples

To anchor scoring consistency, here are reference profiles showing how dimensions and levels interact:

### Example A: The Excellent Curator (Score ~68, Level 2)
- Curation: 82 (L3) — Exceptional eye, surfaces great content across domains
- Restraint: 75 (L3) — Economical, knows their lane
- Originality: 45 (L2) — Shares others' ideas but rarely creates their own
- Conviction: 55 (L2) — Has opinions but follows the crowd on most things
- Identity: 70 (L2) — Recognizable presence but not unmistakable
- Self-Awareness: 65 (L2) — Knows they're a curator, doesn't pretend to be a creator

**Why this works:** High discrimination skills (Level 2 excellence) but limited vision/creation (Level 3 weakness). The level-weighted formula means strong L2 scores can't compensate for weak L3-L4. Overall Level: 2.

### Example B: The Visionary Builder (Score ~81, Level 3)
- Curation: 65 (L2) — Decent but unremarkable sharing habits
- Restraint: 70 (L2) — Generally economical, not exceptional
- Originality: 90 (L3) — Ships genuinely new work, unmistakable creative voice
- Conviction: 85 (L3) — Champions ideas early, holds positions, builds what they believe in
- Identity: 82 (L3) — Work feels authored, you'd notice if they changed
- Self-Awareness: 78 (L3) — Knows their strengths, acknowledges evolution

**Why this works:** Moderate selector skills but strong creator and emerging identity. Level 3 dimensions pull the weighted score up. Overall Level: 3.

### Example C: The Taste-as-Identity Master (Score ~90, Level 4)
- Curation: 85 (L3) — Curation itself is creative, clear authored through-line
- Restraint: 88 (L4) — The negative space is a fingerprint
- Originality: 92 (L4) — "I couldn't have made this any other way"
- Conviction: 87 (L3) — Deeply convicted, tested under pressure
- Identity: 95 (L4) — Unmistakable. Work and person are one.
- Self-Awareness: 90 (L4) — Perfectly calibrated. Knows exactly what they are.

**Why this works:** Operates at Level 3-4 across all dimensions. The highest-weighted dimensions (Identity, Self-Awareness) are near-perfect. Overall Level: 4.

---

## Evaluation Architecture

### Agent Structure

Each of the 6 dimensions is evaluated independently with its full multi-lens framework. The evaluation can be structured as:

**Option A: 6 Specialized Agents** (one per dimension)
Each agent receives the verified/cleaned data and evaluates only its dimension through all lenses. Produces: score, level, evidence, tension positioning, philosopher highlights, and evaluation paragraph.

**Option B: 1 Deep Analyst Agent** (with 6-section prompt)
A single powerful agent that evaluates all 6 dimensions in sequence, with full lens frameworks per section. Benefits from cross-dimensional context (patterns across dimensions inform each other).

**Option C: Hybrid** (recommended)
- Agent 1: **Researcher** — Verify, clean, organize scraped data (unchanged from current)
- Agent 2: **Analyst** — Score all 6 dimensions with full multi-lens evaluation. Benefits from seeing the whole picture. Produces scores, levels, evidence, tensions, philosopher checks.
- Agent 3: **Writer** — Transform structured analysis into editorial prose. Produces the taste profile, verdict, DNA, recommendations.

The hybrid preserves the 3-agent pipeline structure but deepens the Analyst's evaluation framework dramatically. Each dimension section in the Analyst's prompt contains the full lens framework defined above.

### Data Flow

```
Raw scraped data (Twitter, LinkedIn, Website, Web Research)
    |
    v
[RESEARCHER] — Verify ownership, categorize content, clean data, assess confidence
    |
    v
Verified Data (structured, cleaned, categorized)
    |
    v
[ANALYST] — Evaluate each dimension through all lenses:
    For each of 6 dimensions:
      - Apply Level detection (L2/L3/L4)
      - Apply Choosing lens
      - Apply Tension positioning
      - Apply relevant Philosopher checks
      - Cite specific evidence (2-4 items)
      - Score 0.00-100.00
    Calculate composite (level-weighted)
    Identify patterns, contradictions, standout moments
    |
    v
Analysis Result (scores, levels, evidence, tensions, patterns)
    |
    v
[WRITER] — Transform into editorial prose:
    - Taste profile with level map
    - Witty title and brutal verdict
    - 6 dimension deep-dives (full paragraphs)
    - Taste DNA psychological profile
    - Cross-platform consistency
    - 3 tailored recommendations
    |
    v
Taste Report (the final deliverable)
```

---

## Philosophical Safeguards

Built into every dimension evaluation, not as afterthoughts:

### The Bourdieu Check (Every Dimension)
"Is this measuring taste or cultural capital? Would someone with this same quality of discernment but different cultural background score similarly?"

### The Style Check (Especially Identity)
"Am I scoring the aesthetic or the intention? Minimalism, maximalism, brutalism — these are styles. Score how intentional and owned it is, not which style it is."

### The Performance Check (Especially Conviction, Identity)
"Is this genuine or performed? Contrarian takes can be strategic. Vulnerability can be calculated. Look for consistency over time and under pressure as the authenticity signal."

### The Rubin Check (Especially Identity, Curation)
"Forget the analysis for a moment. Does this feel like a person with taste? Sometimes the gut signal catches what frameworks miss."

### The Manidis Check (Especially Originality)
"Do they build or just critique? Taste without action is just discrimination. The discriminator gets discarded once the generator is good enough."

### The Camp/Irony Check (Especially Originality, Curation)
"Is apparent 'bad taste' actually sophisticated? Intentional irony, camp, shitposting-as-art — these are taste signals, not taste failures. Distinguish sincere from ironic engagement."

---

## What This Framework Doesn't (Yet) Measure

Acknowledged limitations for transparency and future development:

1. **"What you return to" over years** — Currently single-snapshot. The deepest taste signal (Level 4) requires longitudinal data. Future: re-evaluate over time, track return-to patterns.

2. **Visual/aesthetic taste** — Currently text-primary. Screenshots are captured but not deeply analyzed. Future: vision model analysis for design, photography, visual identity.

3. **Cross-cultural taste norms** — Framework is informed by Western philosophical tradition. Future: calibrate for non-Western aesthetic traditions, non-English content.

4. **Domain-specific taste** — Designer taste differs from researcher taste differs from founder taste. Future: industry-specific benchmarks and norms.

5. **True internal conviction vs performance** — We can detect consistency and patterns, but can never fully verify internal states from external data. Acknowledged as inherent limitation.

---

## Relationship to Previous Frameworks

### What Changed from Original 6

| Original | v2 | Why |
|----------|----|----|
| References (15%) | **Curation** (12.5%) | Quality of amplification, not obscurity. Avoids Bourdieu trap. |
| Originality (20%) | **Originality** (17.5%) | Kept and strengthened. Subsumes Intuitive Transgression. Agency tested here. |
| Consistency (15%) | **Identity** (20%) | Deepened from "same across platforms" to "unmistakable person." Elevated to Level 4. |
| Communication (20%) | **Restraint** (12.5%) | Flipped from eloquence to economy. What you leave out > what you say. |
| Courage (15%) | **Conviction** (17.5%) | Refined from "edgy takes" to "holding positions before consensus." |
| Self-Awareness (15%) | **Self-Awareness** (20%) | Kept and elevated to Level 4. Meta-dimension that references all others. |

### What Changed from Proposed 8

| Proposed | v2 | Why |
|----------|----|----|
| Restraint | **Restraint** | Kept. |
| Intuitive Transgression | Folded into **Originality** | Operationally hard to distinguish from originality. Rule-breaking IS a form of creation. |
| Conviction | **Conviction** | Kept. |
| Soul | Folded into **Identity** | Soul + Consistency merged into one deeper dimension. |
| Curation | **Curation** | Kept. |
| Influence | **Removed as dimension** | Influence is an outcome of taste, not a component. Can't measure without becoming a follower metric. Noted as meta-observation in report. |
| Agency | **Built into structure** | Agency is what separates L2 from L3. Tested primarily in Originality dimension via Manidis check. Not a separate dimension — it's structural. |
| Self-Awareness | **Self-Awareness** | Kept. |

---

## Summary

**6 dimensions. 4 levels. Multiple lenses per dimension. Level-weighted composite scoring. Profile-first reporting.**

The framework measures taste by examining six types of choices a person makes, evaluating each through philosophical, evidential, and tension-based lenses, detecting which level of taste each choice reveals, and producing both a composite score (the hook) and a full taste profile (the reflection).

The score tells you where you stand. The profile tells you who you are.

---

## Migration Notes

### Existing v1 Evaluations

Evaluations scored under the v1 framework (original 6 dimensions) are NOT directly comparable to v2 scores. Options:
1. **Keep as-is** — v1 scores remain on the leaderboard with a "v1" marker. Historical artifact.
2. **Re-evaluate** — Re-run existing subjects through the v2 pipeline. New scores replace old ones.
3. **Clean slate** — Archive v1 leaderboard. v2 starts fresh.

Decision deferred to implementation phase.

### Implementation Scope

To implement this spec, the following must change:
1. **Type definitions** — Dimension names, add level fields, add levelProfile
2. **Analyst prompt** — Complete rewrite with multi-lens framework per dimension
3. **Writer prompt** — Update for new output structure (level map, tension/philosopher prose)
4. **Scoring formula** — New weights (0.125, 0.125, 0.175, 0.175, 0.20, 0.20)
5. **Score precision** — Remove `Math.round()`, store as float with 2 decimal places
6. **Database schema** — Add level profile fields, update dimension column names
7. **Frontend** — Update score display, add level map visualization, update dimension names
