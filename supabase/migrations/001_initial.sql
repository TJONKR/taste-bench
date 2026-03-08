-- Evaluations table
CREATE TABLE evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  score INTEGER NOT NULL,
  title TEXT NOT NULL,
  verdict TEXT NOT NULL,
  taste_dna TEXT,
  cross_platform_consistency TEXT,
  recommendations JSONB DEFAULT '[]',
  dimensions JSONB NOT NULL,
  input JSONB NOT NULL,
  avatar_url TEXT,
  screenshots JSONB DEFAULT '[]',
  scraped_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pending jobs table
CREATE TABLE pending_jobs (
  id UUID PRIMARY KEY,
  input JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'scraping-twitter',
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for leaderboard sorting
CREATE INDEX idx_evaluations_score ON evaluations(score DESC);
CREATE INDEX idx_evaluations_created ON evaluations(created_at DESC);

-- Enable RLS
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_jobs ENABLE ROW LEVEL SECURITY;

-- Public read access for evaluations
CREATE POLICY "Public read access" ON evaluations FOR SELECT USING (true);

-- Service role can do everything
CREATE POLICY "Service role full access evaluations" ON evaluations FOR ALL USING (true);
CREATE POLICY "Service role full access pending" ON pending_jobs FOR ALL USING (true);
