-- 0004_projects_constraints.sql
-- Add unique constraint to prevent duplicate project members and indexes to speed lookups

BEGIN;

-- unique constraint on (project_id, user_id)
ALTER TABLE IF EXISTS project_members
  ADD CONSTRAINT IF NOT EXISTS project_members_project_user_unique UNIQUE (project_id, user_id);

-- indexes
CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_project_components_project_id ON project_components(project_id);
CREATE INDEX IF NOT EXISTS idx_project_components_component_id ON project_components(component_id);

-- make child rows cascade when a project is removed
ALTER TABLE IF EXISTS project_members DROP CONSTRAINT IF EXISTS project_members_project_id_fkey;
ALTER TABLE IF EXISTS project_members
  ADD CONSTRAINT IF NOT EXISTS project_members_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS project_components DROP CONSTRAINT IF EXISTS project_components_project_id_fkey;
ALTER TABLE IF EXISTS project_components
  ADD CONSTRAINT IF NOT EXISTS project_components_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

COMMIT;
