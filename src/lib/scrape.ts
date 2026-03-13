const APIFY_TOKEN = process.env.APIFY_API_TOKEN;

export interface TwitterData {
  handle: string;
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  followers?: number;
  following?: number;
  tweets: string[];
  oldestTweetDate?: string;
  newestTweetDate?: string;
  dateRangeSummary?: string;
}

export interface LinkedInData {
  headline?: string;
  summary?: string;
  experience?: string[];
  posts?: string[];
}

// Use Apify REST API directly (avoids proxy-agent bundling issue)
async function runApifyActor(actorId: string, input: any, timeoutSecs = 60): Promise<any[]> {
  try {
    console.log(`Starting Apify actor ${actorId}...`);
    const runRes = await fetch(
      `https://api.apify.com/v2/acts/${actorId}/runs?token=${APIFY_TOKEN}&timeout=${timeoutSecs}&waitForFinish=${timeoutSecs}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      }
    );
    
    if (!runRes.ok) {
      const err = await runRes.text();
      console.error(`Apify actor ${actorId} run failed:`, err);
      return [];
    }
    
    const run = await runRes.json();
    const datasetId = run.data?.defaultDatasetId;
    if (!datasetId) {
      console.error(`Apify actor ${actorId}: no dataset ID`);
      return [];
    }

    console.log(`Apify actor ${actorId} completed, fetching dataset ${datasetId}...`);
    const dataRes = await fetch(
      `https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_TOKEN}&limit=250`
    );
    
    if (!dataRes.ok) return [];
    const items = await dataRes.json();
    console.log(`Apify actor ${actorId}: got ${items.length} items`);
    return items;
  } catch (e: any) {
    console.error(`Apify actor ${actorId} error:`, e.message);
    return [];
  }
}

export async function scrapeTwitter(handle: string): Promise<TwitterData> {
  const clean = handle.replace("@", "").replace(/https?:\/\/(twitter|x)\.com\//i, "").replace(/\/.*/, "");
  const result: TwitterData = { handle: clean, tweets: [] };

  // Try tweet scraper
  const items = await runApifyActor("apidojo~tweet-scraper", {
    handles: [clean],
    tweetsDesired: 200,
    addUserInfo: true,
    proxyConfig: { useApifyProxy: true },
  }, 120);

  if (items.length > 0) {
    // Filter: only keep tweets from the correct user (verification!)
    const targetHandle = clean.toLowerCase();
    const verified = items.filter((item: any) => {
      const author = item.author || item.user || {};
      const handle = (author.userName || author.screen_name || "").toLowerCase();
      return handle === targetHandle || !handle; // Keep if matching or no handle info
    });
    
    console.log(`Twitter verification: ${items.length} total items, ${verified.length} verified for @${clean}`);
    
    // Get profile info from the first verified tweet
    const first = verified[0] || items[0];
    if (first?.author) {
      result.displayName = first.author.name || first.author.userName;
      result.bio = first.author.description;
      result.avatarUrl = (first.author.profilePicture || first.author.profileImageUrl || "")
        .replace("_normal", "_400x400");
      result.bannerUrl = first.author.profileBannerUrl || undefined;
      result.followers = first.author.followers;
      result.following = first.author.following;
    } else if (first?.user) {
      result.displayName = first.user.name;
      result.bio = first.user.description;
      result.avatarUrl = (first.user.profile_image_url_https || first.user.profilePicture || "")
        .replace("_normal", "_400x400");
      result.bannerUrl = first.user.profile_banner_url || undefined;
      result.followers = first.user.followers_count;
      result.following = first.user.friends_count;
    }

    // Parse dates and build tweets with timestamps
    const tweetDates: Date[] = [];
    result.tweets = verified
      .map((item: any) => {
        const text = item.fullText || item.full_text || item.text || "";
        const likes = item.likeCount || item.favorite_count || 0;
        const rts = item.retweetCount || item.retweet_count || 0;
        const isRetweet = text.startsWith("RT @") || item.isRetweet || item.retweeted;
        const isQuote = !!item.quoteId || item.isQuote;
        const prefix = isRetweet ? "[RETWEET] " : isQuote ? "[QUOTE TWEET] " : "[ORIGINAL] ";
        const dateStr = item.createdAt || item.created_at || item.timestamp;
        const date = dateStr ? new Date(dateStr) : null;
        if (date && !isNaN(date.getTime())) tweetDates.push(date);
        const dateTag = date && !isNaN(date.getTime()) ? ` ${date.toISOString().slice(0, 10)}` : "";
        return text ? `${prefix}${text} [${likes} likes, ${rts} RTs]${dateTag}` : "";
      })
      .filter(Boolean)
      .slice(0, 200);

    // Calculate date range coverage
    if (tweetDates.length > 0) {
      tweetDates.sort((a, b) => a.getTime() - b.getTime());
      const oldest = tweetDates[0];
      const newest = tweetDates[tweetDates.length - 1];
      result.oldestTweetDate = oldest.toISOString().slice(0, 10);
      result.newestTweetDate = newest.toISOString().slice(0, 10);
      const daySpan = Math.round((newest.getTime() - oldest.getTime()) / (1000 * 60 * 60 * 24));
      result.dateRangeSummary = `${result.tweets.length} tweets spanning ${daySpan} days (${result.oldestTweetDate} to ${result.newestTweetDate})`;
      console.log(`Twitter date range: ${result.dateRangeSummary}`);
    }
  }

  // Fallback if first actor got nothing
  if (result.tweets.length === 0) {
    const items2 = await runApifyActor("quacker~twitter-url-scraper", {
      startUrls: [{ url: `https://x.com/${clean}` }],
      maxTweets: 200,
      proxyConfiguration: { useApifyProxy: true },
    }, 45);

    result.tweets = items2
      .map((item: any) => item.text || item.full_text || "")
      .filter(Boolean)
      .slice(0, 200);

    if (items2[0]?.user) {
      const u = items2[0].user;
      result.displayName = result.displayName || u.name;
      result.bio = result.bio || u.description;
      result.avatarUrl = result.avatarUrl || u.profile_image_url_https?.replace("_normal", "_400x400");
      result.bannerUrl = result.bannerUrl || u.profile_banner_url || undefined;
      result.followers = result.followers || u.followers_count;
      result.following = result.following || u.friends_count;
    }
  }

  return result;
}

export async function scrapeLinkedIn(url: string): Promise<LinkedInData> {
  const result: LinkedInData = {};

  // Scrape posts (this actor works on free tier!)
  const posts = await runApifyActor("harvestapi~linkedin-profile-posts", {
    profileUrls: [url],
    maxPosts: 30,
  }, 60);

  if (posts.length > 0) {
    // Extract author info from first post
    const author = posts[0]?.author;
    if (author) {
      result.headline = author.headline || author.title;
      result.summary = author.description || author.summary;
    }

    result.posts = posts
      .map((p: any) => {
        const content = p.content || p.text || "";
        const likes = p.numLikes || p.likes || 0;
        const comments = p.numComments || p.comments || 0;
        return content ? `${content} [${likes} likes, ${comments} comments]` : "";
      })
      .filter(Boolean)
      .slice(0, 30);
  }

  // Also try to scrape the public profile page for headline/summary
  if (!result.headline) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)" },
        signal: AbortSignal.timeout(8000),
      });
      if (res.ok) {
        const html = await res.text();
        const headlineMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/i);
        if (headlineMatch) result.headline = headlineMatch[1];
      }
    } catch {}
  }

  return result;
}

export async function scrapeWebsite(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; TasteBench/1.0)" },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return `[Failed to fetch: ${res.status}]`;
    const html = await res.text();
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 8000);
    return text || "[Empty page]";
  } catch (e: any) {
    return `[Error fetching: ${e.message}]`;
  }
}

// Deep research: search the web for the person and scrape top results
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function deepResearch(name: string, twitter?: string, website?: string): Promise<{ url: string; title: string; snippet: string; content: string }[]> {
  const results: { url: string; title: string; snippet: string; content: string }[] = [];
  
  // Build search queries
  const queries = [
    `"${name}"`,
    twitter ? `"${twitter.replace('@', '')}" site:twitter.com OR site:x.com` : null,
    `"${name}" interview OR podcast OR article`,
    `"${name}" founder OR creator OR builder`,
  ].filter(Boolean) as string[];

  try {
    // Use Apify Google Search actor
    for (const query of queries.slice(0, 2)) { // Max 2 searches to save credits
      console.log(`Deep research: searching "${query}"...`);
      const items = await runApifyActor("apify~google-search-scraper", {
        queries: query,
        maxPagesPerQuery: 1,
        resultsPerPage: 5,
        languageCode: "en",
      }, 30);

      for (const item of items) {
        const organicResults = item.organicResults || [];
        for (const r of organicResults.slice(0, 3)) {
          const url = r.url || r.link;
          if (!url) continue;
          // Skip social media profiles (we scrape those separately)
          if (url.includes('linkedin.com/in/') || url.includes('x.com/') || url.includes('twitter.com/')) continue;
          // Skip duplicates
          if (results.find(existing => existing.url === url)) continue;
          
          results.push({
            url,
            title: r.title || "",
            snippet: r.description || "",
            content: "", // Will be filled below
          });
        }
      }
    }

    // Scrape the top 5 found URLs for content
    console.log(`Deep research: scraping ${Math.min(results.length, 5)} found URLs...`);
    await Promise.all(
      results.slice(0, 5).map(async (r) => {
        try {
          const res = await fetch(r.url, {
            headers: { "User-Agent": "Mozilla/5.0 (compatible; TasteBench/1.0)" },
            signal: AbortSignal.timeout(8000),
          });
          if (res.ok) {
            const html = await res.text();
            r.content = html
              .replace(/<script[\s\S]*?<\/script>/gi, "")
              .replace(/<style[\s\S]*?<\/style>/gi, "")
              .replace(/<[^>]+>/g, " ")
              .replace(/\s+/g, " ")
              .trim()
              .slice(0, 3000);
          }
        } catch {}
      })
    );
  } catch (e: any) {
    console.error("Deep research error:", e.message);
  }

  return results.filter(r => r.content || r.snippet);
}

export function getScreenshotUrl(url: string): string {
  return `https://image.thum.io/get/width/1280/${url}`;
}

export async function fetchScreenshotAsBase64(url: string): Promise<{ base64: string; mediaType: string } | null> {
  try {
    const screenshotUrl = getScreenshotUrl(url);
    console.log(`Fetching screenshot for ${url}...`);
    const res = await fetch(screenshotUrl, {
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
      console.error(`Screenshot fetch failed for ${url}: ${res.status}`);
      return null;
    }
    const buffer = await res.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const mediaType = (res.headers.get("content-type") || "image/png").split(";")[0];
    console.log(`Screenshot captured for ${url} (${Math.round(buffer.byteLength / 1024)}KB)`);
    return { base64, mediaType };
  } catch (e: any) {
    console.error(`Screenshot fetch error for ${url}:`, e.message);
    return null;
  }
}

export function getAvatarUrl(name: string, twitterAvatarUrl?: string, twitterHandle?: string): string {
  // Priority: scraped Twitter profile pic > unavatar.io (reliable fallback) > DiceBear initials
  if (twitterAvatarUrl && twitterAvatarUrl.length > 5) return twitterAvatarUrl;
  if (twitterHandle) {
    const clean = twitterHandle.replace("@", "").replace(/https?:\/\/(twitter|x)\.com\//i, "").replace(/\/.*/, "");
    return `https://unavatar.io/twitter/${clean}`;
  }
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=C45D3E`;
}

// ============================================================
// GitHub scraping (free public API, no auth needed)
// ============================================================

export interface GitHubData {
  username: string;
  name?: string;
  bio?: string;
  company?: string;
  location?: string;
  blog?: string;
  followers?: number;
  following?: number;
  publicRepos?: number;
  topRepos: { name: string; description: string | null; stars: number; language: string | null; url: string }[];
  starredRepos: { name: string; owner: string; description: string | null; stars: number; language: string | null }[];
}

export async function scrapeGitHub(username: string): Promise<GitHubData> {
  const clean = username.replace(/https?:\/\/github\.com\//i, "").replace(/\/.*/, "").replace("@", "");
  const result: GitHubData = { username: clean, topRepos: [], starredRepos: [] };

  const headers = { "User-Agent": "TasteBench/1.0", Accept: "application/vnd.github.v3+json" };
  const timeout = AbortSignal.timeout(10000);

  try {
    // Fetch profile + repos + starred in parallel
    const [profileRes, reposRes, starredRes] = await Promise.all([
      fetch(`https://api.github.com/users/${clean}`, { headers, signal: timeout }),
      fetch(`https://api.github.com/users/${clean}/repos?sort=stars&direction=desc&per_page=30`, { headers, signal: timeout }),
      fetch(`https://api.github.com/users/${clean}/starred?per_page=30`, { headers, signal: timeout }),
    ]);

    if (profileRes.ok) {
      const p = await profileRes.json();
      result.name = p.name;
      result.bio = p.bio;
      result.company = p.company;
      result.location = p.location;
      result.blog = p.blog;
      result.followers = p.followers;
      result.following = p.following;
      result.publicRepos = p.public_repos;
    }

    if (reposRes.ok) {
      const repos = await reposRes.json();
      result.topRepos = repos
        .filter((r: any) => !r.fork)
        .slice(0, 20)
        .map((r: any) => ({
          name: r.name,
          description: r.description,
          stars: r.stargazers_count,
          language: r.language,
          url: r.html_url,
        }));
    }

    if (starredRes.ok) {
      const starred = await starredRes.json();
      result.starredRepos = starred.slice(0, 30).map((r: any) => ({
        name: r.name,
        owner: r.owner?.login,
        description: r.description,
        stars: r.stargazers_count,
        language: r.language,
      }));
    }

    console.log(`GitHub: ${clean} — ${result.topRepos.length} repos, ${result.starredRepos.length} starred`);
  } catch (e: any) {
    console.error(`GitHub scrape error for ${clean}:`, e.message);
  }

  return result;
}

// ============================================================
// YouTube transcript fetching (free, no API key)
// ============================================================

export interface YouTubeTranscriptData {
  videoId: string;
  title?: string;
  transcript: string;
}

export async function fetchYouTubeTranscript(videoUrl: string): Promise<YouTubeTranscriptData | null> {
  try {
    // Extract video ID from various URL formats
    const videoId = extractVideoId(videoUrl);
    if (!videoId) return null;

    const { YoutubeTranscript } = await import("youtube-transcript");
    const items = await YoutubeTranscript.fetchTranscript(videoId);
    if (!items || items.length === 0) return null;

    // Combine transcript segments into readable text (cap at 10000 chars)
    const transcript = items
      .map((item: any) => item.text)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 10000);

    console.log(`YouTube transcript: ${videoId} — ${transcript.length} chars`);
    return { videoId, transcript };
  } catch (e: any) {
    console.error(`YouTube transcript error:`, e.message);
    return null;
  }
}

function extractVideoId(url: string): string | null {
  // Handle various YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  // Maybe it's already just a video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;
  return null;
}
