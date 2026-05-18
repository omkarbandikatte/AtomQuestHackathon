"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/use-auth-store";
import type { SessionUser } from "@/types/app.types";

export function AuthProvider({
  children,
  initialUser,
}: {
  children: ReactNode;
  initialUser: SessionUser | null;
}) {
  const { setUser, setLoading } = useAuthStore();
  const router = useRouter();

  // Hydrate the store with server-provided user immediately
  useEffect(() => {
    setUser(initialUser);
  }, [initialUser, setUser]);

  useEffect(() => {
    const supabase = createClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === "SIGNED_OUT") {
        setUser(null);
        router.push("/login");
        router.refresh();
        return;
      }

      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        // Skip client-side refetch if we already have a valid user from the server
        const currentUser = useAuthStore.getState().user;
        if (currentUser && event === "TOKEN_REFRESHED") return;

        setLoading(true);
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        if (authUser) {
          const { data } = await supabase
            .from("users")
            .select("id, email, full_name, role, manager_id, department")
            .eq("id", authUser.id)
            .single();
          if (data) {
            setUser(data as SessionUser);
          } else if (!currentUser) {
            // Only set null if we don't already have a valid user
            setUser(null);
          }
        } else if (!currentUser) {
          setUser(null);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [setUser, setLoading, router]);

  return <>{children}</>;
}
