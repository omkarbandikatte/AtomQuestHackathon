import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, User } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatDate } from "@/lib/utils/format";

interface Props {
  member: {
    id: string;
    full_name: string;
    email: string;
    department: string | null;
  };
  sheet: {
    id: string;
    status: string;
    is_locked: boolean;
    submitted_at: string | null;
    approved_at: string | null;
  } | null;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-neutral-100 text-neutral-600" },
  submitted: { label: "Submitted", className: "bg-brand-amber/20 text-brand-amber" },
  approved: { label: "Approved", className: "bg-brand-green/20 text-brand-green" },
  returned: { label: "Returned", className: "bg-brand-red/20 text-brand-red" },
};

export function TeamMemberCard({ member, sheet }: Props) {
  const status = sheet?.status ?? "not_started";
  const config = statusConfig[status] ?? { label: "Not Started", className: "bg-neutral-100 text-neutral-500" };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-brand-blue/10 flex items-center justify-center">
              <User className="h-5 w-5 text-brand-blue" />
            </div>
            <div>
              <p className="font-semibold text-sm text-neutral-900">{member.full_name}</p>
              <p className="text-xs text-neutral-500">{member.department ?? "No department"}</p>
            </div>
          </div>
          <Badge className={cn("text-xs", config.className)}>{config.label}</Badge>
        </div>

        {sheet && (
          <div className="mt-3 pt-3 border-t border-neutral-100 space-y-1">
            {sheet.submitted_at && (
              <p className="text-xs text-neutral-500">
                Submitted: {formatDate(sheet.submitted_at)}
              </p>
            )}
            {sheet.approved_at && (
              <p className="text-xs text-neutral-500">
                Approved: {formatDate(sheet.approved_at)}
              </p>
            )}
          </div>
        )}

        {sheet?.status === "submitted" && (
          <Link
            href={`/approvals/${sheet.id}`}
            className="mt-3 flex items-center justify-end text-xs text-brand-teal hover:underline"
          >
            Review <ChevronRight className="h-3 w-3 ml-0.5" />
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
