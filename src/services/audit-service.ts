import { createClient } from "@/lib/supabase/client";
import type { AuditLogEntry } from "@/types/app.types";

interface GetAuditLogOptions {
  sheetId?: string;
  page?: number;
  pageSize?: number;
}

export class AuditService {
  static async getAuditLog({
    sheetId,
    page = 1,
    pageSize = 50,
  }: GetAuditLogOptions): Promise<{ data: AuditLogEntry[]; count: number }> {
    const supabase = createClient();
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from("audit_log")
      .select("*, actor:users(full_name, email)", { count: "exact" })
      .order("changed_at", { ascending: false })
      .range(from, to);

    if (sheetId) {
      query = query.eq("goal_sheet_id", sheetId);
    }

    const { data, error, count } = await query;
    if (error) throw new Error(error.message);
    return { data: (data ?? []) as unknown as AuditLogEntry[], count: count ?? 0 };
  }
}
