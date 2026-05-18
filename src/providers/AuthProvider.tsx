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
      }

      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        // Refresh user profile from DB to get latest role/metadata
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
          setUser(data as SessionUser | null);
        } else {
          setUser(null);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [setUser, setLoading, router]);

  return <>{children}</>;
}
