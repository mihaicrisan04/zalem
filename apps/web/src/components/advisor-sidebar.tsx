"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MessageSquarePlus, Send, Sparkles, X } from "lucide-react";
import { TextShimmer } from "@zalem/ui/components/text-shimmer";
import { useUIMessages } from "@convex-dev/agent/react";
import { api } from "@zalem/backend/convex/_generated/api";
import { Button } from "@zalem/ui/components/optics/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@zalem/ui/components/optics/tooltip";
import { ScrollArea } from "@zalem/ui/components/optics/scroll-area";
import { cn } from "@zalem/ui/lib/utils";
import { MessageContent, PromptSuggestion, Loader } from "@zalem/ui/components/prompt-kit";
import { useAdvisor } from "@/hooks/use-advisor";
import { StreamingText } from "./streaming-text";

const MIN_WIDTH = 340;
const DEFAULT_WIDTH = 400;
const DISMISS_THRESHOLD = 200;

const SUGGESTIONS = [
  "What laptop should I get for coding?",
  "Compare the top-rated phones",
  "What are the best deals right now?",
];

// -- tool name → human-readable label --

const TOOL_LABELS: Record<string, { active: string; done: string }> = {
  getProductDetails: { active: "Looking up product details", done: "Looked up product details" },
  searchProducts: { active: "Searching products", done: "Searched products" },
  getRecommendations: { active: "Finding recommendations", done: "Found recommendations" },
  getCartContents: { active: "Checking your cart", done: "Checked your cart" },
  getReviewsSummary: { active: "Reading reviews", done: "Read reviews" },
};

function getToolLabel(toolName: string, isActive: boolean): string {
  const labels = TOOL_LABELS[toolName];
  if (labels) return isActive ? labels.active : labels.done;
  return isActive ? `Running ${toolName}` : `Ran ${toolName}`;
}

// -- tool step indicator with minimum display time --

function ToolStepIndicator({ toolName, isActive }: { toolName: string; isActive: boolean }) {
  const [isDone, setIsDone] = useState(!isActive);
  const doneRef = useRef(!isActive);
  const mountedAt = useRef(Date.now());

  useEffect(() => {
    if (doneRef.current) return; // already done, never go back
    if (!isActive) {
      const elapsed = Date.now() - mountedAt.current;
      const remaining = Math.max(0, 800 - elapsed);
      const timer = setTimeout(() => {
        doneRef.current = true;
        setIsDone(true);
      }, remaining);
      return () => clearTimeout(timer);
    }
  }, [isActive]);

  const activeLabel = getToolLabel(toolName, true);
  const doneLabel = getToolLabel(toolName, false);

  return isDone ? (
    <div className="text-muted-foreground text-sm">{doneLabel}</div>
  ) : (
    <TextShimmer as="div" className="text-sm" duration={2}>
      {activeLabel}...
    </TextShimmer>
  );
}

// -- extract tool name from a part --

function extractToolName(part: any): string | null {
  if (part.type === "dynamic-tool") return part.toolName;
  if (typeof part.type === "string" && part.type.startsWith("tool-")) {
    return part.toolName ?? part.type.replace("tool-", "");
  }
  return null;
}

function isToolActive(part: any): boolean {
  return part.state === "call" || part.state === "input-streaming" || part.state === "partial-call";
}

// -- collect tool states: merge call + result parts into one indicator per tool --

function collectToolSteps(parts: any[]): Map<string, { toolName: string; isActive: boolean }> {
  const tools = new Map<string, { toolName: string; isActive: boolean }>();

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const toolName = extractToolName(part);
    if (!toolName) continue;

    const callId = part.toolCallId ?? `${toolName}-${i}`;
    const existing = tools.get(callId);

    // always update to latest state (result overrides call)
    if (!existing || !isToolActive(part)) {
      tools.set(callId, { toolName, isActive: isToolActive(part) });
    }
  }

  return tools;
}

// -- message parts renderer --

function AssistantMessage({ parts }: { parts: any[] }) {
  const toolSteps = collectToolSteps(parts);
  const renderedToolCalls = new Set<string>();

  return (
    <div className="space-y-1">
      {parts.map((part: any, i: number) => {
        // text parts
        if (part.type === "text" && part.text) {
          return (
            <StreamingText key={i} text={part.text} isStreaming={part.state === "streaming"} />
          );
        }

        // tool call parts — render at first occurrence, use merged state
        const toolName = extractToolName(part);
        if (toolName) {
          const callId = part.toolCallId ?? `${toolName}-${i}`;
          if (renderedToolCalls.has(callId)) return null;
          renderedToolCalls.add(callId);

          const step = toolSteps.get(callId);
          if (!step) return null;

          return (
            <ToolStepIndicator key={callId} toolName={step.toolName} isActive={step.isActive} />
          );
        }

        // skip step-start, reasoning, etc.
        return null;
      })}
    </div>
  );
}

// -- main sidebar --

export function AdvisorSidebar() {
  const { isOpen, close, newChat, threadId, isLoading, sendMessage, pendingQuestion } =
    useAdvisor();
  const [input, setInput] = useState("");
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const messagesResult = useUIMessages(
    api.ai.queries.listThreadMessages,
    threadId ? { threadId } : "skip",
    { initialNumItems: 50, stream: true },
  );

  const messages = messagesResult?.results ?? [];

  // auto-scroll: on new messages or when streaming status changes
  const lastMessageKey = messages.length > 0 ? messages[messages.length - 1]?.key : null;
  const lastMessageStatus = messages.length > 0 ? messages[messages.length - 1]?.status : null;

  useEffect(() => {
    // scroll the ScrollArea viewport directly — NOT scrollIntoView which scrolls all ancestors
    const scrollArea = scrollAreaRef.current;
    if (!scrollArea) return;
    const viewport = scrollArea.querySelector("[data-slot='scroll-area-viewport']");
    if (!viewport) return;
    const raf = requestAnimationFrame(() => {
      viewport.scrollTo({ top: viewport.scrollHeight, behavior: "smooth" });
    });
    return () => cancelAnimationFrame(raf);
  }, [messages.length, lastMessageKey, lastMessageStatus, isLoading]);

  useEffect(() => {
    if (pendingQuestion && isOpen && !isLoading) {
      sendMessage(pendingQuestion);
    }
  }, [pendingQuestion, isOpen]);

  // focus textarea when sidebar opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 350);
    }
  }, [isOpen]);

  const getMaxWidth = useCallback(() => {
    return Math.floor(window.innerWidth / 3);
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsResizing(true);

      const startX = e.clientX;
      const startWidth = width;

      const handleMouseMove = (e: MouseEvent) => {
        const delta = startX - e.clientX;
        const newWidth = startWidth + delta;
        const maxWidth = getMaxWidth();

        if (newWidth < DISMISS_THRESHOLD) {
          setWidth(Math.max(0, newWidth));
        } else {
          setWidth(Math.max(MIN_WIDTH, Math.min(maxWidth, newWidth)));
        }
      };

      const handleMouseUp = () => {
        setIsResizing(false);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";

        const sidebar = document.querySelector("[data-advisor-sidebar]");
        if (sidebar && sidebar.clientWidth < DISMISS_THRESHOLD) {
          close();
          setWidth(DEFAULT_WIDTH);
        }
      };

      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [width, getMaxWidth, close],
  );

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    setInput("");
    sendMessage(trimmed);
    // reset textarea height
    if (textareaRef.current) textareaRef.current.style.height = "";
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  };

  return (
    <aside
      data-advisor-sidebar
      className={cn(
        "bg-background group/sidebar relative flex h-full shrink-0 flex-col border-l",
        !isResizing && "transition-[width,opacity] duration-300 ease-out",
        isOpen ? "" : "w-0 overflow-hidden opacity-0",
      )}
      style={isOpen ? { width: `${width}px` } : undefined}
    >
      {/* resize handle */}
      <div
        onMouseDown={handleMouseDown}
        className="absolute top-0 -left-1 z-10 h-full w-2 cursor-col-resize"
      />

      {/* close — visible on sidebar hover */}
      <Button
        variant="raised"
        size="icon"
        className="absolute top-2.5 right-5 z-20 size-7 opacity-0 transition-opacity group-hover/sidebar:opacity-100"
        onClick={close}
      >
        <X className="size-3.5" />
      </Button>

      {/* messages */}
      <ScrollArea ref={scrollAreaRef} className="min-h-0 flex-1" maskHeight={20}>
        <div className="flex flex-col gap-4 p-4">
          {messages.length === 0 && !isLoading && (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 py-16">
              <div className="text-muted-foreground text-center">
                <Sparkles className="mx-auto mb-3 size-8 opacity-20" />
                <p className="text-sm font-semibold">Shopping Advisor</p>
                <p className="mt-1.5 max-w-[220px] text-xs leading-relaxed opacity-70">
                  Ask about products, compare options, or get recommendations.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2 px-2">
                {SUGGESTIONS.map((s) => (
                  <PromptSuggestion
                    key={s}
                    onClick={() => {
                      setInput("");
                      sendMessage(s);
                    }}
                    className="text-xs"
                  >
                    {s}
                  </PromptSuggestion>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => {
            const isUser = msg.role === "user";

            if (isUser) {
              const text =
                msg.parts
                  ?.filter((p: any) => p.type === "text")
                  .map((p: any) => p.text)
                  .join("") ?? "";
              if (!text) return null;

              return (
                <div key={msg.id} className="flex justify-end">
                  <MessageContent className="bg-primary text-primary-foreground max-w-[85%]">
                    {text}
                  </MessageContent>
                </div>
              );
            }

            // assistant message: render parts individually
            const hasParts = msg.parts && msg.parts.length > 0;
            const hasText = msg.parts?.some((p: any) => p.type === "text" && p.text);
            const hasToolCalls = msg.parts?.some((p: any) => extractToolName(p) !== null);

            if (!hasParts || (!hasText && !hasToolCalls)) return null;

            return (
              <div key={msg.id}>
                <AssistantMessage parts={msg.parts} />
              </div>
            );
          })}

          {isLoading && !messages.some((m) => m.status === "streaming") && (
            <div className="py-1">
              <Loader variant="typing" size="sm" />
            </div>
          )}

          <div aria-hidden />
        </div>
      </ScrollArea>

      {/* input */}
      <div className="shrink-0 px-3 pb-3">
        <div className="border-input bg-background rounded-2xl border p-2 shadow-xs">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything..."
            rows={1}
            disabled={isLoading}
            className="text-foreground placeholder:text-muted-foreground w-full resize-none border-none bg-transparent px-2 py-1.5 text-sm outline-none"
          />
          <div className="flex items-center justify-between px-1">
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-muted-foreground size-7 shrink-0"
                    onClick={newChat}
                    disabled={isLoading || !threadId}
                  >
                    <MessageSquarePlus className="size-3.5" />
                  </Button>
                }
              />
              <TooltipContent side="top">New chat</TooltipContent>
            </Tooltip>
            <Button
              size="icon"
              variant={input.trim() ? "default" : "ghost"}
              className="size-7 shrink-0"
              disabled={isLoading || !input.trim()}
              onClick={handleSubmit}
            >
              <Send className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>
      <style>{`
        [data-advisor-sidebar] textarea::-webkit-scrollbar { width: 5px; }
        [data-advisor-sidebar] textarea::-webkit-scrollbar-track { background: transparent; }
        [data-advisor-sidebar] textarea::-webkit-scrollbar-thumb { background: oklch(0.708 0 0); border-radius: 3px; }
        .dark [data-advisor-sidebar] textarea::-webkit-scrollbar-thumb { background: oklch(0.4 0 0); }
      `}</style>
    </aside>
  );
}
