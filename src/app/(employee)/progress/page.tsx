import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/constants/routes";
import { getCurrentWindow } from "@/lib/utils/window";
import { EmptyState } from "@/components/shared/EmptyState";
import { ProgressPageClient } from "@/components/checkins/ProgressPageClient";

export const metadata = { title: "Progress — AtomQuest" };

export default async function ProgressPage() {
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

  if (!sheet || !sheet.is_locked) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Progress Overview</h1>
          {cycle && (
            <p className="mt-1 text-sm text-neutral-500">Cycle: {cycle.name}</p>
          )}
        </div>
        <EmptyState
          title="No progress data yet"
          description="Progress scores appear after your goal sheet is approved and check-ins are submitted."
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
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Progress Overview</h1>
        {cycle && (
          <p className="mt-1 text-sm text-neutral-500">Cycle: {cycle.name}</p>
        )}
      </div>

      <ProgressPageClient
        sheetId={sheet.id}
        goals={(goals ?? []) as any}
        activeQuarter={windowStatus.phase}
        cycleName={cycle?.name ?? ""}
      />
    </div>
  );
}
