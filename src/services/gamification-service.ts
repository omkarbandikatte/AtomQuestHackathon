import { createAdminClient } from "@/lib/supabase/admin";
import type { LeaderboardEntry } from "@/components/gamification/Leaderboard";

export async function getLeaderboardData(): Promise<{
  departmentCompletion: LeaderboardEntry[];
  topPerformers: LeaderboardEntry[];
}> {
  const admin = createAdminClient();

  // Get all employees with their goal sheets
  const { data: employees } = await admin
    .from("users")
    .select("id, full_name, department, role")
    .eq("is_active", true)
    .eq("role", "employee");

  const { data: sheets } = await admin
    .from("goal_sheets")
    .select("employee_id, status, approved_at, submitted_at");

  const empList = employees ?? [];
  const sheetList = sheets ?? [];

  // Department completion
  const deptMap: Record<string, { total: number; approved: number }> = {};
  for (const emp of empList) {
    const dept = emp.department ?? "Unknown";
    if (!deptMap[dept]) deptMap[dept] = { total: 0, approved: 0 };
    deptMap[dept].total++;
    const sheet = sheetList.find((s) => s.employee_id === emp.id);
    if (sheet?.status === "approved") deptMap[dept].approved++;
  }

  const departmentCompletion: LeaderboardEntry[] = Object.entries(deptMap)
    .map(([dept, stats]) => ({
      name: dept,
      department: `${stats.total} members`,
      score: stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0,
      rank: 0,
    }))
    .sort((a, b) => b.score - a.score)
    .map((e, i) => ({ ...e, rank: i + 1 }));

  // Top performers (earliest submitters)
  const topPerformers: LeaderboardEntry[] = empList
    .map((emp) => {
      const sheet = sheetList.find((s) => s.employee_id === emp.id);
      const hasSubmitted = sheet?.status === "submitted" || sheet?.status === "approved";
      return {
        name: emp.full_name,
        department: emp.department ?? "—",
        score: sheet?.status === "approved" ? 100 : sheet?.status === "submitted" ? 75 : sheet?.status === "draft" ? 25 : 0,
        rank: 0,
        badge: sheet?.status === "approved" ? "🏆" : sheet?.status === "submitted" ? "📝" : undefined,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map((e, i) => ({ ...e, rank: i + 1 }));

  return { departmentCompletion, topPerformers };
}
