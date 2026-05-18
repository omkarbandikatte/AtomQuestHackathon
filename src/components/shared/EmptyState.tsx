"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 text-center",
        className,
      )}
    >
      <div className="text-4xl mb-4">📭</div>
      <h3 className="text-base font-semibold text-neutral-900">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-neutral-500 max-w-sm">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
