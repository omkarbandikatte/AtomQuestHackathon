"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { returnForReworkSchema } from "@/validations/goal-schema";
import { approveWithCommentAction, returnForReworkAction } from "@/app/actions/goals";
import { GoalCard } from "@/components/goals/GoalCard";
import { LockBadge } from "@/components/goals/LockBadge";
import { AuditTrail } from "@/components/manager/AuditTrail";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, RotateCcw, ArrowLeft, AlertTriangle } from "lucide-react";
import Link from "next/link";
import type { Goal, GoalSheet } from "@/types/app.types";
import type { ReturnForReworkValues } from "@/validations/goal-schema";

interface Props {
  sheet: GoalSheet & {
    goals: Goal[];
    employee: { id: string; full_name: string; email: string; department: string | null } | null;
  };
  managerId: string;
}

export function ApprovalDetailClient({ sheet, managerId }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [reworkOpen, setReworkOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [approvalComment, setApprovalComment] = useState("");
  const [goals, setGoals] = useState<Goal[]>(
    [...(sheet.goals ?? [])].sort((a, b) => a.sort_order - b.sort_order),
  );

  const isSubmitted = sheet.status === "submitted";
  const isLocked = sheet.is_locked;
  const canAct = isSubmitted && !isLocked;

  // Weightage validation
  const totalWeightage = goals.reduce((sum, g) => sum + g.weightage, 0);
  const isWeightageValid = totalWeightage === 100;

  // Return for rework form
  const reworkForm = useForm<ReturnForReworkValues>({
    resolver: zodResolver(returnForReworkSchema),
    defaultValues: { sheet_id: sheet.id, comment: "" },
  });

  function handleGoalEdited() {
    // Trigger re-render by refreshing the page data
    router.refresh();
  }

  function handleApprove() {
    if (!approvalComment.trim() || approvalComment.trim().length < 3) {
      toast.error("Please provide an approval comment (min 3 characters)");
      return;
    }
    if (!isWeightageValid) {
      toast.error(`Cannot approve: total weightage is ${totalWeightage}%, must be 100%`);
      return;
    }

    startTransition(async () => {
      const result = await approveWithCommentAction(sheet.id, approvalComment.trim());
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Goal sheet approved and locked");
        setApproveOpen(false);
        router.refresh();
      }
    });
  }

  function handleRework(values: ReturnForReworkValues) {
    startTransition(async () => {
      const result = await returnForReworkAction(values);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Sheet returned to employee for rework");
        setReworkOpen(false);
        reworkForm.reset();
        router.refresh();
      }
    });
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back link */}
      <Link
        href="/approvals"
        className="inline-flex items-center text-sm text-neutral-500 hover:text-brand-blue transition-colors"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Approvals
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Review Goal Sheet</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {sheet.employee?.full_name} · {sheet.employee?.department ?? "No department"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={isSubmitted ? "default" : sheet.status === "approved" ? "success" : "secondary"}
            className="capitalize"
          >
            {sheet.status}
          </Badge>
          {isLocked && <LockBadge />}
        </div>
      </div>

      {/* Weightage summary */}
      <Card>
        <CardContent className="py-3 px-4 flex items-center justify-between">
          <div className="text-sm">
            <span className="text-neutral-500">Goals:</span>{" "}
            <span className="font-semibold">{goals.length}</span>
            <span className="mx-3 text-neutral-300">|</span>
            <span className="text-neutral-500">Total Weightage:</span>{" "}
            <span className={`font-semibold ${isWeightageValid ? "text-brand-green" : "text-brand-red"}`}>
              {totalWeightage}%
            </span>
          </div>
          {!isWeightageValid && (
            <div className="flex items-center gap-1 text-xs text-brand-red">
              <AlertTriangle className="h-3.5 w-3.5" />
              Must equal 100%
            </div>
          )}
        </CardContent>
      </Card>

      {/* Goals list with inline editing */}
      <div className="space-y-4">
        {goals.map((goal) => (
          <GoalCard
            key={goal.id}
            goal={goal}
            isLocked={isLocked}
            showManagerEdit={canAct}
            onGoalEdited={handleGoalEdited}
          />
        ))}
      </div>

      {/* Approval actions */}
      {canAct && (
        <div className="flex items-center gap-3 pt-4 border-t border-neutral-200">
          <Button
            onClick={() => setApproveOpen(true)}
            disabled={isPending || !isWeightageValid}
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
        </div>
      )}

      {/* Audit trail */}
      <div className="pt-4 border-t border-neutral-100">
        <AuditTrail sheetId={sheet.id} />
      </div>

      {/* Approve dialog with mandatory comment */}
      <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Goal Sheet</DialogTitle>
            <DialogDescription>
              This will lock the goal sheet. The employee will not be able to edit it after approval.
              Please add a comment for the record.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="approval-comment">Comment (required)</Label>
              <Textarea
                id="approval-comment"
                placeholder="e.g. Goals are well-aligned with team objectives. Approved."
                value={approvalComment}
                onChange={(e) => setApprovalComment(e.target.value)}
                rows={3}
              />
              {approvalComment.trim().length > 0 && approvalComment.trim().length < 3 && (
                <p className="text-xs text-brand-red">Minimum 3 characters required</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button
              onClick={handleApprove}
              disabled={isPending || approvalComment.trim().length < 3}
              className="bg-brand-green hover:bg-brand-green/90 text-white"
            >
              {isPending ? "Approving…" : "Confirm Approval"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Return for rework dialog */}
      <Dialog open={reworkOpen} onOpenChange={setReworkOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Return for Rework</DialogTitle>
            <DialogDescription>
              Provide a comment explaining what the employee needs to correct.
              This is mandatory so the employee understands the feedback.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={reworkForm.handleSubmit(handleRework)} className="space-y-4">
            <input type="hidden" {...reworkForm.register("sheet_id")} />
            <div className="space-y-1.5">
              <Label htmlFor="rework-comment">Reason / Comment (required)</Label>
              <Textarea
                id="rework-comment"
                placeholder="e.g. Please revise the weightage for goal 3 — it must be at least 10%"
                {...reworkForm.register("comment")}
                rows={4}
              />
              {reworkForm.formState.errors.comment && (
                <p className="text-xs text-brand-red">
                  {reworkForm.formState.errors.comment.message}
                </p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setReworkOpen(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="bg-brand-amber hover:bg-brand-amber/90 text-white"
              >
                {isPending ? "Sending…" : "Return for Rework"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
