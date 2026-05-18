-- ============================================================
-- AtomQuest 1.0 — Migration 003: Functions & Triggers
-- ============================================================
-- All business logic lives in the database via triggers.
-- Application code NEVER computes progress_score or syncs shared goals.
-- ============================================================

BEGIN;

-- ============================================================
-- FUNCTION: compute_progress_score
-- Pure function — computes a progress percentage (0–200) based
-- on UOM type and actual vs target values.
--
-- Formula (from blueprint Doc 03):
--   numeric_min = min((actual/target)*100, 200)
--   numeric_max = min((target/actual)*100, 200)
--   timeline    = 100 if on_time else 0
--   zero        = 100 if actual=0 else 0
-- ============================================================
CREATE OR REPLACE FUNCTION compute_progress_score(
  p_uom_type        text,
  p_target          numeric,
  p_actual          numeric,
  p_target_date     date,
  p_completion_date date
) RETURNS numeric AS $$
BEGIN
  CASE p_uom_type
    WHEN 'numeric_min' THEN
      -- Higher actual is better (e.g., revenue)
      IF p_target IS NULL OR p_target = 0 THEN RETURN NULL; END IF;
      RETURN LEAST(ROUND((p_actual / p_target) * 100, 2), 200);

    WHEN 'numeric_max' THEN
      -- Lower actual is better (e.g., defects)
      IF p_actual IS NULL OR p_actual = 0 THEN RETURN 200; END IF;
      RETURN LEAST(ROUND((p_target / p_actual) * 100, 2), 200);

    WHEN 'timeline' THEN
      -- Binary: on time = 100, late = 0
      IF p_completion_date IS NULL OR p_target_date IS NULL THEN RETURN NULL; END IF;
      RETURN CASE WHEN p_completion_date <= p_target_date THEN 100 ELSE 0 END;

    WHEN 'zero' THEN
      -- Binary: zero defects = 100, any defects = 0
      IF p_actual IS NULL THEN RETURN NULL; END IF;
      RETURN CASE WHEN p_actual = 0 THEN 100 ELSE 0 END;

    ELSE
      RETURN NULL;
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION compute_progress_score IS 'Computes 0–200 progress score based on UOM type. IMMUTABLE — safe for index use.';

-- ============================================================
-- TRIGGER FUNCTION: auto_compute_progress_score
-- Automatically sets progress_score on checkin INSERT/UPDATE.
-- ============================================================
CREATE OR REPLACE FUNCTION auto_compute_progress_score()
RETURNS TRIGGER AS $$
DECLARE
  v_uom_type      text;
  v_target_value  numeric;
  v_target_date   date;
BEGIN
  SELECT g.uom_type, g.target_value, g.target_date
    INTO v_uom_type, v_target_value, v_target_date
    FROM public.goals g
   WHERE g.id = NEW.goal_id;

  NEW.progress_score := compute_progress_score(
    v_uom_type,
    v_target_value,
    NEW.actual_value,
    v_target_date,
    NEW.completion_date
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION auto_compute_progress_score IS 'Trigger function: auto-computes progress_score before checkin write.';

DROP TRIGGER IF EXISTS trg_auto_progress_score ON public.checkins;
CREATE TRIGGER trg_auto_progress_score
  BEFORE INSERT OR UPDATE ON public.checkins
  FOR EACH ROW EXECUTE FUNCTION auto_compute_progress_score();

-- ============================================================
-- TRIGGER FUNCTION: set_updated_at
-- Generic — sets updated_at = now() on any UPDATE.
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_goal_sheets_updated_at ON public.goal_sheets;
CREATE TRIGGER trg_goal_sheets_updated_at
  BEFORE UPDATE ON public.goal_sheets
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_checkins_updated_at ON public.checkins;
CREATE TRIGGER trg_checkins_updated_at
  BEFORE UPDATE ON public.checkins
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- TRIGGER FUNCTION: check_max_goals
-- Enforces maximum 8 goals per goal_sheet.
-- ============================================================
CREATE OR REPLACE FUNCTION check_max_goals()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.goals WHERE goal_sheet_id = NEW.goal_sheet_id) >= 8 THEN
    RAISE EXCEPTION 'MAX_GOALS_REACHED: A goal sheet may have at most 8 goals.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_max_goals ON public.goals;
CREATE TRIGGER trg_max_goals
  BEFORE INSERT ON public.goals
  FOR EACH ROW EXECUTE FUNCTION check_max_goals();

-- ============================================================
-- TRIGGER FUNCTION: enforce_single_active_cycle
-- Ensures only ONE cycle can have is_active = true.
-- ============================================================
CREATE OR REPLACE FUNCTION enforce_single_active_cycle()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_active = true THEN
    UPDATE public.cycles SET is_active = false WHERE id != NEW.id AND is_active = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_single_active_cycle ON public.cycles;
CREATE TRIGGER trg_single_active_cycle
  BEFORE INSERT OR UPDATE OF is_active ON public.cycles
  FOR EACH ROW
  WHEN (NEW.is_active = true)
  EXECUTE FUNCTION enforce_single_active_cycle();

-- ============================================================
-- TRIGGER FUNCTION: enforce_weightage_sum
-- Validates that total weightage across all goals in a sheet = 100
-- ONLY at submission time (checked via app, but belt-and-suspenders).
-- ============================================================
CREATE OR REPLACE FUNCTION check_weightage_on_submit()
RETURNS TRIGGER AS $$
DECLARE
  v_total numeric;
BEGIN
  IF NEW.status = 'submitted' AND OLD.status = 'draft' THEN
    SELECT COALESCE(SUM(weightage), 0) INTO v_total
      FROM public.goals
     WHERE goal_sheet_id = NEW.id;

    IF v_total != 100 THEN
      RAISE EXCEPTION 'WEIGHTAGE_SUM_NOT_100: Total weightage must be exactly 100, got %', v_total;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_weightage_on_submit ON public.goal_sheets;
CREATE TRIGGER trg_check_weightage_on_submit
  BEFORE UPDATE ON public.goal_sheets
  FOR EACH ROW EXECUTE FUNCTION check_weightage_on_submit();

-- ============================================================
-- TRIGGER FUNCTION: prevent_locked_sheet_mutation
-- Prevents any INSERT/UPDATE/DELETE on goals when sheet is locked.
-- Admin unlock is done by setting is_locked=false first.
-- ============================================================
CREATE OR REPLACE FUNCTION prevent_locked_sheet_mutation()
RETURNS TRIGGER AS $$
DECLARE
  v_locked boolean;
BEGIN
  -- For DELETE, use OLD; for INSERT/UPDATE, use NEW
  SELECT is_locked INTO v_locked
    FROM public.goal_sheets
   WHERE id = COALESCE(NEW.goal_sheet_id, OLD.goal_sheet_id);

  IF v_locked = true THEN
    RAISE EXCEPTION 'SHEET_LOCKED: Cannot modify goals on a locked sheet. Contact admin to unlock.';
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_locked_goals ON public.goals;
CREATE TRIGGER trg_prevent_locked_goals
  BEFORE INSERT OR UPDATE OR DELETE ON public.goals
  FOR EACH ROW EXECUTE FUNCTION prevent_locked_sheet_mutation();

-- ============================================================
-- TRIGGER FUNCTION: log_goal_change (Audit Log)
-- Records field-level changes to goals when sheet is LOCKED.
-- Uses app.current_user_id session variable for actor_id.
-- ============================================================
CREATE OR REPLACE FUNCTION log_goal_change()
RETURNS TRIGGER AS $$
DECLARE
  v_actor_id     uuid;
  v_sheet_locked boolean;
BEGIN
  -- Only log if the sheet is locked (post-lock mutations require audit)
  SELECT is_locked INTO v_sheet_locked
    FROM public.goal_sheets
   WHERE id = NEW.goal_sheet_id;

  IF NOT v_sheet_locked THEN
    RETURN NEW;
  END IF;

  -- Retrieve the actor from session variable
  BEGIN
    v_actor_id := current_setting('app.current_user_id', true)::uuid;
  EXCEPTION WHEN OTHERS THEN
    v_actor_id := auth.uid();
  END;

  -- Log each changed field
  INSERT INTO public.audit_log (goal_sheet_id, goal_id, actor_id, action, field_changed, old_value, new_value)
  SELECT
    NEW.goal_sheet_id,
    NEW.id,
    v_actor_id,
    'UPDATE',
    kv_old.key,
    kv_old.value,
    kv_new.value
  FROM jsonb_each_text(to_jsonb(OLD)) AS kv_old(key, value)
  JOIN jsonb_each_text(to_jsonb(NEW)) AS kv_new(key, value) USING (key)
  WHERE kv_old.value IS DISTINCT FROM kv_new.value
    AND kv_old.key NOT IN ('updated_at', 'created_at');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION log_goal_change IS 'Audit trigger: logs field-level diffs on goal mutations when sheet is locked.';

DROP TRIGGER IF EXISTS trg_audit_goals ON public.goals;
CREATE TRIGGER trg_audit_goals
  AFTER UPDATE ON public.goals
  FOR EACH ROW EXECUTE FUNCTION log_goal_change();

-- ============================================================
-- TRIGGER FUNCTION: log_checkin_change (Audit Log)
-- Records check-in mutations for locked sheets.
-- ============================================================
CREATE OR REPLACE FUNCTION log_checkin_change()
RETURNS TRIGGER AS $$
DECLARE
  v_actor_id       uuid;
  v_goal_sheet_id  uuid;
  v_sheet_locked   boolean;
BEGIN
  -- Resolve the goal_sheet_id via the goal
  SELECT g.goal_sheet_id INTO v_goal_sheet_id
    FROM public.goals g
   WHERE g.id = NEW.goal_id;

  SELECT is_locked INTO v_sheet_locked
    FROM public.goal_sheets
   WHERE id = v_goal_sheet_id;

  IF NOT v_sheet_locked THEN
    RETURN NEW;
  END IF;

  BEGIN
    v_actor_id := current_setting('app.current_user_id', true)::uuid;
  EXCEPTION WHEN OTHERS THEN
    v_actor_id := auth.uid();
  END;

  INSERT INTO public.audit_log (goal_sheet_id, goal_id, actor_id, action, field_changed, old_value, new_value)
  SELECT
    v_goal_sheet_id,
    NEW.goal_id,
    v_actor_id,
    'UPDATE',
    kv_old.key,
    kv_old.value,
    kv_new.value
  FROM jsonb_each_text(to_jsonb(OLD)) AS kv_old(key, value)
  JOIN jsonb_each_text(to_jsonb(NEW)) AS kv_new(key, value) USING (key)
  WHERE kv_old.value IS DISTINCT FROM kv_new.value
    AND kv_old.key NOT IN ('updated_at', 'logged_at', 'progress_score');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_checkins ON public.checkins;
CREATE TRIGGER trg_audit_checkins
  AFTER UPDATE ON public.checkins
  FOR EACH ROW EXECUTE FUNCTION log_checkin_change();

-- ============================================================
-- TRIGGER FUNCTION: sync_shared_goal_checkins
-- When a primary owner submits a check-in, propagate the
-- actual_value and completion_date to all linked target goals.
-- FIXED: resolves employee_id from goal_sheets (not goal_sheet_id).
-- ============================================================
CREATE OR REPLACE FUNCTION sync_shared_goal_checkins()
RETURNS TRIGGER AS $$
DECLARE
  v_link RECORD;
  v_target_employee_id uuid;
BEGIN
  FOR v_link IN
    SELECT target_goal_id
      FROM public.shared_goal_links
     WHERE source_goal_id = NEW.goal_id
  LOOP
    -- Resolve the actual employee_id for the target goal
    SELECT gs.employee_id INTO v_target_employee_id
      FROM public.goals g
      JOIN public.goal_sheets gs ON gs.id = g.goal_sheet_id
     WHERE g.id = v_link.target_goal_id;

    INSERT INTO public.checkins (
      goal_id, quarter, actual_value, completion_date,
      status, employee_id
    )
    VALUES (
      v_link.target_goal_id,
      NEW.quarter,
      NEW.actual_value,
      NEW.completion_date,
      NEW.status,
      v_target_employee_id
    )
    ON CONFLICT (goal_id, quarter) DO UPDATE
      SET actual_value     = EXCLUDED.actual_value,
          completion_date  = EXCLUDED.completion_date,
          status           = EXCLUDED.status,
          updated_at       = now();
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION sync_shared_goal_checkins IS 'Propagates check-in data from primary owner to all linked shared-goal recipients.';

DROP TRIGGER IF EXISTS trg_sync_shared_checkins ON public.checkins;
CREATE TRIGGER trg_sync_shared_checkins
  AFTER INSERT OR UPDATE ON public.checkins
  FOR EACH ROW EXECUTE FUNCTION sync_shared_goal_checkins();

-- ============================================================
-- TRIGGER FUNCTION: prevent_audit_log_mutation
-- Belt-and-suspenders: prevents UPDATE/DELETE on audit_log
-- even if RLS is bypassed (e.g., service role).
-- ============================================================
CREATE OR REPLACE FUNCTION prevent_audit_log_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'AUDIT_LOG_IMMUTABLE: The audit_log table is append-only. No UPDATE or DELETE permitted.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_audit_update ON public.audit_log;
CREATE TRIGGER trg_prevent_audit_update
  BEFORE UPDATE OR DELETE ON public.audit_log
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_mutation();

-- ============================================================
-- TRIGGER FUNCTION: notify_on_submission
-- Creates a notification for the manager when an employee
-- submits their goal sheet.
-- ============================================================
CREATE OR REPLACE FUNCTION notify_on_submission()
RETURNS TRIGGER AS $$
DECLARE
  v_manager_id uuid;
  v_emp_name   text;
BEGIN
  IF NEW.status = 'submitted' AND OLD.status = 'draft' THEN
    SELECT u.manager_id, u.full_name INTO v_manager_id, v_emp_name
      FROM public.users u
     WHERE u.id = NEW.employee_id;

    IF v_manager_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, title, body, type, link)
      VALUES (
        v_manager_id,
        'Goal Sheet Submitted',
        v_emp_name || ' has submitted their goal sheet for approval.',
        'approval',
        '/approvals/' || NEW.id::text
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_notify_on_submission ON public.goal_sheets;
CREATE TRIGGER trg_notify_on_submission
  AFTER UPDATE ON public.goal_sheets
  FOR EACH ROW EXECUTE FUNCTION notify_on_submission();

-- ============================================================
-- TRIGGER FUNCTION: notify_on_approval_or_return
-- Notifies employee when their sheet is approved or returned.
-- ============================================================
CREATE OR REPLACE FUNCTION notify_on_approval_or_return()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status = 'submitted' THEN
    INSERT INTO public.notifications (user_id, title, body, type, link)
    VALUES (
      NEW.employee_id,
      'Goal Sheet Approved',
      'Your goal sheet has been approved and locked.',
      'info',
      '/goal-sheet'
    );
  ELSIF NEW.status = 'returned' AND OLD.status = 'submitted' THEN
    INSERT INTO public.notifications (user_id, title, body, type, link)
    VALUES (
      NEW.employee_id,
      'Goal Sheet Returned',
      'Your goal sheet has been returned for rework. Please review the comments.',
      'rejection',
      '/goal-sheet'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_notify_approval_return ON public.goal_sheets;
CREATE TRIGGER trg_notify_approval_return
  AFTER UPDATE ON public.goal_sheets
  FOR EACH ROW EXECUTE FUNCTION notify_on_approval_or_return();

-- ============================================================
-- RPC: approve_goal_sheet
-- Atomic operation: validates, locks, and records approval.
-- ============================================================
CREATE OR REPLACE FUNCTION approve_goal_sheet(
  p_sheet_id   uuid,
  p_manager_id uuid
) RETURNS void AS $$
BEGIN
  UPDATE public.goal_sheets
     SET status      = 'approved',
         is_locked   = true,
         approved_by = p_manager_id,
         approved_at = now(),
         updated_at  = now()
   WHERE id = p_sheet_id
     AND status = 'submitted'
     AND is_locked = false;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'SHEET_NOT_FOUND_OR_NOT_SUBMITTED: Sheet must be in submitted state.';
  END IF;

  -- Log the approval in audit
  INSERT INTO public.audit_log (goal_sheet_id, actor_id, action)
  VALUES (p_sheet_id, p_manager_id, 'APPROVE');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION approve_goal_sheet IS 'Atomic RPC: approves + locks a submitted goal sheet.';

-- ============================================================
-- RPC: return_for_rework
-- Returns a submitted sheet to draft with a mandatory comment.
-- ============================================================
CREATE OR REPLACE FUNCTION return_for_rework(
  p_sheet_id   uuid,
  p_manager_id uuid,
  p_comment    text
) RETURNS void AS $$
BEGIN
  IF p_comment IS NULL OR char_length(TRIM(p_comment)) < 10 THEN
    RAISE EXCEPTION 'COMMENT_TOO_SHORT: Return comment must be at least 10 characters.';
  END IF;

  UPDATE public.goal_sheets
     SET status         = 'returned',
         return_comment = p_comment,
         updated_at     = now()
   WHERE id = p_sheet_id
     AND status = 'submitted';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'SHEET_NOT_FOUND_OR_NOT_SUBMITTED';
  END IF;

  INSERT INTO public.audit_log (goal_sheet_id, actor_id, action, new_value)
  VALUES (p_sheet_id, p_manager_id, 'RETURN_FOR_REWORK', p_comment);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- RPC: unlock_sheet (Admin only)
-- Unlocks an approved sheet. Requires a reason (min 20 chars).
-- ============================================================
CREATE OR REPLACE FUNCTION unlock_sheet(
  p_sheet_id  uuid,
  p_admin_id  uuid,
  p_reason    text
) RETURNS void AS $$
BEGIN
  IF p_reason IS NULL OR char_length(TRIM(p_reason)) < 20 THEN
    RAISE EXCEPTION 'REASON_TOO_SHORT: Unlock reason must be at least 20 characters.';
  END IF;

  UPDATE public.goal_sheets
     SET is_locked  = false,
         status     = 'draft',
         updated_at = now()
   WHERE id = p_sheet_id
     AND is_locked = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'SHEET_NOT_LOCKED_OR_NOT_FOUND';
  END IF;

  INSERT INTO public.audit_log (goal_sheet_id, actor_id, action, reason)
  VALUES (p_sheet_id, p_admin_id, 'UNLOCK', p_reason);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- RPC: relock_sheet (Admin only)
-- Re-locks a previously unlocked sheet.
-- ============================================================
CREATE OR REPLACE FUNCTION relock_sheet(
  p_sheet_id  uuid,
  p_admin_id  uuid
) RETURNS void AS $$
BEGIN
  UPDATE public.goal_sheets
     SET is_locked  = true,
         status     = 'approved',
         updated_at = now()
   WHERE id = p_sheet_id
     AND is_locked = false
     AND status = 'draft';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'SHEET_CANNOT_BE_RELOCKED';
  END IF;

  INSERT INTO public.audit_log (goal_sheet_id, actor_id, action)
  VALUES (p_sheet_id, p_admin_id, 'RELOCK');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;

-- ============================================================
-- ROLLBACK
-- ============================================================
-- BEGIN;
-- DROP FUNCTION IF EXISTS relock_sheet CASCADE;
-- DROP FUNCTION IF EXISTS unlock_sheet CASCADE;
-- DROP FUNCTION IF EXISTS return_for_rework CASCADE;
-- DROP FUNCTION IF EXISTS approve_goal_sheet CASCADE;
-- DROP FUNCTION IF EXISTS notify_on_approval_or_return CASCADE;
-- DROP FUNCTION IF EXISTS notify_on_submission CASCADE;
-- DROP FUNCTION IF EXISTS prevent_audit_log_mutation CASCADE;
-- DROP FUNCTION IF EXISTS sync_shared_goal_checkins CASCADE;
-- DROP FUNCTION IF EXISTS log_checkin_change CASCADE;
-- DROP FUNCTION IF EXISTS log_goal_change CASCADE;
-- DROP FUNCTION IF EXISTS prevent_locked_sheet_mutation CASCADE;
-- DROP FUNCTION IF EXISTS check_weightage_on_submit CASCADE;
-- DROP FUNCTION IF EXISTS enforce_single_active_cycle CASCADE;
-- DROP FUNCTION IF EXISTS check_max_goals CASCADE;
-- DROP FUNCTION IF EXISTS set_updated_at CASCADE;
-- DROP FUNCTION IF EXISTS auto_compute_progress_score CASCADE;
-- DROP FUNCTION IF EXISTS compute_progress_score CASCADE;
-- COMMIT;
