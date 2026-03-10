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
