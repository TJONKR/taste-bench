import Anthropic from "@anthropic-ai/sdk";
import { VerifiedData, ScreenshotImage, StatusData } from "./types";
import {
  scrapeTwitter,
  scrapeLinkedIn,
  scrapeWebsite,
  scrapeGitHub,
  fetchYouTubeTranscript,
  fetchScreenshotAsBase64,
  getScreenshotUrl,
  getAvatarUrl,
  TwitterData,
} from "./scrape";
import { updatePendingStatus } from "./leaderboard";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Tool definitions for Claude
const TOOLS: Anthropic.Messages.Tool[] = [
  {
    name: "scrape_twitter",
    description:
      "Scrape recent tweets from a Twitter/X account. Returns profile info and up to 200 tweets with engagement metrics. Each tweet is tagged as [ORIGINAL], [RETWEET], or [QUOTE TWEET].",
    input_schema: {
      type: "object" as const,
      properties: {
        handle: {
          type: "string",
          description: "Twitter handle (e.g. 'karpathy' or '@karpathy')",
        },
      },
      required: ["handle"],
    },
  },
  {
    name: "scrape_linkedin",
    description:
      "Scrape a LinkedIn profile's posts and headline. Returns up to 30 posts with engagement data. Requires a full LinkedIn profile URL.",
    input_schema: {
      type: "object" as const,
      properties: {
        url: {
          type: "string",
          description: "Full LinkedIn profile URL (e.g. 'https://www.linkedin.com/in/someone/')",
        },
      },
      required: ["url"],
    },
  },
  {
    name: "scrape_website",
    description:
      "Fetch and extract text content from any URL. Returns up to 8000 characters of cleaned text (HTML stripped). Use for personal websites, blogs, articles, podcast transcripts, etc.",
    input_schema: {
      type: "object" as const,
      properties: {
        url: {
          type: "string",
          description: "URL to scrape",
        },
      },
      required: ["url"],
    },
  },
  {
    name: "scrape_github",
    description:
      "Fetch a GitHub user's profile, top repositories (by stars), and starred repositories. Starred repos reveal what tools and projects someone admires — a strong taste signal. Free, no API key needed. Returns profile info, up to 20 top repos, and up to 30 starred repos.",
    input_schema: {
      type: "object" as const,
      properties: {
        username: {
          type: "string",
          description: "GitHub username (e.g. 'karpathy') or profile URL",
        },
      },
      required: ["username"],
    },
  },
  {
    name: "fetch_youtube_transcript",
    description:
      "Fetch the transcript/captions of a YouTube video. Returns up to 10000 characters of transcript text. Use this on their talks, interviews, or podcast appearances found via web search. Great for getting long-form opinions and deep thinking that doesn't show up in tweets.",
    input_schema: {
      type: "object" as const,
      properties: {
        video_url: {
          type: "string",
          description: "YouTube video URL (e.g. 'https://www.youtube.com/watch?v=abc123')",
        },
      },
      required: ["video_url"],
    },
  },
  {
    name: "capture_screenshot",
    description:
      "Capture a visual screenshot of a webpage. Returns the screenshot as base64 for later vision analysis. Use on the person's website, Twitter profile, or any page that reveals visual taste.",
    input_schema: {
      type: "object" as const,
      properties: {
        url: {
          type: "string",
          description: "URL to screenshot",
        },
        label: {
          type: "string",
          description: "Short label for this screenshot (e.g. 'Website', 'Twitter Profile', 'Blog')",
        },
      },
      required: ["url", "label"],
    },
  },
  {
    name: "done",
    description:
      "Call this when you have gathered enough data to produce a comprehensive research report. Pass the final VerifiedData JSON as the result.",
    input_schema: {
      type: "object" as const,
      properties: {
        result: {
          type: "object",
          description: "The final VerifiedData JSON object",
        },
      },
      required: ["result"],
    },
  },
];

// Execute a tool call
async function executeTool(
  name: string,
  input: any
): Promise<string> {
  try {
    switch (name) {
      case "scrape_twitter": {
        const data = await scrapeTwitter(input.handle);
        return JSON.stringify(data);
      }
      case "scrape_linkedin": {
        const data = await scrapeLinkedIn(input.url);
        return JSON.stringify(data);
      }
      case "scrape_website": {
        const text = await scrapeWebsite(input.url);
        return text;
      }
      case "scrape_github": {
        const data = await scrapeGitHub(input.username);
        return JSON.stringify(data);
      }
      case "fetch_youtube_transcript": {
        const data = await fetchYouTubeTranscript(input.video_url);
        if (!data) return JSON.stringify({ error: "Could not fetch transcript — video may not have captions" });
        return JSON.stringify(data);
      }
      case "capture_screenshot": {
        const result = await fetchScreenshotAsBase64(input.url);
        if (!result) return JSON.stringify({ error: "Failed to capture screenshot" });
        return JSON.stringify({ success: true, label: input.label, sizeKB: Math.round(Buffer.from(result.base64, "base64").length / 1024) });
      }
      default:
        return JSON.stringify({ error: `Unknown tool: ${name}` });
    }
  } catch (e: any) {
    return JSON.stringify({ error: e.message });
  }
}

export interface ResearchResult {
  verifiedData: VerifiedData;
  twitterData: TwitterData | null;
  screenshots: { url: string; source: string }[];
  screenshotImages: ScreenshotImage[];
  avatarUrl: string;
  stats: StatusData;
}

export async function runResearchAgent(
  jobId: string,
  name: string,
  twitter?: string,
  linkedin?: string,
  website?: string,
  description?: string
): Promise<ResearchResult> {
  const stats: StatusData = { dataSources: [] };
  const screenshots: { url: string; source: string }[] = [];
  const screenshotImages: ScreenshotImage[] = [];
  let twitterData: TwitterData | null = null;

  // Build the initial prompt
  const inputLines = [`Name: ${name}`];
  if (twitter) inputLines.push(`Twitter/X: ${twitter}`);
  if (linkedin) inputLines.push(`LinkedIn: ${linkedin}`);
  if (website) inputLines.push(`Website: ${website}`);
  if (description) inputLines.push(`Self-description: ${description}`);

  const systemPrompt = `You are a deep research agent for The Taste Bench — the internet's taste evaluation platform.

Your job is to build a comprehensive dossier on "${name}" by scraping their digital presence and researching them online. You have tools to scrape Twitter, LinkedIn, websites, GitHub, fetch YouTube transcripts, search the web, and capture screenshots.

RESEARCH STRATEGY (follow this order strictly):
PHASE 1 — SCRAPE: Start by scraping the provided profiles (Twitter, LinkedIn, website). If they're a tech person, scrape their GitHub too (starred repos reveal taste!). Do ONLY scraping in this phase — no web searches yet. You need to see the raw data first.
PHASE 2 — ASSESS: After seeing the scrape results, check the Twitter dateRangeSummary. If tweets span less than 90 days, you MUST do 3+ web searches for historical content. Also look at what you found: follow interesting leads — if their bio links to a blog, scrape it. If they mention a podcast, search for it.
PHASE 3 — GET TO KNOW THEM: This is the most important phase. Tweets are just the surface. You need to understand WHO this person is — their arc, their influences, their taste DNA. Do 4-8 web searches across these areas:

  INFLUENCES & REFERENCES: Search for "${name} influences" or "${name} inspiration" or "${name} favorite books/music/designers". What shaped them? Who do they cite? What constellation of references do they draw from? This is CRITICAL for the Curation dimension.

  INTERVIEWS & LONG-FORM: Search for "${name} interview" or "${name} podcast". Find where they talk at length — about their work, their philosophy, what they care about. If you find YouTube videos, FETCH THE TRANSCRIPT. A 30-minute interview reveals more taste than 200 tweets.

  CREATIVE OUTPUT & CAREER: Search for their actual work — projects shipped, companies built, art made, writing published. What have they actually put into the world? How has their work evolved over time?

  STRONG POSITIONS & CONTROVERSIES: Search for "${name} controversial" or "${name} opinion" or "${name} disagrees". What hills do they die on? What positions have they taken that others wouldn't? This feeds the Conviction dimension.

  WHAT OTHERS SAY: Search for "${name} profile" or articles written ABOUT them. How do others perceive their taste and work? Awards, recognition, criticism.

  Don't just search — FOLLOW THE LEADS. If a search result mentions a great interview, scrape it. If you find a blog post they wrote, read it. If you find a YouTube talk, get the transcript. Go deep.

PHASE 4 — VISUAL: Capture screenshots of their most visually interesting pages (website, Twitter profile).
PHASE 5 — DONE: Once you have rich data, call the "done" tool with a comprehensive VerifiedData JSON.

TEMPORAL COVERAGE — CRITICAL:
After scraping Twitter, ALWAYS check the "dateRangeSummary" field in the results. This tells you how many days the tweets span.

MANDATORY RULE: If the tweets span LESS than 90 days, you MUST do at least 3 web searches for historical content before calling "done". Do NOT skip this step. Examples:
  - "${name} best tweets" or "${name} viral tweet thread"
  - "${name} twitter thread" + a topic they care about
  - "${name} most controversial take" or "${name} opinion changed"
  - "${name} tweet 2023" or "${name} tweet 2022" for older periods
  - "${name} interview opinions hot take"

If the tweets span 6+ months: good temporal coverage from the scrape alone, but still search for notable moments.

WHY THIS MATTERS: Taste is revealed by what someone consistently returns to over YEARS. 200 tweets from the last 5 days tells you about their current mood, not their taste. A proper evaluation needs their arc — how they've evolved, what they keep coming back to, their most revealing moments. Web search is free, so use it generously for historical research.

QUALITY STANDARDS:
- Verify content ownership — make sure scraped content actually belongs to this person.
- Separate tweets into original/retweets/quote tweets — this matters for taste analysis.
- Flag notable content — unusual takes, revealing statements, strong opinions, interesting references.
- Don't stop at the obvious. Go deeper. The dimension analysts need RICH, SPECIFIC data to score well.
- Aim for 8-12 tool calls minimum. Tweets alone are NOT enough — you need interviews, articles, influences, and long-form content. The more you know about this person, the better the evaluation.
- Be cost-efficient: don't repeat searches or scrape the same URL twice. Web search is free, so use it generously.
- REMEMBER: You're building a DOSSIER, not a tweet summary. The analysts will evaluate this person on Curation (can they recognize quality outside themselves?), Intentionality (are their choices deliberate?), Originality, Conviction, Identity, and Self-Awareness. Feed ALL of these dimensions with evidence.

OUTPUT: When done, call the "done" tool with a JSON object matching this structure:
{
  "name": "${name}",
  "confidence": <0-1>,
  "excludedSources": ["<reason for each excluded piece>"],
  "twitter": {
    "verified": true/false,
    "handle": "<handle>",
    "displayName": "<name>",
    "bio": "<bio>",
    "followers": <number>,
    "following": <number>,
    "originalTweets": ["<tweet>", ...],
    "retweets": ["<retweet>", ...],
    "quoteTweets": ["<quote tweet>", ...],
    "notableTweets": ["<standout tweets>", ...]
  } or null,
  "linkedin": {
    "verified": true/false,
    "headline": "<headline>",
    "summary": "<summary>",
    "experience": ["<role>", ...],
    "posts": ["<post>", ...]
  } or null,
  "website": {
    "verified": true/false,
    "content": "<cleaned content>"
  } or null,
  "github": {
    "username": "<username>",
    "bio": "<bio>",
    "topRepos": ["<repo name> - <description> (★<stars>)", ...],
    "starredRepos": ["<owner>/<repo> - <description>", ...],
    "keyInsight": "<what their GitHub reveals about their taste>"
  } or null,
  "youtube": [
    { "title": "<video title>", "url": "<url>", "keyQuotes": ["<notable quote>", ...] }
  ] or [],
  "selfDescription": "<their description>" or null,
  "webResearch": [
    { "url": "<url>", "title": "<title>", "relevance": "high/medium/low", "keyInsight": "<insight>" }
  ],
  "researcherNotes": "<your notes on data quality, interesting findings, leads you followed>"
}`;

  const messages: Anthropic.Messages.MessageParam[] = [
    { role: "user", content: `Research this person:\n\n${inputLines.join("\n")}` },
  ];

  await updatePendingStatus(jobId, "deep-research", undefined, stats);

  // Agentic loop
  let iterations = 0;
  const MAX_ITERATIONS = 15;

  while (iterations < MAX_ITERATIONS) {
    iterations++;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
      system: systemPrompt,
      tools: [
        ...TOOLS,
        { type: "web_search_20250305" as const, name: "web_search" },
      ],
      messages,
    });

    // Track any server-side web searches for status updates
    const serverToolBlocks = response.content.filter(
      (b: any) => b.type === "server_tool_use"
    );
    for (const stb of serverToolBlocks) {
      const query = (stb as any).input?.query;
      if (query) {
        console.log(`[research-agent] Web search: ${query}`);
        await updatePendingStatus(jobId, "deep-research", undefined, { ...stats, currentAction: `Searching: ${query}` } as any);
      }
    }

    // Collect custom tool use blocks (not server tools)
    const toolUseBlocks = response.content.filter(
      (b): b is Anthropic.Messages.ToolUseBlock => b.type === "tool_use"
    );

    // If no custom tool calls, check if we had server tools or are done
    if (toolUseBlocks.length === 0) {
      if (serverToolBlocks.length > 0) {
        // Web search ran server-side but no custom tools — continue the loop
        messages.push({ role: "assistant", content: response.content });
        messages.push({ role: "user", content: "Continue your research. Use the tools to gather more data or call 'done' when you have enough." });
        continue;
      }
      // Agent finished without calling done — try to parse any text output
      const textBlock = response.content.find(
        (b): b is Anthropic.Messages.TextBlock => b.type === "text"
      );
      if (textBlock) {
        try {
          const result = JSON.parse(textBlock.text);
          return buildResult(result, twitterData, screenshots, screenshotImages, stats, name, twitter);
        } catch {}
      }
      break;
    }

    // Process tool calls
    const toolResults: Anthropic.Messages.ToolResultBlockParam[] = [];

    for (const toolUse of toolUseBlocks) {
      const input = toolUse.input as any;

      // Check for "done" tool
      if (toolUse.name === "done") {
        console.log(`[research-agent] Done after ${iterations} iterations`);
        return buildResult(input.result, twitterData, screenshots, screenshotImages, stats, name, twitter);
      }

      // Update status based on tool being called
      const statusLabel = getStatusLabel(toolUse.name, input);
      console.log(`[research-agent] ${statusLabel}`);
      await updatePendingStatus(jobId, "deep-research", undefined, { ...stats, currentAction: statusLabel } as any);

      // Execute the tool
      const result = await executeTool(toolUse.name, input);

      // Track side effects
      if (toolUse.name === "scrape_twitter") {
        try {
          const data = JSON.parse(result);
          twitterData = data;
          stats.tweetCount = data.tweets?.length || 0;
          stats.dataSources = Array.from(new Set([...(stats.dataSources || []), "twitter"]));
        } catch {}
      }
      if (toolUse.name === "scrape_linkedin") {
        try {
          const data = JSON.parse(result);
          stats.linkedinPostCount = data.posts?.length || 0;
          stats.dataSources = Array.from(new Set([...(stats.dataSources || []), "linkedin"]));
        } catch {}
      }
      if (toolUse.name === "scrape_website") {
        stats.dataSources = Array.from(new Set([...(stats.dataSources || []), "website"]));
      }
      if (toolUse.name === "scrape_github") {
        stats.dataSources = Array.from(new Set([...(stats.dataSources || []), "github"]));
      }
      if (toolUse.name === "fetch_youtube_transcript") {
        stats.dataSources = Array.from(new Set([...(stats.dataSources || []), "youtube"]));
      }
      if (toolUse.name === "capture_screenshot") {
        const screenshotData = await fetchScreenshotAsBase64(input.url);
        if (screenshotData) {
          screenshotImages.push({
            source: input.label || "Page",
            base64: screenshotData.base64,
            mediaType: screenshotData.mediaType,
          });
          screenshots.push({
            url: getScreenshotUrl(input.url),
            source: input.label || "Page",
          });
          stats.screenshotsCaptured = screenshotImages.length;
        }
      }

      toolResults.push({
        type: "tool_result",
        tool_use_id: toolUse.id,
        content: result,
      });
    }

    // Add assistant response + tool results to messages
    messages.push({ role: "assistant", content: response.content });
    messages.push({ role: "user", content: toolResults });

    // Update status with accumulated stats
    await updatePendingStatus(jobId, "deep-research", undefined, stats);
  }

  throw new Error("Research agent exceeded maximum iterations without producing results");
}

function getStatusLabel(toolName: string, input: any): string {
  switch (toolName) {
    case "scrape_twitter":
      return `Scraping @${(input.handle || "").replace("@", "")} on X`;
    case "scrape_linkedin":
      return `Scraping LinkedIn profile`;
    case "scrape_website":
      return `Scraping ${new URL(input.url).hostname}`;
    case "scrape_github":
      return `Scraping GitHub: ${(input.username || "").replace(/.*github\.com\//, "")}`;
    case "fetch_youtube_transcript":
      return `Fetching YouTube transcript`;
    case "capture_screenshot":
      return `Capturing screenshot: ${input.label || input.url}`;
    default:
      return `Running ${toolName}`;
  }
}

function buildResult(
  verifiedData: any,
  twitterData: TwitterData | null,
  screenshots: { url: string; source: string }[],
  screenshotImages: ScreenshotImage[],
  stats: StatusData,
  name: string,
  twitter?: string
): ResearchResult {
  // Also fetch Twitter avatar/banner images for vision if we have them
  const avatarUrl = getAvatarUrl(name, twitterData?.avatarUrl, twitter);

  return {
    verifiedData: verifiedData as VerifiedData,
    twitterData,
    screenshots,
    screenshotImages,
    avatarUrl,
    stats,
  };
}
