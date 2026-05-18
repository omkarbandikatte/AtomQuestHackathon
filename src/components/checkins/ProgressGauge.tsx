"use client";

import { getScoreColorClass, formatScore } from "@/lib/utils/progress";
import { cn } from "@/lib/utils/cn";

type GaugeSize = "xs" | "sm" | "md" | "lg";

const SIZE_MAP: Record<GaugeSize, { px: number; stroke: number; fontSize: string }> = {
  xs: { px: 40, stroke: 3, fontSize: "text-[9px]" },
  sm: { px: 60, stroke: 4, fontSize: "text-xs" },
  md: { px: 80, stroke: 6, fontSize: "text-sm" },
  lg: { px: 120, stroke: 8, fontSize: "text-lg" },
};

interface ProgressGaugeProps {
  score: number | null;
  size?: GaugeSize;
  uomLabel?: string;
  showLabel?: boolean;
  animated?: boolean;
  className?: string;
}

export function ProgressGauge({
  score,
  size = "md",
  uomLabel,
  showLabel = true,
  animated = true,
  className,
}: ProgressGaugeProps) {
  const { px, stroke, fontSize } = SIZE_MAP[size];
  const displayScore = score ?? 0;
  const cappedScore = Math.min(displayScore, 200);
  const percentage = (cappedScore / 200) * 100;
  const radius = px / 2 - stroke - 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (percentage / 100) * circumference;

  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <div className="relative">
        <svg
          width={px}
          height={px}
          viewBox={`0 0 ${px} ${px}`}
          className="rotate-[-90deg]"
          aria-label={`Progress: ${formatScore(score)}`}
        >
          {/* Background track */}
          <circle
            cx={px / 2}
            cy={px / 2}
            r={radius}
            fill="none"
            stroke="#E5E7EB"
            strokeWidth={stroke}
          />
          {/* Progress arc */}
          <circle
            cx={px / 2}
            cy={px / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            className={cn(
              getScoreColorClass(score),
              animated && "transition-[stroke-dashoffset] duration-700 ease-out",
            )}
          />
        </svg>
        {/* Center text */}
        {showLabel && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={cn("font-bold tabular-nums", fontSize, getScoreColorClass(score))}>
              {formatScore(score)}
            </span>
          </div>
        )}
      </div>
      {uomLabel && (
        <span className="text-[10px] text-neutral-500 italic text-center">
          {uomLabel}
        </span>
      )}
    </div>
  );
}
