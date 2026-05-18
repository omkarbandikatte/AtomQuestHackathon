"use client";

import { cn } from "@/lib/utils/cn";
import { GOAL_SHEET_RULES } from "@/lib/constants/goal-rules";
import type { Goal } from "@/types/app.types";

interface ValidationBannerProps {
  goals: Goal[];
}

/**
 * Read-only validation banner for the goal-sheet VIEW page.
 * Shows a summary of validation state based on server-fetched goals.
 */
export function ValidationBanner({ goals }: ValidationBannerProps) {
  const total = goals.reduce((s, g) => s + g.weightage, 0);
  const count = goals.length;
  const hasMinWeightageViolation = goals.some(
    (g) => g.weightage < GOAL_SHEET_RULES.MIN_WEIGHTAGE_PER_GOAL,
  );

  const isWeightageOk = total === GOAL_SHEET_RULES.TOTAL_WEIGHTAGE;
  const isCountOk = count >= 1 && count <= GOAL_SHEET_RULES.MAX_GOALS;
  const isMinWeightageOk = !hasMinWeightageViolation;

  // Don't show if everything is valid
  if (isWeightageOk && isCountOk && isMinWeightageOk) return null;

  return (
    <div className="rounded-lg border border-brand-amber/30 bg-brand-amber/5 px-4 py-2.5 flex flex-wrap items-center gap-3">
      <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
        Issues
      </span>

      {!isWeightageOk && (
        <Chip
          isOk={false}
          message={`${total}% — must equal 100%`}
        />
      )}

      {!isCountOk && (
        <Chip
          isOk={false}
          message={`${count}/${GOAL_SHEET_RULES.MAX_GOALS} — ${count > GOAL_SHEET_RULES.MAX_GOALS ? "max exceeded" : "add at least 1"}`}
        />
      )}

      {!isMinWeightageOk && (
        <Chip
          isOk={false}
          message="A goal has <10% weightage"
        />
      )}
    </div>
  );
}

function Chip({ isOk, message }: { isOk: boolean; message: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border",
        isOk
          ? "bg-brand-green/10 text-brand-green border-brand-green/20"
          : "bg-brand-red/10 text-brand-red border-brand-red/20",
      )}
    >
      {message}
    </span>
  );
}
