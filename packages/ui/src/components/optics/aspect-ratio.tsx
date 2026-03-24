// @ts-nocheck
import { cn } from "@zalem/ui/lib/utils";

function AspectRatio({ ratio = 1, className = "", ...props }: any) {
  return (
    <div
      data-slot="aspect-ratio"
      style={{
        "--ratio": ratio,
      }}
      className={cn("relative aspect-(--ratio)", className)}
      {...props}
    />
  );
}

AspectRatio.displayName = "AspectRatio";

export { AspectRatio };
