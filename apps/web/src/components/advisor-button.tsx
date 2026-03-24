"use client";

import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@zalem/ui/components/optics/button";
import { cn } from "@zalem/ui/lib/utils";

export function AdvisorButton({ shouldPulse = false }: { shouldPulse?: boolean }) {
  return (
    <div className="fixed right-6 bottom-6 z-40">
      {/* soft glow ring behind the button */}
      {shouldPulse && (
        <div className="bg-primary/20 absolute inset-0 -m-1 animate-[advisor-glow_3s_ease-in-out_infinite] rounded-full" />
      )}
      <Button
        size="lg"
        className={cn(
          "relative h-12 gap-2 rounded-full px-5 text-sm shadow-lg transition-shadow",
          shouldPulse && "shadow-primary/25 shadow-xl",
        )}
        onClick={() => {
          toast.info("AI advisor coming in phase 6", {
            description:
              "The shopping advisor will help you compare products, summarize reviews, and make better decisions.",
          });
        }}
      >
        <Sparkles
          className={cn(
            "size-5",
            shouldPulse && "animate-[advisor-sparkle_2s_ease-in-out_infinite]",
          )}
        />
        Ask advisor
      </Button>

      <style>{`
        @keyframes advisor-glow {
          0%, 100% { opacity: 0; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.15); }
        }
        @keyframes advisor-sparkle {
          0%, 100% { opacity: 1; transform: rotate(0deg); }
          50% { opacity: 0.7; transform: rotate(15deg); }
        }
      `}</style>
    </div>
  );
}
