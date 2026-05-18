"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { unlockSheetAction } from "@/app/actions/admin";
import { formatDate, formatDateTime } from "@/lib/utils/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import { LockOpen, AlertTriangle, Clock } from "lucide-react";

const unlockSchema = z.object({
  reason: z.string().min(20, "Reason must be at least 20 characters").max(1000),
});
type UnlockForm = z.infer<typeof unlockSchema>;

interface Sheet {
  id: string;
  approved_at: string | null;
  status: string;
  employee: { id: string; full_name: string; email: string; department: string | null } | null;
  cycle: { id: string; name: string } | null;
}

interface RecentUnlock {
  id: number;
  goal_sheet_id: string;
  changed_at: string;
  reason: string | null;
  actor: { full_name: string } | null;
}

interface Props {
  sheets: Sheet[];
  recentUnlocks: RecentUnlock[];
}

export function UnlockSheetClient({ sheets, recentUnlocks }: Props) {
  const [selectedSheet, setSelectedSheet] = useState<Sheet | null>(null);
  const [isPending, startTransition] = useTransition();

  const { register, handleSubmit, formState: { errors }, reset } = useForm<UnlockForm>({
    resolver: zodResolver(unlockSchema),
  });

  function openDialog(sheet: Sheet) {
    setSelectedSheet(sheet);
    reset();
  }

  function onSubmit(values: UnlockForm) {
    if (!selectedSheet) return;
    startTransition(async () => {
      const result = await unlockSheetAction({
        sheet_id: selectedSheet.id,
        reason: values.reason,
      });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`Sheet unlocked for ${selectedSheet.employee?.full_name}`);
        setSelectedSheet(null);
        reset();
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Warning banner */}
      <div className="flex items-start gap-3 rounded-lg border border-brand-amber/40 bg-brand-amber/5 p-4">
        <AlertTriangle className="h-5 w-5 text-brand-amber mt-0.5 flex-shrink-0" />
        <p className="text-sm text-neutral-700">
          Unlocking a sheet allows the employee or manager to make changes after approval.
          This action is recorded in the audit log and cannot be undone automatically.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Locked sheets list */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Locked Sheets
              <Badge className="ml-2 bg-neutral-100 text-neutral-600 text-xs">
                {sheets.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {sheets.length === 0 ? (
              <p className="text-sm text-neutral-400 text-center py-8">
                No locked sheets found
              </p>
            ) : (
              <ul className="divide-y divide-neutral-100">
                {sheets.map((sheet) => (
                  <li
                    key={sheet.id}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-neutral-800 truncate">
                        {sheet.employee?.full_name ?? "—"}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {sheet.employee?.department ?? "No dept"} ·{" "}
                        {sheet.cycle?.name ?? "—"}
                      </p>
                      {sheet.approved_at && (
                        <p className="text-[11px] text-neutral-400 mt-0.5">
                          Approved {formatDate(sheet.approved_at)}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs gap-1 flex-shrink-0 ml-3 border-brand-red/40 text-brand-red hover:bg-brand-red/5"
                      onClick={() => openDialog(sheet)}
                    >
                      <LockOpen className="h-3 w-3" />
                      Unlock
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Recent unlock history */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-neutral-400" />
              Recent Unlocks
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {recentUnlocks.length === 0 ? (
              <p className="text-sm text-neutral-400 text-center py-8">
                No unlocks recorded
              </p>
            ) : (
              <ul className="divide-y divide-neutral-100">
                {recentUnlocks.map((u) => (
                  <li key={u.id} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-medium text-neutral-700">
                        {u.actor?.full_name ?? "Admin"}
                      </p>
                      <p className="text-[11px] text-neutral-400 flex-shrink-0">
                        {formatDateTime(u.changed_at)}
                      </p>
                    </div>
                    {u.reason && (
                      <p className="text-xs text-neutral-500 mt-1 line-clamp-2">{u.reason}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Unlock dialog */}
      <Dialog open={!!selectedSheet} onOpenChange={(open) => !open && setSelectedSheet(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Unlock Sheet</DialogTitle>
            <DialogDescription>
              You are about to unlock the goal sheet for{" "}
              <span className="font-semibold text-neutral-900">
                {selectedSheet?.employee?.full_name}
              </span>
              . Provide a reason — this is permanently recorded.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="reason">Reason for unlock</Label>
              <textarea
                id="reason"
                rows={4}
                placeholder="e.g. Employee needs to correct weightage after finalisation due to..."
                {...register("reason")}
                className={cn(
                  "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm resize-none",
                  "focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue",
                  errors.reason && "border-brand-red",
                )}
              />
              {errors.reason && (
                <p className="text-xs text-brand-red">{errors.reason.message}</p>
              )}
            </div>

            <div className="flex gap-3 justify-end pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedSheet(null)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="bg-brand-red hover:bg-brand-red/90 text-white"
              >
                {isPending ? "Unlocking…" : "Confirm Unlock"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
