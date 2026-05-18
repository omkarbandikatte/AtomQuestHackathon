-- Fix: log_goal_change and log_checkin_change triggers fail with NULL actor_id
-- Root cause: current_setting('app.current_user_id', true) returns NULL (not exception)
-- so the fallback to auth.uid() never executes.

CREATE OR REPLACE FUNCTION log_goal_change()
RETURNS TRIGGER AS $$
DECLARE
  v_actor_id     uuid;
  v_sheet_locked boolean;
BEGIN
  SELECT is_locked INTO v_sheet_locked
    FROM public.goal_sheets
   WHERE id = NEW.goal_sheet_id;

  IF NOT v_sheet_locked THEN
    RETURN NEW;
  END IF;

  BEGIN
    v_actor_id := current_setting('app.current_user_id', true)::uuid;
  EXCEPTION WHEN OTHERS THEN
    v_actor_id := NULL;
  END;
  IF v_actor_id IS NULL THEN
    v_actor_id := auth.uid();
  END IF;

  -- Skip audit if no actor can be determined (e.g. system trigger cascade)
  IF v_actor_id IS NULL THEN
    RETURN NEW;
  END IF;

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

CREATE OR REPLACE FUNCTION log_checkin_change()
RETURNS TRIGGER AS $$
DECLARE
  v_actor_id       uuid;
  v_goal_sheet_id  uuid;
  v_sheet_locked   boolean;
BEGIN
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
    v_actor_id := NULL;
  END;
  IF v_actor_id IS NULL THEN
    v_actor_id := auth.uid();
  END IF;

  -- Skip audit if no actor can be determined
  IF v_actor_id IS NULL THEN
    RETURN NEW;
  END IF;

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
