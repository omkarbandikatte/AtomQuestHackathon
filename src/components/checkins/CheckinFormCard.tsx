"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { upsertCheckinAction } from "@/app/actions/checkins";
import { checkinSchema } from "@/validations/checkin-schema";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SharedGoalBadge } from "@/components/goals/SharedGoalBadge";
import { ProgressGauge } from "@/components/checkins/ProgressGauge";
import { getUomLabel } from "@/lib/utils/progress";
import { GOAL_STATUS_LABELS } from "@/lib/constants/goal-rules";
import { CheckCircle, Save, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { z } from "zod";
import type { WindowPhase, Checkin } from "@/types/app.types";

type CheckinValues = z.infer<typeof checkinSchema>;

interface Props {
  goal: {
    id: string;
    title: string;
    thrust_area: string;
    uom_type: string;
    target_value: number | null;
    target_date: string | null;
    weightage: number;
    is_shared: boolean;
  };
  checkin: Checkin | null;
  quarter: WindowPhase;
  isWindowOpen: boolean;
  onSaved?: () => void;
}

export function CheckinFormCard({ goal, checkin, quarter, isWindowOpen, onSaved }: Props) {
  const [isPending, startTransition] = useTransition();
  const [showDetails, setShowDetails] = useState(!!checkin);
  const isTimeline = goal.uom_type === "timeline";
  const isZero = goal.uom_type === "zero";

  const { register, handleSubmit, setValue, watch, formState: { errors, isDirty } } = useForm<CheckinValues>({
    resolver: zodResolver(checkinSchema),
    defaultValues: {
      goal_id: goal.id,
      quarter: (quarter as "Q1" | "Q2" | "Q3" | "Q4") ?? "Q1",
      actual_value: checkin?.actual_value ?? null,
      completion_date: checkin?.completion_date ?? null,
      status: (checkin?.status as CheckinValues["status"]) ?? "not_started",
    },
  });

  const currentStatus = watch("status");

  function onSubmit(values: CheckinValues) {
    startTransition(async () => {
      const result = await upsertCheckinAction({ checkins: [values] });
      if (result.error) {
        toast.error(result.error === "WINDOW_CLOSED" ? "Check-in window is closed" : result.error);
      } else {
        toast.success("Check-in saved");
        onSaved?.();
      }
    });
  }

  return (
    <Card className={cn(
      "transition-shadow",
      checkin?.progress_score != null && checkin.progress_score >= 80 && "border-brand-green/20",
      isDirty && isWindowOpen && "ring-1 ring-brand-blue/30",
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Badge variant="teal" className="text-[10px]">
                {goal.thrust_area}
              </Badge>
              <Badge variant="outline" className="text-[10px] font-mono">
                {getUomLabel(goal.uom_type)}
              </Badge>
              <Badge variant="secondary" className="text-[10px]">
                {goal.weightage}%
              </Badge>
              {goal.is_shared && <SharedGoalBadge />}
              {currentStatus === "completed" && (
                <Badge className="bg-brand-green/10 text-brand-green text-[10px]">
                  <CheckCircle className="h-2.5 w-2.5 mr-0.5" />
                  Completed
                </Badge>
              )}
            </div>
            <p className="font-semibold text-sm text-neutral-900">{goal.title}</p>
            <p className="text-xs text-neutral-500 mt-0.5">
              Target: {goal.target_value ?? goal.target_date ?? "N/A"}
            </p>
          </div>
          <ProgressGauge score={checkin?.progress_score ?? null} size="sm" />
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <input type="hidden" {...register("goal_id")} />
          <input type="hidden" {...register("quarter")} />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Actual value / completion date */}
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
                  className="text-sm h-9"
                />
                {errors.completion_date && (
                  <p className="text-[10px] text-brand-red">{errors.completion_date.message}</p>
                )}
              </div>
            ) : !isZero ? (
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
                  className="text-sm h-9"
                  placeholder={goal.target_value ? `Target: ${goal.target_value}` : undefined}
                />
                {errors.actual_value && (
                  <p className="text-[10px] text-brand-red">{errors.actual_value.message}</p>
                )}
              </div>
            ) : (
              <div className="space-y-1">
                <Label className="text-xs">Achievement</Label>
                <Select
                  disabled={!isWindowOpen}
                  defaultValue={checkin?.actual_value === 0 ? "achieved" : "not_achieved"}
                  onValueChange={(v) => setValue("actual_value", v === "achieved" ? 0 : 1, { shouldDirty: true })}
                >
                  <SelectTrigger className="text-sm h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="achieved">Zero Incidents (Achieved)</SelectItem>
                    <SelectItem value="not_achieved">Has Incidents</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Status */}
            <div className="space-y-1">
              <Label className="text-xs">Status</Label>
              <Select
                disabled={!isWindowOpen}
                defaultValue={checkin?.status ?? "not_started"}
                onValueChange={(v) => setValue("status", v as CheckinValues["status"], { shouldDirty: true })}
              >
                <SelectTrigger className="text-sm h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(GOAL_STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Save button */}
            <div className="flex items-end">
              {isWindowOpen && (
                <Button
                  type="submit"
                  size="sm"
                  disabled={isPending || !isDirty}
                  className="bg-brand-blue hover:bg-brand-blue/90 h-9 text-xs w-full"
                >
                  <Save className="h-3 w-3 mr-1.5" />
                  {isPending ? "Saving…" : "Save"}
                </Button>
              )}
            </div>
          </div>

          {/* Manager comment display */}
          {checkin?.manager_comment && (
            <div className="mt-3 p-2.5 bg-neutral-50 rounded-md border border-neutral-100">
              <div className="flex items-center gap-1.5 mb-1">
                <MessageSquare className="h-3 w-3 text-brand-blue" />
                <span className="text-[10px] font-medium text-brand-blue">Manager Comment</span>
              </div>
              <p className="text-xs text-neutral-700">{checkin.manager_comment}</p>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
