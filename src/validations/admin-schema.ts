import { z } from "zod";

// ── Cycle Configuration Schema ─────────────────────────────
export const cycleSchema = z.object({
  name: z.string().min(3, "Cycle name is required").max(50),
  goal_setting_opens: z.string().date("Invalid date"),
  q1_opens: z.string().date("Invalid date"),
  q2_opens: z.string().date("Invalid date"),
  q3_opens: z.string().date("Invalid date"),
  q4_opens: z.string().date("Invalid date"),
  cycle_closes: z.string().date("Invalid date"),
});

export type CycleFormValues = z.infer<typeof cycleSchema>;

// ── Unlock Sheet Schema ────────────────────────────────────
export const unlockSheetSchema = z.object({
  sheet_id: z.string().uuid(),
  reason: z.string().min(20, "Reason must be at least 20 characters").max(1000),
});

export type UnlockSheetValues = z.infer<typeof unlockSheetSchema>;

// ── User Management Schema ─────────────────────────────────
export const userSchema = z.object({
  email: z.string().email("Invalid email address"),
  full_name: z.string().min(2, "Name is required").max(100),
  role: z.enum(["employee", "manager", "admin"]),
  manager_id: z.string().uuid().nullable(),
  department: z.string().max(100).nullable(),
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
});

export type UserFormValues = z.infer<typeof userSchema>;
