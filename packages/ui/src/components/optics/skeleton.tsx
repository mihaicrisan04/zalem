// @ts-nocheck
import { cn } from "@zalem/ui/lib/utils"

function Skeleton({
  className = "",
  ...props
}: any) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-muted rounded-md animate-pulse", className)}
      {...props} />
  );
}


Skeleton.displayName = "Skeleton";

export { Skeleton }

