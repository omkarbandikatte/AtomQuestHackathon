import { createClient } from "@/lib/supabase/client";
import type { GoalSheet, GoalWithCheckins, Goal } from "@/types/app.types";

/**
 * Client-side service for goal data fetching.
 * Mutations are handled by Server Actions in /app/actions/goals.ts.
 */
export class GoalService {
  static async getGoalSheet(
    employeeId: string,
    cycleId: string,
  ): Promise<GoalSheet | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("goal_sheets")
      .select("*")
      .eq("employee_id", employeeId)
      .eq("cycle_id", cycleId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data;
  }

  static async getGoals(sheetId: string): Promise<GoalWithCheckins[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("goals")
      .select("*, checkins(*)")
      .eq("goal_sheet_id", sheetId)
      .order("sort_order", { ascending: true });

    if (error) throw new Error(error.message);
    return (data ?? []) as GoalWithCheckins[];
  }

  static async getSharedGoals(sheetId: string): Promise<Goal[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("goals")
      .select("*")
      .eq("goal_sheet_id", sheetId)
      .eq("is_shared", true)
      .order("sort_order", { ascending: true });

    if (error) throw new Error(error.message);
    return (data ?? []) as Goal[];
  }

  static async getLockStatus(
    sheetId: string,
  ): Promise<{ is_locked: boolean }> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("goal_sheets")
      .select("is_locked")
      .eq("id", sheetId)
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  static async getActiveCycle(): Promise<{ id: string; name: string } | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("cycles")
      .select("id, name")
      .eq("is_active", true)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data;
  }
}
