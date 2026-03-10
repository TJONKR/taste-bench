-- V2 Framework Migration: add level_profile, overall_level, data_sources columns
-- and change score from INTEGER to REAL/FLOAT

-- Add new columns
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS level_profile TEXT;
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS overall_level TEXT;
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS data_sources JSONB DEFAULT '[]';

-- Change score from INTEGER to FLOAT (for decimal precision)
ALTER TABLE evaluations ALTER COLUMN score TYPE DOUBLE PRECISION;
