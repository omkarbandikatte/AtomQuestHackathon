"use client";

import { useState, useTransition, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { updateCycleAction } from "@/app/actions/admin";
import { cycleSchema } from "@/validations/admin-schema";
import type { CycleFormValues } from "@/validations/admin-schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pencil } from "lucide-react";
import type { Cycle } from "@/types/app.types";

interface Props {
  cycle: Cycle;
}

export function CycleEditDialog({ cycle }: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CycleFormValues>({
    resolver: zodResolver(cycleSchema),
  });

  // Populate form when dialog opens
  useEffect(() => {
    if (open) {
      reset({
        name: cycle.name,
        goal_setting_opens: cycle.goal_setting_opens.slice(0, 10),
        q1_opens: cycle.q1_opens.slice(0, 10),
        q2_opens: cycle.q2_opens.slice(0, 10),
        q3_opens: cycle.q3_opens.slice(0, 10),
        q4_opens: cycle.q4_opens.slice(0, 10),
        cycle_closes: cycle.cycle_closes.slice(0, 10),
      });
    }
  }, [open, cycle, reset]);

  function onSubmit(values: CycleFormValues) {
    startTransition(async () => {
      const result = await updateCycleAction(cycle.id, values);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Cycle updated");
        setOpen(false);
      }
    });
  }

  const DATE_FIELDS: { field: keyof CycleFormValues; label: string }[] = [
    { field: "goal_setting_opens", label: "Goal Setting Opens" },
    { field: "q1_opens", label: "Q1 Check-in Opens" },
    { field: "q2_opens", label: "Q2 Check-in Opens" },
    { field: "q3_opens", label: "Q3 Check-in Opens" },
    { field: "q4_opens", label: "Q4 / Annual Opens" },
    { field: "cycle_closes", label: "Cycle Closes" },
  ];

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 text-xs gap-1"
        onClick={() => setOpen(true)}
      >
        <Pencil className="h-3 w-3" />
        Edit
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Cycle</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-name">Cycle Name</Label>
              <Input id="edit-name" placeholder="e.g. FY 2026-27" {...register("name")} />
              {errors.name && (
                <p className="text-xs text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {DATE_FIELDS.map(({ field, label }) => (
                <div key={field} className="space-y-1.5">
                  <Label htmlFor={`edit-${field}`} className="text-xs">
                    {label}
                  </Label>
                  <Input
                    id={`edit-${field}`}
                    type="date"
                    {...register(field)}
                    className="text-sm"
                  />
                  {errors[field] && (
                    <p className="text-xs text-red-500">{errors[field]?.message}</p>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="bg-brand-blue hover:bg-brand-blue/90"
              >
                {isPending ? "Saving…" : "Save Changes"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
