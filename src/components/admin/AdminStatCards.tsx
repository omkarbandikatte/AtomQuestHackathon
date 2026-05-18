import { Card, CardContent } from "@/components/ui/card";
import { Users, UserCheck, CheckCircle, Clock, BarChart3, Calendar } from "lucide-react";
import type { WindowPhase } from "@/types/app.types";

interface Props {
  totalEmployees: number;
  totalManagers: number;
  approvedSheets: number;
  pendingSheets: number;
  totalSheets: number;
  currentPhase: WindowPhase;
}

const PHASE_LABELS: Record<string, string> = {
  goal_setting: "Goal Setting",
  Q1: "Q1 Check-in",
  Q2: "Q2 Check-in",
  Q3: "Q3 Check-in",
  Q4: "Q4 / Annual",
};

export function AdminStatCards({
  totalEmployees,
  totalManagers,
  approvedSheets,
  pendingSheets,
  totalSheets,
  currentPhase,
}: Props) {
  const completionPct =
    totalSheets > 0 ? Math.round((approvedSheets / totalSheets) * 100) : 0;

  const stats = [
    {
      label: "Active Employees",
      value: totalEmployees,
      icon: Users,
      color: "text-brand-blue",
      bg: "bg-brand-blue/10",
    },
    {
      label: "Active Managers",
      value: totalManagers,
      icon: UserCheck,
      color: "text-brand-teal",
      bg: "bg-brand-teal/10",
    },
    {
      label: "Approved Sheets",
      value: approvedSheets,
      sub: `${completionPct}% of total`,
      icon: CheckCircle,
      color: "text-brand-green",
      bg: "bg-brand-green/10",
    },
    {
      label: "Pending Review",
      value: pendingSheets,
      icon: Clock,
      color: "text-brand-amber",
      bg: "bg-brand-amber/10",
    },
    {
      label: "Total Sheets",
      value: totalSheets,
      icon: BarChart3,
      color: "text-neutral-600",
      bg: "bg-neutral-100",
    },
    {
      label: "Current Window",
      value: currentPhase ? PHASE_LABELS[currentPhase] : "—",
      icon: Calendar,
      color: currentPhase ? "text-brand-teal" : "text-neutral-400",
      bg: currentPhase ? "bg-brand-teal/10" : "bg-neutral-100",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      {stats.map((s) => (
        <Card key={s.label} className="border-neutral-200">
          <CardContent className="pt-4 pb-4">
            <div className={`inline-flex rounded-lg p-2 ${s.bg} mb-3`}>
              <s.icon className={`h-4 w-4 ${s.color}`} />
            </div>
            <p className="text-xl font-bold text-neutral-900">{s.value}</p>
            <p className="text-xs text-neutral-500 mt-0.5">{s.label}</p>
            {s.sub && <p className="text-xs text-neutral-400 mt-0.5">{s.sub}</p>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
