import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

/**
 * Subscribes to Supabase Realtime for a shared goal source.
 * When the primary owner logs an achievement, this hook invalidates
 * the recipient's goal sheet cache to trigger a UI refresh.
 */
export function useSharedGoalRealtime(
  sourceGoalId: string | null,
  sheetId: string | null,
) {
  const queryClient = useQueryClient();
  const channelRef = useRef<ReturnType<typeof createClient>["channel"] | null>(null);

  useEffect(() => {
    if (!sourceGoalId) return;

    const supabase = createClient();
    const channelName = `shared-goal-${sourceGoalId}`;

    const channel = supabase
      .channel(channelName)
      .on("broadcast", { event: "achievement_updated" }, () => {
        queryClient.invalidateQueries({ queryKey: ["checkins-sheet", sheetId] });
        queryClient.invalidateQueries({ queryKey: ["goals", sheetId] });
      })
      .subscribe();

    channelRef.current = channel as unknown as ReturnType<typeof createClient>["channel"];

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sourceGoalId, sheetId, queryClient]);
}
