"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils/format";
import { activateCycleAction } from "@/app/actions/admin";
import { useTransition } from "react";
import { toast } from "sonner";
import type { WindowStatus } from "@/types/app.types";
import { CalendarRange, Zap } from "lucide-react";

interface Props {
  windowStatus: WindowStatus;
  cycleId: string | null;
}

const PHASE_LABEL: Record<string, string> = {
  goal_setting: "Goal Setting",
  Q1: "Q1 Check-in",
  Q2: "Q2 Check-in",
  Q3: "Q3 Check-in",
  Q4: "Q4 / Annual",
};

export function WindowControlCard({ windowStatus, cycleId }: Props) {
  const [isPending, startTransition] = useTransition();
  const { phase, closesAt, opensAt } = windowStatus;

  const isOpen = !!phase;
  const today = new Date().toISOString().split("T")[0];
  const daysLeft = closesAt
    ? Math.max(0, Math.ceil((new Date(closesAt).getTime() - new Date(today).getTime()) / 86400000))
    : null;

  return (
    <Card className={isOpen ? "border-brand-teal/30" : "border-neutral-200"}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-neutral-700 flex items-center gap-1.5">
            <CalendarRange className="h-4 w-4" />
            Active Window
          </CardTitle>
          <Badge
            className={
              isOpen
                ? "bg-brand-green/20 text-brand-green text-xs"
                : "bg-neutral-100 text-neutral-500 text-xs"
            }
          >
            {isOpen ? "OPEN" : "CLOSED"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {isOpen ? (
          <>
            <p className="text-xl font-bold text-brand-teal">
              {PHASE_LABEL[phase!] ?? phase}
            </p>
            <div className="text-xs text-neutral-500 space-y-1">
              {opensAt && <p>Opened: {formatDate(opensAt)}</p>}
              {closesAt && (
                <p className={daysLeft !== null && daysLeft <= 7 ? "text-brand-red font-semibold" : ""}>
                  Closes: {formatDate(closesAt)}
                  {daysLeft !== null && ` · ${daysLeft}d left`}
                </p>
              )}
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-neutral-400">No window is currently open.</p>
            {opensAt && (
              <p className="text-xs text-neutral-500">Next opens: {formatDate(opensAt)}</p>
            )}
          </>
        )}

        {cycleId && (
          <div className="pt-2 border-t border-neutral-100">
            <p className="text-xs text-neutral-500 mb-2">
              Window timing is controlled via cycle dates in{" "}
              <a href="/cycles" className="underline text-brand-blue">Cycle Config</a>.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
