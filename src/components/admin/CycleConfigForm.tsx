"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { toast } from "sonner";
import { cycleSchema } from "@/validations/admin-schema";
import { createCycleAction, updateCycleAction } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Cycle } from "@/types/app.types";
import type { z } from "zod";

type CycleValues = z.infer<typeof cycleSchema>;

interface Props {
  cycles: Cycle[];
}

export function CycleConfigForm({ cycles }: Props) {
  const [isPending, startTransition] = useTransition();

  const { register, handleSubmit, formState: { errors }, reset } = useForm<CycleValues>({
    resolver: zodResolver(cycleSchema),
    defaultValues: {
      name: `FY ${new Date().getFullYear()}-${String(new Date().getFullYear() + 1).slice(2)}`,
      goal_setting_opens: "",
      q1_opens: "",
      q2_opens: "",
      q3_opens: "",
      q4_opens: "",
      cycle_closes: "",
    },
  });

  function onSubmit(values: CycleValues) {
    startTransition(async () => {
      const result = await createCycleAction(values);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Cycle created and set as active");
        reset();
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Create New Cycle</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Cycle Name</Label>
            <Input id="name" placeholder="e.g. FY 2026-27" {...register("name")} />
            {errors.name && <p className="text-xs text-brand-red">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { field: "goal_setting_opens" as const, label: "Goal Setting Opens" },
              { field: "q1_opens" as const, label: "Q1 Check-in Opens" },
              { field: "q2_opens" as const, label: "Q2 Check-in Opens" },
              { field: "q3_opens" as const, label: "Q3 Check-in Opens" },
              { field: "q4_opens" as const, label: "Q4 / Annual Opens" },
              { field: "cycle_closes" as const, label: "Cycle Closes" },
            ].map(({ field, label }) => (
              <div key={field} className="space-y-1.5">
                <Label htmlFor={field} className="text-xs">{label}</Label>
                <Input id={field} type="date" {...register(field)} className="text-sm" />
                {errors[field] && (
                  <p className="text-xs text-brand-red">{errors[field]?.message}</p>
                )}
              </div>
            ))}
          </div>

          <Button
            type="submit"
            disabled={isPending}
            className="bg-brand-blue hover:bg-brand-blue/90"
          >
            {isPending ? "Creating…" : "Create Cycle"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
