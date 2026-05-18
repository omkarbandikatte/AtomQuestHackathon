/**
 * Goal sheet validation rules — single source of truth.
 * Enforced at frontend (Zod) AND backend (Server Action + Postgres).
 */
export const GOAL_SHEET_RULES = {
  MAX_GOALS: 8,
  MIN_WEIGHTAGE_PER_GOAL: 10,
  TOTAL_WEIGHTAGE: 100,
  UOM_TYPES: ["numeric_min", "numeric_max", "timeline", "zero"] as const,
  GOAL_TITLE_MIN: 3,
  GOAL_TITLE_MAX: 200,
  GOAL_DESCRIPTION_MAX: 500,
  UNLOCK_REASON_MIN: 20,
} as const;

export type UomType = (typeof GOAL_SHEET_RULES.UOM_TYPES)[number];

export const UOM_LABELS: Record<UomType, string> = {
  numeric_min: "Numeric (Min Target)",
  numeric_max: "Numeric (Max Target)",
  timeline: "Timeline",
  zero: "Zero-Based",
};

export const GOAL_STATUS_OPTIONS = [
  "not_started",
  "on_track",
  "completed",
] as const;

export type GoalStatus = (typeof GOAL_STATUS_OPTIONS)[number];

export const GOAL_STATUS_LABELS: Record<GoalStatus, string> = {
  not_started: "Not Started",
  on_track: "On Track",
  completed: "Completed",
};

export const SHEET_STATUS_OPTIONS = [
  "draft",
  "submitted",
  "approved",
  "returned",
] as const;

export type SheetStatus = (typeof SHEET_STATUS_OPTIONS)[number];
