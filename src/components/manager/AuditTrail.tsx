"use client";

import { useSheetAuditTrail } from "@/hooks/use-approvals";
import { formatDateTime } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { History, CheckCircle, RotateCcw, Pencil, Send, FileText } from "lucide-react";

const ACTION_CONFIG: Record<string, { icon: typeof CheckCircle; label: string; color: string }> = {
  APPROVE_GOAL_SHEET: { icon: CheckCircle, label: "Approved", color: "text-brand-green" },
  RETURN_FOR_REWORK: { icon: RotateCcw, label: "Returned for Rework", color: "text-brand-amber" },
  MANAGER_EDIT_GOAL: { icon: Pencil, label: "Manager Edited Goal", color: "text-brand-blue" },
  SUBMIT_GOAL_SHEET: { icon: Send, label: "Submitted", color: "text-brand-teal" },
};

interface Props {
  sheetId: string;
  className?: string;
}

export function AuditTrail({ sheetId, className }: Props) {
  const { data: entries, isLoading } = useSheetAuditTrail(sheetId);

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 bg-neutral-100 rounded" />
        ))}
      </div>
    );
  }

  if (!entries || entries.length === 0) {
    return (
      <div className="text-center py-6 text-sm text-neutral-400">
        <History className="h-5 w-5 mx-auto mb-2" />
        No audit history yet
      </div>
    );
  }

  return (
    <div className={cn("space-y-0", className)}>
      <h3 className="text-sm font-semibold text-neutral-700 mb-3 flex items-center gap-2">
        <FileText className="h-4 w-4" />
        Audit Trail
      </h3>

      <div className="relative border-l-2 border-neutral-200 ml-2 space-y-4 pl-4">
        {entries.map((entry) => {
          const config = ACTION_CONFIG[entry.action] ?? {
            icon: History,
            label: entry.action,
            color: "text-neutral-500",
          };
          const Icon = config.icon;

          return (
            <div key={entry.id} className="relative">
              {/* Timeline dot */}
              <div className={cn(
                "absolute -left-[22px] top-1 h-3 w-3 rounded-full border-2 border-white",
                config.color === "text-brand-green" && "bg-brand-green",
                config.color === "text-brand-amber" && "bg-brand-amber",
                config.color === "text-brand-blue" && "bg-brand-blue",
                config.color === "text-brand-teal" && "bg-brand-teal",
                config.color === "text-neutral-500" && "bg-neutral-400",
              )} />

              <div className="text-sm">
                <div className="flex items-center gap-2">
                  <Icon className={cn("h-3.5 w-3.5", config.color)} />
                  <span className="font-medium text-neutral-900">{config.label}</span>
                  <span className="text-xs text-neutral-400">
                    {formatDateTime(entry.created_at)}
                  </span>
                </div>

                <p className="text-xs text-neutral-500 mt-0.5">
                  by {entry.actor?.full_name ?? "System"}
                </p>

                {entry.reason && (
                  <p className="text-xs text-neutral-600 mt-1 bg-neutral-50 rounded px-2 py-1 border border-neutral-100">
                    &ldquo;{entry.reason}&rdquo;
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
