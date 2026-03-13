-- Change score column from integer to numeric for decimal scores
ALTER TABLE evaluations ALTER COLUMN score TYPE numeric USING score::numeric;
