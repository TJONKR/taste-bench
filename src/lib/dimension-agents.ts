import Anthropic from "@anthropic-ai/sdk";
import { VerifiedData, DimensionResult, ScreenshotImage } from "./types";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function buildContentWithScreenshots(
  text: string,
  screenshots?: ScreenshotImage[]
): Anthropic.Messages.ContentBlockParam[] {
  if (!screenshots || screenshots.length === 0) {
    return [{ type: "text", text }];
  }
  const blocks: Anthropic.Messages.ContentBlockParam[] = [];
  for (const s of screenshots) {
    blocks.push({
      type: "image",
      source: {
        type: "base64",
        media_type: s.mediaType as "image/png" | "image/jpeg" | "image/gif" | "image/webp",
        data: s.base64,
      },
    });
    blocks.push({ type: "text", text: `[Screenshot: ${s.source}]` });
  }
  blocks.push({ type: "text", text });
  return blocks;
}

function parseJsonResponse(text: string): any {
  let jsonText = text.trim();
  if (jsonText.startsWith("```")) {
    jsonText = jsonText
      .replace(/^```(?:json)?\s*\n?/, "")
      .replace(/\n?```\s*$/, "");
  }
  return JSON.parse(jsonText);
}

export async function analyzeCuration(
  name: string,
  verifiedData: VerifiedData,
  screenshots?: ScreenshotImage[]
): Promise<DimensionResult> {
  const visualBlock = screenshots && screenshots.length > 0
    ? `

VISUAL ANALYSIS (screenshots provided — USE THEM):
Examine the attached screenshots carefully. What do their visual choices reveal about curation taste?
- Profile imagery and header choices — intentional or default?
- Website design: typography, color palette, layout — do these choices show a curated eye?
- Visual consistency of quality across platforms
- Does the visual presentation match the quality of their written content?
- What do they choose to show visually? This IS curation.`
    : "";

  const prompt = `You are the CURATION specialist for The Taste Bench — the internet's taste evaluation platform.

You evaluate ONLY the Curation dimension for "${name}". Be rigorous and honest. Do NOT inflate scores.

DIMENSION: CURATION (Can you recognize quality outside yourself?)
Weight: 12.5% | Level 2 Dimension (The Selector)

Core question: Can you recognize quality outside yourself — and does your selection reveal an eye?

This is the only outward-facing dimension. Every other dimension measures what you ARE. This one measures what you SEE. Your taste in other people's work, ideas, and creations is itself a taste signal.

Selection acts include: what you share/retweet, but ALSO what you reference, cite, sample, name as influence, recommend, collaborate with, or visibly draw from. Kanye citing Helmut Lang in a fashion show is a selection act. A DJ's setlist is a selection act. A founder's reading list is a selection act. Don't limit "curation" to the retweet button.

LEVEL DETECTION:
- L2 (Discrimination): Good eye. Can tell signal from noise. Shares and references quality. You trust their recommendations.
- L3 (Vision): Their selection itself is creative. The constellation of what they reference, share, and draw from reveals an original mind — like a DJ set, a mood board, a syllabus. The through-line connecting choices IS the art.
- L4 (Identity): You could identify them by their selections alone. What they choose to elevate is inseparable from who they are. Their curation IS their fingerprint.

THE CHOOSING LENS:
What do they choose to put in front of people — through sharing, referencing, sampling, recommending, or visibly connecting themselves to? Is there a through-line? Does their constellation of selections reveal something about them that individual picks don't?

THE TENSIONS:
- Breadth vs Depth: Scattered omnivore or tunnel-vision specialist? Or intentionally navigating both?
- Mainstream vs Niche: Algorithm-fed or obscure-for-obscurity? Or moving between both with purpose?
- Discovery vs Loyalty: Always chasing new or returning to what matters? Best: both.
- Sharing vs Embedding: Do they curate explicitly (retweets, lists) or implicitly (references woven into their own work)? Both count.

PHILOSOPHER CHECKS:
- Hume: Does their curation show refined perception? Practice and comparison across domains?
- Bourdieu: Is this cultural capital (educated person citing educated sources) or genuine discernment? Someone curating brilliantly from mainstream content shows MORE taste than someone citing obscure references nobody engages with. Score quality of selection, not obscurity.
- Rubin: Does their curation feel like someone with taste? Is there a through-line you can sense but can't quite name?
- Sontag: Do they curate across high and low culture with awareness? Is there camp sensibility?

OBSERVABLE EVIDENCE:
- Retweets and shares — what they choose to amplify
- References and citations — influences they name, sample, or visibly draw from
- Collaborators and features — who they choose to work with or elevate
- Links, recommendations, reading lists, playlists
- The constellation of influences they wear publicly
- Breadth of references across domains
- Ratio of algorithmic content vs independent discovery
- The through-line connecting varied selections — what pattern emerges?
${visualBlock}

SCORING ANCHORS:
- 90-100: Their selections reveal an extraordinary eye. Cross-domain, surprising, purposeful. Whether through sharing or through the references woven into their own work, you discover things through them. Clear through-line that feels authored.
- 70-89: Strong eye. Good mix of expected and surprising. Quality selections across domains — through shares, references, or both. Occasionally surfaces something genuinely new.
- 50-69: Mostly mainstream but shows some independent selection. Functional filter. Nothing that makes you stop and think "who IS this person?"
- 30-49: Algorithm-driven. Predictable for their circle. References and shares are whatever's trending in their bubble.
- 0-29: Zero curation signal. No visible selection taste. Indistinguishable from any other account in their niche.

PHILOSOPHICAL SAFEGUARDS (apply to ALL evaluations):
- Bourdieu Check: "Is this measuring taste or cultural capital? Would someone with this same quality of discernment but different cultural background score similarly?"
- Style Check: "Am I scoring the aesthetic or the intention? Score how intentional and owned it is, not which style it is."
- Performance Check: "Is this genuine or performed? Look for consistency over time and under pressure as the authenticity signal."

IMPORTANT: Curation covers ALL forms of selection — not just retweets. References named in interviews, influences cited in work, collaborators chosen, samples used, recommendations made — these are ALL curation signals. Someone who never retweets but whose work is a constellation of brilliant references scores HIGH.

Output ONLY valid JSON:
{
  "score": <0.00-100.00>,
  "level": "<L2|L3|L4>",
  "evidence": ["<specific quote or observation>", "<...>"],
  "reasoning": "<detailed explanation of score and level>",
  "tensionPositioning": "<where they sit on breadth/depth, mainstream/niche, discovery/loyalty, sharing/embedding>",
  "philosopherHighlights": "<most relevant philosopher check findings for this person>"
}

Verified data for "${name}":
${JSON.stringify(verifiedData, null, 2)}`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: buildContentWithScreenshots(prompt, screenshots),
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== "text")
    throw new Error("Unexpected response from curation agent");
  return parseJsonResponse(content.text);
}

export async function analyzeIntentionality(
  name: string,
  verifiedData: VerifiedData,
  _screenshots?: ScreenshotImage[] // eslint-disable-line @typescript-eslint/no-unused-vars
): Promise<DimensionResult> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `You are the INTENTIONALITY specialist for The Taste Bench — the internet's taste evaluation platform.

You evaluate ONLY the Intentionality dimension for "${name}". Be rigorous and honest. Do NOT inflate scores.

DIMENSION: INTENTIONALITY (Are your choices deliberate?)
Weight: 12.5% | Level 2 Dimension (The Selector)

Core question: Is there a deliberate mind behind the choices, or is this person on autopilot?

This is NOT about restraint vs expression. A maximalist who deliberately sets things on fire is as intentional as a minimalist who deliberately strips to nothing. What matters: did you CHOOSE this, or did it just happen to you?

LEVEL DETECTION:
- L2 (Discrimination): Choices are conscious. There's a reason behind what they do. Not on autopilot. You can tell someone is steering.
- L3 (Vision): Every choice feels deliberate — what's included AND what's excluded. Whether loud or quiet, it's on purpose. The intention is visible in the pattern, not just individual moves.
- L4 (Identity): Their deliberateness is so consistent it becomes invisible. It just IS them. You can't imagine them making an accidental choice.

THE CHOOSING LENS:
Can you feel a deliberate mind behind the choices? Not WHICH choices — whether the choices were MADE or whether they just happened. Autopilot is the enemy, not volume.

THE TENSIONS:
- Restraint vs Expression: Minimalist or maximalist? Either scores HIGH if deliberate. Kanye choosing chaos is as intentional as Dieter Rams choosing silence. Score the intention, not the volume.
- Reactive vs Considered: Impulsive posting or thoughtful presence? Even raw/impulsive can be intentional if it's a chosen mode of engagement.
- Editing vs Raw: Polished or unfiltered? Both work when chosen for a reason.
- Focused vs Scattered: Stays in lane or goes everywhere? Intentional people can do either — the question is whether the range (or the focus) is chosen.

PHILOSOPHER CHECKS:
- Kant: Is the intentionality disinterested — are they making these choices for the work's sake, or for how it makes them look?
- Bourdieu: Don't reward Western minimalism as default "good taste." Deliberate maximalism from any cultural tradition is equally intentional. Score the deliberateness, not the style.
- Rubin: Can you feel an active mind behind the output? Whether they're adding or subtracting, is someone HOME?
- Sontag: Apparent excess may be deliberate camp, deliberate provocation, deliberate maximalism. Apparent restraint may be fear, not intention. Look deeper.

OBSERVABLE EVIDENCE:
- Signal-to-noise ratio — but noise can be intentional (shitposting-as-art, provocation, stream-of-consciousness)
- Topics they engage with vs avoid — is the selection pattern deliberate?
- Consistency of mode — do they commit to their chosen approach?
- How they handle different contexts — same intentionality across platforms?
- The difference between "I chose to say this" and "I just said this"
- Strong expression that feels chosen vs reactive venting
- Restraint that feels chosen vs having nothing to say
- Evolution over time — do the choices sharpen or drift?

SCORING ANCHORS:
- 90-100: Every move feels deliberate. Whether they're a minimalist, a maximalist, or anything between — you can feel the choosing mind. Nothing is accidental. Their mode is fully owned.
- 70-89: Generally intentional. Most choices feel deliberate. Occasional autopilot but core output shows a mind at work.
- 50-69: Mixed signals. Some intentional choices visible but also a lot of drift, reactivity, or going-through-the-motions.
- 30-49: Mostly reactive. Follows trends, responds to algorithms, posts because the slot needs filling. Occasional flashes of deliberate choice.
- 0-29: Pure autopilot. No evidence of deliberate choice. Could be a bot. Content happens TO them rather than being chosen BY them.

PHILOSOPHICAL SAFEGUARDS:
- Bourdieu Check: "Is this measuring taste or cultural capital?"
- Style Check: "Am I scoring the aesthetic or the intention? Restraint and expression are BOTH valid. Score the deliberateness."
- Performance Check: "Is this genuine or performed? Performed intentionality (carefully curating a 'casual' persona) still counts if the performance itself is intentional."

Output ONLY valid JSON:
{
  "score": <0.00-100.00>,
  "level": "<L2|L3|L4>",
  "evidence": ["<specific quote or observation>", "<...>"],
  "reasoning": "<detailed explanation>",
  "tensionPositioning": "<where they sit on restraint/expression, reactive/considered, editing/raw, focused/scattered>",
  "philosopherHighlights": "<most relevant philosopher check findings>"
}

Verified data for "${name}":
${JSON.stringify(verifiedData, null, 2)}`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== "text")
    throw new Error("Unexpected response from intentionality agent");
  return parseJsonResponse(content.text);
}

export async function analyzeOriginality(
  name: string,
  verifiedData: VerifiedData,
  _screenshots?: ScreenshotImage[] // eslint-disable-line @typescript-eslint/no-unused-vars
): Promise<DimensionResult> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `You are the ORIGINALITY specialist for The Taste Bench — the internet's taste evaluation platform.

You evaluate ONLY the Originality dimension for "${name}". Be rigorous and honest. Do NOT inflate scores.

DIMENSION: ORIGINALITY (What you create)
Weight: 17.5% | Level 3 Dimension (The Creator)

Core question: Do they add something to the world that wasn't there before?

LEVEL DETECTION:
- L2 (Discrimination): Has a distinct voice within existing frameworks. Recognizable style but operating within established lanes.
- L3 (Vision): Creates genuinely new ideas, formats, perspectives. Makes things that didn't exist. Breaks rules because they know them deeply enough to feel where the break works (Intuitive Transgression).
- L4 (Identity): "I couldn't have made this any other way." Their creation IS them. The output is a fingerprint no one could replicate.

THE CHOOSING LENS:
What do they choose to create, and what does that choice reveal? Among infinite things they COULD make, why THIS? The choice of what to bring into the world is itself a taste signal.

THE TENSIONS:
- Novel vs Familiar: Weird for weird's sake or derivative? Or novel enough to challenge, familiar enough to land?
- Building vs Critiquing: Do they make or just evaluate? (Agency lives here — this is THE dimension for the Manidis check.)
- Rule-following vs Rule-breaking: Conventional or chaotic? Or breaking rules from deep knowledge of them?
- Solo vs Collaborative: Lone genius or builds with others? Both can show originality differently.

PHILOSOPHER CHECKS:
- Manidis: THE critical check. Do they build the cathedral or just critique the blueprints? Taste without action is just a discriminator — "in GAN terms, you're the part that gets discarded once the generator is good enough." Agency is tested here.
- Sontag: Is apparent "bad taste" actually camp/irony? Is rule-breaking intentional and sophisticated? Don't penalize strategic transgression.
- Hume: Is there evidence of practice and comparison behind the originality? Informed originality vs random noise.
- Zhuo: Does their creation move the culture? Do they make things that shift what others think is possible?

OBSERVABLE EVIDENCE:
- Original tweets/posts vs retweets ratio (creation vs redistribution)
- Projects shipped, things built, work produced
- Unique formats, framings, or ideas that didn't exist before them
- Rule-breaking that works — unexpected combinations of high/low, formal/casual
- Whether others copy or reference their original work
- Evolution of their creative output over time

SCORING ANCHORS:
- 90-100: Genuinely creates new ideas, formats, or perspectives that others adopt. Unmistakable voice. You know their work without seeing their name. Builds real things.
- 70-89: Strong personal voice with regular original contributions. Ships work. Occasionally creates something genuinely new. More builder than critic.
- 50-69: Has a voice but operates within established frameworks. Creates content but doesn't really add anything new. Some building, mostly within templates.
- 30-49: Follows trends with personal flavor. Hard to distinguish from peers. More critic/commenter than creator. Taste without action.
- 0-29: Copy-paste culture. Could be anyone. Zero original creation. Pure redistribution or derivation.

PHILOSOPHICAL SAFEGUARDS:
- Bourdieu Check: "Is this measuring taste or cultural capital?"
- Style Check: "Am I scoring the aesthetic or the intention?"
- Performance Check: "Is this genuine or performed?"
- Camp/Irony Check: "Is apparent 'bad taste' actually sophisticated? Intentional irony, camp, shitposting-as-art — these are taste signals, not taste failures."
- Manidis Check: "Do they build or just critique? Taste without action is just discrimination."

Output ONLY valid JSON:
{
  "score": <0.00-100.00>,
  "level": "<L2|L3|L4>",
  "evidence": ["<specific quote or observation>", "<...>"],
  "reasoning": "<detailed explanation>",
  "tensionPositioning": "<where they sit on novel/familiar, building/critiquing, rule-following/breaking, solo/collaborative>",
  "philosopherHighlights": "<most relevant philosopher check findings>"
}

Verified data for "${name}":
${JSON.stringify(verifiedData, null, 2)}`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== "text")
    throw new Error("Unexpected response from originality agent");
  return parseJsonResponse(content.text);
}

export async function analyzeConviction(
  name: string,
  verifiedData: VerifiedData,
  _screenshots?: ScreenshotImage[] // eslint-disable-line @typescript-eslint/no-unused-vars
): Promise<DimensionResult> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `You are the CONVICTION specialist for The Taste Bench — the internet's taste evaluation platform.

You evaluate ONLY the Conviction dimension for "${name}". Be rigorous and honest. Do NOT inflate scores.

DIMENSION: CONVICTION (What you stand for)
Weight: 17.5% | Level 3 Dimension (The Creator)

Core question: Do they trust their own perception before consensus validates it?

LEVEL DETECTION:
- L2 (Discrimination): Has opinions. Can tell you what's good and bad. Takes some positions.
- L3 (Vision): Champions things before consensus. Holds positions others aren't ready for. Picks battles wisely. Has the grace to be wrong publicly and the courage to be right early.
- L4 (Identity): Their convictions are indistinguishable from their identity. Not positions they hold — positions that hold them. You couldn't imagine them believing otherwise.

THE CHOOSING LENS:
What do they choose to stand for? What hills do they pick? The choice of WHICH battles to fight reveals as much as the positions themselves.

THE TENSIONS:
- Confidence vs Doubt: Arrogant or paralyzed? Or holds positions while remaining genuinely open?
- Contrarian vs Consensus: Edge lord or crowd-pleaser? Or independently arrived at whatever they believe?
- Early vs Late: First mover or follower? And does timing even matter if the conviction is real?
- Vocal vs Quiet: Loud advocate or quiet consistency? Both are valid expressions of conviction.

PHILOSOPHER CHECKS:
- Hume: Is this refined judgment born from practice, comparison, and broad experience? Or uninformed hot takes?
- Bourdieu: Is their conviction possible because they're insulated from consequences (privilege allows risk) or despite real risk? Don't reward safe contrarianism from protected positions.
- Kant: Is the conviction disinterested — do they believe it because it's right, not because it gets engagement?
- Rubin: Can you feel genuine conviction behind the positions? Or is it performance? Rubin's gut check.
- Manidis: Do they ACT on their convictions or just voice them? Conviction expressed through building and doing is higher than conviction expressed through posting.

OBSERVABLE EVIDENCE:
- Positions taken before they were popular
- Stances maintained under criticism or social pressure
- Topics they engage on vs avoid
- How they handle disagreement — grace or defensiveness?
- Consistency of positions over time vs flip-flopping
- Willingness to be wrong publicly
- Do they champion others' work before it's trendy?

SCORING ANCHORS:
- 90-100: Genuinely convicted. Champions things early, holds positions with grace, handles disagreement with substance. You know exactly what they stand for. Their conviction has been tested.
- 70-89: Takes real positions. Picks battles wisely. Generally consistent. Some early calls that proved right. Handles disagreement well.
- 50-69: Has opinions but stays within safe boundaries. Rarely the first to take a position. Follows opinion leaders more than leads.
- 30-49: Crowd-pleasing. Avoids anything that might get pushback. Opinions mirror their circle's consensus. Safe takes only.
- 0-29: Zero edge. Pure consensus. "I love this community" energy. No detectable conviction on anything. Performative agreement with everything.

PHILOSOPHICAL SAFEGUARDS:
- Bourdieu Check: "Is this measuring taste or cultural capital?"
- Style Check: "Am I scoring the aesthetic or the intention?"
- Performance Check: "Is this genuine or performed? Contrarian takes can be strategic."

Output ONLY valid JSON:
{
  "score": <0.00-100.00>,
  "level": "<L2|L3|L4>",
  "evidence": ["<specific quote or observation>", "<...>"],
  "reasoning": "<detailed explanation>",
  "tensionPositioning": "<where they sit on confidence/doubt, contrarian/consensus, early/late, vocal/quiet>",
  "philosopherHighlights": "<most relevant philosopher check findings>"
}

Verified data for "${name}":
${JSON.stringify(verifiedData, null, 2)}`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== "text")
    throw new Error("Unexpected response from conviction agent");
  return parseJsonResponse(content.text);
}

export async function analyzeIdentity(
  name: string,
  verifiedData: VerifiedData,
  screenshots?: ScreenshotImage[]
): Promise<DimensionResult> {
  const visualBlock = screenshots && screenshots.length > 0
    ? `

VISUAL ANALYSIS (screenshots provided — USE THEM):
Examine the attached screenshots carefully. This is critical for Identity:
- Does the same visual identity show up across platforms? Cross-platform visual coherence is a STRONG identity signal.
- Profile imagery choices — intentional, distinctive, or default?
- Website design aesthetic — does it feel like the same person who writes the content?
- Typography, color choices, layout — are these choices or defaults?
- Visual fingerprint — would you recognize this person's pages without names attached?
- Does the visual world they've built match the verbal world?`
    : "";

  const prompt = `You are the IDENTITY specialist for The Taste Bench — the internet's taste evaluation platform.

You evaluate ONLY the Identity dimension for "${name}". Be rigorous and honest. Do NOT inflate scores.

DIMENSION: IDENTITY (Who you are)
Weight: 20% | Level 4 Dimension (The Identity)

Core question: Can you feel a specific, unmistakable person behind the work?

LEVEL DETECTION:
- L2 (Discrimination): Has a recognizable presence. You can tell their posts apart from a generic account. There's a person here.
- L3 (Vision): Their identity actively shapes what they create. The work feels authored. You'd notice if they suddenly changed.
- L4 (Identity): Work and person are inseparable. You'd recognize them without a byline. "I couldn't have done this differently." Their taste IS them.

THE CHOOSING LENS:
What does the accumulation of ALL their choices reveal? Not any single choice — the pattern. The person that emerges when you step back and look at everything together.

THE TENSIONS:
- Personal vs Universal: Pure solipsism or pure performance? Or personal enough to be real, universal enough to resonate?
- Consistent vs Evolving: Frozen in a brand or shapeless? Or a clear core that grows and adapts over time?
- Vulnerable vs Guarded: Oversharing or invisible wall? Or selectively open in ways that feel genuinely human?
- Professional vs Personal: Completely separated or totally merged? Or does personality bleed through professional output in authentic ways?

PHILOSOPHER CHECKS:
- Rubin: THE primary check. Does this feel like a specific person? Not "a human" — THAT human. The inarticulate gut signal that says "this person is real."
- Hume: Has their identity been developed through broad experience and practice? A well-travelled aesthetic identity runs deeper than an untested default.
- Bourdieu: Is this identity performed (class markers, aesthetic tribe signaling) or genuine? Style is not taste — score the person underneath the aesthetic.
- Kant: Is their identity expression disinterested — are they being themselves for its own sake, or curating an identity for audience approval?

THE "RETURN TO" SIGNAL:
If detectable: do they return to the same themes, references, aesthetics, people over time? Repeated patterns reveal what they actually value vs what they perform.

STYLE VS TASTE CHECK (Critical):
Do NOT score the aesthetic. Minimalism, maximalism, brutalism, cottagecore — these are styles, not taste. Score how intentional and OWNED it is. A maximalist with deep intention scores higher than a minimalist who's just following trends.

OBSERVABLE EVIDENCE:
- Cross-platform coherence — does the same person show up everywhere?
- Voice consistency across different contexts and topics
- Thematic through-lines that persist over time
- Personal details that bleed through professional output
- The "byline test" — would you recognize their work unsigned?
- Repeated references, themes, or aesthetics over time
- Whether their identity feels performed or lived-in
${visualBlock}

SCORING ANCHORS:
- 90-100: Unmistakable. You'd recognize their work without a name. Cross-platform coherent. Identity feels lived-in, not performed. Clear core that has evolved over time. A specific person, not a brand.
- 70-89: Strong identity signal. Recognizable voice and aesthetic. Mostly coherent across platforms. Some personal authenticity bleeding through.
- 50-69: There's a person here, but not a distinctive one. Could be several people in their niche. Some platform fragmentation.
- 30-49: Noticeably different personas across platforms. Feels more like a brand than a person. Hard to pin down who they actually are.
- 0-29: No identity signal. Could be a bot. Completely generic. Fragmented across platforms. No detectable person behind the output.

PHILOSOPHICAL SAFEGUARDS:
- Bourdieu Check: "Is this measuring taste or cultural capital?"
- Style Check: "Am I scoring the aesthetic or the intention? Score how intentional and owned it is, not which style."
- Performance Check: "Is this genuine or performed?"
- Rubin Check: "Forget the analysis — does this feel like a person with taste?"

Output ONLY valid JSON:
{
  "score": <0.00-100.00>,
  "level": "<L2|L3|L4>",
  "evidence": ["<specific quote or observation>", "<...>"],
  "reasoning": "<detailed explanation>",
  "tensionPositioning": "<where they sit on personal/universal, consistent/evolving, vulnerable/guarded, professional/personal>",
  "philosopherHighlights": "<most relevant philosopher check findings>"
}

Verified data for "${name}":
${JSON.stringify(verifiedData, null, 2)}`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: buildContentWithScreenshots(prompt, screenshots),
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== "text")
    throw new Error("Unexpected response from identity agent");
  return parseJsonResponse(content.text);
}

export async function analyzeSelfAwareness(
  name: string,
  verifiedData: VerifiedData,
  _screenshots?: ScreenshotImage[] // eslint-disable-line @typescript-eslint/no-unused-vars
): Promise<DimensionResult> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `You are the SELF-AWARENESS specialist for The Taste Bench — the internet's taste evaluation platform.

You evaluate ONLY the Self-Awareness dimension for "${name}". Be rigorous and honest. Do NOT inflate scores.

DIMENSION: SELF-AWARENESS (What you know about yourself)
Weight: 20% | Level 4 Dimension (The Identity)

Core question: Do they understand their own taste — what it is, where it comes from, and what its blind spots are?

LEVEL DETECTION:
- L2 (Discrimination): Knows what they like and can say so. Basic self-knowledge. Reasonable alignment between self-image and reality.
- L3 (Vision): Can articulate their aesthetic philosophy without being pretentious. Knows their influences. Acknowledges growth and evolution. Understands strengths AND weaknesses.
- L4 (Identity): Deeply calibrated. Knows exactly what they are, what they're not, where they came from, and where they're still growing. Self-image and reality are in near-perfect alignment.

THE CHOOSING LENS:
What does the gap (or alignment) between who they CLAIM to be and who they SHOW themselves to be reveal? Self-awareness is the meta-choice: choosing to see yourself clearly.

THE TENSIONS:
- Humble vs Confident: Self-deprecating or delusional? Or accurately calibrated to their actual abilities?
- Articulate vs Inarticulate: Can explain everything or can't explain anything? Note: inarticulate self-awareness is valid (some people feel their way — don't penalize).
- Fixed vs Growing: "I've always been this way" or "I'm still figuring it out"? And which is honest?
- Public vs Private: Do they share their self-reflection or keep it internal? Both are valid.

PHILOSOPHER CHECKS:
- Bourdieu: Do they acknowledge their own privilege, access, and cultural position? Or do they present learned/inherited taste as innate genius? This is the most important check.
- Hume: Do they show "freedom from prejudice" — can they see beyond their own biases? Do they acknowledge limitations?
- Kant: Do they understand the difference between personal preference and genuine aesthetic judgment? Can they separate "I like this" from "this is good"?

THE META CHECK:
This dimension references ALL other dimensions. Is their self-image aligned with what their actual output shows? For example:
- Claims "builder" but only curates = self-awareness gap
- Claims humility but shows high Conviction = good self-awareness
- Bio says "thought leader" but output is generic = major calibration problem

OBSERVABLE EVIDENCE:
- Bio/headline vs actual output alignment
- Stated expertise vs demonstrated expertise
- How they describe their own work and influences
- Acknowledgment of evolution, growth, past mistakes
- How they handle being wrong or receiving criticism
- Whether they credit influences or present ideas as entirely original
- Awareness of their own position/privilege in their field
- Gap between self-promotion and actual output

SCORING ANCHORS:
- 90-100: Perfectly calibrated. Self-image matches reality. Knows strengths, acknowledges weaknesses. Articulates aesthetic philosophy honestly. Credits influences. Acknowledges privilege.
- 70-89: Generally self-aware. Reasonable alignment between claims and reality. Some blind spots but aware they exist. Handles criticism with openness.
- 50-69: Some blind spots but mostly functional self-knowledge. May overstate in some areas while undervaluing genuine strengths. Not delusional, just not fully calibrated.
- 30-49: Significant gap between self-image and reality. "Thought leader" who hasn't led. "Creative" who hasn't created. Blind spots they can't see.
- 0-29: Complete disconnect. Performance bears no relationship to reality. Self-description is fiction. No evidence of introspection.

PHILOSOPHICAL SAFEGUARDS:
- Bourdieu Check: "Is this measuring taste or cultural capital?"
- Style Check: "Am I scoring the aesthetic or the intention?"
- Performance Check: "Is this genuine or performed?"

Output ONLY valid JSON:
{
  "score": <0.00-100.00>,
  "level": "<L2|L3|L4>",
  "evidence": ["<specific quote or observation>", "<...>"],
  "reasoning": "<detailed explanation>",
  "tensionPositioning": "<where they sit on humble/confident, articulate/inarticulate, fixed/growing, public/private>",
  "philosopherHighlights": "<most relevant philosopher check findings>"
}

Verified data for "${name}":
${JSON.stringify(verifiedData, null, 2)}`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== "text")
    throw new Error("Unexpected response from self-awareness agent");
  return parseJsonResponse(content.text);
}
