"use client";

import { Sparkles } from "lucide-react";
import { Button } from "@zalem/ui/components/optics/button";
import { cn } from "@zalem/ui/lib/utils";
import { useAdvisor } from "@/hooks/use-advisor";

export function AdvisorButton({ shouldPulse = false }: { shouldPulse?: boolean }) {
  const { open, isOpen } = useAdvisor();

  if (isOpen) return null;

  return (
    <div
      className={cn(
        "fixed right-6 bottom-6 z-40",
        shouldPulse && "animate-[breathe_2.5s_ease-in-out_infinite]",
      )}
    >
      <Button
        size="lg"
        className={cn(
          "h-12 gap-2 rounded-full px-5 text-sm shadow-lg transition-shadow",
          shouldPulse && "shadow-primary/30 shadow-xl",
        )}
        onClick={() => open()}
      >
        <Sparkles className="size-5" />
        Ask advisor
      </Button>

      <style>{`
        @keyframes breathe {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}
