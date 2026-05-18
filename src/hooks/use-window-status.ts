import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { WindowPhase } from "@/types/app.types";

async function fetchWindowStatus(): Promise<{
  phase: WindowPhase;
  closesAt: string | null;
  opensAt: string | null;
}> {
  const supabase = createClient();
  const today = new Date().toISOString().split("T")[0];

  const { data: cycle } = await supabase
    .from("cycles")
    .select("*")
    .eq("is_active", true)
    .single();

  if (!cycle) return { phase: null, closesAt: null, opensAt: null };

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
}

export function useWindowStatus() {
  return useQuery({
    queryKey: ["window-status"],
    queryFn: fetchWindowStatus,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
}
