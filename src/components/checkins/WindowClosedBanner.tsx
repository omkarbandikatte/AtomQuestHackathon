import { AlertTriangle } from "lucide-react";
import { formatDate } from "@/lib/utils/format";
import type { WindowStatus } from "@/types/app.types";

interface Props {
  windowStatus: WindowStatus;
}

export function WindowClosedBanner({ windowStatus }: Props) {
  return (
    <div className="rounded-lg border border-brand-amber/30 bg-brand-amber/10 px-4 py-3 flex items-start gap-3">
      <AlertTriangle className="h-4 w-4 text-brand-amber mt-0.5 flex-shrink-0" />
      <div>
        <p className="text-sm font-medium text-brand-amber">
          Check-in window is currently closed
        </p>
        {windowStatus.closesAt && (
          <p className="text-xs text-neutral-500 mt-0.5">
            Next window opens: {formatDate(windowStatus.closesAt)}
          </p>
        )}
      </div>
    </div>
  );
}
