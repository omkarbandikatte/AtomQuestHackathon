import { createServerSupabaseClient } from "@/lib/supabase/server";
import { cache } from "react";
import type { WindowPhase } from "@/types/app.types";

/**
 * Determines the currently active window phase from the cycles table.
 * Cached per request so layouts + pages don't repeat the query.
 */
export const getCurrentWindow = cache(async (): Promise<{
  phase: WindowPhase;
  closesAt: string | null;
  opensAt: string | null;
}> => {
  const supabase = await createServerSupabaseClient();
  const today = new Date().toISOString().split("T")[0];

  const { data: cycle } = await supabase
    .from("cycles")
    .select("*")
    .eq("is_active", true)
    .single();

  if (!cycle) {
    return { phase: null, closesAt: null, opensAt: null };
  }

  if (today >= cycle.goal_setting_opens && today < cycle.q1_opens) {
    return { phase: "goal_setting", closesAt: cycle.q1_opens, opensAt: cycle.goal_setting_opens };
  }
  if (today >= cycle.q1_opens && today < cycle.q2_opens) {
    return { phase: "Q1", closesAt: cycle.q2_opens, opensAt: cycle.q1_opens };
  }
  if (today >= cycle.q2_opens && today < cycle.q3_opens) {
    return { phase: "Q2", closesAt: cycle.q3_opens, opensAt: cycle.q2_opens };
  }
  if (today >= cycle.q3_opens && today < cycle.q4_opens) {
    return { phase: "Q3", closesAt: cycle.q4_opens, opensAt: cycle.q3_opens };
  }
  if (today >= cycle.q4_opens && today <= cycle.cycle_closes) {
    return { phase: "Q4", closesAt: cycle.cycle_closes, opensAt: cycle.q4_opens };
  }

  return { phase: null, closesAt: null, opensAt: null };
});

/**
 * Validates that the current quarter window matches the expected quarter.
 * Returns an error object if the window is closed.
 */
export async function validateWindowOpen(expectedQuarter: string): Promise<{ error: string } | null> {
  const { phase } = await getCurrentWindow();
  if (!phase || phase !== expectedQuarter) {
    return { error: "WINDOW_CLOSED" };
  }
  return null;
}
