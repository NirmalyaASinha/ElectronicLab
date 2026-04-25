BEGIN;

DO $$
BEGIN
  CREATE TYPE lab_entry_action AS ENUM ('ENTRY', 'EXIT');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE IF EXISTS lab_entry_taps
  ADD COLUMN IF NOT EXISTS action lab_entry_action;

UPDATE lab_entry_taps
SET action = 'ENTRY'
WHERE action IS NULL;

ALTER TABLE IF EXISTS lab_entry_taps
  ALTER COLUMN action SET NOT NULL;

COMMIT;
