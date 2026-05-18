import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { cache } from "react";
import { ROUTES } from "@/lib/constants/routes";
import type { Role } from "@/lib/constants/roles";
import type { SessionUser } from "@/types/app.types";

/**
 * Cached profile fetch — runs only once per request regardless of
 * how many components/layouts call requireAuth.
 */
export const getSessionProfile = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("users")
    .select("id, email, full_name, role, manager_id, department")
    .eq("id", authUser.id)
    .single();

  return profile as SessionUser | null;
});

/**
 * Server-side auth guard for use in Server Components and Server Actions.
 * Validates that the user is authenticated and optionally checks their role.
 *
 * Usage in a Server Component:
 *   const user = await requireAuth("manager");
 *
 * Usage in a Server Action:
 *   const user = await requireAuth(); // any authenticated user
 *
 * Redirects to /login if unauthenticated.
 * Redirects to the user's default page if role doesn't match.
 */
export async function requireAuth(
  allowedRoles?: Role | Role[],
): Promise<SessionUser> {
  const profile = await getSessionProfile();

  if (!profile) {
    redirect(ROUTES.LOGIN);
  }

  // Check role access if specified
  if (allowedRoles) {
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    if (!roles.includes(profile.role as Role)) {
      // Redirect to their own default page
      switch (profile.role) {
        case "admin":
          redirect(ROUTES.ADMIN_DASHBOARD);
        case "manager":
          redirect(ROUTES.TEAM);
        default:
          redirect(ROUTES.GOAL_SHEET);
      }
    }
  }

  return profile;
}

/**
 * Lightweight version that just checks if authenticated.
 * Returns null instead of redirecting — useful for conditional UI.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("id, email, full_name, role, manager_id, department")
    .eq("id", authUser.id)
    .single();

  return (profile as SessionUser) ?? null;
}

/**
 * For Server Actions — throws an error instead of redirecting.
 * This allows the action to return a proper error response.
 */
export async function requireAuthForAction(
  allowedRoles?: Role | Role[],
): Promise<SessionUser> {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    throw new Error("UNAUTHENTICATED");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("id, email, full_name, role, manager_id, department")
    .eq("id", authUser.id)
    .single();

  if (!profile) {
    throw new Error("PROFILE_NOT_FOUND");
  }

  if (allowedRoles) {
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    if (!roles.includes(profile.role as Role)) {
      throw new Error("FORBIDDEN");
    }
  }

  return profile as SessionUser;
}
