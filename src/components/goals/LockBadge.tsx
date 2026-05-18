"use client";

import { Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";

interface LockBadgeProps {
  className?: string;
}

export function LockBadge({ className }: LockBadgeProps) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        "flex items-center gap-1 bg-neutral-200 text-neutral-900 font-medium",
        className,
      )}
    >
      <Lock className="h-3 w-3" aria-hidden="true" />
      Approved &amp; Locked
    </Badge>
  );
}
