import { createClient } from "@/lib/supabase/client";
import type { TeamMemberSummary, GoalSheetWithGoals } from "@/types/app.types";

export class UserService {
  static async getTeamSummary(managerId: string): Promise<TeamMemberSummary[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("users")
      .select(
        "id, full_name, email, department, goal_sheets(id, status, is_locked, submitted_at, approved_at)",
      )
      .eq("manager_id", managerId)
      .eq("is_active", true);

    if (error) throw new Error(error.message);
    return (data ?? []).map((user) => ({
      employee: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        department: user.department,
      },
      goalSheet: Array.isArray(user.goal_sheets) ? user.goal_sheets[0] ?? null : null,
      goalCount: 0,
      checkinCompletion: {},
    }));
  }

  static async getTeamMemberSheet(
    employeeId: string,
    cycleId: string,
  ): Promise<GoalSheetWithGoals | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("goal_sheets")
      .select(
        "*, employee:users(id, full_name, email, department), goals(*, checkins(*))",
      )
      .eq("employee_id", employeeId)
      .eq("cycle_id", cycleId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data as GoalSheetWithGoals | null;
  }
}
