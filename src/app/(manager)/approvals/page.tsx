import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants/routes";
import { EmptyState } from "@/components/shared/EmptyState";
import { ApprovalListItem } from "@/components/manager/ApprovalListItem";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = { title: "Approvals — AtomQuest" };

export default async function ApprovalsPage() {
  const user = await requireAuth("manager");
  const supabase = await createServerSupabaseClient();

  const { data: cycle } = await supabase
    .from("cycles")
    .select("id, name")
    .eq("is_active", true)
    .single();

  // Fetch submitted sheets for direct reports (manager's team only)
  const { data: pendingSheets } = cycle
    ? await supabase
        .from("goal_sheets")
        .select(
          `
          id, status, submitted_at, is_locked,
          employee:users!goal_sheets_employee_fk(id, full_name, email, department, manager_id),
          goals(id, title, weightage, uom_type, thrust_area)
        `,
        )
        .eq("cycle_id", cycle.id)
        .eq("status", "submitted")
        .order("submitted_at")
    : { data: [] };

  // Filter to only this manager's direct reports
  const myPendingSheets = (pendingSheets ?? []).filter(
    (s) => (s.employee as any)?.manager_id === user.id,
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        href={ROUTES.TEAM}
        className="inline-flex items-center text-sm text-neutral-500 hover:text-brand-blue transition-colors"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Team
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Pending Approvals</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {cycle?.name ?? "No active cycle"}
          </p>
        </div>
        <Badge variant="default" className="text-sm px-3 py-1">
          {myPendingSheets.length} pending
        </Badge>
      </div>

      {myPendingSheets.length > 0 ? (
        <div className="space-y-4">
          {myPendingSheets.map((sheet) => (
            <ApprovalListItem key={sheet.id} sheet={sheet as any} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="All caught up"
          description="No goal sheets are pending your approval."
        />
      )}
    </div>
  );
}
