"use client";

import { Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import type { ReadinessChip } from "@/hooks/use-readiness-signals";

export function QuestionChip({
  chip,
  onDismiss,
}: {
  chip: ReadinessChip;
  onDismiss: (type: string) => void;
}) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      <button
        onClick={() => {
          toast.info("AI advisor coming in phase 6", {
            description: `This will answer: "${chip.text}"`,
          });
        }}
        className="bg-primary/5 hover:bg-primary/10 text-primary border-primary/20 group inline-flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm transition-all hover:shadow-sm"
      >
        <Sparkles className="size-3.5 shrink-0" />
        {chip.text}
        <span
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            onDismiss(chip.type);
          }}
          className="text-primary/40 hover:text-primary/70 -mr-1 ml-1"
        >
          <X className="size-3.5" />
        </span>
      </button>
    </div>
  );
}

export function StickyBottomChip({
  chip,
  onDismiss,
}: {
  chip: ReadinessChip;
  onDismiss: (type: string) => void;
}) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 fixed inset-x-0 bottom-20 z-30 flex justify-center duration-500">
      <button
        onClick={() => {
          toast.info("AI advisor coming in phase 6", {
            description: `This will answer: "${chip.text}"`,
          });
        }}
        className="bg-background/95 text-primary border-primary/20 group inline-flex cursor-pointer items-center gap-2 rounded-full border px-5 py-2.5 text-sm shadow-lg backdrop-blur transition-all hover:shadow-xl"
      >
        <Sparkles className="size-4 shrink-0" />
        {chip.text}
        <span
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            onDismiss(chip.type);
          }}
          className="text-primary/40 hover:text-primary/70 -mr-1 ml-2"
        >
          <X className="size-4" />
        </span>
      </button>
    </div>
  );
}
