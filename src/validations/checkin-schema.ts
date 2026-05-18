import { z } from "zod";
import { GOAL_STATUS_OPTIONS } from "@/lib/constants/goal-rules";

// ── Single Check-in Entry Schema ───────────────────────────
export const checkinSchema = z.object({
  goal_id: z.string().uuid(),
  quarter: z.enum(["Q1", "Q2", "Q3", "Q4"]),
  actual_value: z.number().nullable(),
  completion_date: z.string().date().nullable(),
  status: z.enum(GOAL_STATUS_OPTIONS, {
    errorMap: () => ({ message: "Select a valid status" }),
  }),
});

export type CheckinFormValues = z.infer<typeof checkinSchema>;

// ── Batch Check-in Submission Schema ───────────────────────
export const batchCheckinSchema = z.object({
  checkins: z.array(checkinSchema).min(1, "At least one check-in is required"),
});

export type BatchCheckinFormValues = z.infer<typeof batchCheckinSchema>;

// ── Manager Check-in Comment Schema ────────────────────────
export const managerCheckinCommentSchema = z.object({
  checkin_id: z.string().uuid(),
  manager_comment: z.string().min(3, "Comment is required").max(2000),
});

export type ManagerCheckinCommentValues = z.infer<typeof managerCheckinCommentSchema>;
