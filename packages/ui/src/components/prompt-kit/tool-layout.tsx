"use client";

import { cn } from "@zalem/ui/lib/utils";
import { Loader2, Minus, Plus } from "lucide-react";
import type React from "react";
import { type ReactNode, useEffect, useState } from "react";

export type ToolRenderState = {
  running: boolean;
  error?: string;
};

export type ToolLayoutProps = {
  name: string;
  summary: ReactNode;
  state: ToolRenderState;
  expandedContent?: ReactNode;
  defaultExpanded?: boolean;
  icon?: ReactNode;
  className?: string;
};

const EXPANDED_CONTENT_TRANSITION_MS = 200;

function StatusIndicator({ state }: { state: ToolRenderState }) {
  if (state.running) {
    return <Loader2 className="size-3 animate-spin text-yellow-500" />;
  }
  const color = state.error ? "bg-red-500" : "bg-green-500";
  return <span className={cn("inline-block size-2 rounded-full", color)} />;
}

function hasRenderableContent(value: ReactNode) {
  return value !== null && value !== undefined && value !== false && value !== "";
}

export function ToolLayout({
  name,
  summary,
  state,
  expandedContent,
  defaultExpanded = false,
  icon,
  className,
}: ToolLayoutProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const hasExpandedDetails = hasRenderableContent(expandedContent) || !!state.error;
  const isExpandedPanelVisible = isExpanded && hasExpandedDetails;
  const [shouldRenderExpandedContent, setShouldRenderExpandedContent] = useState(
    defaultExpanded && hasExpandedDetails,
  );

  useEffect(() => {
    if (!hasExpandedDetails) {
      setShouldRenderExpandedContent(false);
      return;
    }
    if (isExpandedPanelVisible) {
      setShouldRenderExpandedContent(true);
      return;
    }
    if (!shouldRenderExpandedContent) return;

    const timeoutId = window.setTimeout(() => {
      setShouldRenderExpandedContent(false);
    }, EXPANDED_CONTENT_TRANSITION_MS);
    return () => window.clearTimeout(timeoutId);
  }, [hasExpandedDetails, isExpandedPanelVisible, shouldRenderExpandedContent]);

  const handleToggle = () => {
    if (!hasExpandedDetails) return;
    const nextExpanded = !isExpanded;
    if (nextExpanded) setShouldRenderExpandedContent(true);
    setIsExpanded(nextExpanded);
  };

  const isRunning = state.running;
  const resolvedIcon = isRunning ? (
    <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
  ) : (
    (icon ?? <StatusIndicator state={state} />)
  );

  const hasSummary = typeof summary === "string" ? summary.trim().length > 0 : summary != null;

  return (
    <div className={cn("-mx-1.5 rounded-md border border-transparent bg-transparent", className)}>
      <div
        className={cn(
          "group flex min-w-0 select-none items-center gap-2 rounded-md px-1.5 py-1 text-sm",
          hasExpandedDetails && "cursor-pointer transition-colors hover:bg-muted/50",
        )}
        {...(hasExpandedDetails && {
          onClick: handleToggle,
          onKeyDown: (e: React.KeyboardEvent) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleToggle();
            }
          },
          role: "button",
          tabIndex: 0,
          "aria-expanded": isExpanded,
        })}
      >
        {/* Icon area */}
        <span className="flex size-4 shrink-0 items-center justify-center text-muted-foreground/70">
          {hasExpandedDetails && !isRunning ? (
            <>
              <span className="group-hover:hidden">{resolvedIcon}</span>
              {isExpandedPanelVisible ? (
                <Minus className="hidden size-3.5 text-muted-foreground group-hover:block" />
              ) : (
                <Plus className="hidden size-3.5 text-muted-foreground group-hover:block" />
              )}
            </>
          ) : (
            resolvedIcon
          )}
        </span>

        {/* Name */}
        <span
          className={cn(
            "min-w-0 shrink truncate font-medium leading-none",
            state.error ? "text-red-500" : "text-foreground",
          )}
        >
          {name}
        </span>

        {/* Summary */}
        {hasSummary && (
          <span className="text-muted-foreground min-w-0 shrink truncate font-mono text-[13px] leading-none">
            {summary}
          </span>
        )}
      </div>

      {/* Expandable content */}
      {hasExpandedDetails && (
        <div
          aria-hidden={!isExpandedPanelVisible}
          className={cn(
            "grid overflow-hidden transition-[grid-template-rows,opacity,margin-top] motion-reduce:transition-none",
            isExpandedPanelVisible
              ? "mt-1.5 grid-rows-[1fr] opacity-100 duration-200 ease-out"
              : "pointer-events-none grid-rows-[0fr] opacity-0 duration-150 ease-out",
          )}
        >
          <div className="min-h-0">
            {shouldRenderExpandedContent && (
              <div className="space-y-2 pb-1">
                {state.error && !hasRenderableContent(expandedContent) && (
                  <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-all rounded-md border border-red-500/20 bg-red-500/5 px-3 py-2 font-mono text-xs leading-relaxed text-red-400">
                    {state.error}
                  </pre>
                )}
                {expandedContent}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

ToolLayout.displayName = "ToolLayout";
