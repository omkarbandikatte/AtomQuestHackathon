import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils/format";
import type { Cycle } from "@/types/app.types";
import { CalendarDays } from "lucide-react";

interface Props {
  cycle: Cycle;
}

const WINDOWS = [
  { label: "Goal Setting", opensKey: "goal_setting_opens", closesKey: "q1_opens" },
  { label: "Q1 Check-in", opensKey: "q1_opens", closesKey: "q2_opens" },
  { label: "Q2 Check-in", opensKey: "q2_opens", closesKey: "q3_opens" },
  { label: "Q3 Check-in", opensKey: "q3_opens", closesKey: "q4_opens" },
  { label: "Q4 / Annual", opensKey: "q4_opens", closesKey: "cycle_closes" },
] as const;

export function CycleStatusCard({ cycle }: Props) {
  const today = new Date().toISOString().split("T")[0];

  return (
    <Card className="border-brand-teal/30 bg-brand-teal/5">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base text-brand-teal">
            <CalendarDays className="inline h-4 w-4 mr-2" />
            Active Cycle: {cycle.name}
          </CardTitle>
          <Badge className="bg-brand-green/20 text-brand-green">Active</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {WINDOWS.map((w) => {
            const opens = cycle[w.opensKey];
            const closes = cycle[w.closesKey];
            const isActive = today >= opens && today < closes;
            const isPast = today >= closes;

            return (
              <div
                key={w.label}
                className={`rounded-md p-2 text-center text-xs border ${
                  isActive
                    ? "border-brand-teal bg-brand-teal/10 text-brand-teal"
                    : isPast
                    ? "border-neutral-200 bg-neutral-50 text-neutral-400"
                    : "border-neutral-200 bg-white text-neutral-600"
                }`}
              >
                <p className="font-semibold">{w.label}</p>
                <p className="mt-0.5">{formatDate(opens)}</p>
                {isActive && (
                  <span className="inline-block mt-1 text-[10px] bg-brand-teal text-white rounded px-1">
                    OPEN
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
