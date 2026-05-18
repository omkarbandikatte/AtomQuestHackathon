import { create } from "zustand";
import type { GoalFormValues } from "@/validations/goal-schema";
import { GOAL_SHEET_RULES } from "@/lib/constants/goal-rules";

interface GoalSheetState {
  goals: GoalFormValues[];
  addGoal: (goal: GoalFormValues) => void;
  updateGoal: (index: number, goal: GoalFormValues) => void;
  removeGoal: (index: number) => void;
  reorderGoals: (goals: GoalFormValues[]) => void;
  resetGoals: () => void;
  setGoals: (goals: GoalFormValues[]) => void;

  // Computed validation helpers
  totalWeightage: () => number;
  canAddGoal: () => boolean;
  isValid: () => boolean;
}

export const useGoalSheetStore = create<GoalSheetState>((set, get) => ({
  goals: [],

  addGoal: (goal) =>
    set((state) => {
      if (state.goals.length >= GOAL_SHEET_RULES.MAX_GOALS) return state;
      return { goals: [...state.goals, goal] };
    }),

  updateGoal: (index, goal) =>
    set((state) => ({
      goals: state.goals.map((g, i) => (i === index ? goal : g)),
    })),

  removeGoal: (index) =>
    set((state) => ({
      goals: state.goals.filter((_, i) => i !== index),
    })),

  reorderGoals: (goals) => set({ goals }),

  resetGoals: () => set({ goals: [] }),

  setGoals: (goals) => set({ goals }),

  totalWeightage: () =>
    get().goals.reduce((sum, g) => sum + g.weightage, 0),

  canAddGoal: () => get().goals.length < GOAL_SHEET_RULES.MAX_GOALS,

  isValid: () => {
    const { goals } = get();
    if (goals.length === 0 || goals.length > GOAL_SHEET_RULES.MAX_GOALS) return false;
    const total = goals.reduce((sum, g) => sum + g.weightage, 0);
    if (total !== GOAL_SHEET_RULES.TOTAL_WEIGHTAGE) return false;
    if (goals.some((g) => g.weightage < GOAL_SHEET_RULES.MIN_WEIGHTAGE_PER_GOAL)) return false;
    return true;
  },
}));
