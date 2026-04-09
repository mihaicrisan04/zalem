"use client";

import { cn } from "@zalem/ui/lib/utils";
import { TextShimmer } from "@zalem/ui/components/text-shimmer";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@zalem/ui/components/optics/collapsible";
import { ScrollArea } from "@zalem/ui/components/optics/scroll-area";
import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export type ThinkingProps = {
  text: string;
  isStreaming?: boolean;
  defaultOpen?: boolean;
  className?: string;
};

const MIN_SHIMMER_MS = 800;

function Thinking({ text, isStreaming = false, defaultOpen = false, className }: ThinkingProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [displayDone, setDisplayDone] = useState(!isStreaming);
  const mountedAt = useRef(Date.now());
  const doneRef = useRef(false);

  useEffect(() => {
    if (doneRef.current) return;
    if (!isStreaming) {
      const elapsed = Date.now() - mountedAt.current;
      const remaining = Math.max(0, MIN_SHIMMER_MS - elapsed);
      const timer = setTimeout(() => {
        doneRef.current = true;
        setDisplayDone(true);
      }, remaining);
      return () => clearTimeout(timer);
    }
  }, [isStreaming]);

  const showAsActive = !displayDone;
  const hasText = text.trim().length > 0;

  return (
    <div className={cn("inline-flex flex-col", className)}>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger
          className={cn(
            "group/thinking text-muted-foreground hover:text-foreground -mx-1 inline-flex items-center gap-1.5 rounded px-1 py-0.5 text-left text-sm transition-colors",
          )}
        >
          {showAsActive ? (
            <TextShimmer as="span" duration={2}>
              Thinking...
            </TextShimmer>
          ) : (
            <span>Thought</span>
          )}
          <ChevronDown
            className={cn(
              "size-3.5 shrink-0 transition-transform duration-150",
              open && "rotate-180",
            )}
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-1">
          <div className="bg-muted/50 border-border rounded-md border p-2">
            {hasText ? (
              <ScrollArea className="h-auto max-h-60" viewportClassName="max-h-60" maskHeight={12}>
                <div className="text-muted-foreground text-[12px] leading-relaxed whitespace-pre-wrap">
                  {text}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-muted-foreground text-[11px] italic">No reasoning yet</div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

Thinking.displayName = "Thinking";

export { Thinking };
