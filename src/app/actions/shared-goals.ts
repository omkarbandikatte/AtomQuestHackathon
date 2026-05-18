"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { pushSharedGoalSchema } from "@/validations/shared-goal-schema";
import { ERROR_CODES } from "@/lib/constants/routes";
import type { ActionResponse } from "@/types/app.types";

/**
 * Push a Shared Goal (departmental KPI) to one or more employees.
 * Only Admin or Manager may call this.
 * Creates a goal row (is_shared=true) in each recipient's active goal_sheet
 * and inserts shared_goal_links rows.
 */
export async function pushSharedGoalAction(
  rawValues: unknown,
): Promise<ActionResponse<{ linkedCount: number }>> {
  const parsed = pushSharedGoalSchema.safeParse(rawValues);
  if (!parsed.success) {
    return { data: null, error: parsed.error.errors[0]?.message ?? ERROR_CODES.VALIDATION_FAILED };
  }

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: ERROR_CODES.UNAUTHORISED };

  // Verify caller is manager or admin
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!profile || !["manager", "admin"].includes(profile.role)) {
    return { data: null, error: ERROR_CODES.UNAUTHORISED };
  }

  const { source_goal_id, recipient_employee_ids } = parsed.data;
  const adminClient = createAdminClient();

  // Fetch source goal
  const { data: sourceGoal } = await adminClient
    .from("goals")
    .select("*, goal_sheets(cycle_id)")
    .eq("id", source_goal_id)
    .single();

  if (!sourceGoal) return { data: null, error: ERROR_CODES.NOT_FOUND };

  const cycleId = sourceGoal.goal_sheets?.cycle_id;
  if (!cycleId) return { data: null, error: "Source goal has no associated cycle" };

  const linkRows: { source_goal_id: string; target_goal_id: string; is_primary_owner: boolean; created_by: string }[] = [];
  let successCount = 0;

  for (const employeeId of recipient_employee_ids) {
    // Get or create draft goal_sheet for this employee in the active cycle
    const { data: sheet } = await adminClient
      .from("goal_sheets")
      .upsert(
        { employee_id: employeeId, cycle_id: cycleId, status: "draft" },
        { onConflict: "employee_id,cycle_id" },
      )
      .select("id")
      .single();

    if (!sheet) continue;

    // Insert shared goal row for recipient (title/target copied, read-only)
    const { data: targetGoal } = await adminClient
      .from("goals")
      .insert({
        goal_sheet_id: sheet.id,
        thrust_area: sourceGoal.thrust_area,
        title: sourceGoal.title,
        description: sourceGoal.description,
        uom_type: sourceGoal.uom_type,
        target_value: sourceGoal.target_value,
        target_date: sourceGoal.target_date,
        weightage: 10, // Default — recipient can edit
        is_shared: true,
        shared_owner_id: sourceGoal.goal_sheet_id,
        sort_order: 99,
      })
      .select("id")
      .single();

    if (!targetGoal) continue;

    linkRows.push({
      source_goal_id,
      target_goal_id: targetGoal.id,
      is_primary_owner: false,
      created_by: user.id,
    });

    successCount++;
  }

  if (linkRows.length > 0) {
    await adminClient.from("shared_goal_links").insert(linkRows);
  }

  revalidatePath("/team");
  revalidatePath("/goal-sheet");
  return { data: { linkedCount: successCount }, error: null };
}
