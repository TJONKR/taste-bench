export interface ScoreResult {
  id: string;
  name: string;
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
  input: {
    twitter?: string;
    linkedin?: string;
    website?: string;
    description?: string;
  };
  avatarUrl: string;
  screenshots: { url: string; source: string }[];
  scrapedData: { twitter?: any; linkedin?: any; website?: string };
  createdAt: string;
}

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
  patterns: string[];
  contradictions: string[];
  standoutMoments: string[];
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
