"use client";

import { cn } from "@/lib/utils/cn";
import type { WindowStatus } from "@/types/app.types";
import { formatDate } from "@/lib/utils/format";

interface WindowStatusBannerProps {
  windowStatus: WindowStatus;
  className?: string;
}

const PHASE_CONFIG = {
  goal_setting: {
    color: "bg-brand-green/10 border-brand-green/30 text-brand-green",
    icon: "✅",
    label: "Goal Setting Window is OPEN",
  },
  Q1: {
    color: "bg-brand-teal/10 border-brand-teal/30 text-brand-teal",
    icon: "📋",
    label: "Q1 Check-in Window is OPEN",
  },
  Q2: {
    color: "bg-brand-teal/10 border-brand-teal/30 text-brand-teal",
    icon: "📋",
    label: "Q2 Check-in Window is OPEN",
  },
  Q3: {
    color: "bg-brand-teal/10 border-brand-teal/30 text-brand-teal",
    icon: "📋",
    label: "Q3 Check-in Window is OPEN",
  },
  Q4: {
    color: "bg-brand-teal/10 border-brand-teal/30 text-brand-teal",
    icon: "📋",
    label: "Q4 / Annual Check-in is OPEN",
  },
} as const;

export function WindowStatusBanner({
  windowStatus,
  className,
}: WindowStatusBannerProps) {
  const { phase, closesAt } = windowStatus;

  if (!phase) {
    return (
      <div
        className={cn(
          "w-full border rounded-md px-4 py-2.5 text-sm font-medium",
          "bg-brand-amber/10 border-brand-amber/30 text-brand-amber",
          className,
        )}
        role="status"
      >
        ⏳ No check-in window is currently active.
        {windowStatus.opensAt && (
          <span className="ml-1 font-normal text-neutral-500">
            Next window opens {formatDate(windowStatus.opensAt)}.
          </span>
        )}
      </div>
    );
  }

  const config = PHASE_CONFIG[phase];

  return (
    <div
      className={cn(
        "w-full border rounded-md px-4 py-2.5 text-sm font-medium",
        config.color,
        className,
      )}
      role="status"
    >
      {config.icon} {config.label}
      {closesAt && (
        <span className="ml-1 font-normal opacity-80">
          — closes {formatDate(closesAt)}
        </span>
      )}
    </div>
  );
}
