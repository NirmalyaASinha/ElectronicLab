BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  CREATE TYPE concern_target_type AS ENUM ('FACULTY', 'ALL_FACULTY', 'ADMIN');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE concern_status AS ENUM ('OPEN', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS concerns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  created_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type concern_target_type NOT NULL,
  target_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  status concern_status NOT NULL DEFAULT 'OPEN',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT concerns_target_user_check CHECK (
    (target_type = 'FACULTY' AND target_user_id IS NOT NULL) OR
    (target_type IN ('ALL_FACULTY', 'ADMIN') AND target_user_id IS NULL)
  )
);

CREATE TABLE IF NOT EXISTS concern_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  concern_id uuid NOT NULL REFERENCES concerns(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_concerns_created_by ON concerns(created_by);
CREATE INDEX IF NOT EXISTS idx_concerns_target_type ON concerns(target_type);
CREATE INDEX IF NOT EXISTS idx_concerns_target_user_id ON concerns(target_user_id);
CREATE INDEX IF NOT EXISTS idx_concerns_status ON concerns(status);
CREATE INDEX IF NOT EXISTS idx_concern_replies_concern_id ON concern_replies(concern_id);

COMMIT;
