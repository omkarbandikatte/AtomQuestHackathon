"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { managerGoalEditSchema } from "@/validations/goal-schema";
import { managerEditGoalAction } from "@/app/actions/goals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil, X, Check } from "lucide-react";
import type { Goal } from "@/types/app.types";
import type { ManagerGoalEditValues } from "@/validations/goal-schema";

interface Props {
  goal: Goal;
  onSaved?: () => void;
}

export function InlineGoalEditor({ goal, onSaved }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ManagerGoalEditValues>({
    resolver: zodResolver(managerGoalEditSchema),
    defaultValues: {
      goal_id: goal.id,
      target_value: goal.target_value ?? undefined,
      target_date: goal.target_date ?? undefined,
      weightage: goal.weightage,
    },
  });

  function onSubmit(values: ManagerGoalEditValues) {
    startTransition(async () => {
      const result = await managerEditGoalAction(values);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Goal updated");
        setIsEditing(false);
        onSaved?.();
      }
    });
  }

  function handleCancel() {
    reset();
    setIsEditing(false);
  }

  if (!isEditing) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsEditing(true)}
        className="h-7 px-2 text-xs text-neutral-500 hover:text-brand-blue"
      >
        <Pencil className="h-3 w-3 mr-1" />
        Edit
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-3 p-3 bg-neutral-50 rounded-lg border border-neutral-200 space-y-3">
      <input type="hidden" {...register("goal_id")} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {(goal.uom_type === "numeric_min" || goal.uom_type === "numeric_max") && (
          <div className="space-y-1">
            <Label className="text-xs">Target Value</Label>
            <Input
              type="number"
              step="0.01"
              {...register("target_value", { valueAsNumber: true })}
              className="h-8 text-sm"
            />
            {errors.target_value && (
              <p className="text-xs text-brand-red">{errors.target_value.message}</p>
            )}
          </div>
        )}

        {goal.uom_type === "timeline" && (
          <div className="space-y-1">
            <Label className="text-xs">Target Date</Label>
            <Input
              type="date"
              {...register("target_date")}
              className="h-8 text-sm"
            />
            {errors.target_date && (
              <p className="text-xs text-brand-red">{errors.target_date.message}</p>
            )}
          </div>
        )}

        <div className="space-y-1">
          <Label className="text-xs">Weightage (%)</Label>
          <Input
            type="number"
            min={10}
            max={100}
            {...register("weightage", { valueAsNumber: true })}
            className="h-8 text-sm"
          />
          {errors.weightage && (
            <p className="text-xs text-brand-red">{errors.weightage.message}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="submit"
          size="sm"
          disabled={isPending}
          className="h-7 text-xs bg-brand-teal hover:bg-brand-teal/90"
        >
          <Check className="h-3 w-3 mr-1" />
          {isPending ? "Saving…" : "Save"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          disabled={isPending}
          className="h-7 text-xs"
        >
          <X className="h-3 w-3 mr-1" />
          Cancel
        </Button>
      </div>
    </form>
  );
}
