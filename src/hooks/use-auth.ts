"use client";

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/use-auth-store";
import type { Role } from "@/lib/constants/roles";

/**
 * Client-side hook for auth state. Uses Zustand store hydrated by AuthProvider.
 * Provides role checks and logout functionality.
 */
export function useAuth() {
  const { user, isLoading } = useAuthStore();
  const router = useRouter();

  const logout = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    useAuthStore.getState().reset();
    router.push("/login");
    router.refresh();
  }, [router]);

  const hasRole = useCallback(
    (role: Role | Role[]): boolean => {
      if (!user) return false;
      const roles = Array.isArray(role) ? role : [role];
      return roles.includes(user.role);
    },
    [user],
  );

  const isAuthenticated = !!user;

  return {
    user,
    isLoading,
    isAuthenticated,
    hasRole,
    logout,
  };
}

/**
 * Hook that redirects to login if user is not authenticated.
 * Use in client components that need guaranteed auth context.
 */
export function useRequireAuth(allowedRoles?: Role | Role[]) {
  const { user, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    if (allowedRoles) {
      const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
      if (!roles.includes(user.role)) {
        router.push("/");
      }
    }
  }, [user, isLoading, allowedRoles, router]);

  return { user, isLoading };
}
