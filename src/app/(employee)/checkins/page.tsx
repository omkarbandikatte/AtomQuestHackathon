import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/constants/routes";
import { getCurrentWindow } from "@/lib/utils/window";
import { EmptyState } from "@/components/shared/EmptyState";
import { CheckinPageClient } from "@/components/checkins/CheckinPageClient";

export const metadata = { title: "Check-ins — AtomQuest" };

export default async function CheckinsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(ROUTES.LOGIN);

  const windowStatus = await getCurrentWindow();

  const { data: cycle } = await supabase
    .from("cycles")
    .select("id, name")
    .eq("is_active", true)
    .single();

  const { data: sheet } = cycle
    ? await supabase
        .from("goal_sheets")
        .select("id, is_locked, status")
        .eq("employee_id", user.id)
        .eq("cycle_id", cycle.id)
        .single()
    : { data: null };

  // Only show check-ins if sheet is approved/locked
  if (!sheet || !sheet.is_locked || sheet.status !== "approved") {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Check-ins</h1>
          {cycle && (
            <p className="mt-1 text-sm text-neutral-500">Cycle: {cycle.name}</p>
          )}
        </div>
        <EmptyState
          title="No goals to check in"
          description="Your goal sheet must be approved and locked before you can log check-in progress."
        />
      </div>
    );
  }

  const { data: goals } = await supabase
    .from("goals")
    .select("id, title, thrust_area, uom_type, target_value, target_date, weightage, is_shared, sort_order, checkins(*)")
    .eq("goal_sheet_id", sheet.id)
    .order("sort_order");

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Check-ins</h1>
        {cycle && (
          <p className="mt-1 text-sm text-neutral-500">
            Cycle: {cycle.name}
            {windowStatus.phase && windowStatus.phase !== "goal_setting" && ` · Active: ${windowStatus.phase}`}
          </p>
        )}
      </div>

      <CheckinPageClient
        sheetId={sheet.id}
        goals={(goals ?? []) as any}
        windowStatus={windowStatus}
        cycleName={cycle?.name ?? ""}
      />
    </div>
  );
}
