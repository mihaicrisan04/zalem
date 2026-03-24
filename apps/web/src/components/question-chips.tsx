"use client";

import { X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@zalem/ui/components/optics/badge";
import type { ReadinessChip } from "@/hooks/use-readiness-signals";

export function QuestionChips({
  chips,
  onDismiss,
}: {
  chips: ReadinessChip[];
  onDismiss: (type: string) => void;
}) {
  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {chips.map((chip) => (
        <button
          key={chip.type}
          onClick={() => {
            toast.info("AI advisor coming in phase 6", {
              description: `This will answer: "${chip.text}"`,
            });
          }}
          className="bg-primary/5 hover:bg-primary/10 text-primary border-primary/20 group inline-flex cursor-pointer items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm transition-colors"
        >
          {chip.text}
          <span
            onClick={(e) => {
              e.stopPropagation();
              onDismiss(chip.type);
            }}
            className="text-primary/40 hover:text-primary/70 -mr-1"
          >
            <X className="size-3.5" />
          </span>
        </button>
      ))}
    </div>
  );
}
