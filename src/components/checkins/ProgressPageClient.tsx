"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProgressGauge } from "./ProgressGauge";
import { ProgressSummaryCard } from "./ProgressSummaryCard";
import { QuarterlyTimeline } from "./QuarterlyTimeline";
import { RealtimeCheckinProvider } from "./RealtimeCheckinProvider";
import { getUomLabel, getScoreColorClass, formatScore } from "@/lib/utils/progress";
import { SharedGoalBadge } from "@/components/goals/SharedGoalBadge";
import { cn } from "@/lib/utils/cn";
import type { WindowPhase, Checkin } from "@/types/app.types";

const QUARTERS = ["Q1", "Q2", "Q3", "Q4"] as const;

interface GoalWithCheckins {
  id: string;
  title: string;
  thrust_area: string;
  uom_type: string;
  target_value: number | null;
  target_date: string | null;
  weightage: number;
  is_shared: boolean;
  sort_order: number;
  checkins: Checkin[];
}

interface Props {
  sheetId: string;
  goals: GoalWithCheckins[];
  activeQuarter: WindowPhase;
  cycleName: string;
}

export function ProgressPageClient({ sheetId, goals, activeQuarter, cycleName }: Props) {
  const goalIds = goals.map((g) => g.id);

  // Compute quarter progress for the summary card
  const quarterProgress = QUARTERS.map((q) => {
    const qCheckins = goals.flatMap((g) => g.checkins.filter((c) => c.quarter === q));
    const scores = qCheckins.map((c) => c.progress_score).filter((s): s is number => s != null);
    return {
      quarter: q,
      goalCount: goals.length,
      completedCount: qCheckins.filter((c) => c.status === "completed").length,
      averageScore: scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null,
      checkins: qCheckins,
    };
  });

  // Timeline data
  const timelineQuarters = QUARTERS.map((q) => ({
    quarter: q,
    averageScore: quarterProgress.find((p) => p.quarter === q)?.averageScore ?? null,
    completedCount: quarterProgress.find((p) => p.quarter === q)?.completedCount ?? 0,
    goalCount: goals.length,
    isActive: q === activeQuarter,
  }));

  return (
    <RealtimeCheckinProvider sheetId={sheetId} goalIds={goalIds}>
      <div className="space-y-6">
        {/* Summary card */}
        <ProgressSummaryCard quarters={quarterProgress} />

        {/* Timeline */}
        <Card>
          <CardContent className="py-4">
            <QuarterlyTimeline quarters={timelineQuarters} activeQuarter={activeQuarter} />
          </CardContent>
        </Card>

        {/* Per-goal breakdown */}
        <div className="grid gap-4">
          {goals.map((goal) => (
            <GoalProgressCard key={goal.id} goal={goal} activeQuarter={activeQuarter} />
          ))}
        </div>
      </div>
    </RealtimeCheckinProvider>
  );
}

function GoalProgressCard({ goal, activeQuarter }: { goal: GoalWithCheckins; activeQuarter: WindowPhase }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <Badge variant="teal" className="text-[10px]">{goal.thrust_area}</Badge>
              <Badge variant="outline" className="text-[10px] font-mono">{getUomLabel(goal.uom_type)}</Badge>
              <Badge variant="secondary" className="text-[10px]">{goal.weightage}%</Badge>
              {goal.is_shared && <SharedGoalBadge />}
            </div>
            <CardTitle className="text-sm">{goal.title}</CardTitle>
            <p className="text-xs text-neutral-500 mt-0.5">
              Target: {goal.target_value ?? goal.target_date ?? "N/A"}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-4">
          {QUARTERS.map((q) => {
            const checkin = goal.checkins.find((c) => c.quarter === q);
            const isActive = q === activeQuarter;

            return (
              <div
                key={q}
                className={cn(
                  "flex flex-col items-center gap-2 py-2 rounded-lg",
                  isActive && "bg-brand-blue/5 ring-1 ring-brand-blue/10",
                )}
              >
                <span className={cn(
                  "text-xs font-semibold",
                  isActive ? "text-brand-blue" : "text-neutral-500",
                )}>
                  {q}
                </span>
                <ProgressGauge score={checkin?.progress_score ?? null} size="sm" />
                {checkin && (
                  <div className="text-center space-y-0.5">
                    <p className="text-[10px] text-neutral-600 capitalize">
                      {checkin.status?.replace("_", " ") ?? "—"}
                    </p>
                    {checkin.actual_value != null && (
                      <p className="text-[10px] text-neutral-400">
                        Actual: {checkin.actual_value}
                      </p>
                    )}
                    {checkin.manager_comment && (
                      <p className="text-[9px] text-brand-blue italic truncate max-w-[80px]">
                        💬 Reviewed
                      </p>
                    )}
                  </div>
                )}
                {!checkin && (
                  <span className="text-[10px] text-neutral-300">No data</span>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
