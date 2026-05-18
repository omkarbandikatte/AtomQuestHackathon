"use client";

import type { Control, UseFormRegister, FieldErrors } from "react-hook-form";
import { useWatch } from "react-hook-form";
import { Trash2, GripVertical } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GOAL_SHEET_RULES, UOM_LABELS } from "@/lib/constants/goal-rules";
import { cn } from "@/lib/utils/cn";

interface GoalFormRowProps {
  index: number;
  control: Control<any>;
  register: UseFormRegister<any>;
  errors?: FieldErrors;
  onRemove: () => void;
  canRemove: boolean;
  disabled?: boolean;
  children?: React.ReactNode;
}

const THRUST_AREAS = [
  "Delivery",
  "Quality",
  "Innovation",
  "People",
  "Process",
  "Customer",
];

export function GoalFormRow({
  index,
  control,
  register,
  errors,
  onRemove,
  canRemove,
  disabled,
  children,
}: GoalFormRowProps) {
  const uomType = useWatch({ control, name: `goals.${index}.uom_type` });

  const showTargetValue = uomType === "numeric_min" || uomType === "numeric_max";
  const showTargetDate = uomType === "timeline";

  return (
    <Card className={cn("relative", disabled && "opacity-60")}>
      <CardContent className="pt-4 pb-4">
        {/* Row Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <GripVertical className="h-4 w-4 text-neutral-300 cursor-grab" />
            <span className="text-xs font-semibold text-neutral-400 uppercase">
              Goal {index + 1}
            </span>
          </div>
          {canRemove && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-neutral-400 hover:text-brand-red"
              onClick={onRemove}
              disabled={disabled}
              aria-label={`Remove goal ${index + 1}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Row 1: Title + Thrust Area */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_200px] gap-3 mb-3">
          <div className="space-y-1">
            <Label htmlFor={`goals.${index}.title`} className="text-xs">
              Title *
            </Label>
            <Input
              id={`goals.${index}.title`}
              placeholder="e.g., Increase quarterly revenue by 20%"
              {...register(`goals.${index}.title`)}
              disabled={disabled}
              aria-invalid={!!errors?.title}
              className="text-sm"
            />
            {errors?.title && (
              <p className="text-xs text-brand-red">
                {errors.title.message as string}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor={`goals.${index}.thrust_area`} className="text-xs">
              Thrust Area *
            </Label>
            <select
              id={`goals.${index}.thrust_area`}
              {...register(`goals.${index}.thrust_area`)}
              disabled={disabled}
              className={cn(
                "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm",
                "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                errors?.thrust_area && "border-brand-red",
              )}
            >
              <option value="">Select…</option>
              {THRUST_AREAS.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
            {errors?.thrust_area && (
              <p className="text-xs text-brand-red">
                {errors.thrust_area.message as string}
              </p>
            )}
          </div>
        </div>

        {/* Row 2: UOM Type + Target + Weightage */}
        <div className="grid grid-cols-1 md:grid-cols-[180px_1fr_100px] gap-3 mb-3">
          <div className="space-y-1">
            <Label htmlFor={`goals.${index}.uom_type`} className="text-xs">
              UOM Type *
            </Label>
            <select
              id={`goals.${index}.uom_type`}
              {...register(`goals.${index}.uom_type`)}
              disabled={disabled}
              className={cn(
                "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm",
                "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
              )}
            >
              {GOAL_SHEET_RULES.UOM_TYPES.map((type) => (
                <option key={type} value={type}>
                  {UOM_LABELS[type]}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            {showTargetValue && (
              <>
                <Label
                  htmlFor={`goals.${index}.target_value`}
                  className="text-xs"
                >
                  Target Value *
                </Label>
                <Input
                  id={`goals.${index}.target_value`}
                  type="number"
                  step="any"
                  placeholder="e.g., 100"
                  {...register(`goals.${index}.target_value`, {
                    valueAsNumber: true,
                  })}
                  disabled={disabled}
                  aria-invalid={!!errors?.target_value}
                  className="text-sm"
                />
                {errors?.target_value && (
                  <p className="text-xs text-brand-red">
                    {errors.target_value.message as string}
                  </p>
                )}
              </>
            )}
            {showTargetDate && (
              <>
                <Label
                  htmlFor={`goals.${index}.target_date`}
                  className="text-xs"
                >
                  Target Date *
                </Label>
                <Input
                  id={`goals.${index}.target_date`}
                  type="date"
                  {...register(`goals.${index}.target_date`)}
                  disabled={disabled}
                  aria-invalid={!!errors?.target_date}
                  className="text-sm"
                />
                {errors?.target_date && (
                  <p className="text-xs text-brand-red">
                    {errors.target_date.message as string}
                  </p>
                )}
              </>
            )}
            {!showTargetValue && !showTargetDate && (
              <div className="flex items-end h-full">
                <p className="text-xs text-neutral-400 pb-2">
                  No target needed for this UOM type
                </p>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor={`goals.${index}.weightage`} className="text-xs">
              Weight (%) *
            </Label>
            <Input
              id={`goals.${index}.weightage`}
              type="number"
              min={GOAL_SHEET_RULES.MIN_WEIGHTAGE_PER_GOAL}
              max={100}
              step={5}
              {...register(`goals.${index}.weightage`, { valueAsNumber: true })}
              disabled={disabled}
              aria-invalid={!!errors?.weightage}
              className="text-sm font-mono"
            />
            {errors?.weightage && (
              <p className="text-xs text-brand-red">
                {errors.weightage.message as string}
              </p>
            )}
          </div>
        </div>

        {/* Row 3: Description (optional) */}
        <div className="space-y-1">
          <Label htmlFor={`goals.${index}.description`} className="text-xs">
            Description (optional)
          </Label>
          <Textarea
            id={`goals.${index}.description`}
            placeholder="Add more detail about how success is measured…"
            rows={2}
            {...register(`goals.${index}.description`)}
            disabled={disabled}
            className="text-sm resize-none"
          />
          {errors?.description && (
            <p className="text-xs text-brand-red">
              {errors.description.message as string}
            </p>
          )}
        </div>

        {/* AI Quality Scorer slot */}
        {children}
      </CardContent>
    </Card>
  );
}
