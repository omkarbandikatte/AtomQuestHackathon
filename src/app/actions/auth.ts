"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/constants/routes";
import { z } from "zod";
import type { ActionResponse } from "@/types/app.types";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function loginAction(
  values: z.infer<typeof loginSchema>,
  redirectTo?: string | null,
): Promise<ActionResponse & { redirectUrl?: string }> {
  const parsed = loginSchema.safeParse(values);
  if (!parsed.success) {
    return { data: null, error: "Invalid credentials format" };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { data: null, error: "Invalid email or password" };
  }

  // Check that the user has a profile row — without one they'd be stuck in a redirect loop.
  // Use the admin client (service_role) so RLS never blocks this internal check.
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("users")
    .select("id, role")
    .eq("id", authUser!.id)
    .single();

  if (!profile) {
    // Sign them back out so the session doesn't cause a redirect loop
    await supabase.auth.signOut();
    return {
      data: null,
      error:
        "Your account has not been set up yet. Please contact your administrator.",
    };
  }

  // Server-side redirect — avoids the client router.push + router.refresh
  // race condition that can prevent the session from being seen immediately.
  // Validate redirectTo to prevent open redirects (must be a relative path).
  const safeRedirect =
    redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")
      ? redirectTo
      : (() => {
          switch (profile.role) {
            case "admin":
              return ROUTES.ADMIN_DASHBOARD;
            case "manager":
              return ROUTES.TEAM;
            default:
              return ROUTES.GOAL_SHEET;
          }
        })();

  // Return the URL instead of calling redirect().
  // redirect() in a server action performs a client-side RSC navigation which
  // can race with cookie storage — the browser may not have written the
  // session Set-Cookie headers before the next fetch goes out, making the
  // middleware see an unauthenticated request. Returning the URL lets the
  // client navigate with window.location.href (full page reload) which
  // guarantees cookies are persisted before the new request is sent.
  return { data: null, error: null, redirectUrl: safeRedirect };
}

export async function logoutAction(): Promise<void> {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect(ROUTES.LOGIN);
}

// ── Self-registration ──────────────────────────────────────────────────────
const signupSchema = z.object({
  full_name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["employee", "manager"]),
  department: z.string().max(100).optional(),
});

export async function signupAction(
  values: z.infer<typeof signupSchema>,
): Promise<ActionResponse> {
  const parsed = signupSchema.safeParse(values);
  if (!parsed.success) {
    return { data: null, error: "Please check your details and try again." };
  }

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();

  // Check for duplicate email in users table
  const { data: existing } = await admin
    .from("users")
    .select("id")
    .eq("email", parsed.data.email)
    .maybeSingle();

  if (existing) {
    return { data: null, error: "An account with this email already exists." };
  }

  // Create auth user (email confirmed so they can log in)
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
  });

  if (authError) {
    return { data: null, error: authError.message };
  }

  // Insert profile row
  const { error: profileError } = await admin.from("users").insert({
    id: authData.user.id,
    email: parsed.data.email,
    full_name: parsed.data.full_name,
    role: parsed.data.role,
    department: parsed.data.department ?? null,
    manager_id: null,
  });

  if (profileError) {
    // Attempt to clean up the dangling auth user. Log but don't swallow errors.
    const { error: cleanupError } = await admin.auth.admin.deleteUser(authData.user.id);
    if (cleanupError) {
      console.error("[signupAction] Failed to delete orphaned auth user:", authData.user.id, cleanupError.message);
    }
    return { data: null, error: `Account setup failed: ${profileError.message}. Please try again.` };
  }

  return { data: null, error: null };
}

/**
 * Sign up a new user (admin-only action used from the Users page).
 * Creates the auth user and the public.users profile row.
 */
export async function signUpUserAction(values: {
  email: string;
  password: string;
  full_name: string;
  role: string;
  manager_id?: string | null;
  department?: string | null;
}): Promise<ActionResponse> {
  const { requireAuthForAction } = await import("@/lib/auth/session");
  const { createAdminClient } = await import("@/lib/supabase/admin");

  await requireAuthForAction("admin");

  const admin = createAdminClient();

  // Create auth user
  const { data: authData, error: authError } =
    await admin.auth.admin.createUser({
      email: values.email,
      password: values.password,
      email_confirm: true,
    });

  if (authError) {
    return { data: null, error: authError.message };
  }

  // Create profile row
  const { error: profileError } = await admin.from("users").insert({
    id: authData.user.id,
    email: values.email,
    full_name: values.full_name,
    role: values.role as "employee" | "manager" | "admin",
    manager_id: values.manager_id ?? null,
    department: values.department ?? null,
  });

  if (profileError) {
    // Rollback: delete auth user if profile creation fails
    await admin.auth.admin.deleteUser(authData.user.id);
    return { data: null, error: profileError.message };
  }

  return { data: null, error: null };
}
