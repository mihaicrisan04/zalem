"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ToolCallsSummaryBar } from "@zalem/ui/components/prompt-kit/tool-calls-summary-bar";
import { extractToolName } from "./tool-labels";

type MessagePart = {
  type?: string;
  text?: string;
  state?: string;
  toolName?: string;
  toolCallId?: string;
  input?: unknown;
  output?: unknown;
  errorText?: string;
};

const ACTIVE_TOOL_STATES = new Set(["call", "partial-call", "input-streaming", "input-available"]);

function isCollapsiblePart(part: MessagePart): boolean {
  if (part.type === "reasoning") return true;
  return extractToolName(part) !== null;
}

function countToolCalls(parts: MessagePart[]): number {
  return parts.filter((p) => extractToolName(p) !== null).length;
}

function hasAnyActivePart(parts: MessagePart[]): boolean {
  return parts.some((p) => {
    if (p.type === "reasoning") return p.state === "streaming";
    if (extractToolName(p) !== null) return ACTIVE_TOOL_STATES.has(p.state ?? "");
    return false;
  });
}

export type AssistantMessageGroupsProps = {
  message: { id?: string; parts?: MessagePart[] };
  isStreaming: boolean;
  /** Pre-computed generation duration in ms (for completed messages) */
  durationMs: number | null;
  /** Timestamp of when generation started — used for live timer while streaming */
  startedAt: number | null;
  /**
   * Render function that produces the list of group elements.
   * Called with `isExpanded` so the caller can conditionally
   * skip rendering collapsible groups.
   */
  children: (isExpanded: boolean) => ReactNode;
};

export function AssistantMessageGroups({
  message,
  isStreaming,
  durationMs,
  startedAt,
  children,
}: AssistantMessageGroupsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const parts = message.parts ?? [];

  const hasCollapsible = useMemo(() => parts.some(isCollapsiblePart), [parts]);
  const toolCallCount = useMemo(() => countToolCalls(parts), [parts]);
  const isAnyActive = useMemo(() => hasAnyActivePart(parts), [parts]);

  // If no collapsible content, just render children directly
  if (!hasCollapsible) {
    return <>{children(true)}</>;
  }

  return (
    <>
      <ToolCallsSummaryBar
        isExpanded={isExpanded}
        onToggle={() => setIsExpanded((v) => !v)}
        isStreaming={isStreaming && isAnyActive}
        toolCallCount={toolCallCount}
        durationMs={durationMs}
        startedAt={startedAt}
      />
      <div className="space-y-1">{children(isExpanded)}</div>
    </>
  );
}
