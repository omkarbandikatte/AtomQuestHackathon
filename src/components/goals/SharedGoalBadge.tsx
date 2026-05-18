"use client";

import { Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";

interface SharedGoalBadgeProps {
  className?: string;
}

export function SharedGoalBadge({ className }: SharedGoalBadgeProps) {
  return (
    <Badge
      variant="warning"
      className={cn("flex items-center gap-1", className)}
    >
      <Users className="h-3 w-3" aria-hidden="true" />
      Shared
    </Badge>
  );
}
