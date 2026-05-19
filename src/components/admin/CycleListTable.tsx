"use client";

import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils/format";
import { activateCycleAction } from "@/app/actions/admin";
import { useTransition } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";
import type { Cycle } from "@/types/app.types";
import { Zap } from "lucide-react";
import { CycleEditDialog } from "@/components/admin/CycleEditDialog";

interface Props {
  cycles: Cycle[];
  activeCycleId: string | null;
}

export function CycleListTable({ cycles, activeCycleId }: Props) {
  const [isPending, startTransition] = useTransition();

  function handleActivate(cycleId: string) {
    startTransition(async () => {
      const result = await activateCycleAction(cycleId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Cycle activated");
      }
    });
  }

  if (cycles.length === 0) {
    return (
      <p className="text-sm text-neutral-400 text-center py-6">
        No cycles configured yet.
      </p>
    );
  }

  return (
    <div className="rounded-lg border border-neutral-200 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-neutral-50">
            <TableHead>Name</TableHead>
            <TableHead>Goal Setting</TableHead>
            <TableHead>Q1 Opens</TableHead>
            <TableHead>Closes</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[140px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {cycles.map((cycle) => (
            <TableRow key={cycle.id}>
              <TableCell className="font-medium text-sm">{cycle.name}</TableCell>
              <TableCell className="text-sm text-neutral-500">
                {formatDate(cycle.goal_setting_opens)}
              </TableCell>
              <TableCell className="text-sm text-neutral-500">
                {formatDate(cycle.q1_opens)}
              </TableCell>
              <TableCell className="text-sm text-neutral-500">
                {formatDate(cycle.cycle_closes)}
              </TableCell>
              <TableCell>
                <Badge
                  className={cn(
                    "text-xs",
                    cycle.is_active
                      ? "bg-brand-green/20 text-brand-green"
                      : "bg-neutral-100 text-neutral-400",
                  )}
                >
                  {cycle.is_active ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <CycleEditDialog cycle={cycle} />
                  {!cycle.is_active && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs gap-1"
                      disabled={isPending}
                      onClick={() => handleActivate(cycle.id)}
                    >
                      <Zap className="h-3 w-3" />
                      Activate
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
