import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/constants/routes";
import { AuditLogTable } from "@/components/admin/AuditLogTable";

export const metadata = { title: "Audit Log — AtomQuest" };

export default async function AuditLogPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(ROUTES.LOGIN);

  const { data: entries } = await supabase
    .from("audit_log")
    .select(
      `
      *, 
      actor:users!audit_log_actor_id_fkey(id, full_name, email),
      goal_sheet:goal_sheets(id, employee:users!goal_sheets_employee_fk(full_name))
    `,
    )
    .order("changed_at", { ascending: false })
    .limit(500) as any;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Audit Log</h1>
        <p className="mt-1 text-sm text-neutral-500">
          All post-lock mutations — append-only, exportable
        </p>
      </div>

      <AuditLogTable entries={entries ?? []} />
    </div>
  );
}
