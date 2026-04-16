"use client";

import { ArrowDown, Sparkles } from "lucide-react";
import { PromptSuggestion } from "@zalem/ui/components/prompt-kit";
import { Button } from "@zalem/ui/components/optics/button";
import { cn } from "@zalem/ui/lib/utils";
import { useStickToBottom } from "use-stick-to-bottom";
import { useMemo } from "react";
import { AdvisorMessageItem } from "./advisor-message-item";
import { extractToolName } from "./tool-labels";

const SUGGESTIONS = [
  "What laptop should I get for coding?",
  "Compare the top-rated phones",
  "What are the best deals right now?",
];

type MessagePart = {
  type?: string;
  text?: string;
  state?: string;
  toolName?: string;
  toolCallId?: string;
  input?: Record<string, unknown>;
  output?: unknown;
};

type UIMessage = {
  id?: string;
  key?: string;
  role?: string;
  status?: string;
  parts?: MessagePart[];
  _creationTime?: number;
};

function hasRenderableAssistantPart(part: MessagePart): boolean {
  if (part.type === "text") return (part.text ?? "").trim().length > 0;
  if (part.type === "reasoning") return true;
  if (extractToolName(part) !== null) return true;
  return false;
}

export type AdvisorMessageListProps = {
  messages: UIMessage[];
  isLoading: boolean;
  optimisticMsg: string | null;
  onSuggestionClick: (suggestion: string) => void;
};

export function AdvisorMessageList({
  messages,
  isLoading,
  optimisticMsg,
  onSuggestionClick,
}: AdvisorMessageListProps) {
  const { scrollRef, contentRef, isAtBottom, scrollToBottom } = useStickToBottom({
    resize: "smooth",
    initial: "instant",
  });

  const isEmpty = messages.length === 0 && !optimisticMsg && !isLoading;

  // Determine if the last assistant message has renderable content
  const lastMsg = messages[messages.length - 1];
  const hasAssistantRenderableContent = useMemo(() => {
    if (!lastMsg || lastMsg.role !== "assistant") return false;
    return (lastMsg.parts ?? []).some(hasRenderableAssistantPart);
  }, [lastMsg]);

  // Show thinking indicator:
  // - When loading and we haven't seen renderable assistant content yet
  // - When there's an optimistic message waiting
  const showThinkingIndicator = (() => {
    if (!isLoading && !optimisticMsg) return false;

    // If we have an optimistic msg, always show (user just sent, no response yet)
    if (optimisticMsg) return true;

    // If last message isn't assistant, show thinking
    if (!lastMsg || lastMsg.role !== "assistant") return true;

    // If assistant message has no renderable content yet, show thinking
    return !hasAssistantRenderableContent;
  })();

  // Determine which message is currently streaming
  const isLastAssistantStreaming = isLoading && lastMsg?.role === "assistant";

  return (
    <div className="relative min-h-0 flex-1">
      <div
        ref={scrollRef as React.Ref<HTMLDivElement>}
        className="absolute inset-0 overflow-y-auto"
      >
        <div
          ref={contentRef as React.RefObject<HTMLDivElement>}
          className="mx-auto flex w-full max-w-full flex-col p-4"
        >
          {isEmpty ? (
            <div className="flex h-full min-h-[40vh] flex-col items-center justify-center gap-4">
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
                    onClick={() => onSuggestionClick(s)}
                    className="text-xs"
                  >
                    {s}
                  </PromptSuggestion>
                ))}
              </div>
            </div>
          ) : null}

          <div className="space-y-6">
            {messages.map((msg, index) => {
              const key = msg.key ?? msg.id ?? `msg-${index}`;
              const isStreaming = isLastAssistantStreaming && index === messages.length - 1;
              return (
                <AdvisorMessageItem
                  key={key}
                  message={msg}
                  isStreaming={isStreaming}
                  forceActionsVisible={index === messages.length - 1 && msg.role === "assistant"}
                />
              );
            })}

            {optimisticMsg ? (
              <div className="flex justify-end py-2">
                <div className="w-fit min-w-0 max-w-[80%] animate-in fade-in slide-in-from-bottom-1 duration-200">
                  <div className="bg-secondary rounded-3xl px-4 py-2">
                    <p className="break-words whitespace-pre-wrap">{optimisticMsg}</p>
                  </div>
                </div>
              </div>
            ) : null}

            {showThinkingIndicator ? (
              <div className="my-1.5 border border-transparent py-0.5">
                <div className="text-muted-foreground inline-flex items-center gap-2 rounded-md py-px text-sm">
                  <span className="flex size-3.5 shrink-0 items-center justify-center">
                    <span className="bg-muted-foreground inline-block size-2 animate-pulse rounded-full" />
                  </span>
                  <span className="leading-none">Thinking...</span>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {!isAtBottom && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => scrollToBottom()}
          className="bg-secondary text-secondary-foreground hover:bg-accent absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full"
          aria-label="Scroll to bottom"
        >
          <ArrowDown className="size-4" />
        </Button>
      )}
    </div>
  );
}
