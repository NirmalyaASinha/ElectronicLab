BEGIN;

ALTER TABLE IF EXISTS lab_entry_taps
  ADD COLUMN IF NOT EXISTS tap_signature text;

CREATE UNIQUE INDEX IF NOT EXISTS lab_entry_taps_tap_signature_idx
  ON lab_entry_taps(tap_signature)
  WHERE tap_signature IS NOT NULL;

COMMIT;
