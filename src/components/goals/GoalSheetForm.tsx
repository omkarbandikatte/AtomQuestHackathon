"use client";

import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTransition, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";

import { goalSchema, goalSheetSubmissionSchema } from "@/validations/goal-schema";
import { GOAL_SHEET_RULES, UOM_LABELS } from "@/lib/constants/goal-rules";
import { saveGoalSheetDraftAction, submitGoalSheetAction } from "@/app/actions/goals";
import { Button } from "@/components/ui/button";
import { GoalFormRow } from "@/components/goals/GoalFormRow";
import { GoalSheetValidationBar } from "@/components/goals/GoalSheetValidationBar";
import { AIGoalAssistant } from "@/components/ai/AIGoalAssistant";
import { GoalQualityScorer } from "@/components/ai/GoalQualityScorer";
import type { AISuggestedGoal } from "@/lib/ai/groq-service";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Goal } from "@/types/app.types";

/**
 * Internal form schema — wraps the goal array with cycle_id.
 * The goalSheetSubmissionSchema enforces the refinements on submit.
 */
const formSchema = z.object({
  cycle_id: z.string().uuid(),
  goals: z.array(goalSchema).min(1).max(GOAL_SHEET_RULES.MAX_GOALS),
});

type FormValues = z.infer<typeof formSchema>;

interface GoalSheetFormProps {
  cycleId: string;
  cycleName: string;
  sheetId: string | null;
  sheetStatus: string | null;
  existingGoals: Goal[];
  isGoalSettingOpen: boolean;
}

const DEFAULT_GOAL: z.infer<typeof goalSchema> = {
  title: "",
  thrust_area: "",
  uom_type: "numeric_min",
  target_value: null,
  target_date: null,
  weightage: 10,
  description: "",
};

export function GoalSheetForm({
  cycleId,
  cycleName,
  sheetId,
  sheetStatus,
  existingGoals,
  isGoalSettingOpen,
}: GoalSheetFormProps) {
  const router = useRouter();
  const [isSaving, startSaveTransition] = useTransition();
  const [isSubmitting, startSubmitTransition] = useTransition();
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  const defaultGoals = useMemo(() => {
    if (existingGoals.length === 0) return [DEFAULT_GOAL];
    return existingGoals
      .filter((g) => !g.is_shared) // Shared goals are read-only, handled separately
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((g) => ({
        title: g.title,
        thrust_area: g.thrust_area,
        uom_type: g.uom_type as (typeof GOAL_SHEET_RULES.UOM_TYPES)[number],
        target_value: g.target_value,
        target_date: g.target_date,
        weightage: g.weightage,
        description: g.description ?? "",
      }));
  }, [existingGoals]);

  const sharedGoals = useMemo(
    () => existingGoals.filter((g) => g.is_shared),
    [existingGoals],
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cycle_id: cycleId,
      goals: defaultGoals,
    },
    mode: "onChange",
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "goals",
  });

  // Watch goals for real-time validation display
  const watchedGoals = useWatch({ control: form.control, name: "goals" });

  const totalWeightage = useMemo(() => {
    const ownWeightage = (watchedGoals ?? []).reduce(
      (sum, g) => sum + (g?.weightage ?? 0),
      0,
    );
    const sharedWeightage = sharedGoals.reduce((sum, g) => sum + g.weightage, 0);
    return ownWeightage + sharedWeightage;
  }, [watchedGoals, sharedGoals]);

  const totalGoalCount = (watchedGoals?.length ?? 0) + sharedGoals.length;

  const canAddGoal = totalGoalCount < GOAL_SHEET_RULES.MAX_GOALS;

  const validationState = useMemo(() => {
    const goals = watchedGoals ?? [];
    const hasMinViolation = goals.some(
      (g) => (g?.weightage ?? 0) < GOAL_SHEET_RULES.MIN_WEIGHTAGE_PER_GOAL,
    );
    return {
      isWeightageOk: totalWeightage === GOAL_SHEET_RULES.TOTAL_WEIGHTAGE,
      isCountOk: totalGoalCount <= GOAL_SHEET_RULES.MAX_GOALS && totalGoalCount >= 1,
      isMinWeightageOk: !hasMinViolation,
      totalWeightage,
      goalCount: totalGoalCount,
    };
  }, [watchedGoals, totalWeightage, totalGoalCount]);

  const canSubmit =
    validationState.isWeightageOk &&
    validationState.isCountOk &&
    validationState.isMinWeightageOk;

  function handleAddGoal() {
    if (!canAddGoal) return;
    append(DEFAULT_GOAL);
  }

  function handleApplyAIGoal(suggestion: AISuggestedGoal) {
    if (!canAddGoal) return;
    append({
      title: suggestion.title,
      thrust_area: suggestion.thrust_area,
      uom_type: (["numeric_min", "numeric_max", "timeline", "zero"].includes(suggestion.uom_type)
        ? suggestion.uom_type
        : "numeric_min") as (typeof GOAL_SHEET_RULES.UOM_TYPES)[number],
      target_value: suggestion.target_value,
      target_date: suggestion.target_date,
      weightage: Math.max(suggestion.weightage, GOAL_SHEET_RULES.MIN_WEIGHTAGE_PER_GOAL),
      description: suggestion.description ?? "",
    });
  }

  function handleSaveDraft(values: FormValues) {
    // Include shared goals in the submission for server-side save
    const allGoals = [
      ...values.goals,
      ...sharedGoals.map((g) => ({
        title: g.title,
        thrust_area: g.thrust_area,
        uom_type: g.uom_type as (typeof GOAL_SHEET_RULES.UOM_TYPES)[number],
        target_value: g.target_value,
        target_date: g.target_date,
        weightage: g.weightage,
        description: g.description ?? "",
      })),
    ];

    startSaveTransition(async () => {
      const result = await saveGoalSheetDraftAction({
        cycle_id: values.cycle_id,
        goals: values.goals, // Only save own goals; shared goals are managed by admin
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Draft saved successfully");
        router.refresh();
      }
    });
  }

  function handleSubmitSheet() {
    if (!sheetId) {
      toast.error("Save as draft first before submitting.");
      return;
    }

    // Full validation
    const fullPayload = {
      cycle_id: cycleId,
      goals: [
        ...(watchedGoals ?? []),
        ...sharedGoals.map((g) => ({
          title: g.title,
          thrust_area: g.thrust_area,
          uom_type: g.uom_type as (typeof GOAL_SHEET_RULES.UOM_TYPES)[number],
          target_value: g.target_value,
          target_date: g.target_date,
          weightage: g.weightage,
          description: g.description ?? "",
        })),
      ],
    };

    const validation = goalSheetSubmissionSchema.safeParse(fullPayload);
    if (!validation.success) {
      toast.error(validation.error.errors[0]?.message ?? "Validation failed");
      return;
    }

    setShowSubmitConfirm(true);
  }

  function confirmSubmit() {
    setShowSubmitConfirm(false);
    startSubmitTransition(async () => {
      const result = await submitGoalSheetAction(sheetId!);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Goal sheet submitted for approval!");
        router.push("/goal-sheet");
        router.refresh();
      }
    });
  }

  const isPending = isSaving || isSubmitting;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">
            {sheetId ? "Edit Goal Sheet" : "Create Goal Sheet"}
          </h1>
          <p className="mt-1 text-sm text-neutral-500">Cycle: {cycleName}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/goal-sheet")}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={form.handleSubmit(handleSaveDraft)}
            disabled={isPending}
          >
            {isSaving ? "Saving…" : "Save Draft"}
          </Button>
          {sheetId && sheetStatus === "draft" && (
            <Button
              type="button"
              className="bg-brand-blue hover:bg-brand-blue/90"
              onClick={handleSubmitSheet}
              disabled={isPending || !canSubmit}
            >
              {isSubmitting ? "Submitting…" : "Submit for Approval"}
            </Button>
          )}
        </div>
      </div>

      {/* Validation Banner */}
      <GoalSheetValidationBar
        totalWeightage={validationState.totalWeightage}
        goalCount={validationState.goalCount}
        isWeightageOk={validationState.isWeightageOk}
        isCountOk={validationState.isCountOk}
        isMinWeightageOk={validationState.isMinWeightageOk}
        canAddGoal={canAddGoal}
      />

      {/* Shared Goals (read-only) */}
      {sharedGoals.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider">
            Shared Goals (Read-only)
          </h2>
          {sharedGoals.map((goal) => (
            <div
              key={goal.id}
              className="rounded-lg border border-brand-amber/30 bg-brand-amber/5 p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{goal.title}</span>
                  <span className="text-xs text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded">
                    {goal.thrust_area}
                  </span>
                </div>
                <span className="text-xs font-mono font-medium">
                  {goal.weightage}%
                </span>
              </div>
              <p className="mt-1 text-xs text-neutral-500">
                {UOM_LABELS[goal.uom_type as keyof typeof UOM_LABELS]} ·
                Target: {goal.target_value ?? goal.target_date ?? "—"}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Dynamic Goal Rows */}
      <form onSubmit={form.handleSubmit(handleSaveDraft)} className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider">
            My Goals ({fields.length})
          </h2>
          <AIGoalAssistant onApplyGoal={handleApplyAIGoal} />
        </div>

        {fields.map((field, index) => (
          <GoalFormRow
            key={field.id}
            index={index}
            control={form.control as any}
            register={form.register}
            errors={form.formState.errors.goals?.[index] as any}
            onRemove={() => remove(index)}
            canRemove={fields.length > 1}
            disabled={isPending}
          >
            <GoalQualityScorer
              title={watchedGoals?.[index]?.title ?? ""}
              description={watchedGoals?.[index]?.description}
              targetValue={watchedGoals?.[index]?.target_value}
              targetDate={watchedGoals?.[index]?.target_date}
              uomType={watchedGoals?.[index]?.uom_type}
            />
          </GoalFormRow>
        ))}

        {/* Add Goal Button */}
        {canAddGoal && (
          <Button
            type="button"
            variant="outline"
            className="w-full border-dashed"
            onClick={handleAddGoal}
            disabled={isPending}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Goal ({totalGoalCount}/{GOAL_SHEET_RULES.MAX_GOALS})
          </Button>
        )}
      </form>

      {/* Returned-for-rework notice */}
      {sheetStatus === "returned" && (
        <div className="rounded-lg border border-brand-amber/30 bg-brand-amber/5 p-4">
          <p className="text-sm font-medium text-brand-amber">
            This sheet was returned for rework. Please review the manager&apos;s
            comments and resubmit.
          </p>
        </div>
      )}

      {/* Submit Confirmation Dialog */}
      <AlertDialog open={showSubmitConfirm} onOpenChange={setShowSubmitConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Goal Sheet for Approval?</AlertDialogTitle>
            <AlertDialogDescription>
              Once submitted, you will not be able to edit your goals until your
              manager returns them for rework. Are you sure you want to submit?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSubmit}>
              Yes, Submit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
