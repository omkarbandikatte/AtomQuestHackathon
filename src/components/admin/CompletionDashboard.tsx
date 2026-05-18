import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";

interface Sheet {
  id: string;
  status: string;
  is_locked: boolean;
  employee: { id: string; full_name: string; email: string; department: string | null } | null;
}

interface Props {
  sheets: Sheet[];
}

const STATUS_ORDER = ["approved", "submitted", "draft", "returned"];
const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  approved: { label: "Approved", className: "bg-brand-green/20 text-brand-green" },
  submitted: { label: "Submitted", className: "bg-brand-amber/20 text-brand-amber" },
  draft: { label: "Draft", className: "bg-neutral-100 text-neutral-500" },
  returned: { label: "Returned", className: "bg-brand-red/20 text-brand-red" },
};

export function CompletionDashboard({ sheets }: Props) {
  const counts = STATUS_ORDER.reduce<Record<string, number>>((acc, s) => {
    acc[s] = sheets.filter((sh) => sh.status === s).length;
    return acc;
  }, {});

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Completion Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary chips */}
        <div className="flex flex-wrap gap-3">
          {STATUS_ORDER.map((s) => (
            <div
              key={s}
              className={cn(
                "rounded-full px-3 py-1 text-sm font-medium",
                STATUS_CONFIG[s]?.className,
              )}
            >
              {STATUS_CONFIG[s]?.label}: {counts[s] ?? 0}
            </div>
          ))}
          <div className="rounded-full px-3 py-1 text-sm font-medium bg-neutral-100 text-neutral-500">
            Total: {sheets.length}
          </div>
        </div>

        {/* Employee list */}
        <div className="divide-y divide-neutral-100">
          {sheets.map((sheet) => (
            <div key={sheet.id} className="py-2 flex items-center justify-between text-sm">
              <div>
                <span className="font-medium">{sheet.employee?.full_name ?? "—"}</span>
                <span className="ml-2 text-xs text-neutral-500">
                  {sheet.employee?.department ?? "No dept"}
                </span>
              </div>
              <Badge className={cn("text-xs", STATUS_CONFIG[sheet.status]?.className)}>
                {STATUS_CONFIG[sheet.status]?.label ?? sheet.status}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
