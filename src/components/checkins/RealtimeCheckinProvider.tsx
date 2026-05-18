"use client";

import { useRealtimeCheckins, useRealtimeProgress } from "@/hooks/use-checkins";
import { useCallback } from "react";
import { toast } from "sonner";

interface Props {
  sheetId: string;
  goalIds: string[];
  children: React.ReactNode;
}

/**
 * Wraps check-in pages to provide realtime subscriptions.
 * Automatically invalidates queries and shows toasts on external updates.
 */
export function RealtimeCheckinProvider({ sheetId, goalIds, children }: Props) {
  useRealtimeCheckins(sheetId, goalIds);

  const handleScoreUpdate = useCallback(
    (data: { goal_id: string; quarter: string; progress_score: number }) => {
      // Optional toast for score recalculations (from Postgres trigger)
      if (data.progress_score > 0) {
        toast.info(`Progress score updated: ${Math.round(data.progress_score)}%`, {
          duration: 2000,
        });
      }
    },
    [],
  );

  useRealtimeProgress(goalIds, handleScoreUpdate);

  return <>{children}</>;
}
