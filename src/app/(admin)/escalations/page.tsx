import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/constants/routes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/EmptyState";
import { AlertTriangle, Clock, User } from "lucide-react";

export const metadata = { title: "Escalations — AtomQuest" };

export default async function EscalationsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(ROUTES.LOGIN);

  const adminClient = createAdminClient();

  // Get employees whose sheets are returned (needing resubmission) or overdue
  const { data: cycle } = await adminClient
    .from("cycles")
    .select("id, name, q1_opens")
    .eq("is_active", true)
    .single();

  const { data: returnedSheets } = cycle
    ? await adminClient
        .from("goal_sheets")
        .select(
          `id, status, return_comment, updated_at,
           employee:users!goal_sheets_employee_fk(full_name, email, department)`
        )
        .eq("cycle_id", cycle.id)
        .eq("status", "returned")
        .order("updated_at", { ascending: false })
    : { data: [] };

  // Employees who haven't submitted at all and window is open
  const { data: notStarted } = cycle
    ? await adminClient
        .from("users")
        .select("id, full_name, email, department")
        .eq("role", "employee")
        .eq("is_active", true)
        .not(
          "id",
          "in",
          `(SELECT employee_id FROM goal_sheets WHERE cycle_id = '${cycle.id}')`
        )
    : { data: [] };

  const returned = returnedSheets ?? [];
  const pending = notStarted ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Escalations</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Goal sheets requiring attention
          {cycle ? ` · ${cycle.name}` : ""}.
        </p>
      </div>

      {/* Returned sheets */}
      <div>
        <h2 className="text-sm font-semibold text-neutral-600 uppercase tracking-wide mb-3 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          Returned Sheets ({returned.length})
        </h2>
        {returned.length === 0 ? (
          <p className="text-sm text-neutral-400 pl-1">No returned sheets.</p>
        ) : (
          <div className="space-y-3">
            {returned.map((sheet: any) => (
              <Card key={sheet.id} className="border-red-100">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-red-50 p-2 mt-0.5">
                        <User className="h-4 w-4 text-red-500" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-neutral-800">
                          {sheet.employee?.full_name}
                        </p>
                        <p className="text-xs text-neutral-400">{sheet.employee?.department}</p>
                        {sheet.return_comment && (
                          <p className="text-xs text-neutral-500 mt-1 italic">
                            &ldquo;{sheet.return_comment}&rdquo;
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <Badge className="bg-red-100 text-red-700 text-xs">Returned</Badge>
                      <p className="text-xs text-neutral-300 mt-1">
                        {new Date(sheet.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Employees who haven't started */}
      <div>
        <h2 className="text-sm font-semibold text-neutral-600 uppercase tracking-wide mb-3 flex items-center gap-2">
          <Clock className="h-4 w-4 text-yellow-500" />
          Not Started ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <p className="text-sm text-neutral-400 pl-1">All employees have started their sheets.</p>
        ) : (
          <div className="space-y-2">
            {pending.map((emp: any) => (
              <Card key={emp.id} className="border-yellow-100">
                <CardContent className="pt-3 pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-neutral-800">{emp.full_name}</p>
                      <p className="text-xs text-neutral-400">{emp.department} · {emp.email}</p>
                    </div>
                    <Badge className="bg-yellow-100 text-yellow-700 text-xs">Not Started</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
