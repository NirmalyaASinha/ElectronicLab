BEGIN;

DO $$
BEGIN
  CREATE TYPE lab_entry_session_status AS ENUM ('INSIDE', 'COMPLETED', 'REVOKED', 'NO_SHOW');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE lab_entry_tap_result AS ENUM (
    'ENTRY_CREATED',
    'EXIT_MARKED',
    'UNKNOWN_CARD',
    'INACTIVE_CARD',
    'DEVICE_UNAUTHORIZED',
    'LAB_MISMATCH',
    'DUPLICATE_TAP'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS lab_rfid_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  rfid_uid text NOT NULL UNIQUE,
  student_id uuid NOT NULL UNIQUE REFERENCES users(id),
  is_active boolean DEFAULT true NOT NULL,
  assigned_at timestamp DEFAULT now() NOT NULL,
  revoked_at timestamp,
  notes text
);

CREATE TABLE IF NOT EXISTS lab_entry_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  lab_id uuid NOT NULL REFERENCES labs(id),
  device_uid text NOT NULL UNIQUE,
  device_secret_hash text NOT NULL,
  label text,
  is_active boolean DEFAULT true NOT NULL,
  last_seen_at timestamp,
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS lab_entry_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  lab_id uuid NOT NULL REFERENCES labs(id),
  student_id uuid NOT NULL REFERENCES users(id),
  rfid_card_id uuid NOT NULL REFERENCES lab_rfid_cards(id),
  entry_device_id uuid REFERENCES lab_entry_devices(id),
  exit_device_id uuid REFERENCES lab_entry_devices(id),
  entry_tap_id uuid,
  exit_tap_id uuid,
  entry_at timestamp DEFAULT now() NOT NULL,
  exit_at timestamp,
  status lab_entry_session_status DEFAULT 'INSIDE' NOT NULL,
  notes text,
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS lab_entry_taps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  lab_id uuid NOT NULL REFERENCES labs(id),
  device_id uuid REFERENCES lab_entry_devices(id),
  rfid_uid text NOT NULL,
  tapped_at timestamp DEFAULT now() NOT NULL,
  raw_payload text,
  processed boolean DEFAULT false NOT NULL,
  result lab_entry_tap_result,
  created_at timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS lab_entry_one_open_session_idx
  ON lab_entry_sessions(lab_id, student_id)
  WHERE exit_at IS NULL;

CREATE INDEX IF NOT EXISTS lab_entry_sessions_lab_id_idx ON lab_entry_sessions(lab_id);
CREATE INDEX IF NOT EXISTS lab_entry_sessions_student_id_idx ON lab_entry_sessions(student_id);
CREATE INDEX IF NOT EXISTS lab_entry_taps_lab_id_idx ON lab_entry_taps(lab_id);
CREATE INDEX IF NOT EXISTS lab_entry_taps_rfid_uid_idx ON lab_entry_taps(rfid_uid);

COMMIT;
