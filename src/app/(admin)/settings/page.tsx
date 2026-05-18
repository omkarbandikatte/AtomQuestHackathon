import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/constants/routes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings, Users, Calendar, Shield, Database } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Settings — AtomQuest" };

export default async function SettingsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(ROUTES.LOGIN);

  const adminClient = createAdminClient();

  const [{ count: userCount }, { count: cycleCount }, { data: activeCycle }] = await Promise.all([
    adminClient.from("users").select("id", { count: "exact", head: true }).eq("is_active", true),
    adminClient.from("cycles").select("id", { count: "exact", head: true }),
    adminClient.from("cycles").select("name, goal_setting_opens, cycle_closes").eq("is_active", true).single(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Settings</h1>
        <p className="text-sm text-neutral-500 mt-1">System overview and configuration shortcuts.</p>
      </div>

      {/* System info */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-50 p-2">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-neutral-500">Active Users</p>
                <p className="text-2xl font-bold text-neutral-900">{userCount ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-50 p-2">
                <Calendar className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-neutral-500">Total Cycles</p>
                <p className="text-2xl font-bold text-neutral-900">{cycleCount ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-50 p-2">
                <Shield className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-neutral-500">Active Cycle</p>
                <p className="text-sm font-semibold text-neutral-700 truncate max-w-[100px]">
                  {activeCycle?.name ?? "None"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick config links */}
      <div>
        <h2 className="text-sm font-semibold text-neutral-600 uppercase tracking-wide mb-3">Configuration</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label: "Manage Users", description: "Add, edit, or deactivate user accounts", href: ROUTES.USERS, icon: Users },
            { label: "Cycle Configuration", description: "Set goal-setting and check-in windows", href: ROUTES.CYCLES, icon: Calendar },
            { label: "Unlock Sheets", description: "Unlock submitted goal sheets for editing", href: ROUTES.UNLOCK, icon: Database },
            { label: "Audit Log", description: "View all system activity", href: ROUTES.AUDIT_LOG, icon: Shield },
          ].map((item) => (
            <Link key={item.href} href={item.href}>
              <Card className="hover:border-brand-blue/40 hover:shadow-sm transition-all cursor-pointer h-full">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-neutral-100 p-2 mt-0.5">
                      <item.icon className="h-4 w-4 text-neutral-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-neutral-800">{item.label}</p>
                      <p className="text-xs text-neutral-400 mt-0.5">{item.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
