const APIFY_TOKEN = process.env.APIFY_API_TOKEN;

export interface TwitterData {
  handle: string;
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  followers?: number;
  following?: number;
  tweets: string[];
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
      `https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_TOKEN}&limit=50`
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
  }, 60);

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
      result.followers = first.author.followers;
      result.following = first.author.following;
    } else if (first?.user) {
      result.displayName = first.user.name;
      result.bio = first.user.description;
      result.avatarUrl = (first.user.profile_image_url_https || first.user.profilePicture || "")
        .replace("_normal", "_400x400");
      result.followers = first.user.followers_count;
      result.following = first.user.friends_count;
    }

    result.tweets = verified
      .map((item: any) => {
        const text = item.fullText || item.full_text || item.text || "";
        const likes = item.likeCount || item.favorite_count || 0;
        const rts = item.retweetCount || item.retweet_count || 0;
        const isRetweet = text.startsWith("RT @") || item.isRetweet || item.retweeted;
        const isQuote = !!item.quoteId || item.isQuote;
        const prefix = isRetweet ? "[RETWEET] " : isQuote ? "[QUOTE TWEET] " : "[ORIGINAL] ";
        return text ? `${prefix}${text} [${likes} likes, ${rts} RTs]` : "";
      })
      .filter(Boolean)
      .slice(0, 200);
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
      result.followers = result.followers || u.followers_count;
      result.following = result.following || u.friends_count;
    }
  }

  return result;
}

export async function scrapeLinkedIn(url: string): Promise<LinkedInData> {
  const result: LinkedInData = {};

  // Extract profile identifier from URL
  const match = url.match(/linkedin\.com\/in\/([^\/\?]+)/);
  const profileId = match ? match[1] : url;

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

export function getAvatarUrl(name: string, twitterAvatarUrl?: string, twitterHandle?: string): string {
  // Priority: scraped Twitter profile pic > unavatar.io (reliable fallback) > DiceBear initials
  if (twitterAvatarUrl && twitterAvatarUrl.length > 5) return twitterAvatarUrl;
  if (twitterHandle) {
    const clean = twitterHandle.replace("@", "").replace(/https?:\/\/(twitter|x)\.com\//i, "").replace(/\/.*/, "");
    return `https://unavatar.io/twitter/${clean}`;
  }
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=C45D3E`;
}
