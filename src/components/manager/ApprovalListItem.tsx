import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Clock } from "lucide-react";
import { formatDate } from "@/lib/utils/format";

interface Props {
  sheet: {
    id: string;
    status: string;
    submitted_at: string | null;
    is_locked: boolean;
    employee: { id: string; full_name: string; email: string; department: string | null } | null;
    goals: Array<{ id: string; title: string; weightage: number; uom_type: string; thrust_area: string }>;
  };
}

export function ApprovalListItem({ sheet }: Props) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-semibold text-sm text-neutral-900">
              {sheet.employee?.full_name ?? "Unknown Employee"}
            </p>
            <p className="text-xs text-neutral-500">{sheet.employee?.department ?? "No department"}</p>
          </div>
          <Badge className="bg-brand-amber/20 text-brand-amber text-xs">Pending Review</Badge>
        </div>

        <div className="mt-3 flex items-center gap-4 text-xs text-neutral-500">
          <span>{sheet.goals?.length ?? 0} goals</span>
          {sheet.submitted_at && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Submitted {formatDate(sheet.submitted_at)}
            </span>
          )}
        </div>

        <Link
          href={`/approvals/${sheet.id}`}
          className="mt-3 flex items-center justify-end text-sm text-brand-teal font-medium hover:underline"
        >
          Review Sheet <ChevronRight className="h-4 w-4 ml-0.5" />
        </Link>
      </CardContent>
    </Card>
  );
}
