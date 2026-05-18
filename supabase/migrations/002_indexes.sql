-- ============================================================
-- AtomQuest 1.0 — Migration 002: Indexes
-- ============================================================
-- Optimized indexes for common query patterns.
-- All indexes use IF NOT EXISTS for idempotent reruns.
-- ============================================================

BEGIN;

-- ── users ──────────────────────────────────────────────────
-- Login lookup
CREATE INDEX IF NOT EXISTS idx_users_email
  ON public.users (email);

-- Manager team query: "get all reports for this manager"
CREATE INDEX IF NOT EXISTS idx_users_manager_id
  ON public.users (manager_id)
  WHERE manager_id IS NOT NULL;

-- Active users filter (admin panel)
CREATE INDEX IF NOT EXISTS idx_users_is_active
  ON public.users (is_active)
  WHERE is_active = true;

-- Role-based filtering
CREATE INDEX IF NOT EXISTS idx_users_role
  ON public.users (role);

-- ── cycles ─────────────────────────────────────────────────
-- Fast lookup of the active cycle
CREATE UNIQUE INDEX IF NOT EXISTS idx_cycles_active
  ON public.cycles (is_active)
  WHERE is_active = true;
  -- UNIQUE partial index ensures only ONE active cycle

-- ── goal_sheets ────────────────────────────────────────────
-- Employee's sheets (most common query)
CREATE INDEX IF NOT EXISTS idx_goal_sheets_employee_id
  ON public.goal_sheets (employee_id);

-- Cycle-scoped queries
CREATE INDEX IF NOT EXISTS idx_goal_sheets_cycle_id
  ON public.goal_sheets (cycle_id);

-- Manager approval queue: submitted, unlocked sheets
CREATE INDEX IF NOT EXISTS idx_goal_sheets_pending_approval
  ON public.goal_sheets (status, is_locked)
  WHERE status = 'submitted' AND is_locked = false;

-- Composite: employee + cycle + status (covers goal-sheet page query)
CREATE INDEX IF NOT EXISTS idx_goal_sheets_emp_cycle_status
  ON public.goal_sheets (employee_id, cycle_id, status);

-- ── goals ──────────────────────────────────────────────────
-- All goals for a goal_sheet (most common join)
CREATE INDEX IF NOT EXISTS idx_goals_goal_sheet_id
  ON public.goals (goal_sheet_id);

-- Shared goal lookup
CREATE INDEX IF NOT EXISTS idx_goals_shared
  ON public.goals (is_shared)
  WHERE is_shared = true;

-- Sort order (for ordered display)
CREATE INDEX IF NOT EXISTS idx_goals_sort_order
  ON public.goals (goal_sheet_id, sort_order);

-- ── checkins ───────────────────────────────────────────────
-- All checkins for a goal (progress display)
CREATE INDEX IF NOT EXISTS idx_checkins_goal_id
  ON public.checkins (goal_id);

-- Employee's checkins across all goals
CREATE INDEX IF NOT EXISTS idx_checkins_employee_id
  ON public.checkins (employee_id);

-- Quarter-scoped queries (check-in window)
CREATE INDEX IF NOT EXISTS idx_checkins_quarter
  ON public.checkins (quarter);

-- Composite: employee + quarter (check-in page query)
CREATE INDEX IF NOT EXISTS idx_checkins_employee_quarter
  ON public.checkins (employee_id, quarter);

-- Manager viewing team checkins
CREATE INDEX IF NOT EXISTS idx_checkins_manager_id
  ON public.checkins (manager_id)
  WHERE manager_id IS NOT NULL;

-- ── shared_goal_links ──────────────────────────────────────
-- Source goal → find all targets (sync trigger)
CREATE INDEX IF NOT EXISTS idx_sgl_source_goal
  ON public.shared_goal_links (source_goal_id);

-- Target goal → find source (reverse lookup)
CREATE INDEX IF NOT EXISTS idx_sgl_target_goal
  ON public.shared_goal_links (target_goal_id);

-- ── audit_log ──────────────────────────────────────────────
-- Goal sheet audit history
CREATE INDEX IF NOT EXISTS idx_audit_log_goal_sheet_id
  ON public.audit_log (goal_sheet_id);

-- Actor history (who did what)
CREATE INDEX IF NOT EXISTS idx_audit_log_actor_id
  ON public.audit_log (actor_id);

-- Chronological queries (most recent first)
CREATE INDEX IF NOT EXISTS idx_audit_log_changed_at
  ON public.audit_log (changed_at DESC);

-- Action type filtering (admin panel)
CREATE INDEX IF NOT EXISTS idx_audit_log_action
  ON public.audit_log (action);

-- ── notifications ──────────────────────────────────────────
-- User's unread notifications (bell badge)
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON public.notifications (user_id, is_read)
  WHERE is_read = false;

-- Chronological listing
CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON public.notifications (user_id, created_at DESC);

COMMIT;

-- ============================================================
-- ROLLBACK (drop all custom indexes)
-- ============================================================
-- BEGIN;
-- DROP INDEX IF EXISTS idx_users_email;
-- DROP INDEX IF EXISTS idx_users_manager_id;
-- DROP INDEX IF EXISTS idx_users_is_active;
-- DROP INDEX IF EXISTS idx_users_role;
-- DROP INDEX IF EXISTS idx_cycles_active;
-- DROP INDEX IF EXISTS idx_goal_sheets_employee_id;
-- DROP INDEX IF EXISTS idx_goal_sheets_cycle_id;
-- DROP INDEX IF EXISTS idx_goal_sheets_pending_approval;
-- DROP INDEX IF EXISTS idx_goal_sheets_emp_cycle_status;
-- DROP INDEX IF EXISTS idx_goals_goal_sheet_id;
-- DROP INDEX IF EXISTS idx_goals_shared;
-- DROP INDEX IF EXISTS idx_goals_sort_order;
-- DROP INDEX IF EXISTS idx_checkins_goal_id;
-- DROP INDEX IF EXISTS idx_checkins_employee_id;
-- DROP INDEX IF EXISTS idx_checkins_quarter;
-- DROP INDEX IF EXISTS idx_checkins_employee_quarter;
-- DROP INDEX IF EXISTS idx_checkins_manager_id;
-- DROP INDEX IF EXISTS idx_sgl_source_goal;
-- DROP INDEX IF EXISTS idx_sgl_target_goal;
-- DROP INDEX IF EXISTS idx_audit_log_goal_sheet_id;
-- DROP INDEX IF EXISTS idx_audit_log_actor_id;
-- DROP INDEX IF EXISTS idx_audit_log_changed_at;
-- DROP INDEX IF EXISTS idx_audit_log_action;
-- DROP INDEX IF EXISTS idx_notifications_user_unread;
-- DROP INDEX IF EXISTS idx_notifications_user_created;
-- COMMIT;
