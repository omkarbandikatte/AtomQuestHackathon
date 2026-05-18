import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/constants/routes";
import { getCurrentWindow } from "@/lib/utils/window";
import { AdminStatCards } from "@/components/admin/AdminStatCards";
import { CycleStatusCard } from "@/components/admin/CycleStatusCard";
import { CompletionBarChart } from "@/components/admin/CompletionBarChart";
import { RecentAuditFeed } from "@/components/admin/RecentAuditFeed";
import { WindowControlCard } from "@/components/admin/WindowControlCard";
import { AIInsightsDashboard } from "@/components/ai/AIInsightsDashboard";
import Link from "next/link";
import { Settings, Users, LockOpen, FileText, BarChart3 } from "lucide-react";

export const metadata = { title: "Admin Dashboard — AtomQuest" };

export default async function AdminDashboardPage() {
  const authClient = await createServerSupabaseClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) redirect(ROUTES.LOGIN);

  const supabase = createAdminClient();

  const [
    { data: cycle },
    { data: userCounts },
    { data: sheetStats },
    { data: recentAudit },
    windowStatus,
  ] = await Promise.all([
    supabase.from("cycles").select("*").eq("is_active", true).single(),
    supabase.from("users").select("id, role, is_active"),
    supabase
      .from("goal_sheets")
      .select("status, is_locked")
      .eq("cycle_id", (await supabase.from("cycles").select("id").eq("is_active", true).single()).data?.id ?? ""),
    supabase
      .from("audit_log")
      .select("id, action, changed_at, actor:users!audit_log_actor_id_fkey(full_name)")
      .order("changed_at", { ascending: false })
      .limit(8) as any,
    getCurrentWindow(),
  ]);

  const totalEmployees = userCounts?.filter((u) => u.role === "employee" && u.is_active).length ?? 0;
  const totalManagers = userCounts?.filter((u) => u.role === "manager" && u.is_active).length ?? 0;
  const submittedSheets = sheetStats?.filter((s) => s.status === "submitted").length ?? 0;
  const approvedSheets = sheetStats?.filter((s) => s.status === "approved").length ?? 0;
  const draftSheets = sheetStats?.filter((s) => s.status === "draft").length ?? 0;
  const returnedSheets = sheetStats?.filter((s) => s.status === "returned").length ?? 0;
  const totalSheets = sheetStats?.length ?? 0;

  const deptStats = [
    { label: "Approved", value: approvedSheets, color: "#16A34A" },
    { label: "Submitted", value: submittedSheets, color: "#F59E0B" },
    { label: "Draft", value: draftSheets, color: "#94A3B8" },
    { label: "Returned", value: returnedSheets, color: "#DC2626" },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-neutral-500">
          {cycle ? `Active cycle: ${cycle.name}` : "No active cycle"}
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { label: "Manage Cycles", href: "/cycles", icon: Settings, color: "bg-brand-teal/10 text-brand-teal border-brand-teal/20" },
          { label: "Manage Users", href: "/users", icon: Users, color: "bg-brand-blue/10 text-brand-blue border-brand-blue/20" },
          { label: "Unlock Sheets", href: "/unlock", icon: LockOpen, color: "bg-brand-amber/10 text-brand-amber border-brand-amber/20" },
          { label: "Audit Log", href: "/audit-log", icon: FileText, color: "bg-neutral-100 text-neutral-700 border-neutral-200" },
          { label: "Reports", href: "/reports", icon: BarChart3, color: "bg-brand-green/10 text-brand-green border-brand-green/20" },
        ].map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition-all hover:shadow-md ${action.color}`}
          >
            <action.icon className="h-5 w-5 shrink-0" />
            <span>{action.label}</span>
          </Link>
        ))}
      </div>

      <AdminStatCards
        totalEmployees={totalEmployees}
        totalManagers={totalManagers}
        approvedSheets={approvedSheets}
        pendingSheets={submittedSheets}
        totalSheets={totalSheets}
        currentPhase={windowStatus.phase}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {cycle && (
            <CycleStatusCard cycle={cycle} />
          )}
          <CompletionBarChart segments={deptStats} total={totalSheets} />
          <AIInsightsDashboard />
        </div>
        <div className="space-y-4">
          <WindowControlCard windowStatus={windowStatus} cycleId={cycle?.id ?? null} />
          <RecentAuditFeed entries={recentAudit ?? []} />
        </div>
      </div>
    </div>
  );
}
