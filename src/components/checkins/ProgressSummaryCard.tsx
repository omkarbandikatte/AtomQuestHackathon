"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressGauge } from "./ProgressGauge";
import { formatScore, getScoreColorClass } from "@/lib/utils/progress";
import { cn } from "@/lib/utils/cn";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { QuarterProgress } from "@/services/checkin-service";

interface Props {
  quarters: QuarterProgress[];
  className?: string;
}

export function ProgressSummaryCard({ quarters, className }: Props) {
  // Overall weighted average across all quarters with data
  const quartersWithData = quarters.filter((q) => q.averageScore != null);
  const overallScore = quartersWithData.length > 0
    ? quartersWithData.reduce((sum, q) => sum + (q.averageScore ?? 0), 0) / quartersWithData.length
    : null;

  // Trend: compare last two quarters with data
  const trend = computeTrend(quartersWithData);

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Overall Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          <ProgressGauge score={overallScore} size="lg" />

          <div className="flex-1 space-y-3">
            {/* Trend indicator */}
            <div className="flex items-center gap-2">
              {trend === "up" && (
                <>
                  <TrendingUp className="h-4 w-4 text-brand-green" />
                  <span className="text-xs text-brand-green font-medium">Improving</span>
                </>
              )}
              {trend === "down" && (
                <>
                  <TrendingDown className="h-4 w-4 text-brand-red" />
                  <span className="text-xs text-brand-red font-medium">Declining</span>
                </>
              )}
              {trend === "flat" && (
                <>
                  <Minus className="h-4 w-4 text-neutral-400" />
                  <span className="text-xs text-neutral-500 font-medium">Stable</span>
                </>
              )}
            </div>

            {/* Quarter breakdown */}
            <div className="grid grid-cols-4 gap-2">
              {quarters.map((q) => (
                <div key={q.quarter} className="text-center">
                  <p className="text-[10px] text-neutral-500 font-medium">{q.quarter}</p>
                  <p className={cn(
                    "text-sm font-bold tabular-nums",
                    q.averageScore != null ? getScoreColorClass(q.averageScore) : "text-neutral-300",
                  )}>
                    {q.averageScore != null ? `${Math.round(q.averageScore)}%` : "—"}
                  </p>
                  <p className="text-[9px] text-neutral-400">
                    {q.completedCount}/{q.goalCount} done
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function computeTrend(quartersWithData: QuarterProgress[]): "up" | "down" | "flat" | null {
  if (quartersWithData.length < 2) return null;

  const last = quartersWithData[quartersWithData.length - 1].averageScore ?? 0;
  const prev = quartersWithData[quartersWithData.length - 2].averageScore ?? 0;
  const diff = last - prev;

  if (diff > 5) return "up";
  if (diff < -5) return "down";
  return "flat";
}
