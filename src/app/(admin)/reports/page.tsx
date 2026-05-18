import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/constants/routes";
import { ReportExportButton } from "@/components/admin/ReportExportButton";
import { CompletionDashboard } from "@/components/admin/CompletionDashboard";
import { DepartmentReportTable } from "@/components/admin/DepartmentReportTable";
import { ScoreDistributionChart } from "@/components/admin/ScoreDistributionChart";
import { Leaderboard } from "@/components/gamification/Leaderboard";
import { getLeaderboardData } from "@/services/gamification-service";

export const metadata = { title: "Reports — AtomQuest" };

export default async function ReportsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(ROUTES.LOGIN);

  const { data: cycle } = await supabase
    .from("cycles")
    .select("id, name")
    .eq("is_active", true)
    .single();

  const [{ data: sheets }, { data: checkins }] = await Promise.all([
    cycle
      ? supabase
          .from("goal_sheets")
          .select(
            `id, status, is_locked,
             employee:users!goal_sheets_employee_fk(id, full_name, email, department)`,
          )
          .eq("cycle_id", cycle.id) as any
      : { data: [] },
    cycle
      ? supabase
          .from("checkins")
          .select("progress_score, goal:goals!inner(goal_sheets!inner(cycle_id))")
          .eq("goal.goal_sheets.cycle_id", cycle.id)
      : { data: [] },
  ]);

  // Build score distribution buckets: 0-20, 20-40, 40-60, 60-80, 80-100
  const buckets = [0, 20, 40, 60, 80, 100];
  const distribution = buckets.slice(0, -1).map((low, i) => {
    const high = buckets[i + 1];
    const count =
      checkins?.filter(
        (c) =>
          c.progress_score !== null &&
          c.progress_score >= low &&
          c.progress_score < (i === 4 ? 101 : high),
      ).length ?? 0;
    return { label: `${low}–${high}%`, count };
  });

  // Department breakdown
  const deptMap = new Map<string, { total: number; approved: number; submitted: number; draft: number }>();
  sheets?.forEach((s: any) => {
    const dept = s.employee?.department ?? "—";
    const cur = deptMap.get(dept) ?? { total: 0, approved: 0, submitted: 0, draft: 0 };
    cur.total++;
    if (s.status === "approved") cur.approved++;
    else if (s.status === "submitted") cur.submitted++;
    else cur.draft++;
    deptMap.set(dept, cur);
  });

  const deptRows = [...deptMap.entries()]
    .map(([dept, stats]) => ({ dept, ...stats }))
    .sort((a, b) => b.total - a.total);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Reports</h1>
          {cycle && (
            <p className="mt-1 text-sm text-neutral-500">Cycle: {cycle.name}</p>
          )}
        </div>
        <div className="flex gap-3">
          <ReportExportButton cycleId={cycle?.id ?? ""} format="xlsx" />
          <ReportExportButton cycleId={cycle?.id ?? ""} format="csv" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CompletionDashboard sheets={sheets ?? []} />
        <ScoreDistributionChart distribution={distribution} />
      </div>

      <DepartmentReportTable rows={deptRows} />

      {/* Gamification Leaderboards */}
      <LeaderboardSection />
    </div>
  );
}

async function LeaderboardSection() {
  const { departmentCompletion, topPerformers } = await getLeaderboardData();
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Leaderboard
        title="Department Completion"
        entries={departmentCompletion}
      />
      <Leaderboard
        title="Top Performers"
        entries={topPerformers}
        metric=" pts"
      />
    </div>
  );
}
