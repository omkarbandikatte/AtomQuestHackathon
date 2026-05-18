import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/constants/routes";
import { getCurrentWindow } from "@/lib/utils/window";
import { EmptyState } from "@/components/shared/EmptyState";
import { ManagerCheckinPanel } from "@/components/manager/ManagerCheckinPanel";
import { WindowStatusBanner } from "@/components/checkins/WindowStatusBanner";

export const metadata = { title: "Team Check-ins — AtomQuest" };

export default async function ManagerCheckinsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(ROUTES.LOGIN);

  const windowStatus = await getCurrentWindow();
  const activeQuarter = windowStatus.phase;

  const { data: cycle } = await supabase
    .from("cycles")
    .select("id, name")
    .eq("is_active", true)
    .single();

  const { data: directReports } = await supabase
    .from("users")
    .select(
      `
      id, full_name, email,
      goal_sheets(
        id, status, is_locked, cycle_id,
        goals(id, title, thrust_area, uom_type, target_value, weightage,
          checkins(id, quarter, actual_value, status, progress_score, manager_comment)
        )
      )
    `,
    )
    .eq("manager_id", user.id)
    .eq("is_active", true)
    .order("full_name") as any;

  const approvedReports = directReports?.filter((r: any) =>
    r.goal_sheets?.some(
      (s: { cycle_id: string; status: string }) =>
        s.cycle_id === cycle?.id && s.status === "approved",
    ),
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Team Check-ins</h1>
        {cycle && activeQuarter && (
          <p className="mt-1 text-sm text-neutral-500">
            {cycle.name} · {activeQuarter} Review
          </p>
        )}
      </div>

      <WindowStatusBanner windowStatus={windowStatus} context="checkin" />

      {approvedReports && approvedReports.length > 0 ? (
        <div className="space-y-6">
          {approvedReports.map((member: any) => {
            const sheet = member.goal_sheets?.find(
              (s: { cycle_id: string }) => s.cycle_id === cycle?.id,
            );
            return (
              <ManagerCheckinPanel
                key={member.id}
                member={member}
                sheet={sheet}
                activeQuarter={activeQuarter}
                managerId={user.id}
              />
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No approved sheets yet"
          description="Check-in reviews are available once your team members' goal sheets are approved."
        />
      )}
    </div>
  );
}
