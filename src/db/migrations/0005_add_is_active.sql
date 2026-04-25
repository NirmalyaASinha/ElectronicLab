-- 0005_add_is_active.sql
-- Add missing is_active column to projects table to match Drizzle schema

BEGIN;

ALTER TABLE IF EXISTS projects
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true NOT NULL;

COMMIT;
