import { create } from "zustand";
import type { SessionUser } from "@/types/app.types";

interface AuthState {
  user: SessionUser | null;
  isLoading: boolean;
  setUser: (user: SessionUser | null) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  reset: () => set({ user: null, isLoading: false }),
}));
