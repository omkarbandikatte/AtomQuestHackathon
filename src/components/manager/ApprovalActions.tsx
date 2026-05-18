"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { approveGoalSheetAction, returnForReworkAction } from "@/app/actions/goals";
import { returnForReworkSchema } from "@/validations/goal-schema";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle, RotateCcw } from "lucide-react";
import { useState } from "react";

interface Props {
  sheetId: string;
  managerId: string;
}

type ReworkValues = z.infer<typeof returnForReworkSchema>;

export function ApprovalActions({ sheetId, managerId }: Props) {
  const [isPending, startTransition] = useTransition();
  const [reworkOpen, setReworkOpen] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ReworkValues>({
    resolver: zodResolver(returnForReworkSchema),
    defaultValues: { sheet_id: sheetId, comment: "" },
  });

  function handleApprove() {
    startTransition(async () => {
      const result = await approveGoalSheetAction(sheetId, managerId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Goal sheet approved and locked");
      }
    });
  }

  function handleRework(values: ReworkValues) {
    startTransition(async () => {
      const result = await returnForReworkAction(values);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Sheet returned for rework");
        setReworkOpen(false);
        reset();
      }
    });
  }

  return (
    <div className="flex items-center gap-3 pt-4 border-t border-neutral-200">
      <Button
        onClick={handleApprove}
        disabled={isPending}
        className="bg-brand-green hover:bg-brand-green/90 text-white"
      >
        <CheckCircle className="mr-2 h-4 w-4" />
        Approve & Lock
      </Button>

      <Button
        variant="outline"
        onClick={() => setReworkOpen(true)}
        disabled={isPending}
        className="border-brand-amber text-brand-amber hover:bg-brand-amber/10"
      >
        <RotateCcw className="mr-2 h-4 w-4" />
        Return for Rework
      </Button>

      <Dialog open={reworkOpen} onOpenChange={setReworkOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Return for Rework</DialogTitle>
            <DialogDescription>
              Provide a comment explaining what the employee needs to correct.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(handleRework)} className="space-y-4">
            <input type="hidden" {...register("sheet_id")} />
            <div className="space-y-1.5">
              <Label htmlFor="comment">Reason / Comment</Label>
              <Textarea
                id="comment"
                placeholder="e.g. Please revise the weightage for goal 3 — it must be at least 10%"
                rows={4}
                {...register("comment")}
                aria-invalid={!!errors.comment}
              />
              {errors.comment && (
                <p className="text-xs text-brand-red">{errors.comment.message}</p>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setReworkOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="bg-brand-amber hover:bg-brand-amber/90 text-white"
              >
                Send Back
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
