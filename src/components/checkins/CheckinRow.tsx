"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { upsertCheckinAction } from "@/app/actions/checkins";
import { checkinSchema } from "@/validations/checkin-schema";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SharedGoalBadge } from "@/components/goals/SharedGoalBadge";
import { ProgressGauge } from "@/components/checkins/ProgressGauge";
import { getUomLabel } from "@/lib/utils/progress";
import { GOAL_STATUS_LABELS } from "@/lib/constants/goal-rules";
import type { z } from "zod";
import type { WindowPhase } from "@/types/app.types";

type CheckinValues = z.infer<typeof checkinSchema>;

interface Props {
  goal: {
    id: string;
    title: string;
    thrust_area: string;
    uom_type: string;
    target_value: number | null;
    weightage: number;
    is_shared: boolean;
  };
  checkin: {
    id: string;
    actual_value: number | null;
    completion_date: string | null;
    status: string;
    progress_score: number | null;
  } | null;
  quarter: WindowPhase;
  isWindowOpen: boolean;
}

export function CheckinRow({ goal, checkin, quarter, isWindowOpen }: Props) {
  const [isPending, startTransition] = useTransition();
  const isTimeline = goal.uom_type === "timeline";

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<CheckinValues>({
    resolver: zodResolver(checkinSchema),
    defaultValues: {
      goal_id: goal.id,
      quarter: (quarter as "Q1" | "Q2" | "Q3" | "Q4") ?? "Q1",
      actual_value: checkin?.actual_value ?? null,
      completion_date: checkin?.completion_date ?? null,
      status: (checkin?.status as CheckinValues["status"]) ?? "not_started",
    },
  });

  function onSubmit(values: CheckinValues) {
    startTransition(async () => {
      const result = await upsertCheckinAction({ checkins: [values] });
      if (result.error) {
        toast.error(result.error === "WINDOW_CLOSED" ? "Check-in window is closed" : result.error);
      } else {
        toast.success("Check-in saved");
      }
    });
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-brand-teal uppercase tracking-wide">
                {goal.thrust_area}
              </span>
              {goal.is_shared && <SharedGoalBadge />}
            </div>
            <p className="font-semibold text-sm text-neutral-900">{goal.title}</p>
            <p className="text-xs text-neutral-500 mt-0.5">
              {getUomLabel(goal.uom_type)} · Target: {goal.target_value ?? "N/A"} · {goal.weightage}% weight
            </p>
          </div>
          <ProgressGauge score={checkin?.progress_score ?? null} size="sm" />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <input type="hidden" {...register("goal_id")} />
          <input type="hidden" {...register("quarter")} />

          <div className="grid grid-cols-2 gap-3">
            {isTimeline ? (
              <div className="space-y-1">
                <Label htmlFor={`completion_date_${goal.id}`} className="text-xs">
                  Completion Date
                </Label>
                <Input
                  id={`completion_date_${goal.id}`}
                  type="date"
                  disabled={!isWindowOpen}
                  {...register("completion_date")}
                  className="text-sm"
                />
              </div>
            ) : (
              <div className="space-y-1">
                <Label htmlFor={`actual_${goal.id}`} className="text-xs">
                  Actual Value
                </Label>
                <Input
                  id={`actual_${goal.id}`}
                  type="number"
                  step="any"
                  disabled={!isWindowOpen}
                  {...register("actual_value", { valueAsNumber: true })}
                  className="text-sm"
                />
              </div>
            )}

            <div className="space-y-1">
              <Label className="text-xs">Status</Label>
              <Select
                disabled={!isWindowOpen}
                defaultValue={checkin?.status ?? "not_started"}
                onValueChange={(v) => setValue("status", v as CheckinValues["status"])}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(GOAL_STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isWindowOpen && (
            <Button
              type="submit"
              size="sm"
              disabled={isPending}
              className="bg-brand-blue hover:bg-brand-blue/90 h-8 text-xs"
            >
              {isPending ? "Saving…" : "Save"}
            </Button>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
