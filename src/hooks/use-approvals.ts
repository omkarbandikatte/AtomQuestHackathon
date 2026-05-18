import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ManagerService } from "@/services/manager-service";
import {
  approveWithCommentAction,
  returnForReworkAction,
  managerEditGoalAction,
} from "@/app/actions/goals";
import type { ActionResponse } from "@/types/app.types";
import type { ManagerGoalEditValues, ReturnForReworkValues } from "@/validations/goal-schema";

export function useTeamMembers(managerId: string) {
  return useQuery({
    queryKey: ["team-members", managerId],
    queryFn: () => ManagerService.getTeamMembers(managerId),
    enabled: !!managerId,
  });
}

export function usePendingApprovals(cycleId: string) {
  return useQuery({
    queryKey: ["pending-approvals", cycleId],
    queryFn: () => ManagerService.getPendingApprovals(cycleId),
    enabled: !!cycleId,
  });
}

export function useSheetForReview(sheetId: string) {
  return useQuery({
    queryKey: ["sheet-review", sheetId],
    queryFn: () => ManagerService.getSheetForReview(sheetId),
    enabled: !!sheetId,
  });
}

export function useSheetAuditTrail(sheetId: string) {
  return useQuery({
    queryKey: ["audit-trail", sheetId],
    queryFn: () => ManagerService.getSheetAuditTrail(sheetId),
    enabled: !!sheetId,
  });
}

export function useApproveSheet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sheetId, comment }: { sheetId: string; comment: string }) =>
      approveWithCommentAction(sheetId, comment) as Promise<ActionResponse>,
    onMutate: async ({ sheetId }) => {
      // Optimistic: remove from pending list
      await queryClient.cancelQueries({ queryKey: ["pending-approvals"] });
      const previous = queryClient.getQueriesData({ queryKey: ["pending-approvals"] });

      queryClient.setQueriesData(
        { queryKey: ["pending-approvals"] },
        (old: unknown) => {
          if (!Array.isArray(old)) return old;
          return old.filter((s: { id: string }) => s.id !== sheetId);
        },
      );

      return { previous };
    },
    onError: (_err, _vars, context) => {
      // Rollback on error
      if (context?.previous) {
        context.previous.forEach(([key, data]) => {
          queryClient.setQueryData(key, data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-approvals"] });
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      queryClient.invalidateQueries({ queryKey: ["sheet-review"] });
      queryClient.invalidateQueries({ queryKey: ["audit-trail"] });
    },
  });
}

export function useReturnForRework() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: ReturnForReworkValues) =>
      returnForReworkAction(values) as Promise<ActionResponse>,
    onMutate: async ({ sheet_id }) => {
      await queryClient.cancelQueries({ queryKey: ["pending-approvals"] });
      const previous = queryClient.getQueriesData({ queryKey: ["pending-approvals"] });

      queryClient.setQueriesData(
        { queryKey: ["pending-approvals"] },
        (old: unknown) => {
          if (!Array.isArray(old)) return old;
          return old.filter((s: { id: string }) => s.id !== sheet_id);
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
      queryClient.invalidateQueries({ queryKey: ["pending-approvals"] });
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      queryClient.invalidateQueries({ queryKey: ["sheet-review"] });
      queryClient.invalidateQueries({ queryKey: ["audit-trail"] });
    },
  });
}

export function useManagerEditGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: ManagerGoalEditValues) =>
      managerEditGoalAction(values) as Promise<ActionResponse>,
    onMutate: async (values) => {
      // Optimistic update on the goal within sheet-review
      const queries = queryClient.getQueriesData({ queryKey: ["sheet-review"] });

      queryClient.setQueriesData(
        { queryKey: ["sheet-review"] },
        (old: unknown) => {
          if (!old || typeof old !== "object") return old;
          const sheet = old as { goals?: Array<{ id: string; target_value?: number | null; target_date?: string | null; weightage?: number }> };
          if (!sheet.goals) return old;
          return {
            ...sheet,
            goals: sheet.goals.map((g) =>
              g.id === values.goal_id
                ? {
                    ...g,
                    ...(values.target_value !== undefined && { target_value: values.target_value }),
                    ...(values.target_date !== undefined && { target_date: values.target_date }),
                    ...(values.weightage !== undefined && { weightage: values.weightage }),
                  }
                : g,
            ),
          };
        },
      );

      return { queries };
    },
    onError: (_err, _vars, context) => {
      if (context?.queries) {
        context.queries.forEach(([key, data]) => {
          queryClient.setQueryData(key, data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["sheet-review"] });
      queryClient.invalidateQueries({ queryKey: ["audit-trail"] });
    },
  });
}
