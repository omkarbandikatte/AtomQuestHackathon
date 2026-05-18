import { Card, CardContent } from "@/components/ui/card";
import { Users, Send, CheckCircle, FileEdit, AlertCircle, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface Props {
  stats: {
    total: number;
    submitted: number;
    approved: number;
    draft: number;
    notStarted: number;
    returned: number;
  };
}

const statItems = [
  { key: "total" as const, label: "Total", icon: Users, color: "text-brand-blue", bg: "bg-brand-blue/10" },
  { key: "submitted" as const, label: "Pending Review", icon: Send, color: "text-brand-amber", bg: "bg-brand-amber/10" },
  { key: "approved" as const, label: "Approved", icon: CheckCircle, color: "text-brand-green", bg: "bg-brand-green/10" },
  { key: "draft" as const, label: "In Draft", icon: FileEdit, color: "text-neutral-500", bg: "bg-neutral-100" },
  { key: "returned" as const, label: "Returned", icon: RotateCcw, color: "text-brand-red", bg: "bg-brand-red/10" },
  { key: "notStarted" as const, label: "Not Started", icon: AlertCircle, color: "text-neutral-400", bg: "bg-neutral-50" },
];

export function TeamStats({ stats }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {statItems.map(({ key, label, icon: Icon, color, bg }) => (
        <Card key={key} className="border-0 shadow-sm">
          <CardContent className="p-3 flex items-center gap-3">
            <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center", bg)}>
              <Icon className={cn("h-4 w-4", color)} />
            </div>
            <div>
              <p className="text-lg font-bold text-neutral-900">{stats[key]}</p>
              <p className="text-[10px] text-neutral-500 leading-tight">{label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
