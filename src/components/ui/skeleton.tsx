import { cn } from "@/lib/utils/cn";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-neutral-200/60", className)}
      {...props}
    />
  );
}

export { Skeleton };
