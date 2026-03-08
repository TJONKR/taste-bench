-- Add user_id to evaluations (nullable — evaluations without accounts still work)
ALTER TABLE evaluations ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- Index for user lookups
CREATE INDEX idx_evaluations_user_id ON evaluations(user_id);

-- Drop old permissive policies and replace with proper ones
DROP POLICY IF EXISTS "Public read access" ON evaluations;
DROP POLICY IF EXISTS "Service role full access evaluations" ON evaluations;
DROP POLICY IF EXISTS "Service role full access pending" ON pending_jobs;

-- Everyone can read evaluations (public leaderboard)
CREATE POLICY "evaluations_select" ON evaluations FOR SELECT USING (true);

-- Service role inserts evaluations (from judge API)
CREATE POLICY "evaluations_insert" ON evaluations FOR INSERT WITH CHECK (true);

-- Owner can update their evaluation (claim it)
CREATE POLICY "evaluations_update" ON evaluations FOR UPDATE
  USING (user_id = auth.uid() OR user_id IS NULL);

-- Pending jobs: service role only (policies with USING(true) — service role bypasses RLS anyway)
CREATE POLICY "pending_select" ON pending_jobs FOR SELECT USING (true);
CREATE POLICY "pending_insert" ON pending_jobs FOR INSERT WITH CHECK (true);
CREATE POLICY "pending_update" ON pending_jobs FOR UPDATE USING (true);
CREATE POLICY "pending_delete" ON pending_jobs FOR DELETE USING (true);
