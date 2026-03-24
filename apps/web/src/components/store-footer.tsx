import { Separator } from "@zalem/ui/components/optics/separator";

export function StoreFooter() {
  return (
    <footer className="mt-auto border-t">
      <div className="container mx-auto px-4 py-6">
        <Separator className="mb-4" />
        <div className="text-muted-foreground flex items-center justify-between text-sm">
          <p>&copy; {new Date().getFullYear()} zalem. All rights reserved.</p>
          <p className="text-xs">AI-powered shopping assistant</p>
        </div>
      </div>
    </footer>
  );
}
