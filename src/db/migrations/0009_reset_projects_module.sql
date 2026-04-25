BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DROP TABLE IF EXISTS project_components CASCADE;
DROP TABLE IF EXISTS project_members CASCADE;
DROP TABLE IF EXISTS projects CASCADE;

DROP TYPE IF EXISTS project_member_role CASCADE;
DROP TYPE IF EXISTS project_visibility CASCADE;
DROP TYPE IF EXISTS project_status CASCADE;

CREATE TYPE project_visibility AS ENUM ('PRIVATE', 'OPEN');
CREATE TYPE project_status AS ENUM ('PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED');
CREATE TYPE project_member_role AS ENUM ('OWNER', 'MEMBER');

CREATE TABLE projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text NOT NULL DEFAULT '',
  visibility project_visibility NOT NULL DEFAULT 'PRIVATE',
  status project_status NOT NULL DEFAULT 'PLANNING',
  progress integer NOT NULL DEFAULT 0,
  owner_id uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT projects_progress_range CHECK (progress >= 0 AND progress <= 100)
);

CREATE TABLE project_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role project_member_role NOT NULL DEFAULT 'MEMBER',
  joined_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT project_members_project_user_unique UNIQUE (project_id, user_id)
);

CREATE TABLE project_components (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  component_id uuid NOT NULL REFERENCES components(id),
  quantity integer NOT NULL DEFAULT 1,
  notes text,
  added_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT project_components_quantity_positive CHECK (quantity > 0)
);

CREATE INDEX idx_projects_owner_id ON projects(owner_id);
CREATE INDEX idx_projects_visibility ON projects(visibility);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_project_members_project_id ON project_members(project_id);
CREATE INDEX idx_project_members_user_id ON project_members(user_id);
CREATE INDEX idx_project_components_project_id ON project_components(project_id);
CREATE INDEX idx_project_components_component_id ON project_components(component_id);

COMMIT;
