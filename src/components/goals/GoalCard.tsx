"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LockBadge } from "./LockBadge";
import { SharedGoalBadge } from "./SharedGoalBadge";
import { UOM_LABELS } from "@/lib/constants/goal-rules";
import { formatScore } from "@/lib/utils/progress";
import { cn } from "@/lib/utils/cn";
import { InlineGoalEditor } from "@/components/manager/InlineGoalEditor";
import { RiskDetector } from "@/components/ai/RiskDetector";
import type { Goal, Checkin } from "@/types/app.types";

interface GoalCardProps {
  goal: Goal;
  latestCheckin?: Checkin | null;
  isLocked: boolean;
  quarter?: string;
  showManagerEdit?: boolean;
  showRiskAssessment?: boolean;
  onGoalEdited?: () => void;
  className?: string;
}

export function GoalCard({
  goal,
  latestCheckin,
  isLocked,
  quarter,
  showManagerEdit,
  showRiskAssessment,
  onGoalEdited,
  className,
}: GoalCardProps) {
  return (
    <Card className={cn("relative", className)}>
      {isLocked && (
        <div className="absolute top-3 right-3">
          <LockBadge />
        </div>
      )}

      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center gap-2 pr-24">
          <Badge variant="teal" className="text-xs">
            {goal.thrust_area}
          </Badge>
          {goal.is_shared && <SharedGoalBadge />}
          <Badge variant="outline" className="text-xs font-mono">
            {UOM_LABELS[goal.uom_type as keyof typeof UOM_LABELS] ?? goal.uom_type}
          </Badge>
          <Badge variant="secondary" className="text-xs ml-auto">
            {goal.weightage}%
          </Badge>
        </div>

        <h3
          className={cn(
            "text-sm font-semibold text-neutral-900 mt-2",
            goal.is_shared && !goal.shared_owner_id && "opacity-60",
          )}
        >
          {goal.title}
        </h3>
        {goal.description && (
          <p className="text-xs text-neutral-500 mt-1">{goal.description}</p>
        )}
      </CardHeader>

      <CardContent className="text-xs text-neutral-500 space-y-1">
        <div className="flex justify-between">
          <span>Target</span>
          <span className="font-medium text-neutral-900">
            {goal.target_value ?? goal.target_date ?? "—"}
          </span>
        </div>

        {quarter && latestCheckin && (
          <>
            <div className="flex justify-between">
              <span>{quarter} Actual</span>
              <span className="font-medium text-neutral-900">
                {latestCheckin.actual_value ?? latestCheckin.completion_date ?? "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Progress Score</span>
              <span className="font-semibold text-brand-teal">
                {formatScore(latestCheckin.progress_score)}
              </span>
            </div>
          </>
        )}

        {showManagerEdit && !isLocked && (
          <InlineGoalEditor goal={goal} onSaved={onGoalEdited} />
        )}

        {showRiskAssessment && (
          <RiskDetector goalId={goal.id} goalTitle={goal.title} />
        )}
      </CardContent>
    </Card>
  );
}
