import { requireAuth } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentWindow } from "@/lib/utils/window";
import { GoalCard } from "@/components/goals/GoalCard";
import { LockBadge } from "@/components/goals/LockBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Target, AlertTriangle } from "lucide-react";
import Link from "next/link";
import type { Goal } from "@/types/app.types";

export const metadata = { title: "My Goal Sheet — AtomQuest" };

export default async function GoalSheetPage() {
  const user = await requireAuth("employee");
  const supabase = await createServerSupabaseClient();

  // Fetch active cycle
  const { data: cycle } = await supabase
    .from("cycles")
    .select("id, name")
    .eq("is_active", true)
    .single();

  // Fetch goal sheet for this employee + active cycle
  const { data: sheet } = cycle
    ? await supabase
        .from("goal_sheets")
        .select("id, status, is_locked, submitted_at, approved_at, return_comment")
        .eq("employee_id", user.id)
        .eq("cycle_id", cycle.id)
        .maybeSingle()
    : { data: null };

  let goals: Goal[] = [];
  if (sheet) {
    const { data } = await supabase
      .from("goals")
      .select("*")
      .eq("goal_sheet_id", sheet.id)
      .order("sort_order", { ascending: true });
    goals = (data ?? []) as Goal[];
  }

  const windowStatus = await getCurrentWindow();
  const isGoalSettingOpen = windowStatus.phase === "goal_setting";
  const isLocked = sheet?.is_locked ?? false;
  const canEdit =
    !isLocked && isGoalSettingOpen && sheet?.status !== "submitted";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">My Goal Sheet</h1>
          {cycle && (
            <p className="mt-1 text-sm text-neutral-500">Cycle: {cycle.name}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {isLocked && <LockBadge />}
          {sheet && !isLocked && (
            <StatusBadge status={sheet.status} />
          )}
          {canEdit && (
            <Button
              className="bg-brand-blue hover:bg-brand-blue/90"
              asChild
            >
              <Link href="/goal-sheet/edit">
                <Target className="mr-2 h-4 w-4" />
                {sheet ? "Edit Goals" : "Create Goal Sheet"}
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Returned for rework banner */}
      {sheet?.status === "returned" && sheet.return_comment && (
        <div className="flex gap-3 rounded-lg border border-brand-amber/40 bg-brand-amber/5 p-4">
          <AlertTriangle className="h-5 w-5 text-brand-amber shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-neutral-900">
              Returned for Rework
            </p>
            <p className="mt-1 text-sm text-neutral-600">
              {sheet.return_comment}
            </p>
          </div>
        </div>
      )}

      {/* Submitted banner */}
      {sheet?.status === "submitted" && (
        <div className="rounded-lg border border-brand-blue/20 bg-brand-blue/5 p-4">
          <p className="text-sm text-brand-blue font-medium">
            Your goal sheet has been submitted and is pending manager approval.
          </p>
          {sheet.submitted_at && (
            <p className="mt-1 text-xs text-neutral-500">
              Submitted on{" "}
              {new Date(sheet.submitted_at).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          )}
        </div>
      )}

      {/* Weightage summary bar */}
      {goals.length > 0 && (
        <div className="flex items-center gap-4 rounded-lg bg-white border p-3">
          <span className="text-xs text-neutral-500">
            Goals: <strong className="text-neutral-900">{goals.length}</strong>
          </span>
          <span className="text-xs text-neutral-500">
            Total Weightage:{" "}
            <strong className="text-neutral-900">
              {goals.reduce((s, g) => s + g.weightage, 0)}%
            </strong>
          </span>
          <span className="text-xs text-neutral-500">
            Shared:{" "}
            <strong className="text-neutral-900">
              {goals.filter((g) => g.is_shared).length}
            </strong>
          </span>
        </div>
      )}

      {/* Goal list */}
      {goals.length > 0 ? (
        <div className="space-y-4">
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} isLocked={isLocked} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No goals yet"
          description={
            isGoalSettingOpen
              ? "Start by creating your goal sheet for this cycle."
              : "Goal setting window is not open. Check back when the next cycle begins."
          }
          action={
            isGoalSettingOpen ? (
              <Button asChild className="bg-brand-blue hover:bg-brand-blue/90">
                <Link href="/goal-sheet/edit">
                  <Target className="mr-2 h-4 w-4" />
                  Create Goal Sheet
                </Link>
              </Button>
            ) : undefined
          }
        />
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
    draft: { label: "Draft", variant: "secondary" },
    submitted: { label: "Submitted", variant: "default" },
    returned: { label: "Returned", variant: "outline" },
    approved: { label: "Approved", variant: "default" },
  };

  const { label, variant } = config[status] ?? { label: status, variant: "secondary" };

  return <Badge variant={variant}>{label}</Badge>;
}
