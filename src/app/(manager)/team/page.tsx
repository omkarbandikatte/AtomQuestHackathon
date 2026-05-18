import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants/routes";
import { EmptyState } from "@/components/shared/EmptyState";
import { TeamMemberCard } from "@/components/manager/TeamMemberCard";
import { TeamStats } from "@/components/manager/TeamStats";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Users, CheckCircle } from "lucide-react";

export const metadata = { title: "Team Dashboard — AtomQuest" };

export default async function TeamPage() {
  const user = await requireAuth("manager");
  const supabase = await createServerSupabaseClient();

  const { data: cycle } = await supabase
    .from("cycles")
    .select("id, name")
    .eq("is_active", true)
    .single();

  // Fetch direct reports with their goal sheet status
  const { data: directReports } = await supabase
    .from("users")
    .select(
      `
      id, full_name, email, department,
      goal_sheets!goal_sheets_employee_fk(id, status, is_locked, submitted_at, approved_at, cycle_id)
    `,
    )
    .eq("manager_id", user.id)
    .eq("is_active", true)
    .order("full_name") as any;

  // Compute stats
  const reports = directReports ?? [];
  const currentSheets = reports.map((m: any) =>
    m.goal_sheets?.find((s: { cycle_id: string }) => s.cycle_id === cycle?.id) ?? null,
  );
  const stats = {
    total: reports.length,
    submitted: currentSheets.filter((s: any) => s?.status === "submitted").length,
    approved: currentSheets.filter((s: any) => s?.status === "approved").length,
    draft: currentSheets.filter((s: any) => s?.status === "draft").length,
    notStarted: currentSheets.filter((s: any) => !s).length,
    returned: currentSheets.filter((s: any) => s?.status === "returned").length,
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Team Dashboard</h1>
          {cycle && (
            <p className="mt-1 text-sm text-neutral-500">Cycle: {cycle.name}</p>
          )}
        </div>
        {stats.submitted > 0 && (
          <Link
            href={ROUTES.APPROVALS}
            className="inline-flex items-center gap-2 text-sm font-medium text-white bg-brand-teal hover:bg-brand-teal/90 px-4 py-2 rounded-lg transition-colors"
          >
            <CheckCircle className="h-4 w-4" />
            {stats.submitted} Pending Approval{stats.submitted > 1 ? "s" : ""}
          </Link>
        )}
      </div>

      {/* Stats cards */}
      <TeamStats stats={stats} />

      {reports.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reports.map((member: any) => {
            const sheet = member.goal_sheets?.find(
              (s: { cycle_id: string }) => s.cycle_id === cycle?.id,
            ) ?? null;
            return (
              <TeamMemberCard key={member.id} member={member} sheet={sheet} />
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No direct reports"
          description="No employees are assigned to you. Contact Admin to update the org hierarchy."
        />
      )}
    </div>
  );
}
