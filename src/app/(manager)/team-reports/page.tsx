import { requireAuth } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/EmptyState";
import { BarChart3, Users, CheckCircle, Clock } from "lucide-react";

export const metadata = { title: "Team Reports — AtomQuest" };

export default async function TeamReportsPage() {
  const user = await requireAuth("manager");
  const supabase = await createServerSupabaseClient();

  const { data: cycle } = await supabase
    .from("cycles")
    .select("id, name")
    .eq("is_active", true)
    .single();

  const { data: directReports } = await supabase
    .from("users")
    .select(
      `id, full_name, department,
       goal_sheets(id, status, is_locked, submitted_at, approved_at, cycle_id)`
    )
    .eq("manager_id", user.id)
    .eq("is_active", true)
    .order("full_name") as any;

  const reports = directReports ?? [];
  const currentSheets = reports.map((m: any) =>
    m.goal_sheets?.find((s: any) => s.cycle_id === cycle?.id) ?? null
  );

  const total = reports.length;
  const submitted = currentSheets.filter((s: any) => s?.status === "submitted").length;
  const approved = currentSheets.filter((s: any) => s?.status === "approved").length;
  const draft = currentSheets.filter((s: any) => s?.status === "draft" || !s).length;
  const returned = currentSheets.filter((s: any) => s?.status === "returned").length;

  const statusColor: Record<string, string> = {
    draft: "bg-neutral-100 text-neutral-600",
    submitted: "bg-yellow-100 text-yellow-700",
    approved: "bg-green-100 text-green-700",
    returned: "bg-red-100 text-red-700",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Team Reports</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Goal sheet progress for your direct reports
          {cycle ? ` · ${cycle.name}` : ""}.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-3xl font-bold text-neutral-900">{total}</p>
            <p className="text-xs text-neutral-500 mt-1">Total Members</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-3xl font-bold text-green-600">{approved}</p>
            <p className="text-xs text-neutral-500 mt-1">Approved</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-3xl font-bold text-yellow-600">{submitted}</p>
            <p className="text-xs text-neutral-500 mt-1">Pending Review</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-3xl font-bold text-neutral-400">{draft}</p>
            <p className="text-xs text-neutral-500 mt-1">Not Submitted</p>
          </CardContent>
        </Card>
      </div>

      {/* Member-level breakdown */}
      {reports.length === 0 ? (
        <EmptyState
          title="No direct reports"
          description="You have no active direct reports assigned to you."
        />
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-neutral-700">Member Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-neutral-100">
              {reports.map((member: any, idx: number) => {
                const sheet = currentSheets[idx];
                const status = sheet?.status ?? "not started";
                return (
                  <div key={member.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-neutral-800">{member.full_name}</p>
                      <p className="text-xs text-neutral-400">{member.department}</p>
                    </div>
                    <Badge className={`text-xs ${statusColor[status] ?? "bg-neutral-100 text-neutral-500"}`}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
