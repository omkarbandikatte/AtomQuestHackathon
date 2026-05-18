-- ============================================================
-- AtomQuest 1.0 — Migration 001: Tables & Constraints
-- ============================================================
-- This migration is ROLLBACK-SAFE. See the bottom for the
-- corresponding DROP statements if you need to undo.
--
-- Run order: 001 → 002 → 003 → 004 → 005 (seed)
-- ============================================================

BEGIN;

-- ── Extensions ─────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";   -- for text-search indexes

-- ============================================================
-- TABLE: users
-- Stores all portal users (employees, managers, admins).
-- Maps 1:1 with Supabase Auth (auth.users.id = public.users.id).
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email       text NOT NULL,
  full_name   text NOT NULL,
  role        text NOT NULL DEFAULT 'employee',
  manager_id  uuid,
  department  text,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),

  -- Constraints
  CONSTRAINT users_email_unique       UNIQUE (email),
  CONSTRAINT users_role_check         CHECK (role IN ('employee', 'manager', 'admin')),
  CONSTRAINT users_email_format       CHECK (email ~* '^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT users_full_name_length   CHECK (char_length(full_name) BETWEEN 2 AND 100),
  CONSTRAINT users_manager_fk         FOREIGN KEY (manager_id) REFERENCES public.users(id)
                                        ON DELETE SET NULL
);

COMMENT ON TABLE  public.users              IS 'All portal users — employees, managers, admins. Linked to Supabase Auth.';
COMMENT ON COLUMN public.users.id           IS 'UUID synced with auth.users.id';
COMMENT ON COLUMN public.users.role         IS 'Application role: employee | manager | admin';
COMMENT ON COLUMN public.users.manager_id   IS 'FK to reporting manager; NULL for managers/admins';
COMMENT ON COLUMN public.users.is_active    IS 'Soft-delete pattern — inactive users cannot login';

-- ============================================================
-- TABLE: cycles
-- Represents a single performance cycle (Indian FY: Apr–Mar).
-- Defines all window open dates. Only ONE cycle active at a time.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.cycles (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                text NOT NULL,
  goal_setting_opens  date NOT NULL,
  q1_opens            date NOT NULL,
  q2_opens            date NOT NULL,
  q3_opens            date NOT NULL,
  q4_opens            date NOT NULL,
  cycle_closes        date NOT NULL,
  is_active           boolean NOT NULL DEFAULT false,
  created_at          timestamptz NOT NULL DEFAULT now(),

  -- Constraints: dates must be sequential
  CONSTRAINT cycles_name_length     CHECK (char_length(name) BETWEEN 3 AND 50),
  CONSTRAINT cycles_date_order      CHECK (
    goal_setting_opens < q1_opens
    AND q1_opens < q2_opens
    AND q2_opens < q3_opens
    AND q3_opens < q4_opens
    AND q4_opens < cycle_closes
  )
);

COMMENT ON TABLE  public.cycles                    IS 'Performance cycles with window dates (Indian FY).';
COMMENT ON COLUMN public.cycles.is_active          IS 'Only one cycle may be active at a time (enforced by trigger).';
COMMENT ON COLUMN public.cycles.goal_setting_opens IS 'Goal-sheet creation window opens on this date.';
COMMENT ON COLUMN public.cycles.cycle_closes       IS 'Entire cycle closes — no further data entry allowed.';

-- ============================================================
-- TABLE: goal_sheets
-- One sheet per employee per cycle. Acts as the container for goals.
-- is_locked is the PRIMARY governance control.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.goal_sheets (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id  uuid NOT NULL,
  cycle_id     uuid NOT NULL,
  status       text NOT NULL DEFAULT 'draft',
  is_locked    boolean NOT NULL DEFAULT false,
  approved_by  uuid,
  approved_at  timestamptz,
  submitted_at timestamptz,
  return_comment text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),

  -- Constraints
  CONSTRAINT goal_sheets_employee_fk    FOREIGN KEY (employee_id) REFERENCES public.users(id) ON DELETE RESTRICT,
  CONSTRAINT goal_sheets_cycle_fk       FOREIGN KEY (cycle_id) REFERENCES public.cycles(id) ON DELETE RESTRICT,
  CONSTRAINT goal_sheets_approver_fk    FOREIGN KEY (approved_by) REFERENCES public.users(id) ON DELETE SET NULL,
  CONSTRAINT goal_sheets_status_check   CHECK (status IN ('draft', 'submitted', 'approved', 'returned')),
  CONSTRAINT goal_sheets_unique_per_cycle UNIQUE (employee_id, cycle_id),
  CONSTRAINT goal_sheets_lock_requires_approval CHECK (
    (is_locked = false) OR (is_locked = true AND status = 'approved')
  )
);

COMMENT ON TABLE  public.goal_sheets            IS 'One per employee per cycle. is_locked is the governance lock.';
COMMENT ON COLUMN public.goal_sheets.is_locked  IS 'TRUE after manager approval. No mutations allowed unless admin unlocks.';
COMMENT ON COLUMN public.goal_sheets.status     IS 'draft → submitted → approved/returned. Only admin can revert from approved.';
COMMENT ON COLUMN public.goal_sheets.return_comment IS 'Mandatory comment from manager when returning for rework.';

-- ============================================================
-- TABLE: goals
-- Individual goal rows within a goal_sheet.
-- Max 8 per sheet (enforced by trigger).
-- Shared goals have is_shared=true and read-only title/target.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.goals (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_sheet_id    uuid NOT NULL,
  thrust_area      text NOT NULL,
  title            text NOT NULL,
  description      text,
  uom_type         text NOT NULL,
  target_value     numeric,
  target_date      date,
  weightage        numeric NOT NULL,
  is_shared        boolean NOT NULL DEFAULT false,
  shared_owner_id  uuid,
  sort_order       integer NOT NULL DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now(),

  -- Constraints
  CONSTRAINT goals_sheet_fk           FOREIGN KEY (goal_sheet_id) REFERENCES public.goal_sheets(id) ON DELETE CASCADE,
  CONSTRAINT goals_shared_owner_fk    FOREIGN KEY (shared_owner_id) REFERENCES public.users(id) ON DELETE SET NULL,
  CONSTRAINT goals_uom_check          CHECK (uom_type IN ('numeric_min', 'numeric_max', 'timeline', 'zero')),
  CONSTRAINT goals_weightage_range    CHECK (weightage >= 10 AND weightage <= 100),
  CONSTRAINT goals_title_length       CHECK (char_length(title) BETWEEN 3 AND 200),
  CONSTRAINT goals_description_length CHECK (description IS NULL OR char_length(description) <= 500),
  CONSTRAINT goals_timeline_needs_date CHECK (
    (uom_type = 'timeline' AND target_date IS NOT NULL) OR uom_type != 'timeline'
  ),
  CONSTRAINT goals_numeric_needs_value CHECK (
    (uom_type IN ('numeric_min', 'numeric_max') AND target_value IS NOT NULL AND target_value > 0)
    OR uom_type NOT IN ('numeric_min', 'numeric_max')
  )
);

COMMENT ON TABLE  public.goals                IS 'Individual goals within a goal_sheet. Max 8 per sheet.';
COMMENT ON COLUMN public.goals.uom_type       IS 'Unit of Measurement: numeric_min | numeric_max | timeline | zero';
COMMENT ON COLUMN public.goals.is_shared      IS 'TRUE = pushed from a departmental KPI by admin/manager.';
COMMENT ON COLUMN public.goals.shared_owner_id IS 'FK to the primary owner user for shared-goal sync.';
COMMENT ON COLUMN public.goals.sort_order     IS 'Display ordering set by the employee.';

-- ============================================================
-- TABLE: checkins
-- Quarterly achievement entries. One per goal per quarter.
-- progress_score is auto-computed by trigger — never set by app.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.checkins (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id          uuid NOT NULL,
  quarter          text NOT NULL,
  actual_value     numeric,
  completion_date  date,
  status           text NOT NULL DEFAULT 'not_started',
  progress_score   numeric,
  employee_id      uuid NOT NULL,
  manager_comment  text,
  manager_id       uuid,
  logged_at        timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),

  -- Constraints
  CONSTRAINT checkins_goal_fk           FOREIGN KEY (goal_id) REFERENCES public.goals(id) ON DELETE CASCADE,
  CONSTRAINT checkins_employee_fk       FOREIGN KEY (employee_id) REFERENCES public.users(id) ON DELETE RESTRICT,
  CONSTRAINT checkins_manager_fk        FOREIGN KEY (manager_id) REFERENCES public.users(id) ON DELETE SET NULL,
  CONSTRAINT checkins_quarter_check     CHECK (quarter IN ('Q1', 'Q2', 'Q3', 'Q4')),
  CONSTRAINT checkins_status_check      CHECK (status IN ('not_started', 'on_track', 'completed')),
  CONSTRAINT checkins_unique_per_quarter UNIQUE (goal_id, quarter),
  CONSTRAINT checkins_score_range       CHECK (progress_score IS NULL OR (progress_score >= 0 AND progress_score <= 200)),
  CONSTRAINT checkins_comment_length    CHECK (manager_comment IS NULL OR char_length(manager_comment) <= 2000)
);

COMMENT ON TABLE  public.checkins               IS 'Quarterly achievement entries. One per (goal, quarter).';
COMMENT ON COLUMN public.checkins.progress_score IS 'Auto-computed by Postgres trigger. NEVER set by application code.';
COMMENT ON COLUMN public.checkins.employee_id   IS 'Denormalized for RLS performance — avoids joins on every policy check.';
COMMENT ON COLUMN public.checkins.manager_comment IS 'Structured check-in note written by L1 manager.';

-- ============================================================
-- TABLE: shared_goal_links
-- Junction table linking a source (primary owner) goal to
-- recipient goal rows for shared-goal achievement sync.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.shared_goal_links (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_goal_id   uuid NOT NULL,
  target_goal_id   uuid NOT NULL,
  is_primary_owner boolean NOT NULL DEFAULT false,
  created_by       uuid NOT NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),

  -- Constraints
  CONSTRAINT sgl_source_fk      FOREIGN KEY (source_goal_id) REFERENCES public.goals(id) ON DELETE CASCADE,
  CONSTRAINT sgl_target_fk      FOREIGN KEY (target_goal_id) REFERENCES public.goals(id) ON DELETE CASCADE,
  CONSTRAINT sgl_creator_fk     FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE RESTRICT,
  CONSTRAINT sgl_no_self_link   CHECK (source_goal_id != target_goal_id),
  CONSTRAINT sgl_unique_link    UNIQUE (source_goal_id, target_goal_id)
);

COMMENT ON TABLE  public.shared_goal_links             IS 'Links a primary owner goal to N recipient goals for achievement sync.';
COMMENT ON COLUMN public.shared_goal_links.source_goal_id IS 'The primary owner goal whose check-ins propagate.';
COMMENT ON COLUMN public.shared_goal_links.target_goal_id IS 'The recipient employee goal that receives synced actuals.';

-- ============================================================
-- TABLE: audit_log
-- Append-only ledger. NO UPDATE/DELETE permitted.
-- Records all post-lock mutations and admin actions.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.audit_log (
  id              bigserial PRIMARY KEY,
  goal_sheet_id   uuid NOT NULL,
  goal_id         uuid,
  actor_id        uuid NOT NULL,
  action          text NOT NULL,
  field_changed   text,
  old_value       text,
  new_value       text,
  reason          text,
  changed_at      timestamptz NOT NULL DEFAULT now(),

  -- Constraints
  CONSTRAINT audit_log_sheet_fk   FOREIGN KEY (goal_sheet_id) REFERENCES public.goal_sheets(id) ON DELETE RESTRICT,
  CONSTRAINT audit_log_goal_fk    FOREIGN KEY (goal_id) REFERENCES public.goals(id) ON DELETE SET NULL,
  CONSTRAINT audit_log_actor_fk   FOREIGN KEY (actor_id) REFERENCES public.users(id) ON DELETE RESTRICT,
  CONSTRAINT audit_log_action_check CHECK (action IN (
    'UPDATE', 'UNLOCK', 'RELOCK', 'APPROVE', 'RETURN_FOR_REWORK', 'PUSH_SHARED_GOAL', 'DELETE_GOAL'
  )),
  CONSTRAINT audit_log_unlock_reason CHECK (
    (action = 'UNLOCK' AND reason IS NOT NULL AND char_length(reason) >= 20) OR action != 'UNLOCK'
  )
);

COMMENT ON TABLE  public.audit_log          IS 'Append-only audit ledger. NO UPDATE/DELETE permitted (enforced by RLS + trigger).';
COMMENT ON COLUMN public.audit_log.action   IS 'Action type: UPDATE | UNLOCK | RELOCK | APPROVE | RETURN_FOR_REWORK | PUSH_SHARED_GOAL | DELETE_GOAL';
COMMENT ON COLUMN public.audit_log.reason   IS 'Mandatory for UNLOCK actions (min 20 chars). Optional otherwise.';

-- ============================================================
-- TABLE: notifications (bonus — for in-app notifications)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL,
  title        text NOT NULL,
  body         text,
  type         text NOT NULL DEFAULT 'info',
  is_read      boolean NOT NULL DEFAULT false,
  link         text,
  created_at   timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT notifications_user_fk   FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT notifications_type_check CHECK (type IN ('info', 'approval', 'rejection', 'reminder', 'unlock'))
);

COMMENT ON TABLE public.notifications IS 'In-app notifications for submissions, approvals, rejections, reminders.';

COMMIT;

-- ============================================================
-- ROLLBACK SCRIPT (run only if you need to undo this migration)
-- ============================================================
-- BEGIN;
-- DROP TABLE IF EXISTS public.notifications CASCADE;
-- DROP TABLE IF EXISTS public.audit_log CASCADE;
-- DROP TABLE IF EXISTS public.shared_goal_links CASCADE;
-- DROP TABLE IF EXISTS public.checkins CASCADE;
-- DROP TABLE IF EXISTS public.goals CASCADE;
-- DROP TABLE IF EXISTS public.goal_sheets CASCADE;
-- DROP TABLE IF EXISTS public.cycles CASCADE;
-- DROP TABLE IF EXISTS public.users CASCADE;
-- DROP EXTENSION IF EXISTS "pg_trgm";
-- COMMIT;
