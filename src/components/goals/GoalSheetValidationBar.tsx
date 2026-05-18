"use client";

import { GOAL_SHEET_RULES } from "@/lib/constants/goal-rules";
import { cn } from "@/lib/utils/cn";

interface GoalSheetValidationBarProps {
  totalWeightage: number;
  goalCount: number;
  isWeightageOk: boolean;
  isCountOk: boolean;
  isMinWeightageOk: boolean;
  canAddGoal: boolean;
}

export function GoalSheetValidationBar({
  totalWeightage,
  goalCount,
  isWeightageOk,
  isCountOk,
  isMinWeightageOk,
  canAddGoal,
}: GoalSheetValidationBarProps) {
  return (
    <div className="sticky top-0 z-10 rounded-lg border bg-white px-4 py-2.5 shadow-sm flex flex-wrap items-center gap-3">
      <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
        Validation
      </span>

      <Chip
        isOk={isWeightageOk}
        okMessage={`${totalWeightage}% ✓`}
        errorMessage={`${totalWeightage}% — must equal 100%`}
      />

      <Chip
        isOk={isCountOk}
        okMessage={`${goalCount}/${GOAL_SHEET_RULES.MAX_GOALS} goals`}
        errorMessage={`${goalCount}/${GOAL_SHEET_RULES.MAX_GOALS} — ${goalCount > GOAL_SHEET_RULES.MAX_GOALS ? "max exceeded" : "add at least 1"}`}
      />

      <Chip
        isOk={isMinWeightageOk}
        okMessage="≥10% per goal ✓"
        errorMessage="A goal has <10% weightage"
      />

      {!canAddGoal && (
        <span className="ml-auto text-xs text-brand-amber font-medium">
          Max {GOAL_SHEET_RULES.MAX_GOALS} goals reached
        </span>
      )}
    </div>
  );
}

function Chip({
  isOk,
  okMessage,
  errorMessage,
}: {
  isOk: boolean;
  okMessage: string;
  errorMessage: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border transition-colors",
        isOk
          ? "bg-brand-green/10 text-brand-green border-brand-green/20"
          : "bg-brand-red/10 text-brand-red border-brand-red/20",
      )}
    >
      {isOk ? okMessage : errorMessage}
    </span>
  );
}
