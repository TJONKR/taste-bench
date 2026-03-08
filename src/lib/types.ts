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
