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

// AI SDK v5 states: input-streaming, input-available, output-available, output-error
// Legacy/Convex Agent variants: call, partial-call, result
export type ToolState = string;

export type ToolPart = {
  toolName: string;
  state: ToolState;
  input?: Record<string, unknown>;
  output?: unknown;
  toolCallId?: string;
  errorText?: string;
};

const ACTIVE_STATES = new Set(["call", "partial-call", "input-streaming", "input-available"]);
const ERROR_STATES = new Set(["output-error", "error"]);

export type ToolProps = {
  toolPart: ToolPart;
  label: { active: string; done: string };
  defaultOpen?: boolean;
  className?: string;
};

const MIN_SHIMMER_MS = 800;

function isActiveState(state: ToolState): boolean {
  return ACTIVE_STATES.has(state);
}

function formatValue(value: unknown): unknown {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return value;
}

function renderValue(value: unknown): React.ReactNode {
  const formatted = formatValue(value);
  if (typeof formatted === "object" && formatted !== null) {
    return (
      <pre className="font-mono text-[11px] leading-relaxed whitespace-pre-wrap break-all">
        {JSON.stringify(formatted, null, 2)}
      </pre>
    );
  }
  return <span className="break-all">{String(formatted)}</span>;
}

function Tool({ toolPart, label, defaultOpen = false, className }: ToolProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [displayDone, setDisplayDone] = useState(false);
  const mountedAt = useRef(Date.now());
  const doneRef = useRef(false);

  const isActive = isActiveState(toolPart.state);

  // enforce minimum shimmer display time
  useEffect(() => {
    if (doneRef.current) return;
    if (!isActive) {
      const elapsed = Date.now() - mountedAt.current;
      const remaining = Math.max(0, MIN_SHIMMER_MS - elapsed);
      const timer = setTimeout(() => {
        doneRef.current = true;
        setDisplayDone(true);
      }, remaining);
      return () => clearTimeout(timer);
    }
  }, [isActive]);

  const showAsActive = !displayDone;
  const hasInput = toolPart.input && Object.keys(toolPart.input).length > 0;
  const isResolved = !isActive && !ERROR_STATES.has(toolPart.state);
  const hasOutput = isResolved && toolPart.output !== undefined && toolPart.output !== null;
  const hasError = ERROR_STATES.has(toolPart.state) && toolPart.errorText;

  return (
    <div className={cn("inline-flex flex-col", className)}>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger
          className={cn(
            "group/tool text-muted-foreground hover:text-foreground -mx-1 inline-flex items-center gap-1.5 rounded px-1 py-0.5 text-left text-sm transition-colors",
          )}
        >
          {showAsActive ? (
            <TextShimmer as="span" duration={2}>
              {`${label.active}...`}
            </TextShimmer>
          ) : (
            <span>{label.done}</span>
          )}
          <ChevronDown
            className={cn(
              "size-3.5 shrink-0 transition-transform duration-150",
              open && "rotate-180",
            )}
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-1">
          <div className="bg-muted/50 border-border space-y-2 rounded-md border p-2">
            {hasInput ? (
              <div className="bg-background border-border rounded border p-2">
                <div className="text-muted-foreground mb-1 text-[10px] font-medium tracking-wide uppercase">
                  Input
                </div>
                <ScrollArea
                  className="h-auto max-h-40"
                  viewportClassName="max-h-40"
                  maskHeight={12}
                >
                  <div className="text-foreground space-y-1 font-mono text-[11px]">
                    {Object.entries(toolPart.input as Record<string, unknown>).map(
                      ([key, value]) => (
                        <div key={key} className="break-all">
                          <span className="text-muted-foreground">{key}:</span>{" "}
                          <span>{renderValue(value)}</span>
                        </div>
                      ),
                    )}
                  </div>
                </ScrollArea>
              </div>
            ) : null}
            {hasOutput ? (
              <div className="bg-background border-border rounded border p-2">
                <div className="text-muted-foreground mb-1 text-[10px] font-medium tracking-wide uppercase">
                  Output
                </div>
                <ScrollArea
                  className="h-auto max-h-60"
                  viewportClassName="max-h-60"
                  maskHeight={12}
                >
                  <div className="text-foreground">{renderValue(toolPart.output)}</div>
                </ScrollArea>
              </div>
            ) : null}
            {hasError ? (
              <div className="border-destructive/40 bg-destructive/10 text-destructive rounded border p-2">
                <div className="mb-1 text-[10px] font-medium tracking-wide uppercase">Error</div>
                <div className="font-mono text-[11px] break-all">{toolPart.errorText}</div>
              </div>
            ) : null}
            {!hasInput && !hasOutput && !hasError ? (
              <div className="text-muted-foreground text-[11px] italic">No details</div>
            ) : null}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

Tool.displayName = "Tool";

export { Tool };
