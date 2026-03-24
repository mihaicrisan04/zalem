"use client";

import { cn } from "@zalem/ui/lib/utils";
import { ChevronDown } from "lucide-react";
import { useStickToBottomContext } from "use-stick-to-bottom";
import { Button } from "@zalem/ui/components/optics/button";

export type ScrollButtonProps = {
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

function ScrollButton({ className, ...props }: ScrollButtonProps) {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext();

  return (
    <Button
      variant="outline"
      size="icon"
      className={cn(
        "size-10 rounded-full transition-all duration-150 ease-out",
        !isAtBottom
          ? "translate-y-0 scale-100 opacity-100"
          : "pointer-events-none translate-y-4 scale-95 opacity-0",
        className,
      )}
      onClick={() => scrollToBottom()}
      {...props}
    >
      <ChevronDown className="size-5" />
    </Button>
  );
}

ScrollButton.displayName = "ScrollButton";

export { ScrollButton };
