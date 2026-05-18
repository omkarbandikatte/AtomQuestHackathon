"use client";

import { cn } from "@/lib/utils/cn";
import { ProgressGauge } from "./ProgressGauge";
import { getScoreColor } from "@/lib/utils/progress";
import { CheckCircle, Circle, Clock } from "lucide-react";
import type { WindowPhase } from "@/types/app.types";

interface QuarterData {
  quarter: string;
  averageScore: number | null;
  completedCount: number;
  goalCount: number;
  isActive: boolean;
}

interface Props {
  quarters: QuarterData[];
  activeQuarter: WindowPhase;
  className?: string;
}

export function QuarterlyTimeline({ quarters, activeQuarter, className }: Props) {
  return (
    <div className={cn("flex items-center gap-0", className)}>
      {quarters.map((q, idx) => {
        const isActive = q.quarter === activeQuarter;
        const hasFutureData = q.averageScore === null && !isActive;
        const isComplete = q.completedCount === q.goalCount && q.goalCount > 0;

        return (
          <div key={q.quarter} className="flex items-center">
            {/* Quarter node */}
            <div className={cn(
              "flex flex-col items-center gap-1.5 px-3 py-2 rounded-lg transition-colors",
              isActive && "bg-brand-blue/5 ring-1 ring-brand-blue/20",
            )}>
              {/* Status icon or gauge */}
              {q.averageScore != null ? (
                <ProgressGauge score={q.averageScore} size="xs" showLabel={false} />
              ) : isActive ? (
                <div className="h-10 w-10 rounded-full bg-brand-blue/10 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-brand-blue" />
                </div>
              ) : (
                <div className="h-10 w-10 rounded-full bg-neutral-100 flex items-center justify-center">
                  <Circle className="h-4 w-4 text-neutral-300" />
                </div>
              )}

              {/* Quarter label */}
              <span className={cn(
                "text-xs font-semibold",
                isActive ? "text-brand-blue" : "text-neutral-600",
              )}>
                {q.quarter}
              </span>

              {/* Score text */}
              {q.averageScore != null && (
                <span className={cn(
                  "text-[10px] font-bold tabular-nums",
                  `text-brand-${getScoreColor(q.averageScore) === "red" ? "red" : getScoreColor(q.averageScore) === "amber" ? "amber" : "teal"}`,
                )}>
                  {Math.round(q.averageScore)}%
                </span>
              )}

              {/* Completion badge */}
              {isComplete && (
                <span className="text-[9px] text-brand-green flex items-center gap-0.5">
                  <CheckCircle className="h-2.5 w-2.5" />
                  Done
                </span>
              )}

              {isActive && !isComplete && (
                <span className="text-[9px] text-brand-blue">
                  {q.completedCount}/{q.goalCount}
                </span>
              )}
            </div>

            {/* Connector line */}
            {idx < quarters.length - 1 && (
              <div className={cn(
                "h-0.5 w-8",
                q.averageScore != null ? "bg-brand-teal/40" : "bg-neutral-200",
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}
