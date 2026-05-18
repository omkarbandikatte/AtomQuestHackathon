import { createClient } from "@/lib/supabase/client";
import type { Goal, GoalSheet } from "@/types/app.types";

export type TeamMemberWithSheet = {
  id: string;
  full_name: string;
  email: string;
  department: string | null;
  goal_sheets: Array<{
    id: string;
    status: string;
    is_locked: boolean;
    submitted_at: string | null;
    approved_at: string | null;
    cycle_id: string;
  }>;
};

export type PendingApprovalSheet = {
  id: string;
  status: string;
  submitted_at: string | null;
  is_locked: boolean;
  employee_id: string;
  employee: { id: string; full_name: string; email: string; department: string | null } | null;
  goals: Goal[];
};

export type SheetAuditEntry = {
  id: string;
  actor_id: string;
  action: string;
  reason: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  actor: { full_name: string; email: string } | null;
};

/**
 * Client-side service for manager data fetching.
 */
export class ManagerService {
  static async getTeamMembers(managerId: string): Promise<TeamMemberWithSheet[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("users")
      .select(`
        id, full_name, email, department,
        goal_sheets(id, status, is_locked, submitted_at, approved_at, cycle_id)
      `)
      .eq("manager_id", managerId)
      .eq("is_active", true)
      .order("full_name");

    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as TeamMemberWithSheet[];
  }

  static async getPendingApprovals(cycleId: string): Promise<PendingApprovalSheet[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("goal_sheets")
      .select(`
        id, status, submitted_at, is_locked, employee_id,
        employee:users!goal_sheets_employee_fk(id, full_name, email, department),
        goals(*)
      `)
      .eq("cycle_id", cycleId)
      .eq("status", "submitted")
      .order("submitted_at");

    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as PendingApprovalSheet[];
  }

  static async getSheetForReview(sheetId: string): Promise<
    (GoalSheet & { goals: Goal[]; employee: { id: string; full_name: string; email: string; department: string | null } | null }) | null
  > {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("goal_sheets")
      .select(`
        *,
        goals(*),
        employee:users!goal_sheets_employee_fk(id, full_name, email, department)
      `)
      .eq("id", sheetId)
      .single();

    if (error) throw new Error(error.message);
    return data as unknown as (GoalSheet & { goals: Goal[]; employee: { id: string; full_name: string; email: string; department: string | null } | null });
  }

  static async getSheetAuditTrail(sheetId: string): Promise<SheetAuditEntry[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("audit_log")
      .select(`
        id, actor_id, action, reason, metadata, created_at,
        actor:users!audit_log_actor_id_fkey(full_name, email)
      `)
      .eq("goal_sheet_id", sheetId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as SheetAuditEntry[];
  }
}
