"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { submitQuarterlyCheckinAction } from "@/app/actions/checkins";
import { CheckinFormCard } from "./CheckinFormCard";
import { QuarterlyTimeline } from "./QuarterlyTimeline";
import { WindowStatusBanner } from "./WindowStatusBanner";
import { RealtimeCheckinProvider } from "./RealtimeCheckinProvider";
import { ProgressGauge } from "./ProgressGauge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Send, CheckCircle } from "lucide-react";
import type { WindowPhase, WindowStatus, Checkin } from "@/types/app.types";

interface GoalWithCheckins {
  id: string;
  title: string;
  thrust_area: string;
  uom_type: string;
  target_value: number | null;
  target_date: string | null;
  weightage: number;
  is_shared: boolean;
  sort_order: number;
  checkins: Checkin[];
}

interface Props {
  sheetId: string;
  goals: GoalWithCheckins[];
  windowStatus: WindowStatus;
  cycleName: string;
}

export function CheckinPageClient({ sheetId, goals, windowStatus, cycleName }: Props) {
  const [isPending, startTransition] = useTransition();
  const activeQuarter = windowStatus.phase;
  const isCheckinOpen = activeQuarter === "Q1" || activeQuarter === "Q2" || activeQuarter === "Q3" || activeQuarter === "Q4";
  const goalIds = goals.map((g) => g.id);

  // Compute quarter data for the timeline
  const quarters = ["Q1", "Q2", "Q3", "Q4"].map((q) => {
    const qCheckins = goals.flatMap((g) =>
      g.checkins.filter((c) => c.quarter === q),
    );
    const scores = qCheckins
      .map((c) => c.progress_score)
      .filter((s): s is number => s != null);

    return {
      quarter: q,
      averageScore: scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null,
      completedCount: qCheckins.filter((c) => c.status === "completed").length,
      goalCount: goals.length,
      isActive: q === activeQuarter,
    };
  });

  // Current quarter check-in status
  const currentQCheckins = goals.map((g) =>
    g.checkins.find((c) => c.quarter === activeQuarter),
  );
  const goalsWithCheckin = currentQCheckins.filter((c) => c != null).length;
  const allCheckedIn = goalsWithCheckin === goals.length;

  // Average score for current quarter
  const currentScores = currentQCheckins
    .filter((c): c is Checkin => c != null)
    .map((c) => c.progress_score)
    .filter((s): s is number => s != null);
  const currentAvgScore = currentScores.length > 0
    ? currentScores.reduce((a, b) => a + b, 0) / currentScores.length
    : null;

  function handleSubmitAll() {
    if (!activeQuarter || !isCheckinOpen) return;

    startTransition(async () => {
      const result = await submitQuarterlyCheckinAction(sheetId, activeQuarter);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`${activeQuarter} check-ins submitted successfully`);
      }
    });
  }

  return (
    <RealtimeCheckinProvider sheetId={sheetId} goalIds={goalIds}>
      <div className="space-y-6">
        {/* Window status */}
        <WindowStatusBanner windowStatus={windowStatus} context="checkin" />

        {/* Timeline overview */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-neutral-700">Quarterly Progress</h3>
              {currentAvgScore != null && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-500">Current {activeQuarter}:</span>
                  <ProgressGauge score={currentAvgScore} size="xs" />
                </div>
              )}
            </div>
            <QuarterlyTimeline quarters={quarters} activeQuarter={activeQuarter} />
          </CardContent>
        </Card>

        {/* Status bar */}
        {isCheckinOpen && (
          <div className="flex items-center justify-between bg-neutral-50 rounded-lg px-4 py-3 border border-neutral-100">
            <div className="flex items-center gap-3">
              <Badge variant={allCheckedIn ? "success" : "secondary"} className="text-xs">
                {goalsWithCheckin}/{goals.length} goals updated
              </Badge>
              {allCheckedIn && (
                <span className="text-xs text-brand-green flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  All goals have check-in data
                </span>
              )}
            </div>
            {allCheckedIn && (
              <Button
                size="sm"
                onClick={handleSubmitAll}
                disabled={isPending}
                className="bg-brand-teal hover:bg-brand-teal/90 text-xs"
              >
                <Send className="h-3 w-3 mr-1.5" />
                {isPending ? "Submitting…" : `Submit ${activeQuarter} Check-ins`}
              </Button>
            )}
          </div>
        )}

        {/* Check-in forms per goal */}
        <div className="space-y-4">
          {goals.map((goal) => {
            const quarterCheckin = goal.checkins.find(
              (c) => c.quarter === activeQuarter,
            ) ?? null;
            return (
              <CheckinFormCard
                key={goal.id}
                goal={goal}
                checkin={quarterCheckin}
                quarter={activeQuarter}
                isWindowOpen={isCheckinOpen}
              />
            );
          })}
        </div>
      </div>
    </RealtimeCheckinProvider>
  );
}
