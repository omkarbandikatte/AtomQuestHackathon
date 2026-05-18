import { create } from "zustand";

interface ApprovalUIState {
  /** Currently selected sheet for review */
  activeSheetId: string | null;
  /** Whether the approve dialog is open */
  isApproveDialogOpen: boolean;
  /** Whether the rework dialog is open */
  isReworkDialogOpen: boolean;
  /** Goal currently being inline-edited */
  editingGoalId: string | null;

  setActiveSheet: (id: string | null) => void;
  openApproveDialog: () => void;
  closeApproveDialog: () => void;
  openReworkDialog: () => void;
  closeReworkDialog: () => void;
  setEditingGoal: (id: string | null) => void;
  reset: () => void;
}

export const useApprovalStore = create<ApprovalUIState>((set) => ({
  activeSheetId: null,
  isApproveDialogOpen: false,
  isReworkDialogOpen: false,
  editingGoalId: null,

  setActiveSheet: (id) => set({ activeSheetId: id }),
  openApproveDialog: () => set({ isApproveDialogOpen: true }),
  closeApproveDialog: () => set({ isApproveDialogOpen: false }),
  openReworkDialog: () => set({ isReworkDialogOpen: true }),
  closeReworkDialog: () => set({ isReworkDialogOpen: false }),
  setEditingGoal: (id) => set({ editingGoalId: id }),
  reset: () =>
    set({
      activeSheetId: null,
      isApproveDialogOpen: false,
      isReworkDialogOpen: false,
      editingGoalId: null,
    }),
}));
