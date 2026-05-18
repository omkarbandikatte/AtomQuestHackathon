import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { CheckinService } from "@/services/checkin-service";
import { upsertCheckinAction, submitQuarterlyCheckinAction, addManagerCommentAction } from "@/app/actions/checkins";
import type { CheckinFormValues } from "@/validations/checkin-schema";
import type { ActionResponse } from "@/types/app.types";
import type { Checkin } from "@/types/app.types";

export function useCheckins(goalId: string) {
  return useQuery({
    queryKey: ["checkins", goalId],
    queryFn: () => CheckinService.getCheckins(goalId),
    enabled: !!goalId,
  });
}

export function useCheckinsBySheet(sheetId: string, quarter: string) {
  return useQuery({
    queryKey: ["checkins-sheet", sheetId, quarter],
    queryFn: () => CheckinService.getCheckinsBySheet(sheetId, quarter),
    enabled: !!sheetId && !!quarter,
  });
}

export function useGoalsWithCheckins(sheetId: string) {
  return useQuery({
    queryKey: ["goals-with-checkins", sheetId],
    queryFn: () => CheckinService.getGoalsWithCheckins(sheetId),
    enabled: !!sheetId,
  });
}

export function useProgressBySheet(sheetId: string) {
  return useQuery({
    queryKey: ["progress-by-sheet", sheetId],
    queryFn: () => CheckinService.getProgressBySheet(sheetId),
    enabled: !!sheetId,
  });
}

export function useUpsertCheckin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: CheckinFormValues) =>
      upsertCheckinAction({ checkins: [values] }) as Promise<ActionResponse<{ count: number }>>,
    onMutate: async (values) => {
      // Optimistic update for the checkins-sheet query
      await queryClient.cancelQueries({ queryKey: ["checkins-sheet"] });
      await queryClient.cancelQueries({ queryKey: ["checkins", values.goal_id] });

      const previousSheet = queryClient.getQueriesData({ queryKey: ["checkins-sheet"] });

      queryClient.setQueriesData(
        { queryKey: ["checkins-sheet"] },
        (old: unknown) => {
          if (!Array.isArray(old)) return old;
          const existing = old.find((c: Checkin) => c.goal_id === values.goal_id);
          if (existing) {
            return old.map((c: Checkin) =>
              c.goal_id === values.goal_id
                ? { ...c, ...values, progress_score: c.progress_score }
                : c,
            );
          }
          return [...old, { ...values, id: "optimistic", progress_score: null }];
        },
      );

      return { previousSheet };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousSheet) {
        context.previousSheet.forEach(([key, data]) => {
          queryClient.setQueryData(key, data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["checkins"] });
      queryClient.invalidateQueries({ queryKey: ["checkins-sheet"] });
      queryClient.invalidateQueries({ queryKey: ["goals-with-checkins"] });
      queryClient.invalidateQueries({ queryKey: ["progress-by-sheet"] });
    },
  });
}

export function useSubmitQuarterlyCheckin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sheetId, quarter }: { sheetId: string; quarter: string }) =>
      submitQuarterlyCheckinAction(sheetId, quarter) as Promise<ActionResponse>,
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["checkins"] });
      queryClient.invalidateQueries({ queryKey: ["checkins-sheet"] });
      queryClient.invalidateQueries({ queryKey: ["goals-with-checkins"] });
      queryClient.invalidateQueries({ queryKey: ["progress-by-sheet"] });
    },
  });
}

export function useAddManagerComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: { checkin_id: string; manager_comment: string }) =>
      addManagerCommentAction(values) as Promise<ActionResponse>,
    onMutate: async (values) => {
      await queryClient.cancelQueries({ queryKey: ["checkins"] });
      const previous = queryClient.getQueriesData({ queryKey: ["checkins"] });

      queryClient.setQueriesData(
        { queryKey: ["checkins"] },
        (old: unknown) => {
          if (!Array.isArray(old)) return old;
          return old.map((c: Checkin) =>
            c.id === values.checkin_id
              ? { ...c, manager_comment: values.manager_comment }
              : c,
          );
        },
      );

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        context.previous.forEach(([key, data]) => {
          queryClient.setQueryData(key, data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["checkins"] });
      queryClient.invalidateQueries({ queryKey: ["checkins-sheet"] });
    },
  });
}

/**
 * Hook to subscribe to realtime checkin updates for a sheet.
 * Automatically invalidates queries when new data arrives.
 */
export function useRealtimeCheckins(sheetId: string, goalIds: string[]) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!sheetId || goalIds.length === 0) return;

    const channel = CheckinService.subscribeToCheckins(
      sheetId,
      goalIds,
      () => {
        // Invalidate relevant queries on any update
        queryClient.invalidateQueries({ queryKey: ["checkins-sheet", sheetId] });
        queryClient.invalidateQueries({ queryKey: ["goals-with-checkins", sheetId] });
        queryClient.invalidateQueries({ queryKey: ["progress-by-sheet", sheetId] });
      },
    );

    return () => {
      channel.unsubscribe();
    };
  }, [sheetId, goalIds, queryClient]);
}

/**
 * Hook to subscribe to progress score updates (after compute_progress_score trigger).
 */
export function useRealtimeProgress(
  goalIds: string[],
  onScoreUpdate?: (data: { goal_id: string; quarter: string; progress_score: number }) => void,
) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (goalIds.length === 0) return;

    const channel = CheckinService.subscribeToProgressUpdates(
      goalIds,
      (data) => {
        onScoreUpdate?.(data);
        queryClient.invalidateQueries({ queryKey: ["checkins"] });
        queryClient.invalidateQueries({ queryKey: ["progress-by-sheet"] });
      },
    );

    return () => {
      channel.unsubscribe();
    };
  }, [goalIds, queryClient, onScoreUpdate]);
}
