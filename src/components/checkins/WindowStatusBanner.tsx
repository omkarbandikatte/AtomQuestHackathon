"use client";

import { Clock, CheckCircle, AlertTriangle, CalendarDays } from "lucide-react";
import { formatDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { WindowPhase, WindowStatus } from "@/types/app.types";

interface Props {
  windowStatus: WindowStatus;
  context?: "checkin" | "goal_setting";
  className?: string;
}

const QUARTER_LABELS: Record<string, string> = {
  Q1: "Quarter 1 (Apr–Jun)",
  Q2: "Quarter 2 (Jul–Sep)",
  Q3: "Quarter 3 (Oct–Dec)",
  Q4: "Quarter 4 (Jan–Mar)",
};

export function WindowStatusBanner({ windowStatus, context = "checkin", className }: Props) {
  const { phase, closesAt, opensAt } = windowStatus;

  // Active check-in window
  if (phase && phase !== "goal_setting" && context === "checkin") {
    return (
      <div className={cn(
        "rounded-lg border border-brand-green/30 bg-brand-green/5 px-4 py-3 flex items-start gap-3",
        className,
      )}>
        <CheckCircle className="h-4 w-4 text-brand-green mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-brand-green">
            {QUARTER_LABELS[phase] ?? phase} check-in window is open
          </p>
          <div className="flex items-center gap-4 mt-1">
            {closesAt && (
              <p className="text-xs text-neutral-500 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Closes: {formatDate(closesAt)}
              </p>
            )}
            <CountdownChip closesAt={closesAt} />
          </div>
        </div>
      </div>
    );
  }

  // Goal-setting window active
  if (phase === "goal_setting" && context === "goal_setting") {
    return (
      <div className={cn(
        "rounded-lg border border-brand-blue/30 bg-brand-blue/5 px-4 py-3 flex items-start gap-3",
        className,
      )}>
        <CalendarDays className="h-4 w-4 text-brand-blue mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-brand-blue">
            Goal-setting window is open
          </p>
          {closesAt && (
            <p className="text-xs text-neutral-500 mt-0.5">
              Set your goals before: {formatDate(closesAt)}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Window closed
  return (
    <div className={cn(
      "rounded-lg border border-brand-amber/30 bg-brand-amber/10 px-4 py-3 flex items-start gap-3",
      className,
    )}>
      <AlertTriangle className="h-4 w-4 text-brand-amber mt-0.5 flex-shrink-0" />
      <div>
        <p className="text-sm font-medium text-brand-amber">
          {context === "checkin" ? "Check-in" : "Goal-setting"} window is currently closed
        </p>
        {closesAt && (
          <p className="text-xs text-neutral-500 mt-0.5">
            Next window opens: {formatDate(closesAt)}
          </p>
        )}
        {!closesAt && phase === "goal_setting" && context === "checkin" && (
          <p className="text-xs text-neutral-500 mt-0.5">
            Check-in windows open after the goal-setting phase ends.
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Shows days remaining until window closes.
 */
function CountdownChip({ closesAt }: { closesAt: string | null }) {
  if (!closesAt) return null;

  const now = new Date();
  const closes = new Date(closesAt);
  const diffMs = closes.getTime() - now.getTime();
  const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (daysLeft <= 0) return null;

  const isUrgent = daysLeft <= 7;

  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium",
      isUrgent
        ? "bg-brand-red/10 text-brand-red"
        : "bg-neutral-100 text-neutral-600",
    )}>
      {daysLeft} day{daysLeft !== 1 ? "s" : ""} left
    </span>
  );
}
