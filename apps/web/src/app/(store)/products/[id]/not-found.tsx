import Link from "next/link";
import { Button } from "@zalem/ui/components/optics/button";

export default function ProductNotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-lg font-semibold">Product not found</p>
      <p className="text-muted-foreground text-sm">
        This product may have been removed or the link is incorrect.
      </p>
      <Button variant="outline" size="sm" asChild>
        <Link href={"/" as any}>Back to home</Link>
      </Button>
    </div>
  );
}
