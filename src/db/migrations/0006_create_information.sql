-- 0006_create_information.sql
-- Create information table for announcements/notices

BEGIN;

-- ensure uuid generator available
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS information (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  author_id uuid NOT NULL,
  author_role user_role NOT NULL,
  pinned boolean DEFAULT false,
  visible_from timestamptz,
  visible_until timestamptz,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_information_active_pinned ON information (is_active, pinned);
CREATE INDEX IF NOT EXISTS idx_information_visible_range ON information (visible_from, visible_until);

COMMIT;
