import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/constants/routes";
import { UnlockSheetClient } from "@/components/admin/UnlockSheetClient";

export const metadata = { title: "Unlock Sheets — AtomQuest" };

export default async function UnlockPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(ROUTES.LOGIN);

  const { data: sheets } = await supabase
    .from("goal_sheets")
    .select(
      `
      id, approved_at, status,
      employee:users!goal_sheets_employee_fk(id, full_name, email, department),
      cycle:cycles(id, name)
    `,
    )
    .eq("is_locked", true)
    .order("approved_at", { ascending: false }) as any;

  // Fetch recent unlock audit entries
  const { data: recentUnlocks } = await supabase
    .from("audit_log")
    .select("id, goal_sheet_id, changed_at, reason, actor:users!audit_log_actor_id_fkey(full_name)")
    .eq("action", "UNLOCK")
    .order("changed_at", { ascending: false })
    .limit(20) as any;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Unlock Sheets</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Unlock approved goal sheets to allow post-approval edits. Every unlock is
          written to the audit log.
        </p>
      </div>

      <UnlockSheetClient
        sheets={sheets as {
          id: string;
          approved_at: string | null;
          status: string;
          employee: { id: string; full_name: string; email: string; department: string | null } | null;
          cycle: { id: string; name: string } | null;
        }[]}
        recentUnlocks={recentUnlocks ?? []}
      />
    </div>
  );
}
