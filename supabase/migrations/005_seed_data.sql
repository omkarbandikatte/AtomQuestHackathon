-- ============================================================
-- AtomQuest 1.0 — Migration 005: Seed Data (Dev/Test Only)
-- ============================================================
-- DO NOT run in production!
-- Creates realistic test data for development and demo purposes.
--
-- Users: 1 Admin, 2 Managers, 6 Employees
-- Cycle: FY2024-25 (Indian Financial Year: Apr 2024 – Mar 2025)
-- Goal Sheets: 6 (one per employee, various statuses)
-- Goals: ~30 goals across all sheets
-- Checkins: ~20 quarterly entries
-- ============================================================

BEGIN;

-- ── Test Users ─────────────────────────────────────────────
-- Using fixed UUIDs for predictable references in tests.

-- Admin
INSERT INTO public.users (id, email, full_name, role, manager_id, department, is_active) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'admin@atomquest.dev', 'Priya Sharma', 'admin', NULL, 'People & Culture', true);

-- Managers
INSERT INTO public.users (id, email, full_name, role, manager_id, department, is_active) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'ravi.kumar@atomquest.dev', 'Ravi Kumar', 'manager', NULL, 'Engineering', true),
  ('b0000000-0000-0000-0000-000000000002', 'anita.desai@atomquest.dev', 'Anita Desai', 'manager', NULL, 'Product', true);

-- Employees under Ravi Kumar (Engineering)
INSERT INTO public.users (id, email, full_name, role, manager_id, department, is_active) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'arjun.mehta@atomquest.dev', 'Arjun Mehta', 'employee', 'b0000000-0000-0000-0000-000000000001', 'Engineering', true),
  ('c0000000-0000-0000-0000-000000000002', 'neha.gupta@atomquest.dev', 'Neha Gupta', 'employee', 'b0000000-0000-0000-0000-000000000001', 'Engineering', true),
  ('c0000000-0000-0000-0000-000000000003', 'vikram.singh@atomquest.dev', 'Vikram Singh', 'employee', 'b0000000-0000-0000-0000-000000000001', 'Engineering', true);

-- Employees under Anita Desai (Product)
INSERT INTO public.users (id, email, full_name, role, manager_id, department, is_active) VALUES
  ('c0000000-0000-0000-0000-000000000004', 'kavita.rao@atomquest.dev', 'Kavita Rao', 'employee', 'b0000000-0000-0000-0000-000000000002', 'Product', true),
  ('c0000000-0000-0000-0000-000000000005', 'suresh.patel@atomquest.dev', 'Suresh Patel', 'employee', 'b0000000-0000-0000-0000-000000000002', 'Product', true),
  ('c0000000-0000-0000-0000-000000000006', 'meera.joshi@atomquest.dev', 'Meera Joshi', 'employee', 'b0000000-0000-0000-0000-000000000002', 'Product', true);

-- ── Performance Cycle ──────────────────────────────────────
INSERT INTO public.cycles (id, name, goal_setting_opens, q1_opens, q2_opens, q3_opens, q4_opens, cycle_closes, is_active) VALUES
  ('d0000000-0000-0000-0000-000000000001', 'FY2024-25', '2024-04-01', '2024-07-01', '2024-10-01', '2025-01-01', '2025-04-01', '2025-04-30', true);

-- ── Goal Sheets (various statuses for testing) ─────────────
-- NOTE: Locked sheets are inserted as is_locked=false so that goals/checkins
-- can be seeded without triggering prevent_locked_sheet_mutation.
-- They are relocked at the end of this migration.

-- Arjun: approved (locked at end of migration)
INSERT INTO public.goal_sheets (id, employee_id, cycle_id, status, is_locked, approved_by, approved_at, submitted_at) VALUES
  ('e0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'approved', false, 'b0000000-0000-0000-0000-000000000001', '2024-04-20 10:00:00+05:30', '2024-04-15 09:00:00+05:30');

-- Neha: submitted (pending approval)
INSERT INTO public.goal_sheets (id, employee_id, cycle_id, status, is_locked, submitted_at) VALUES
  ('e0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001', 'submitted', false, '2024-04-18 14:30:00+05:30');

-- Vikram: draft (still editing)
INSERT INTO public.goal_sheets (id, employee_id, cycle_id, status, is_locked) VALUES
  ('e0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000001', 'draft', false);

-- Kavita: approved (locked at end of migration)
INSERT INTO public.goal_sheets (id, employee_id, cycle_id, status, is_locked, approved_by, approved_at, submitted_at) VALUES
  ('e0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000001', 'approved', false, 'b0000000-0000-0000-0000-000000000002', '2024-04-22 11:00:00+05:30', '2024-04-16 10:00:00+05:30');

-- Suresh: returned for rework
INSERT INTO public.goal_sheets (id, employee_id, cycle_id, status, is_locked, submitted_at, return_comment) VALUES
  ('e0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000001', 'returned', false, '2024-04-17 08:00:00+05:30', 'Please add measurable targets for Goal 3 and increase specificity on Goal 1.');

-- Meera: draft
INSERT INTO public.goal_sheets (id, employee_id, cycle_id, status, is_locked) VALUES
  ('e0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000001', 'draft', false);

-- ── Goals for Arjun (approved sheet, 5 goals, weightage=100) ──

INSERT INTO public.goals (id, goal_sheet_id, thrust_area, title, description, uom_type, target_value, target_date, weightage, sort_order) VALUES
  ('f0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'Delivery', 'Complete API v2 Migration', 'Migrate all REST endpoints to v2 spec with backward compatibility', 'numeric_min', 100, NULL, 30, 1),
  ('f0000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000001', 'Quality', 'Reduce Critical Bugs', 'Reduce production critical bugs from current baseline of 12', 'numeric_max', 3, NULL, 20, 2),
  ('f0000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000001', 'Innovation', 'Launch Observability Dashboard', 'Design and deploy real-time service health dashboard', 'timeline', NULL, '2024-09-30', 20, 3),
  ('f0000000-0000-0000-0000-000000000004', 'e0000000-0000-0000-0000-000000000001', 'Quality', 'Zero Security Vulnerabilities', 'Maintain zero critical/high CVEs in production dependencies', 'zero', NULL, NULL, 15, 4),
  ('f0000000-0000-0000-0000-000000000005', 'e0000000-0000-0000-0000-000000000001', 'People', 'Mentor 2 Junior Engineers', 'Provide weekly 1:1 mentoring sessions to 2 junior team members', 'numeric_min', 2, NULL, 15, 5);

-- ── Goals for Neha (submitted, 4 goals, weightage=100) ────

INSERT INTO public.goals (id, goal_sheet_id, thrust_area, title, description, uom_type, target_value, target_date, weightage, sort_order) VALUES
  ('f0000000-0000-0000-0000-000000000006', 'e0000000-0000-0000-0000-000000000002', 'Delivery', 'Ship Mobile App v1.0', 'Complete React Native mobile app with core features', 'timeline', NULL, '2024-12-15', 35, 1),
  ('f0000000-0000-0000-0000-000000000007', 'e0000000-0000-0000-0000-000000000002', 'Quality', 'Unit Test Coverage > 80%', 'Increase test coverage from 62% to above 80%', 'numeric_min', 80, NULL, 25, 2),
  ('f0000000-0000-0000-0000-000000000008', 'e0000000-0000-0000-0000-000000000002', 'Innovation', 'Implement CI/CD Pipeline', 'Set up automated deployment pipeline with staging environment', 'timeline', NULL, '2024-08-31', 20, 3),
  ('f0000000-0000-0000-0000-000000000009', 'e0000000-0000-0000-0000-000000000002', 'People', 'Conduct 4 Tech Talks', 'Present knowledge-sharing sessions to engineering team', 'numeric_min', 4, NULL, 20, 4);

-- ── Goals for Kavita (approved, 4 goals, weightage=100) ───

INSERT INTO public.goals (id, goal_sheet_id, thrust_area, title, description, uom_type, target_value, target_date, weightage, sort_order) VALUES
  ('f0000000-0000-0000-0000-000000000010', 'e0000000-0000-0000-0000-000000000004', 'Delivery', 'Launch Feature Discovery Module', 'Design and ship user research insights dashboard', 'timeline', NULL, '2024-11-30', 30, 1),
  ('f0000000-0000-0000-0000-000000000011', 'e0000000-0000-0000-0000-000000000004', 'Quality', 'NPS Score Improvement', 'Improve product NPS from 42 to 55+', 'numeric_min', 55, NULL, 25, 2),
  ('f0000000-0000-0000-0000-000000000012', 'e0000000-0000-0000-0000-000000000004', 'Innovation', 'Validate 3 New Feature Hypotheses', 'Run A/B tests on 3 product hypotheses with statistical significance', 'numeric_min', 3, NULL, 25, 3),
  ('f0000000-0000-0000-0000-000000000013', 'e0000000-0000-0000-0000-000000000004', 'People', 'Zero Missed Sprint Commitments', 'Ensure 100% delivery of sprint-committed stories', 'zero', NULL, NULL, 20, 4);

-- ── Goals for Vikram (draft, 3 goals, weightage=70 — incomplete) ──

INSERT INTO public.goals (id, goal_sheet_id, thrust_area, title, description, uom_type, target_value, target_date, weightage, sort_order) VALUES
  ('f0000000-0000-0000-0000-000000000014', 'e0000000-0000-0000-0000-000000000003', 'Delivery', 'Database Performance Optimization', 'Reduce p95 query latency from 800ms to under 200ms', 'numeric_max', 200, NULL, 30, 1),
  ('f0000000-0000-0000-0000-000000000015', 'e0000000-0000-0000-0000-000000000003', 'Quality', 'Implement Data Backup Automation', 'Set up automated daily backups with point-in-time recovery', 'timeline', NULL, '2024-08-15', 20, 2),
  ('f0000000-0000-0000-0000-000000000016', 'e0000000-0000-0000-0000-000000000003', 'Innovation', 'Evaluate and Adopt Vector DB', 'Research, POC, and deploy vector database for semantic search', 'timeline', NULL, '2024-10-31', 20, 3);

-- ── Checkins for Arjun (Q1 complete, Q2 partial) ──────────

INSERT INTO public.checkins (id, goal_id, quarter, actual_value, completion_date, status, employee_id) VALUES
  -- Q1 checkins
  ('10000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 'Q1', 35, NULL, 'on_track', 'c0000000-0000-0000-0000-000000000001'),
  ('10000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000002', 'Q1', 5, NULL, 'on_track', 'c0000000-0000-0000-0000-000000000001'),
  ('10000000-0000-0000-0000-000000000003', 'f0000000-0000-0000-0000-000000000003', 'Q1', NULL, NULL, 'on_track', 'c0000000-0000-0000-0000-000000000001'),
  ('10000000-0000-0000-0000-000000000004', 'f0000000-0000-0000-0000-000000000004', 'Q1', 0, NULL, 'on_track', 'c0000000-0000-0000-0000-000000000001'),
  ('10000000-0000-0000-0000-000000000005', 'f0000000-0000-0000-0000-000000000005', 'Q1', 1, NULL, 'on_track', 'c0000000-0000-0000-0000-000000000001'),
  -- Q2 checkins (partial)
  ('10000000-0000-0000-0000-000000000006', 'f0000000-0000-0000-0000-000000000001', 'Q2', 72, NULL, 'on_track', 'c0000000-0000-0000-0000-000000000001'),
  ('10000000-0000-0000-0000-000000000007', 'f0000000-0000-0000-0000-000000000002', 'Q2', 4, NULL, 'on_track', 'c0000000-0000-0000-0000-000000000001');

-- ── Checkins for Kavita (Q1 complete) ─────────────────────

INSERT INTO public.checkins (id, goal_id, quarter, actual_value, completion_date, status, employee_id) VALUES
  ('10000000-0000-0000-0000-000000000008', 'f0000000-0000-0000-0000-000000000010', 'Q1', NULL, NULL, 'on_track', 'c0000000-0000-0000-0000-000000000004'),
  ('10000000-0000-0000-0000-000000000009', 'f0000000-0000-0000-0000-000000000011', 'Q1', 47, NULL, 'on_track', 'c0000000-0000-0000-0000-000000000004'),
  ('10000000-0000-0000-0000-000000000010', 'f0000000-0000-0000-0000-000000000012', 'Q1', 1, NULL, 'on_track', 'c0000000-0000-0000-0000-000000000004'),
  ('10000000-0000-0000-0000-000000000011', 'f0000000-0000-0000-0000-000000000013', 'Q1', 0, NULL, 'on_track', 'c0000000-0000-0000-0000-000000000004');

-- ── Manager Comments (Ravi on Arjun's Q1) ─────────────────

UPDATE public.checkins
  SET manager_comment = 'Great progress on the API migration. Keep the momentum going into Q2.',
      manager_id = 'b0000000-0000-0000-0000-000000000001'
WHERE id = '10000000-0000-0000-0000-000000000001';

UPDATE public.checkins
  SET manager_comment = 'Bug count still higher than target. Focus on root-cause analysis.',
      manager_id = 'b0000000-0000-0000-0000-000000000001'
WHERE id = '10000000-0000-0000-0000-000000000002';

-- ── Shared Goal Link (Arjun's API goal shared with Neha) ──

INSERT INTO public.shared_goal_links (id, source_goal_id, target_goal_id, is_primary_owner, created_by) VALUES
  ('20000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000006', true, 'b0000000-0000-0000-0000-000000000001');

-- ── Audit Log entries ──────────────────────────────────────

INSERT INTO public.audit_log (goal_sheet_id, actor_id, action, changed_at) VALUES
  ('e0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'APPROVE', '2024-04-20 10:00:00+05:30'),
  ('e0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000002', 'APPROVE', '2024-04-22 11:00:00+05:30'),
  ('e0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000002', 'RETURN_FOR_REWORK', '2024-04-19 16:00:00+05:30');

-- ── Notifications ──────────────────────────────────────────

INSERT INTO public.notifications (user_id, title, body, type, is_read, link) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'Goal Sheet Submitted', 'Neha Gupta has submitted their goal sheet for approval.', 'approval', false, '/approvals/e0000000-0000-0000-0000-000000000002'),
  ('c0000000-0000-0000-0000-000000000001', 'Goal Sheet Approved', 'Your goal sheet has been approved and locked.', 'info', true, '/goal-sheet'),
  ('c0000000-0000-0000-0000-000000000005', 'Goal Sheet Returned', 'Your goal sheet has been returned for rework. Please review the comments.', 'rejection', false, '/goal-sheet');

-- ── Lock approved sheets (done last so goals/checkins can be inserted) ────

UPDATE public.goal_sheets
   SET is_locked = true
 WHERE id IN (
   'e0000000-0000-0000-0000-000000000001',  -- Arjun
   'e0000000-0000-0000-0000-000000000004'   -- Kavita
 );

COMMIT;

-- ============================================================
-- ROLLBACK: Remove all seed data
-- ============================================================
-- BEGIN;
-- DELETE FROM public.notifications;
-- DELETE FROM public.audit_log;
-- DELETE FROM public.shared_goal_links;
-- DELETE FROM public.checkins;
-- DELETE FROM public.goals;
-- DELETE FROM public.goal_sheets;
-- DELETE FROM public.cycles;
-- DELETE FROM public.users;
-- COMMIT;
