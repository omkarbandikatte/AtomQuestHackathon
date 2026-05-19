"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { cycleSchema, unlockSheetSchema, userSchema } from "@/validations/admin-schema";
import { ERROR_CODES } from "@/lib/constants/routes";
import type { ActionResponse } from "@/types/app.types";

/**
 * Helper: verify caller is an admin. Uses service-role client to bypass RLS.
 */
async function verifyAdmin(): Promise<{ userId: string } | { error: string }> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: ERROR_CODES.UNAUTHORISED };

  const adminClient = createAdminClient();
  const { data: profile } = await adminClient
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") return { error: ERROR_CODES.UNAUTHORISED };

  return { userId: user.id };
}

// ── Cycle Management ───────────────────────────────────────

export async function createCycleAction(rawValues: unknown): Promise<ActionResponse<{ id: string }>> {
  const parsed = cycleSchema.safeParse(rawValues);
  if (!parsed.success) {
    return { data: null, error: parsed.error.errors[0]?.message ?? ERROR_CODES.VALIDATION_FAILED };
  }

  const auth = await verifyAdmin();
  if ("error" in auth) return { data: null, error: auth.error };

  const adminClient = createAdminClient();

  // Deactivate all existing cycles first
  await adminClient.from("cycles").update({ is_active: false }).neq("id", "00000000-0000-0000-0000-000000000000");

  const { data, error } = await adminClient
    .from("cycles")
    .insert({ ...parsed.data, is_active: true })
    .select("id")
    .single();

  if (error) return { data: null, error: error.message };

  revalidatePath("/cycles");
  return { data: { id: data.id }, error: null };
}

export async function updateCycleAction(
  cycleId: string,
  rawValues: unknown,
): Promise<ActionResponse> {
  const parsed = cycleSchema.safeParse(rawValues);
  if (!parsed.success) {
    return { data: null, error: parsed.error.errors[0]?.message ?? ERROR_CODES.VALIDATION_FAILED };
  }

  const auth = await verifyAdmin();
  if ("error" in auth) return { data: null, error: auth.error };

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("cycles")
    .update(parsed.data)
    .eq("id", cycleId);

  if (error) return { data: null, error: error.message };

  revalidatePath("/cycles");
  return { data: null, error: null };
}

// ── Sheet Unlock ───────────────────────────────────────────

/**
 * Admin unlocks a locked goal sheet.
 * Requires a reason (min 20 chars). Writes to audit_log.
 */
export async function unlockSheetAction(rawValues: unknown): Promise<ActionResponse> {
  const parsed = unlockSheetSchema.safeParse(rawValues);
  if (!parsed.success) {
    return { data: null, error: parsed.error.errors[0]?.message ?? ERROR_CODES.VALIDATION_FAILED };
  }

  const auth = await verifyAdmin();
  if ("error" in auth) return { data: null, error: auth.error };

  const adminClient = createAdminClient();

  // Set actor context for audit trigger
  await (adminClient.rpc as any)("set_config", {
    parameter: "app.current_user_id",
    value: auth.userId,
    is_local: true,
  });

  const { error: unlockError } = await adminClient
    .from("goal_sheets")
    .update({ is_locked: false })
    .eq("id", parsed.data.sheet_id);

  if (unlockError) return { data: null, error: unlockError.message };

  // Write audit log entry
  await adminClient.from("audit_log").insert({
    goal_sheet_id: parsed.data.sheet_id,
    actor_id: auth.userId,
    action: "UNLOCK",
    reason: parsed.data.reason,
  });

  revalidatePath("/audit-log");
  return { data: null, error: null };
}

// ── User Management ────────────────────────────────────────

export async function createUserAction(rawValues: unknown): Promise<ActionResponse<{ id: string }>> {
  const parsed = userSchema.safeParse(rawValues);
  if (!parsed.success) {
    return { data: null, error: parsed.error.errors[0]?.message ?? ERROR_CODES.VALIDATION_FAILED };
  }

  const auth = await verifyAdmin();
  if ("error" in auth) return { data: null, error: auth.error };

  const adminClient = createAdminClient();
  const { email, full_name, role, manager_id, department, password } = parsed.data;
  const tempPassword = password ?? "AtomQuest@123";

  // 1. Create the Supabase Auth account
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { full_name },
  });
  if (authError) return { data: null, error: authError.message };

  const userId = authData.user.id;

  // 2. Insert the public profile row (using the auth user's UUID so they match)
  const { data, error } = await adminClient
    .from("users")
    .insert({ id: userId, email, full_name, role, manager_id, department })
    .select("id")
    .single();

  if (error) {
    // Roll back the auth user if profile insert fails
    await adminClient.auth.admin.deleteUser(userId);
    return { data: null, error: error.message };
  }

  revalidatePath("/users");
  return { data: { id: data.id }, error: null };
}

export async function updateUserAction(
  userId: string,
  rawValues: unknown,
): Promise<ActionResponse> {
  const parsed = userSchema.partial().safeParse(rawValues);
  if (!parsed.success) {
    return { data: null, error: parsed.error.errors[0]?.message ?? ERROR_CODES.VALIDATION_FAILED };
  }

  const adminClient = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password: _pw, ...dbFields } = parsed.data;
  const { error } = await adminClient
    .from("users")
    .update(dbFields)
    .eq("id", userId);

  if (error) return { data: null, error: error.message };

  revalidatePath("/users");
  return { data: null, error: null };
}

export async function deactivateUserAction(userId: string): Promise<ActionResponse> {
  const auth = await verifyAdmin();
  if ("error" in auth) return { data: null, error: auth.error };

  const adminClient = createAdminClient();
  const { error } = await adminClient.from("users").update({ is_active: false }).eq("id", userId);
  if (error) return { data: null, error: error.message };

  revalidatePath("/users");
  return { data: null, error: null };
}

// ── Cycle Activation ──────────────────────────────────────

export async function activateCycleAction(cycleId: string): Promise<ActionResponse> {
  const auth = await verifyAdmin();
  if ("error" in auth) return { data: null, error: auth.error };

  const adminClient = createAdminClient();
  // Deactivate all, then activate target
  await adminClient.from("cycles").update({ is_active: false }).neq("id", "00000000-0000-0000-0000-000000000000");
  const { error } = await adminClient.from("cycles").update({ is_active: true }).eq("id", cycleId);
  if (error) return { data: null, error: error.message };

  revalidatePath("/cycles");
  return { data: null, error: null };
}

// ── Locked Sheet Listing (for unlock flow) ─────────────────

export async function getLockedSheetsAction(): Promise<
  ActionResponse<{ id: string; employee: { full_name: string; email: string }; cycle: { name: string }; approved_at: string | null }[]>
> {
  const auth = await verifyAdmin();
  if ("error" in auth) return { data: null, error: auth.error };

  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("goal_sheets")
    .select(
      "id, approved_at, employee:users!goal_sheets_employee_fk(full_name, email), cycle:cycles(name)",
    )
    .eq("is_locked", true)
    .order("approved_at", { ascending: false });

  if (error) return { data: null, error: error.message };
  return { data: data as unknown as { id: string; employee: { full_name: string; email: string }; cycle: { name: string }; approved_at: string | null }[], error: null };
}
