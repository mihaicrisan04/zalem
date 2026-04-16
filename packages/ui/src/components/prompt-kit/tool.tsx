"use client";

import { ScrollArea } from "@zalem/ui/components/optics/scroll-area";
import { ToolLayout, type ToolRenderState } from "./tool-layout";

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
  const isActive = isActiveState(toolPart.state);
  const hasError = ERROR_STATES.has(toolPart.state);
  const hasInput = toolPart.input && Object.keys(toolPart.input).length > 0;
  const isResolved = !isActive && !hasError;
  const hasOutput = isResolved && toolPart.output !== undefined && toolPart.output !== null;

  const name = isActive ? `${label.active}...` : label.done;

  const state: ToolRenderState = {
    running: isActive,
    error: hasError ? toolPart.errorText : undefined,
  };

  const hasExpandableContent = hasInput || hasOutput || hasError;

  const expandedContent = hasExpandableContent ? (
    <div className="bg-muted/50 border-border space-y-2 rounded-md border p-2">
      {hasInput ? (
        <div className="bg-background border-border rounded border p-2">
          <div className="text-muted-foreground mb-1 text-[10px] font-medium tracking-wide uppercase">
            Input
          </div>
          <ScrollArea className="h-auto max-h-40" viewportClassName="max-h-40" maskHeight={12}>
            <div className="text-foreground space-y-1 font-mono text-[11px]">
              {Object.entries(toolPart.input as Record<string, unknown>).map(([key, value]) => (
                <div key={key} className="break-all">
                  <span className="text-muted-foreground">{key}:</span>{" "}
                  <span>{renderValue(value)}</span>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      ) : null}
      {hasOutput ? (
        <div className="bg-background border-border rounded border p-2">
          <div className="text-muted-foreground mb-1 text-[10px] font-medium tracking-wide uppercase">
            Output
          </div>
          <ScrollArea className="h-auto max-h-60" viewportClassName="max-h-60" maskHeight={12}>
            <div className="text-foreground">{renderValue(toolPart.output)}</div>
          </ScrollArea>
        </div>
      ) : null}
      {hasError && toolPart.errorText ? (
        <div className="border-destructive/40 bg-destructive/10 text-destructive rounded border p-2">
          <div className="mb-1 text-[10px] font-medium tracking-wide uppercase">Error</div>
          <div className="font-mono text-[11px] break-all">{toolPart.errorText}</div>
        </div>
      ) : null}
      {!hasInput && !hasOutput && !hasError ? (
        <div className="text-muted-foreground text-[11px] italic">No details</div>
      ) : null}
    </div>
  ) : undefined;

  return (
    <ToolLayout
      name={name}
      summary=""
      state={state}
      expandedContent={expandedContent}
      defaultExpanded={defaultOpen}
      className={className}
    />
  );
}

Tool.displayName = "Tool";

export { Tool };
