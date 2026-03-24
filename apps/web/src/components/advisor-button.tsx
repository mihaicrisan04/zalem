"use client";

import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@zalem/ui/components/optics/button";
import { cn } from "@zalem/ui/lib/utils";

export function AdvisorButton({ shouldPulse = false }: { shouldPulse?: boolean }) {
  return (
    <div
      className={cn(
        "fixed right-6 bottom-6 z-40 transition-transform",
        shouldPulse && "animate-[breathe_4s_ease-in-out_infinite]",
      )}
    >
      <Button
        size="lg"
        className="h-12 gap-2 rounded-full px-5 text-sm shadow-lg"
        onClick={() => {
          toast.info("AI advisor coming in phase 6", {
            description:
              "The shopping advisor will help you compare products, summarize reviews, and make better decisions.",
          });
        }}
      >
        <Sparkles className="size-5" />
        Ask advisor
      </Button>

      <style>{`
        @keyframes breathe {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.06); opacity: 0.85; }
        }
      `}</style>
    </div>
  );
}
