-- Lab access workflow tables
CREATE TYPE "lab_access_request_status" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');
CREATE TYPE "lab_access_history_status" AS ENUM ('ACTIVE', 'COMPLETED', 'REVOKED', 'NO_SHOW');

CREATE TABLE IF NOT EXISTS "labs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "location" text,
  "responsible_faculty_id" uuid NOT NULL REFERENCES "users" ("id"),
  "created_by" uuid REFERENCES "users" ("id"),
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "lab_access_requests" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "lab_id" uuid NOT NULL REFERENCES "labs" ("id"),
  "student_id" uuid NOT NULL REFERENCES "users" ("id"),
  "reason" text NOT NULL,
  "requested_for" timestamp NOT NULL,
  "duration_minutes" integer DEFAULT 120 NOT NULL,
  "status" "lab_access_request_status" DEFAULT 'PENDING' NOT NULL,
  "reviewed_by" uuid REFERENCES "users" ("id"),
  "reviewed_at" timestamp,
  "decision_note" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "lab_access_history" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "request_id" uuid NOT NULL REFERENCES "lab_access_requests" ("id"),
  "lab_id" uuid NOT NULL REFERENCES "labs" ("id"),
  "student_id" uuid NOT NULL REFERENCES "users" ("id"),
  "faculty_id" uuid NOT NULL REFERENCES "users" ("id"),
  "access_reason" text NOT NULL,
  "status" "lab_access_history_status" DEFAULT 'ACTIVE' NOT NULL,
  "access_granted_at" timestamp DEFAULT now() NOT NULL,
  "access_ended_at" timestamp,
  "notes" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);