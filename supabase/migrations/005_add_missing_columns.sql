-- Add missing columns to evaluations table
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS data_sources jsonb DEFAULT '[]'::jsonb;
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS level_profile text;
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS overall_level text;

-- Delete test row if it exists
DELETE FROM evaluations WHERE id = '00000000-0000-0000-0000-000000000001';
