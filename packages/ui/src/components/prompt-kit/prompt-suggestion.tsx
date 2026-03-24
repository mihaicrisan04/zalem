"use client";

import { cn } from "@zalem/ui/lib/utils";

export type PromptSuggestionProps = {
  children: React.ReactNode;
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

function PromptSuggestion({ children, className, ...props }: PromptSuggestionProps) {
  return (
    <button
      className={cn(
        "border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex cursor-pointer items-center rounded-full border px-4 py-2 text-sm transition-colors",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

PromptSuggestion.displayName = "PromptSuggestion";

export { PromptSuggestion };
