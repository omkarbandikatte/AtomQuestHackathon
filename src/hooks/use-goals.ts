import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { GoalService } from "@/services/goal-service";
import {
  saveGoalSheetDraftAction,
  submitGoalSheetAction,
  deleteGoalAction,
} from "@/app/actions/goals";
import type { GoalSheetSubmissionValues } from "@/validations/goal-schema";
import type { ActionResponse } from "@/types/app.types";

export function useGoalSheet(employeeId: string, cycleId: string) {
  return useQuery({
    queryKey: ["goal-sheet", employeeId, cycleId],
    queryFn: () => GoalService.getGoalSheet(employeeId, cycleId),
    enabled: !!employeeId && !!cycleId,
  });
}

export function useGoals(sheetId: string) {
  return useQuery({
    queryKey: ["goals", sheetId],
    queryFn: () => GoalService.getGoals(sheetId),
    enabled: !!sheetId,
  });
}

export function useSaveGoalSheetDraft() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: GoalSheetSubmissionValues) =>
      saveGoalSheetDraftAction(values) as Promise<ActionResponse<{ sheetId: string }>>,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goal-sheet"] });
      queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
  });
}

export function useSubmitGoalSheet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sheetId: string) =>
      submitGoalSheetAction(sheetId) as Promise<ActionResponse>,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goal-sheet"] });
      queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
  });
}

export function useDeleteGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (goalId: string) =>
      deleteGoalAction(goalId) as Promise<ActionResponse>,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      queryClient.invalidateQueries({ queryKey: ["goal-sheet"] });
    },
  });
}

export function useGoalSheetLockStatus(sheetId: string) {
  return useQuery({
    queryKey: ["goal-sheet-lock", sheetId],
    queryFn: () => GoalService.getLockStatus(sheetId),
    enabled: !!sheetId,
  });
}
