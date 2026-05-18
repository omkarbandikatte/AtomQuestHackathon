"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface LoadingStateProps {
  message?: string;
  className?: string;
}

export function LoadingState({
  message = "Loading…",
  className,
}: LoadingStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 gap-3",
        className,
      )}
      role="status"
      aria-label={message}
    >
      <Loader2 className="h-8 w-8 animate-spin text-brand-teal" />
      <span className="text-sm text-neutral-500">{message}</span>
    </div>
  );
}
