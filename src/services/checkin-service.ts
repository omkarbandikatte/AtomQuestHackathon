import { createClient } from "@/lib/supabase/client";
import type { Checkin } from "@/types/app.types";
import type { CheckinFormValues } from "@/validations/checkin-schema";
import type { RealtimeChannel } from "@supabase/supabase-js";

export type CheckinWithGoal = Checkin & {
  goals?: {
    id: string;
    title: string;
    thrust_area: string;
    uom_type: string;
    target_value: number | null;
    weightage: number;
    is_shared: boolean;
  };
};

export type QuarterProgress = {
  quarter: string;
  goalCount: number;
  completedCount: number;
  averageScore: number | null;
  checkins: Checkin[];
};

export class CheckinService {
  static async getCheckins(goalId: string): Promise<Checkin[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("checkins")
      .select("*")
      .eq("goal_id", goalId)
      .order("quarter", { ascending: true });

    if (error) throw new Error(error.message);
    return data ?? [];
  }

  static async getCheckinsBySheet(
    sheetId: string,
    quarter: string,
  ): Promise<CheckinWithGoal[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("checkins")
      .select("*, goals!inner(id, title, thrust_area, uom_type, target_value, weightage, is_shared, goal_sheet_id)")
      .eq("goals.goal_sheet_id", sheetId)
      .eq("quarter", quarter as any);

    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as CheckinWithGoal[];
  }

  static async getProgressBySheet(sheetId: string): Promise<QuarterProgress[]> {
    const supabase = createClient();
    const quarters = ["Q1", "Q2", "Q3", "Q4"];
    const results: QuarterProgress[] = [];

    // Get all goals for this sheet
    const { data: goals } = await supabase
      .from("goals")
      .select("id")
      .eq("goal_sheet_id", sheetId);

    if (!goals || goals.length === 0) return results;

    const goalIds = goals.map((g) => g.id);

    for (const quarter of quarters) {
      const { data: checkins } = await supabase
        .from("checkins")
        .select("*")
        .in("goal_id", goalIds)
        .eq("quarter", quarter as any);

      const qCheckins = checkins ?? [];
      const scores = qCheckins
        .map((c) => c.progress_score)
        .filter((s): s is number => s != null);

      results.push({
        quarter,
        goalCount: goals.length,
        completedCount: qCheckins.filter((c) => c.status === "completed").length,
        averageScore: scores.length > 0
          ? scores.reduce((a, b) => a + b, 0) / scores.length
          : null,
        checkins: qCheckins,
      });
    }

    return results;
  }

  static async getGoalsWithCheckins(sheetId: string): Promise<Array<{
    id: string;
    title: string;
    thrust_area: string;
    uom_type: string;
    target_value: number | null;
    target_date: string | null;
    weightage: number;
    is_shared: boolean;
    sort_order: number;
    checkins: Checkin[];
  }>> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("goals")
      .select("id, title, thrust_area, uom_type, target_value, target_date, weightage, is_shared, sort_order, checkins(*)")
      .eq("goal_sheet_id", sheetId)
      .order("sort_order", { ascending: true });

    if (error) throw new Error(error.message);
    return (data ?? []) as any;
  }

  /**
   * Subscribe to realtime checkin changes for a given sheet.
   * Returns the channel so caller can unsubscribe.
   */
  static subscribeToCheckins(
    sheetId: string,
    goalIds: string[],
    onUpdate: (checkin: Checkin) => void,
  ): RealtimeChannel {
    const supabase = createClient();

    const channel = supabase
      .channel(`checkins:sheet:${sheetId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "checkins",
          filter: `goal_id=in.(${goalIds.join(",")})`,
        },
        (payload) => {
          if (payload.new && typeof payload.new === "object") {
            onUpdate(payload.new as Checkin);
          }
        },
      )
      .subscribe();

    return channel;
  }

  /**
   * Subscribe to progress score updates (triggered by compute_progress_score).
   */
  static subscribeToProgressUpdates(
    goalIds: string[],
    onScoreUpdate: (data: { goal_id: string; quarter: string; progress_score: number }) => void,
  ): RealtimeChannel {
    const supabase = createClient();

    const channel = supabase
      .channel(`progress:goals`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "checkins",
          filter: `goal_id=in.(${goalIds.join(",")})`,
        },
        (payload) => {
          const updated = payload.new as Checkin;
          if (updated.progress_score != null) {
            onScoreUpdate({
              goal_id: updated.goal_id,
              quarter: updated.quarter,
              progress_score: updated.progress_score,
            });
          }
        },
      )
      .subscribe();

    return channel;
  }
}

