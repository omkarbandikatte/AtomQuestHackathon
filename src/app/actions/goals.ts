"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { goalSheetSubmissionSchema, returnForReworkSchema } from "@/validations/goal-schema";
import { GOAL_SHEET_RULES } from "@/lib/constants/goal-rules";
import { getCurrentWindow } from "@/lib/utils/window";
import { ERROR_CODES } from "@/lib/constants/routes";
import type { ActionResponse } from "@/types/app.types";

/**
 * Create or update a draft goal sheet with goals.
 * Validates all rules: goal count, min weightage, total weightage.
 */
export async function saveGoalSheetDraftAction(
  rawValues: unknown,
): Promise<ActionResponse<{ sheetId: string }>> {
  const parsed = goalSheetSubmissionSchema.safeParse(rawValues);
  if (!parsed.success) {
    return { data: null, error: parsed.error.errors[0]?.message ?? ERROR_CODES.VALIDATION_FAILED };
  }

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: ERROR_CODES.UNAUTHORISED };

  const { cycle_id, goals } = parsed.data;

  // Upsert goal sheet
  const { data: sheet, error: sheetError } = await supabase
    .from("goal_sheets")
    .upsert(
      { employee_id: user.id, cycle_id, status: "draft" },
      { onConflict: "employee_id,cycle_id" },
    )
    .select("id, is_locked")
    .single();

  if (sheetError || !sheet) return { data: null, error: sheetError?.message ?? ERROR_CODES.NOT_FOUND };
  if (sheet.is_locked) return { data: null, error: ERROR_CODES.SHEET_LOCKED };

  // Delete existing non-shared goals then re-insert (simple full replace on draft)
  await supabase.from("goals").delete().eq("goal_sheet_id", sheet.id).eq("is_shared", false);

  const goalRows = goals.map((g, idx) => ({
    goal_sheet_id: sheet.id,
    title: g.title,
    thrust_area: g.thrust_area,
    uom_type: g.uom_type,
    target_value: g.target_value,
    target_date: g.target_date ?? null,
    weightage: g.weightage,
    description: g.description ?? null,
    sort_order: idx,
    is_shared: false,
  }));

  const { error: goalsError } = await supabase.from("goals").insert(goalRows);
  if (goalsError) return { data: null, error: goalsError.message };

  revalidatePath("/goal-sheet");
  return { data: { sheetId: sheet.id }, error: null };
}

/**
 * Submit a goal sheet for manager review.
 * Runs all validation server-side. Goal-setting window must be open.
 */
export async function submitGoalSheetAction(
  sheetId: string,
): Promise<ActionResponse> {
  const windowError = await validateGoalSettingWindow();
  if (windowError) return windowError;

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: ERROR_CODES.UNAUTHORISED };

  const { data: sheet } = await supabase
    .from("goal_sheets")
    .select("id, is_locked, status")
    .eq("id", sheetId)
    .eq("employee_id", user.id)
    .single();

  if (!sheet) return { data: null, error: ERROR_CODES.NOT_FOUND };
  if (sheet.is_locked) return { data: null, error: ERROR_CODES.SHEET_LOCKED };

  // Re-validate goals server-side
  const { data: goals } = await supabase
    .from("goals")
    .select("weightage")
    .eq("goal_sheet_id", sheetId);

  if (!goals || goals.length === 0) {
    return { data: null, error: "No goals on this sheet" };
  }
  if (goals.length > GOAL_SHEET_RULES.MAX_GOALS) {
    return { data: null, error: ERROR_CODES.MAX_GOALS_REACHED };
  }

  const total = goals.reduce((s, g) => s + g.weightage, 0);
  if (total !== GOAL_SHEET_RULES.TOTAL_WEIGHTAGE) {
    return { data: null, error: `Total weightage must equal 100%. Current: ${total}%` };
  }

  if (goals.some((g) => g.weightage < GOAL_SHEET_RULES.MIN_WEIGHTAGE_PER_GOAL)) {
    return { data: null, error: `Minimum weightage per goal is ${GOAL_SHEET_RULES.MIN_WEIGHTAGE_PER_GOAL}%` };
  }

  const { error } = await supabase
    .from("goal_sheets")
    .update({ status: "submitted", submitted_at: new Date().toISOString() })
    .eq("id", sheetId);

  if (error) return { data: null, error: error.message };

  revalidatePath("/goal-sheet");
  revalidatePath("/approvals");
  return { data: null, error: null };
}

/**
 * Manager approves a goal sheet — atomically locks the sheet.
 */
export async function approveGoalSheetAction(
  sheetId: string,
  managerId: string,
): Promise<ActionResponse> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== managerId) return { data: null, error: ERROR_CODES.UNAUTHORISED };

  // Use RPC to atomically set status + is_locked in one transaction
  const { error } = await supabase.rpc("approve_goal_sheet", {
    p_sheet_id: sheetId,
    p_manager_id: managerId,
  });

  if (error) return { data: null, error: error.message };

  revalidatePath("/approvals");
  revalidatePath("/team");
  return { data: null, error: null };
}

/**
 * Manager returns a sheet for rework with a mandatory comment.
 */
export async function returnForReworkAction(
  rawValues: unknown,
): Promise<ActionResponse> {
  const parsed = returnForReworkSchema.safeParse(rawValues);
  if (!parsed.success) {
    return { data: null, error: parsed.error.errors[0]?.message ?? ERROR_CODES.VALIDATION_FAILED };
  }

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: ERROR_CODES.UNAUTHORISED };

  const { sheet_id, comment } = parsed.data;

  const { error } = await supabase
    .from("goal_sheets")
    .update({ status: "returned" })
    .eq("id", sheet_id);

  if (error) return { data: null, error: error.message };

  // Log the rework comment in audit log via admin client
  const adminClient = createAdminClient();
  await adminClient.from("audit_log").insert({
    goal_sheet_id: sheet_id,
    actor_id: user.id,
    action: "RETURN_FOR_REWORK",
    reason: comment,
  });

  // Notification placeholder
  const { notifyUser } = await import("@/lib/notifications");
  const { data: sheetData } = await supabase
    .from("goal_sheets")
    .select("employee_id")
    .eq("id", sheet_id)
    .single();
  if (sheetData) {
    await notifyUser(sheetData.employee_id, "goal_sheet_returned", {
      sheet_id,
      manager_id: user.id,
      comment,
    });
  }

  revalidatePath("/approvals");
  return { data: null, error: null };
}

/**
 * Manager inline-edits a goal (target, weightage) before approving.
 * Validates ownership via manager → employee relationship.
 * Logs changes to audit_log.
 */
export async function managerEditGoalAction(
  rawValues: unknown,
): Promise<ActionResponse> {
  const { managerGoalEditSchema } = await import("@/validations/goal-schema");
  const parsed = managerGoalEditSchema.safeParse(rawValues);
  if (!parsed.success) {
    return { data: null, error: parsed.error.errors[0]?.message ?? ERROR_CODES.VALIDATION_FAILED };
  }

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: ERROR_CODES.UNAUTHORISED };

  const { goal_id, target_value, target_date, weightage } = parsed.data;

  // Fetch goal + sheet + employee to verify manager relationship
  const { data: goal } = await supabase
    .from("goals")
    .select("id, target_value, target_date, weightage, goal_sheet_id, goal_sheets(employee_id, is_locked, status, employee:users!goal_sheets_employee_fk(manager_id))")
    .eq("id", goal_id)
    .single();

  if (!goal) return { data: null, error: ERROR_CODES.NOT_FOUND };

  const sheet = goal.goal_sheets as unknown as {
    employee_id: string;
    is_locked: boolean;
    status: string;
    employee: { manager_id: string | null };
  };

  if (sheet.employee?.manager_id !== user.id) {
    return { data: null, error: ERROR_CODES.UNAUTHORISED };
  }
  if (sheet.is_locked) {
    return { data: null, error: ERROR_CODES.SHEET_LOCKED };
  }
  if (sheet.status !== "submitted") {
    return { data: null, error: "Can only edit goals on submitted sheets" };
  }

  // Build update payload (only changed fields)
  const updates: Record<string, unknown> = {};
  const changes: string[] = [];

  if (target_value !== undefined && target_value !== goal.target_value) {
    updates.target_value = target_value;
    changes.push(`target_value: ${goal.target_value} → ${target_value}`);
  }
  if (target_date !== undefined && target_date !== goal.target_date) {
    updates.target_date = target_date;
    changes.push(`target_date: ${goal.target_date} → ${target_date}`);
  }
  if (weightage !== undefined && weightage !== goal.weightage) {
    updates.weightage = weightage;
    changes.push(`weightage: ${goal.weightage}% → ${weightage}%`);
  }

  if (Object.keys(updates).length === 0) {
    return { data: null, error: null }; // Nothing changed
  }

  const { error } = await supabase
    .from("goals")
    .update(updates as any)
    .eq("id", goal_id);

  if (error) return { data: null, error: error.message };

  // Audit trail
  const adminClient = createAdminClient();
  await adminClient.from("audit_log").insert({
    goal_sheet_id: goal.goal_sheet_id,
    actor_id: user.id,
    action: "MANAGER_EDIT_GOAL",
    reason: `Manager edited goal: ${changes.join("; ")}`,
    metadata: { goal_id, changes: updates },
  } as any);

  revalidatePath(`/approvals/${goal.goal_sheet_id}`);
  return { data: null, error: null };
}

/**
 * Manager approves a goal sheet with a mandatory comment.
 * Uses approve_goal_sheet RPC for atomic lock.
 */
export async function approveWithCommentAction(
  sheetId: string,
  comment: string,
): Promise<ActionResponse> {
  if (!comment || comment.trim().length < 3) {
    return { data: null, error: "Approval comment is required (min 3 characters)" };
  }

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: ERROR_CODES.UNAUTHORISED };

  // Verify manager relationship
  const { data: sheet } = await supabase
    .from("goal_sheets")
    .select("id, is_locked, status, employee:users!goal_sheets_employee_fk(manager_id)")
    .eq("id", sheetId)
    .single();

  if (!sheet) return { data: null, error: ERROR_CODES.NOT_FOUND };

  const employee = sheet.employee as unknown as { manager_id: string | null };
  if (employee?.manager_id !== user.id) {
    return { data: null, error: ERROR_CODES.UNAUTHORISED };
  }
  if (sheet.is_locked) return { data: null, error: ERROR_CODES.SHEET_LOCKED };
  if (sheet.status !== "submitted") {
    return { data: null, error: "Sheet must be in submitted state to approve" };
  }

  // Re-validate total weightage = 100
  const { data: goals } = await supabase
    .from("goals")
    .select("weightage")
    .eq("goal_sheet_id", sheetId);

  if (!goals || goals.length === 0) {
    return { data: null, error: "No goals on this sheet" };
  }
  const total = goals.reduce((s, g) => s + g.weightage, 0);
  if (total !== GOAL_SHEET_RULES.TOTAL_WEIGHTAGE) {
    return { data: null, error: `Total weightage must equal 100%. Current: ${total}%` };
  }

  // Atomic approve + lock via RPC
  const { error } = await supabase.rpc("approve_goal_sheet", {
    p_sheet_id: sheetId,
    p_manager_id: user.id,
  });

  if (error) return { data: null, error: error.message };

  // Audit trail with approval comment
  const adminClient = createAdminClient();
  await adminClient.from("audit_log").insert({
    goal_sheet_id: sheetId,
    actor_id: user.id,
    action: "APPROVE_GOAL_SHEET",
    reason: comment,
  });

  // Notification placeholder
  const { notifyUser } = await import("@/lib/notifications");
  const { data: sheetData } = await supabase
    .from("goal_sheets")
    .select("employee_id")
    .eq("id", sheetId)
    .single();
  if (sheetData) {
    await notifyUser(sheetData.employee_id, "goal_sheet_approved", {
      sheet_id: sheetId,
      manager_id: user.id,
    });
  }

  revalidatePath("/approvals");
  revalidatePath("/team");
  return { data: null, error: null };
}

// ── Helpers ────────────────────────────────────────────────

async function validateGoalSettingWindow(): Promise<ActionResponse | null> {
  const { phase } = await getCurrentWindow();
  if (phase !== "goal_setting") {
    return { data: null, error: ERROR_CODES.WINDOW_CLOSED };
  }
  return null;
}

/**
 * Delete a single goal from a draft goal sheet.
 * Cannot delete shared goals. Sheet must not be locked.
 */
export async function deleteGoalAction(
  goalId: string,
): Promise<ActionResponse> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: ERROR_CODES.UNAUTHORISED };

  // Fetch goal + sheet to validate ownership and lock status
  const { data: goal } = await supabase
    .from("goals")
    .select("id, goal_sheet_id, is_shared, goal_sheets(employee_id, is_locked, status)")
    .eq("id", goalId)
    .single();

  if (!goal) return { data: null, error: ERROR_CODES.NOT_FOUND };

  const sheet = goal.goal_sheets as unknown as {
    employee_id: string;
    is_locked: boolean;
    status: string;
  };

  if (sheet.employee_id !== user.id) {
    return { data: null, error: ERROR_CODES.UNAUTHORISED };
  }
  if (sheet.is_locked) {
    return { data: null, error: ERROR_CODES.SHEET_LOCKED };
  }
  if (goal.is_shared) {
    return { data: null, error: "Cannot delete a shared goal. Contact your manager." };
  }

  const { error } = await supabase.from("goals").delete().eq("id", goalId);
  if (error) return { data: null, error: error.message };

  revalidatePath("/goal-sheet");
  return { data: null, error: null };
}
