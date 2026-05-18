import type { Database } from "./database.types";

// ── Table Row Aliases ──────────────────────────────────────
export type User = Database["public"]["Tables"]["users"]["Row"];
export type Cycle = Database["public"]["Tables"]["cycles"]["Row"];
export type GoalSheet = Database["public"]["Tables"]["goal_sheets"]["Row"];
export type Goal = Database["public"]["Tables"]["goals"]["Row"];
export type Checkin = Database["public"]["Tables"]["checkins"]["Row"];
export type SharedGoalLink = Database["public"]["Tables"]["shared_goal_links"]["Row"];
export type AuditLogEntry = Database["public"]["Tables"]["audit_log"]["Row"];

// ── Insert Aliases ─────────────────────────────────────────
export type GoalInsert = Database["public"]["Tables"]["goals"]["Insert"];
export type CheckinInsert = Database["public"]["Tables"]["checkins"]["Insert"];
export type GoalSheetInsert = Database["public"]["Tables"]["goal_sheets"]["Insert"];

// ── Composite / Joined Types ───────────────────────────────
export type GoalWithCheckins = Goal & {
  checkins: Checkin[];
};

export type GoalSheetWithGoals = GoalSheet & {
  goals: GoalWithCheckins[];
  employee: Pick<User, "id" | "full_name" | "email" | "department">;
};

export type TeamMemberSummary = {
  employee: Pick<User, "id" | "full_name" | "email" | "department">;
  goalSheet: Pick<GoalSheet, "id" | "status" | "is_locked" | "submitted_at" | "approved_at"> | null;
  goalCount: number;
  checkinCompletion: Record<string, boolean>;
};

// ── Window / Phase Types ───────────────────────────────────
export type WindowPhase = "goal_setting" | "Q1" | "Q2" | "Q3" | "Q4" | null;

export type WindowStatus = {
  phase: WindowPhase;
  closesAt: string | null;
  opensAt: string | null;
};

// ── Server Action Response ─────────────────────────────────
export type ActionResponse<T = null> = {
  data: T | null;
  error: string | null;
};

// ── Session / Auth ─────────────────────────────────────────
export type SessionUser = {
  id: string;
  email: string;
  full_name: string;
  role: User["role"];
  manager_id: string | null;
  department: string | null;
};
