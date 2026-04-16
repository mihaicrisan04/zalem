"use client";

import { useEffect } from "react";
import { Button } from "@zalem/ui/components/optics/button";

export default function StoreError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-muted-foreground text-sm">Something went wrong.</p>
      <Button variant="outline" size="sm" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
