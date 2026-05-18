"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { batchCheckinSchema, managerCheckinCommentSchema } from "@/validations/checkin-schema";
import { getCurrentWindow } from "@/lib/utils/window";
import { ERROR_CODES } from "@/lib/constants/routes";
import type { ActionResponse } from "@/types/app.types";

/**
 * Employee logs or updates check-in actuals for a quarter.
 * Window must be open server-side — never trust client date.
 * Triggers compute_progress_score() via Postgres trigger on checkin insert/update.
 */
export async function upsertCheckinAction(
  rawValues: unknown,
): Promise<ActionResponse<{ count: number }>> {
  const parsed = batchCheckinSchema.safeParse(rawValues);
  if (!parsed.success) {
    return { data: null, error: parsed.error.errors[0]?.message ?? ERROR_CODES.VALIDATION_FAILED };
  }

  // Validate active quarter window
  const { phase } = await getCurrentWindow();
  const quarter = parsed.data.checkins[0]?.quarter;
  if (!phase || phase === "goal_setting" || (phase as string) !== quarter) {
    return { data: null, error: ERROR_CODES.WINDOW_CLOSED };
  }

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: ERROR_CODES.UNAUTHORISED };

  // Verify all goals belong to this employee's approved sheet
  const goalIds = parsed.data.checkins.map((c) => c.goal_id);
  const { data: goals } = await supabase
    .from("goals")
    .select("id, goal_sheet_id, goal_sheets!inner(employee_id, is_locked, status)")
    .in("id", goalIds);

  if (!goals || goals.length !== goalIds.length) {
    return { data: null, error: "One or more goals not found" };
  }

  for (const goal of goals) {
    const sheet = goal.goal_sheets as unknown as { employee_id: string; is_locked: boolean; status: string };
    if (sheet.employee_id !== user.id) {
      return { data: null, error: ERROR_CODES.UNAUTHORISED };
    }
    if (!sheet.is_locked || sheet.status !== "approved") {
      return { data: null, error: "Goal sheet must be approved before logging check-ins" };
    }
  }

  const checkinRows = parsed.data.checkins.map((c) => ({
    goal_id: c.goal_id,
    quarter: c.quarter,
    actual_value: c.actual_value,
    completion_date: c.completion_date ?? null,
    status: c.status,
    employee_id: user.id,
  }));

  // Upsert — conflict on (goal_id, quarter). Postgres trigger computes progress_score.
  const { error } = await supabase
    .from("checkins")
    .upsert(checkinRows, { onConflict: "goal_id,quarter" });

  if (error) return { data: null, error: error.message };

  revalidatePath("/checkins");
  revalidatePath("/progress");
  revalidatePath("/manager-checkins");
  return { data: { count: checkinRows.length }, error: null };
}

/**
 * Submit all check-ins for a quarter in one batch (marks them as finalized).
 * Triggers shared goal sync if any shared goals are included.
 */
export async function submitQuarterlyCheckinAction(
  sheetId: string,
  quarter: string,
): Promise<ActionResponse> {
  const { phase } = await getCurrentWindow();
  if (!phase || (phase as string) !== quarter) {
    return { data: null, error: ERROR_CODES.WINDOW_CLOSED };
  }

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: ERROR_CODES.UNAUTHORISED };

  // Verify sheet ownership
  const { data: sheet } = await supabase
    .from("goal_sheets")
    .select("id, employee_id, is_locked")
    .eq("id", sheetId)
    .single();

  if (!sheet || sheet.employee_id !== user.id) {
    return { data: null, error: ERROR_CODES.UNAUTHORISED };
  }
  if (!sheet.is_locked) {
    return { data: null, error: "Sheet must be approved before submitting check-ins" };
  }

  // Fetch all goals + their checkins for this quarter
  const { data: goals } = await supabase
    .from("goals")
    .select("id, is_shared, shared_goal_links(shared_goal_id)")
    .eq("goal_sheet_id", sheetId);

  if (!goals || goals.length === 0) {
    return { data: null, error: "No goals found" };
  }

  // Verify all goals have a checkin for this quarter
  const { data: checkins } = await supabase
    .from("checkins")
    .select("goal_id, status")
    .in("goal_id", goals.map((g) => g.id))
    .eq("quarter", quarter as any);

  const goalsWithCheckin = new Set(checkins?.map((c) => c.goal_id) ?? []);
  const missingGoals = goals.filter((g) => !goalsWithCheckin.has(g.id));

  if (missingGoals.length > 0) {
    return { data: null, error: `${missingGoals.length} goal(s) missing check-in data for ${quarter}` };
  }

  // Sync shared goal progress via RPC (if any shared goals exist)
  const sharedGoals = goals.filter((g) => g.is_shared);
  if (sharedGoals.length > 0) {
    await syncSharedGoalProgress(supabase, sharedGoals, quarter);
  }

  // Log audit
  const adminClient = createAdminClient();
  await adminClient.from("audit_log").insert({
    goal_sheet_id: sheetId,
    actor_id: user.id,
    action: "SUBMIT_QUARTERLY_CHECKIN",
    reason: `${quarter} check-ins submitted for all ${goals.length} goals`,
  });

  // Notification to manager
  const { notifyUser } = await import("@/lib/notifications");
  const { data: employeeData } = await supabase
    .from("users")
    .select("manager_id")
    .eq("id", user.id)
    .single();

  if (employeeData?.manager_id) {
    await notifyUser(employeeData.manager_id, "goal_sheet_submitted", {
      sheet_id: sheetId,
      quarter,
    });
  }

  revalidatePath("/checkins");
  revalidatePath("/progress");
  revalidatePath("/manager-checkins");
  return { data: null, error: null };
}

/**
 * Manager adds a structured check-in comment.
 */
export async function addManagerCommentAction(
  rawValues: unknown,
): Promise<ActionResponse> {
  const parsed = managerCheckinCommentSchema.safeParse(rawValues);
  if (!parsed.success) {
    return { data: null, error: parsed.error.errors[0]?.message ?? ERROR_CODES.VALIDATION_FAILED };
  }

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: ERROR_CODES.UNAUTHORISED };

  // Verify manager relationship via checkin → goal → sheet → employee → manager
  const { data: checkin } = await supabase
    .from("checkins")
    .select("id, goal_id, goals!inner(goal_sheet_id, goal_sheets!inner(employee_id, employee:users!goal_sheets_employee_fk(manager_id)))")
    .eq("id", parsed.data.checkin_id)
    .single();

  if (!checkin) return { data: null, error: ERROR_CODES.NOT_FOUND };

  const goalData = checkin.goals as unknown as {
    goal_sheet_id: string;
    goal_sheets: { employee_id: string; employee: { manager_id: string | null } };
  };

  if (goalData.goal_sheets.employee.manager_id !== user.id) {
    return { data: null, error: ERROR_CODES.UNAUTHORISED };
  }

  const { error } = await supabase
    .from("checkins")
    .update({
      manager_comment: parsed.data.manager_comment,
      manager_id: user.id,
    })
    .eq("id", parsed.data.checkin_id);

  if (error) return { data: null, error: error.message };

  revalidatePath("/manager-checkins");
  revalidatePath("/checkins");
  return { data: null, error: null };
}

// ── Helpers ────────────────────────────────────────────────

/**
 * Sync progress of shared goals to the parent shared_goal_links table.
 * This allows the manager/org to see aggregated progress across employees.
 */
async function syncSharedGoalProgress(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  sharedGoals: Array<{ id: string; shared_goal_links: unknown }>,
  quarter: string,
): Promise<void> {
  for (const goal of sharedGoals) {
    const links = goal.shared_goal_links as Array<{ shared_goal_id: string }> | null;
    if (!links || links.length === 0) continue;

    // Fetch the latest progress score for this goal in this quarter
    const { data: checkin } = await supabase
      .from("checkins")
      .select("progress_score")
      .eq("goal_id", goal.id)
      .eq("quarter", quarter as any)
      .single();

    if (checkin?.progress_score != null) {
      // Update the shared_goal_link with the latest progress
      await (supabase
        .from("shared_goal_links") as any)
        .update({ last_progress_score: checkin.progress_score })
        .eq("shared_goal_id", links[0].shared_goal_id)
        .eq("goal_id", goal.id);
    }
  }
}

