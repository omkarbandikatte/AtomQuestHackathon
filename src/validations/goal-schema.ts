import { z } from "zod";
import { GOAL_SHEET_RULES } from "@/lib/constants/goal-rules";

// ── Single Goal Schema ─────────────────────────────────────
export const goalSchema = z.object({
  title: z
    .string()
    .min(GOAL_SHEET_RULES.GOAL_TITLE_MIN, "Title must be at least 3 characters")
    .max(GOAL_SHEET_RULES.GOAL_TITLE_MAX, "Title must be at most 200 characters"),
  thrust_area: z.string().min(1, "Thrust area is required"),
  uom_type: z.enum(GOAL_SHEET_RULES.UOM_TYPES, {
    errorMap: () => ({ message: "Select a valid unit of measurement" }),
  }),
  target_value: z.number().positive("Target must be positive").nullable(),
  target_date: z.string().date("Invalid date format").nullable(),
  weightage: z
    .number()
    .min(GOAL_SHEET_RULES.MIN_WEIGHTAGE_PER_GOAL, `Minimum weightage per goal is ${GOAL_SHEET_RULES.MIN_WEIGHTAGE_PER_GOAL}%`)
    .max(100, "Weightage cannot exceed 100%"),
  description: z
    .string()
    .max(GOAL_SHEET_RULES.GOAL_DESCRIPTION_MAX, "Description must be at most 500 characters")
    .optional(),
});

export type GoalFormValues = z.infer<typeof goalSchema>;

// ── Goal Sheet (Array of Goals) Schema ─────────────────────
export const goalSheetSchema = z
  .array(goalSchema)
  .min(1, "At least one goal is required")
  .max(GOAL_SHEET_RULES.MAX_GOALS, `Maximum ${GOAL_SHEET_RULES.MAX_GOALS} goals per sheet`)
  .refine(
    (goals) => goals.reduce((sum, g) => sum + g.weightage, 0) === GOAL_SHEET_RULES.TOTAL_WEIGHTAGE,
    { message: "Total weightage must equal 100%" },
  )
  .refine(
    (goals) => goals.length <= GOAL_SHEET_RULES.MAX_GOALS,
    { message: `Maximum ${GOAL_SHEET_RULES.MAX_GOALS} goals per sheet` },
  );

export type GoalSheetFormValues = z.infer<typeof goalSheetSchema>;

// ── Goal Submission Schema (wraps sheet + metadata) ────────
export const goalSheetSubmissionSchema = z.object({
  cycle_id: z.string().uuid("Invalid cycle ID"),
  goals: goalSheetSchema,
});

export type GoalSheetSubmissionValues = z.infer<typeof goalSheetSubmissionSchema>;

// ── Manager Edit Schema (approval inline edits) ───────────
export const managerGoalEditSchema = z.object({
  goal_id: z.string().uuid(),
  target_value: z.number().positive().nullable().optional(),
  target_date: z.string().date().nullable().optional(),
  weightage: z
    .number()
    .min(GOAL_SHEET_RULES.MIN_WEIGHTAGE_PER_GOAL)
    .max(100)
    .optional(),
});

export type ManagerGoalEditValues = z.infer<typeof managerGoalEditSchema>;

// ── Return for Rework Schema ──────────────────────────────
export const returnForReworkSchema = z.object({
  sheet_id: z.string().uuid(),
  comment: z.string().min(5, "Comment must be at least 5 characters").max(1000),
});

export type ReturnForReworkValues = z.infer<typeof returnForReworkSchema>;
