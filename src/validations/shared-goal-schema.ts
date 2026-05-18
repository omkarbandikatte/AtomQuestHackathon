import { z } from "zod";

// ── Push Shared Goal Schema ────────────────────────────────
export const pushSharedGoalSchema = z.object({
  source_goal_id: z.string().uuid("Invalid source goal ID"),
  recipient_employee_ids: z
    .array(z.string().uuid())
    .min(1, "At least one recipient is required"),
});

export type PushSharedGoalValues = z.infer<typeof pushSharedGoalSchema>;

// ── Shared Goal Weightage Edit Schema ──────────────────────
export const sharedGoalWeightageSchema = z.object({
  goal_id: z.string().uuid(),
  weightage: z.number().min(10).max(100),
});

export type SharedGoalWeightageValues = z.infer<typeof sharedGoalWeightageSchema>;
