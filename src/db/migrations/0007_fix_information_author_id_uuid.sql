BEGIN;

DO $$
DECLARE
  author_id_type text;
BEGIN
  SELECT t.typname
    INTO author_id_type
  FROM pg_attribute a
  JOIN pg_class c ON c.oid = a.attrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  JOIN pg_type t ON t.oid = a.atttypid
  WHERE n.nspname = 'public'
    AND c.relname = 'information'
    AND a.attname = 'author_id'
    AND NOT a.attisdropped;

  IF author_id_type = 'int8' THEN
    ALTER TABLE information
      ALTER COLUMN author_id TYPE uuid
      USING author_id::text::uuid;
  END IF;
END $$;

ALTER TABLE information
  DROP CONSTRAINT IF EXISTS information_author_id_users_id_fk;

ALTER TABLE information
  ADD CONSTRAINT information_author_id_users_id_fk
  FOREIGN KEY (author_id) REFERENCES users(id);

COMMIT;
