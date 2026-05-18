import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/constants/routes";
import { getCurrentWindow } from "@/lib/utils/window";
import { CycleConfigForm } from "@/components/admin/CycleConfigForm";
import { CycleStatusCard } from "@/components/admin/CycleStatusCard";
import { CycleListTable } from "@/components/admin/CycleListTable";
import { WindowControlCard } from "@/components/admin/WindowControlCard";

export const metadata = { title: "Cycle Configuration — AtomQuest" };

export default async function CyclesPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(ROUTES.LOGIN);

  const [{ data: cycles }, windowStatus] = await Promise.all([
    supabase
      .from("cycles")
      .select("*")
      .order("goal_setting_opens", { ascending: false }),
    getCurrentWindow(),
  ]);

  const activeCycle = cycles?.find((c) => c.is_active);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Cycle Configuration</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Manage goal-setting and check-in windows
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {activeCycle && <CycleStatusCard cycle={activeCycle} />}
          <CycleListTable cycles={cycles ?? []} activeCycleId={activeCycle?.id ?? null} />
        </div>
        <div>
          <WindowControlCard windowStatus={windowStatus} cycleId={activeCycle?.id ?? null} />
        </div>
      </div>

      <CycleConfigForm cycles={cycles ?? []} />
    </div>
  );
}
