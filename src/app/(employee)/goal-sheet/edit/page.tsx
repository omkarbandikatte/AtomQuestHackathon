import { requireAuth } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getCurrentWindow } from "@/lib/utils/window";
import { GoalSheetForm } from "@/components/goals/GoalSheetForm";
import type { Goal } from "@/types/app.types";

export const metadata = { title: "Edit Goal Sheet — AtomQuest" };

export default async function GoalSheetEditPage() {
  const user = await requireAuth("employee");
  const supabase = await createServerSupabaseClient();

  // Fetch active cycle
  const { data: cycle } = await supabase
    .from("cycles")
    .select("id, name")
    .eq("is_active", true)
    .single();

  if (!cycle) {
    redirect("/goal-sheet");
  }

  // Check window is open
  const windowStatus = await getCurrentWindow();
  if (windowStatus.phase !== "goal_setting") {
    redirect("/goal-sheet");
  }

  // Fetch existing sheet + goals
  const { data: sheet } = await supabase
    .from("goal_sheets")
    .select("id, status, is_locked, return_comment")
    .eq("employee_id", user.id)
    .eq("cycle_id", cycle.id)
    .maybeSingle();

  // Cannot edit locked or submitted sheets
  if (sheet?.is_locked || sheet?.status === "submitted") {
    redirect("/goal-sheet");
  }

  let existingGoals: Goal[] = [];
  if (sheet) {
    const { data: goals } = await supabase
      .from("goals")
      .select("*")
      .eq("goal_sheet_id", sheet.id)
      .order("sort_order", { ascending: true });
    existingGoals = (goals ?? []) as Goal[];
  }

  return (
    <GoalSheetForm
      cycleId={cycle.id}
      cycleName={cycle.name}
      sheetId={sheet?.id ?? null}
      sheetStatus={sheet?.status ?? null}
      existingGoals={existingGoals}
      isGoalSettingOpen={true}
    />
  );
}
