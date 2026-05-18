"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressGauge } from "@/components/checkins/ProgressGauge";
import { ManagerCommentForm } from "@/components/manager/ManagerCommentForm";
import { getUomLabel } from "@/lib/utils/progress";
import type { WindowPhase } from "@/types/app.types";
import { ChevronDown, ChevronUp } from "lucide-react";

interface Goal {
  id: string;
  title: string;
  thrust_area: string;
  uom_type: string;
  target_value: number | null;
  weightage: number;
  checkins: Array<{
    id: string;
    quarter: string;
    actual_value: number | null;
    status: string;
    progress_score: number | null;
    manager_comment: string | null;
  }>;
}

interface Props {
  member: { id: string; full_name: string; email: string };
  sheet: { id: string; goals: Goal[] } | null;
  activeQuarter: WindowPhase;
  managerId: string;
}

export function ManagerCheckinPanel({ member, sheet, activeQuarter, managerId }: Props) {
  const [expanded, setExpanded] = useState(true);

  const goals = sheet?.goals ?? [];

  return (
    <Card>
      <CardHeader
        className="cursor-pointer select-none"
        onClick={() => setExpanded((e) => !e)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{member.full_name}</CardTitle>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-neutral-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-neutral-400" />
          )}
        </div>
        <p className="text-xs text-neutral-500 mt-0.5">{goals.length} goals</p>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-4 pt-0">
          {goals.map((goal) => {
            const checkin = goal.checkins?.find((c) => c.quarter === activeQuarter);
            return (
              <div
                key={goal.id}
                className="border border-neutral-100 rounded-lg p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs text-brand-teal font-medium uppercase">
                      {goal.thrust_area}
                    </span>
                    <p className="font-medium text-sm mt-0.5">{goal.title}</p>
                    <p className="text-xs text-neutral-500">
                      {getUomLabel(goal.uom_type)} · Target:{" "}
                      {goal.target_value ?? "N/A"} · {goal.weightage}% weight
                    </p>
                  </div>
                  <div className="flex-shrink-0 ml-4">
                    <ProgressGauge score={checkin?.progress_score ?? null} size="sm" />
                  </div>
                </div>

                {checkin && (
                  <div className="text-xs text-neutral-600 bg-neutral-50 rounded p-2">
                    <span className="font-medium">Actual: </span>
                    {checkin.actual_value ?? "—"} ·{" "}
                    <span className="capitalize">{checkin.status?.replace("_", " ")}</span>
                  </div>
                )}

                <ManagerCommentForm
                  checkinId={checkin?.id ?? null}
                  existingComment={checkin?.manager_comment ?? null}
                  managerId={managerId}
                />
              </div>
            );
          })}
        </CardContent>
      )}
    </Card>
  );
}
