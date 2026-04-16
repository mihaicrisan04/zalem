"use client";

import { cn } from "@zalem/ui/lib/utils";
import { ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

export type ToolCallsSummaryBarProps = {
  isExpanded: boolean;
  onToggle: () => void;
  isStreaming: boolean;
  toolCallCount: number;
  /** Final generation duration in ms (for completed messages). */
  durationMs: number | null;
  /** ISO timestamp or epoch ms of when generation started — used for a live counter while streaming. */
  startedAt: string | number | null;
  className?: string;
};

type StatusWordPair = { present: string; past: string };

const STATUS_WORD_PAIRS: StatusWordPair[] = [
  { present: "Pondering", past: "Pondered" },
  { present: "Crafting", past: "Crafted" },
  { present: "Simmering", past: "Simmered" },
  { present: "Ruminating", past: "Ruminated" },
];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function formatElapsedTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (secs === 0) return `${mins}m`;
  return `${mins}m ${secs}s`;
}

function ToolCallsSummaryBar({
  isExpanded,
  onToggle,
  isStreaming,
  toolCallCount,
  durationMs,
  startedAt,
  className,
}: ToolCallsSummaryBarProps) {
  const startMs =
    startedAt == null
      ? null
      : typeof startedAt === "number"
        ? startedAt
        : new Date(startedAt).getTime();

  const computeLiveElapsed = () =>
    startMs != null ? Math.max(0, Math.floor((Date.now() - startMs) / 1000)) : 0;

  const [liveElapsed, setLiveElapsed] = useState(computeLiveElapsed);

  useEffect(() => {
    if (!isStreaming) return;
    setLiveElapsed(computeLiveElapsed());
    const interval = setInterval(() => {
      setLiveElapsed(computeLiveElapsed());
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStreaming, startMs]);

  const elapsedSeconds = isStreaming
    ? liveElapsed
    : durationMs != null
      ? Math.max(0, Math.round(durationMs / 1000))
      : liveElapsed;

  // pick a stable status word based on tool count (deterministic per message)
  const pair = STATUS_WORD_PAIRS[hashString(String(toolCallCount)) % STATUS_WORD_PAIRS.length]!;
  const statusLabel = isStreaming ? `${pair.present}...` : pair.past;

  const toolLabel =
    toolCallCount > 0 ? `${toolCallCount} tool${toolCallCount !== 1 ? "s" : ""}` : null;

  const segments: string[] = [];
  if (elapsedSeconds > 0) segments.push(formatElapsedTime(elapsedSeconds));
  if (toolLabel) segments.push(toolLabel);

  return (
    <div className={cn("my-1.5 border border-transparent py-0.5", className)}>
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "text-muted-foreground group flex w-full items-center gap-2 rounded-md py-px text-left text-sm tabular-nums transition-colors hover:text-foreground",
          isStreaming && "text-foreground/90",
        )}
      >
        <span className="flex size-3.5 shrink-0 items-center justify-center">
          <span
            className={cn(
              "inline-block size-2 rounded-full",
              isStreaming ? "bg-muted-foreground animate-pulse" : "bg-muted-foreground/50",
            )}
          />
        </span>
        <span
          className={cn(
            "min-w-0 flex-1 truncate leading-none",
            isStreaming && "animate-pulse motion-reduce:animate-none",
          )}
        >
          {statusLabel}
          {segments.map((segment) => (
            <span key={segment}>
              <span className="text-muted-foreground/40"> · </span>
              {segment}
            </span>
          ))}
        </span>
        <ChevronRight
          className={cn(
            "size-3 shrink-0 text-muted-foreground/50 transition-transform duration-200 ease-out",
            isExpanded && "rotate-90",
          )}
        />
      </button>
    </div>
  );
}

ToolCallsSummaryBar.displayName = "ToolCallsSummaryBar";

export { ToolCallsSummaryBar };
