import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

interface AuditEntry {
  id: number;
  action: string;
  changed_at: string;
  actor: { full_name: string } | null;
}

interface Props {
  entries: AuditEntry[];
}

const ACTION_STYLES: Record<string, string> = {
  UNLOCK: "bg-brand-amber/10 text-brand-amber",
  GOAL_EDIT: "bg-brand-blue/10 text-brand-blue",
  APPROVE: "bg-brand-green/10 text-brand-green",
  RETURN: "bg-brand-red/10 text-brand-red",
  SUBMIT: "bg-neutral-100 text-neutral-600",
};

export function RecentAuditFeed({ entries }: Props) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-neutral-700">Recent Audit Events</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {entries.length === 0 ? (
          <p className="text-xs text-neutral-400 text-center py-4">No recent events</p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {entries.map((e) => (
              <li key={e.id} className="px-4 py-2.5 flex items-start gap-2">
                <span
                  className={cn(
                    "mt-0.5 inline-block rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide flex-shrink-0",
                    ACTION_STYLES[e.action] ?? "bg-neutral-100 text-neutral-500",
                  )}
                >
                  {e.action}
                </span>
                <div className="min-w-0">
                  <p className="text-xs text-neutral-700 truncate">
                    {e.actor?.full_name ?? "System"}
                  </p>
                  <p className="text-[10px] text-neutral-400">{formatDateTime(e.changed_at)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
