import { requireAuth } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentWindow } from "@/lib/utils/window";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Target, ClipboardCheck, TrendingUp, Bell, ChevronRight } from "lucide-react";
import { ROUTES } from "@/lib/constants/routes";

export const metadata = { title: "Dashboard — AtomQuest" };

export default async function EmployeeDashboardPage() {
  const user = await requireAuth("employee");
  const supabase = await createServerSupabaseClient();
  const windowStatus = await getCurrentWindow();

  const { data: cycle } = await supabase
    .from("cycles")
    .select("id, name")
    .eq("is_active", true)
    .single();

  const { data: sheet } = cycle
    ? await supabase
        .from("goal_sheets")
        .select("id, status, is_locked, submitted_at, approved_at")
        .eq("employee_id", user.id)
        .eq("cycle_id", cycle.id)
        .maybeSingle()
    : { data: null };

  const { count: goalsCount } = await (sheet
    ? supabase.from("goals").select("id", { count: "exact", head: true }).eq("goal_sheet_id", sheet.id)
    : Promise.resolve({ count: 0 }));

  const { count: unreadCount } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  const statusColor: Record<string, string> = {
    draft: "bg-neutral-100 text-neutral-600",
    submitted: "bg-yellow-100 text-yellow-700",
    approved: "bg-green-100 text-green-700",
    returned: "bg-red-100 text-red-700",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">
          Welcome back, {user.full_name?.split(" ")[0] ?? "there"} 👋
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          {cycle ? `Active cycle: ${cycle.name}` : "No active cycle at the moment."}
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-50 p-2">
                <Target className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-neutral-500">Goals Added</p>
                <p className="text-2xl font-bold text-neutral-900">{goalsCount ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-50 p-2">
                <ClipboardCheck className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-neutral-500">Sheet Status</p>
                <p className="text-sm font-semibold text-neutral-700 mt-0.5">
                  {sheet ? (
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColor[sheet.status] ?? ""}`}>
                      {sheet.status.charAt(0).toUpperCase() + sheet.status.slice(1)}
                    </span>
                  ) : (
                    <span className="text-neutral-400">Not started</span>
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-orange-50 p-2">
                <Bell className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-xs text-neutral-500">Unread Notifications</p>
                <p className="text-2xl font-bold text-neutral-900">{unreadCount ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current window */}
      {windowStatus.phase && (
        <Card className="border-brand-teal/30 bg-brand-teal/5">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-brand-teal uppercase tracking-wide">Current Window Open</p>
                <p className="text-base font-semibold text-neutral-800 mt-0.5">{windowStatus.phase} phase</p>
                {windowStatus.closesAt && (
                  <p className="text-xs text-neutral-500 mt-0.5">Closes: {new Date(windowStatus.closesAt).toLocaleDateString()}</p>
                )}
              </div>
              <Badge className="bg-green-100 text-green-700">OPEN</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick actions */}
      <div>
        <h2 className="text-sm font-semibold text-neutral-600 uppercase tracking-wide mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link href={ROUTES.GOAL_SHEET}>
            <Card className="hover:border-brand-blue/40 hover:shadow-sm transition-all cursor-pointer">
              <CardContent className="pt-4 pb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Target className="h-5 w-5 text-brand-blue" />
                  <span className="text-sm font-medium text-neutral-700">My Goal Sheet</span>
                </div>
                <ChevronRight className="h-4 w-4 text-neutral-400" />
              </CardContent>
            </Card>
          </Link>
          <Link href={ROUTES.CHECKINS}>
            <Card className="hover:border-brand-blue/40 hover:shadow-sm transition-all cursor-pointer">
              <CardContent className="pt-4 pb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ClipboardCheck className="h-5 w-5 text-brand-blue" />
                  <span className="text-sm font-medium text-neutral-700">Quarterly Check-ins</span>
                </div>
                <ChevronRight className="h-4 w-4 text-neutral-400" />
              </CardContent>
            </Card>
          </Link>
          <Link href={ROUTES.PROGRESS}>
            <Card className="hover:border-brand-blue/40 hover:shadow-sm transition-all cursor-pointer">
              <CardContent className="pt-4 pb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-brand-blue" />
                  <span className="text-sm font-medium text-neutral-700">View Progress</span>
                </div>
                <ChevronRight className="h-4 w-4 text-neutral-400" />
              </CardContent>
            </Card>
          </Link>
          <Link href={ROUTES.NOTIFICATIONS}>
            <Card className="hover:border-brand-blue/40 hover:shadow-sm transition-all cursor-pointer">
              <CardContent className="pt-4 pb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-brand-blue" />
                  <span className="text-sm font-medium text-neutral-700">Notifications</span>
                  {(unreadCount ?? 0) > 0 && (
                    <Badge className="bg-red-100 text-red-600 text-xs px-1.5 py-0">{unreadCount}</Badge>
                  )}
                </div>
                <ChevronRight className="h-4 w-4 text-neutral-400" />
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
