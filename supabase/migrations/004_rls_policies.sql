-- ============================================================
-- AtomQuest 1.0 — Migration 004: Row Level Security Policies
-- ============================================================
-- RLS is the PRIMARY authorization layer.
-- Every table has RLS enabled. Policies are role-aware.
-- Admin uses service_role key for bypass when needed.
-- ============================================================

BEGIN;

-- ── Enable RLS on all tables ───────────────────────────────
ALTER TABLE public.users             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cycles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_sheets       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkins          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_goal_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications     ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- USERS TABLE POLICIES
-- ============================================================

-- SELECT: Users see their own record
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- SELECT: Managers/Admins see all users (for team views, user management)
CREATE POLICY "users_select_managers_admins" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role IN ('manager', 'admin')
    )
  );

-- UPDATE: Users can update their own non-sensitive fields (handled by app)
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- INSERT/UPDATE: Admins can manage users
CREATE POLICY "users_admin_insert" ON public.users
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "users_admin_update" ON public.users
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- CYCLES TABLE POLICIES
-- ============================================================

-- SELECT: Everyone can read cycles (needed for window status checks)
CREATE POLICY "cycles_select_all" ON public.cycles
  FOR SELECT USING (true);

-- INSERT/UPDATE: Only admins can manage cycles
CREATE POLICY "cycles_admin_insert" ON public.cycles
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "cycles_admin_update" ON public.cycles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- GOAL_SHEETS TABLE POLICIES
-- ============================================================

-- SELECT: Employees see own sheets
CREATE POLICY "goal_sheets_select_own" ON public.goal_sheets
  FOR SELECT USING (employee_id = auth.uid());

-- SELECT: Managers see their direct reports' sheets
CREATE POLICY "goal_sheets_select_team" ON public.goal_sheets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = goal_sheets.employee_id
        AND u.manager_id = auth.uid()
    )
  );

-- SELECT: Admins see all sheets
CREATE POLICY "goal_sheets_select_admin" ON public.goal_sheets
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- INSERT: Employees create their own sheets
CREATE POLICY "goal_sheets_insert_own" ON public.goal_sheets
  FOR INSERT WITH CHECK (employee_id = auth.uid());

-- UPDATE: Employees update own (when unlocked); Managers for approval flow
CREATE POLICY "goal_sheets_update_own" ON public.goal_sheets
  FOR UPDATE USING (employee_id = auth.uid())
  WITH CHECK (employee_id = auth.uid());

CREATE POLICY "goal_sheets_update_manager" ON public.goal_sheets
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = goal_sheets.employee_id
        AND u.manager_id = auth.uid()
    )
  );

CREATE POLICY "goal_sheets_update_admin" ON public.goal_sheets
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- GOALS TABLE POLICIES
-- ============================================================

-- SELECT: Employees see goals in their own sheets
CREATE POLICY "goals_select_own" ON public.goals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.goal_sheets gs
      WHERE gs.id = goals.goal_sheet_id AND gs.employee_id = auth.uid()
    )
  );

-- SELECT: Managers see goals of direct reports
CREATE POLICY "goals_select_team" ON public.goals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.goal_sheets gs
      JOIN public.users u ON u.id = gs.employee_id
      WHERE gs.id = goals.goal_sheet_id AND u.manager_id = auth.uid()
    )
  );

-- SELECT: Admins see all goals
CREATE POLICY "goals_select_admin" ON public.goals
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- INSERT: Employees add goals to their own unlocked sheets
CREATE POLICY "goals_insert_own" ON public.goals
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.goal_sheets gs
      WHERE gs.id = goals.goal_sheet_id
        AND gs.employee_id = auth.uid()
        AND gs.is_locked = false
    )
  );

-- UPDATE: Employees update goals in own unlocked sheets
CREATE POLICY "goals_update_own" ON public.goals
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.goal_sheets gs
      WHERE gs.id = goals.goal_sheet_id
        AND gs.employee_id = auth.uid()
        AND gs.is_locked = false
    )
  );

-- DELETE: Employees delete goals from own unlocked sheets
CREATE POLICY "goals_delete_own" ON public.goals
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.goal_sheets gs
      WHERE gs.id = goals.goal_sheet_id
        AND gs.employee_id = auth.uid()
        AND gs.is_locked = false
    )
  );

-- INSERT/UPDATE/DELETE: Admins can modify any goals (post-unlock)
CREATE POLICY "goals_admin_all" ON public.goals
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- CHECKINS TABLE POLICIES
-- ============================================================

-- SELECT: Employees see own checkins
CREATE POLICY "checkins_select_own" ON public.checkins
  FOR SELECT USING (employee_id = auth.uid());

-- SELECT: Managers see direct reports' checkins
CREATE POLICY "checkins_select_team" ON public.checkins
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = checkins.employee_id AND u.manager_id = auth.uid()
    )
  );

-- SELECT: Admins see all checkins
CREATE POLICY "checkins_select_admin" ON public.checkins
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- INSERT: Employees create own checkins
CREATE POLICY "checkins_insert_own" ON public.checkins
  FOR INSERT WITH CHECK (employee_id = auth.uid());

-- UPDATE: Employees update own checkins
CREATE POLICY "checkins_update_own" ON public.checkins
  FOR UPDATE USING (employee_id = auth.uid())
  WITH CHECK (employee_id = auth.uid());

-- UPDATE: Managers can add comments to direct reports' checkins
CREATE POLICY "checkins_update_manager" ON public.checkins
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = checkins.employee_id AND u.manager_id = auth.uid()
    )
  );

-- ============================================================
-- SHARED_GOAL_LINKS TABLE POLICIES
-- ============================================================

-- SELECT: Everyone can see links (needed for UI indicators)
CREATE POLICY "sgl_select_all" ON public.shared_goal_links
  FOR SELECT USING (true);

-- INSERT: Only managers/admins can push shared goals
CREATE POLICY "sgl_insert_managers_admins" ON public.shared_goal_links
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('manager', 'admin')
    )
  );

-- DELETE: Only the creator or admins can remove links
CREATE POLICY "sgl_delete_creator_admin" ON public.shared_goal_links
  FOR DELETE USING (
    created_by = auth.uid()
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- AUDIT_LOG TABLE POLICIES
-- Append-only: NO UPDATE/DELETE via RLS (reinforced by trigger)
-- ============================================================

-- SELECT: Admins only
CREATE POLICY "audit_log_select_admin" ON public.audit_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- SELECT: Managers can see audit for their direct reports' sheets
CREATE POLICY "audit_log_select_manager" ON public.audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.goal_sheets gs
      JOIN public.users u ON u.id = gs.employee_id
      WHERE gs.id = audit_log.goal_sheet_id AND u.manager_id = auth.uid()
    )
  );

-- INSERT: System/service role inserts (via triggers + RPCs with SECURITY DEFINER)
CREATE POLICY "audit_log_insert_system" ON public.audit_log
  FOR INSERT WITH CHECK (true);
  -- The audit_log INSERT is done by SECURITY DEFINER functions and triggers.
  -- Direct client INSERT is acceptable since it's append-only.

-- DENY UPDATE and DELETE via RLS
CREATE POLICY "audit_log_deny_update" ON public.audit_log
  FOR UPDATE USING (false);

CREATE POLICY "audit_log_deny_delete" ON public.audit_log
  FOR DELETE USING (false);

-- ============================================================
-- NOTIFICATIONS TABLE POLICIES
-- ============================================================

-- SELECT: Users see their own notifications
CREATE POLICY "notifications_select_own" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

-- UPDATE: Users can mark own notifications as read
CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- INSERT: System inserts (via triggers with SECURITY DEFINER)
CREATE POLICY "notifications_insert_system" ON public.notifications
  FOR INSERT WITH CHECK (true);

-- DELETE: Users can delete own notifications
CREATE POLICY "notifications_delete_own" ON public.notifications
  FOR DELETE USING (user_id = auth.uid());

COMMIT;

-- ============================================================
-- ROLLBACK: Drop all policies
-- ============================================================
-- BEGIN;
-- DROP POLICY IF EXISTS "users_select_own" ON public.users;
-- DROP POLICY IF EXISTS "users_select_managers_admins" ON public.users;
-- DROP POLICY IF EXISTS "users_update_own" ON public.users;
-- DROP POLICY IF EXISTS "users_admin_insert" ON public.users;
-- DROP POLICY IF EXISTS "users_admin_update" ON public.users;
-- DROP POLICY IF EXISTS "cycles_select_all" ON public.cycles;
-- DROP POLICY IF EXISTS "cycles_admin_insert" ON public.cycles;
-- DROP POLICY IF EXISTS "cycles_admin_update" ON public.cycles;
-- DROP POLICY IF EXISTS "goal_sheets_select_own" ON public.goal_sheets;
-- DROP POLICY IF EXISTS "goal_sheets_select_team" ON public.goal_sheets;
-- DROP POLICY IF EXISTS "goal_sheets_select_admin" ON public.goal_sheets;
-- DROP POLICY IF EXISTS "goal_sheets_insert_own" ON public.goal_sheets;
-- DROP POLICY IF EXISTS "goal_sheets_update_own" ON public.goal_sheets;
-- DROP POLICY IF EXISTS "goal_sheets_update_manager" ON public.goal_sheets;
-- DROP POLICY IF EXISTS "goal_sheets_update_admin" ON public.goal_sheets;
-- DROP POLICY IF EXISTS "goals_select_own" ON public.goals;
-- DROP POLICY IF EXISTS "goals_select_team" ON public.goals;
-- DROP POLICY IF EXISTS "goals_select_admin" ON public.goals;
-- DROP POLICY IF EXISTS "goals_insert_own" ON public.goals;
-- DROP POLICY IF EXISTS "goals_update_own" ON public.goals;
-- DROP POLICY IF EXISTS "goals_delete_own" ON public.goals;
-- DROP POLICY IF EXISTS "goals_admin_all" ON public.goals;
-- DROP POLICY IF EXISTS "checkins_select_own" ON public.checkins;
-- DROP POLICY IF EXISTS "checkins_select_team" ON public.checkins;
-- DROP POLICY IF EXISTS "checkins_select_admin" ON public.checkins;
-- DROP POLICY IF EXISTS "checkins_insert_own" ON public.checkins;
-- DROP POLICY IF EXISTS "checkins_update_own" ON public.checkins;
-- DROP POLICY IF EXISTS "checkins_update_manager" ON public.checkins;
-- DROP POLICY IF EXISTS "sgl_select_all" ON public.shared_goal_links;
-- DROP POLICY IF EXISTS "sgl_insert_managers_admins" ON public.shared_goal_links;
-- DROP POLICY IF EXISTS "sgl_delete_creator_admin" ON public.shared_goal_links;
-- DROP POLICY IF EXISTS "audit_log_select_admin" ON public.audit_log;
-- DROP POLICY IF EXISTS "audit_log_select_manager" ON public.audit_log;
-- DROP POLICY IF EXISTS "audit_log_insert_system" ON public.audit_log;
-- DROP POLICY IF EXISTS "audit_log_deny_update" ON public.audit_log;
-- DROP POLICY IF EXISTS "audit_log_deny_delete" ON public.audit_log;
-- DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
-- DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
-- DROP POLICY IF EXISTS "notifications_insert_system" ON public.notifications;
-- DROP POLICY IF EXISTS "notifications_delete_own" ON public.notifications;
-- COMMIT;
