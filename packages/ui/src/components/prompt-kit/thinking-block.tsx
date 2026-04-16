"use client";

import { Brain } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ToolLayout, type ToolRenderState } from "./tool-layout";

export type ThinkingBlockProps = {
  text: string;
  isStreaming?: boolean;
  partCount?: number;
  className?: string;
};

const COMPLETED_STATE: ToolRenderState = { running: false };
const STREAMING_STATE: ToolRenderState = { running: true };

function ThinkingBlock({
  text,
  isStreaming = false,
  partCount = 1,
  className,
}: ThinkingBlockProps) {
  const [elapsed, setElapsed] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isStreaming) {
      if (startTimeRef.current !== null) {
        setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }

    if (startTimeRef.current === null) {
      startTimeRef.current = Date.now();
    }

    intervalRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - (startTimeRef.current ?? Date.now())) / 1000));
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isStreaming]);

  const hasContent = text.trim().length > 0;
  const thoughtLabel =
    partCount === 1 ? "Thought" : `${partCount} thought${partCount !== 1 ? "s" : ""}`;
  const name = isStreaming ? "Thinking..." : thoughtLabel;
  const summary = !isStreaming && elapsed > 0 ? `${elapsed} second${elapsed !== 1 ? "s" : ""}` : "";

  const expandedContent = hasContent ? (
    <div className="border-border bg-muted/40 rounded-md border px-3 py-2">
      <p className="text-muted-foreground whitespace-pre-wrap break-words text-xs">{text}</p>
    </div>
  ) : undefined;

  return (
    <ToolLayout
      name={name}
      icon={<Brain className="size-3.5" />}
      summary={summary}
      state={isStreaming ? STREAMING_STATE : COMPLETED_STATE}
      expandedContent={expandedContent}
      className={className}
    />
  );
}

ThinkingBlock.displayName = "ThinkingBlock";

export { ThinkingBlock };
