"use client";

import { ChevronDown, Sparkles } from "lucide-react";
import { Loader, PromptSuggestion } from "@zalem/ui/components/prompt-kit";
import { Button } from "@zalem/ui/components/optics/button";
import { ScrollArea } from "@zalem/ui/components/optics/scroll-area";
import { cn } from "@zalem/ui/lib/utils";
import { useStickToBottom } from "use-stick-to-bottom";
import { AdvisorMessageItem } from "./advisor-message-item";

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

function isRenderablePart(p: MessagePart): boolean {
  if (p.type === "text") return (p.text ?? "").trim().length > 0;
  if (p.type === "reasoning") return true;
  if (p.type === "dynamic-tool") return true;
  if (typeof p.type === "string" && p.type.startsWith("tool-")) return true;
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

  // show the typing indicator while we're waiting for the assistant's first
  // renderable delta. we can't rely on the latest real message because on a
  // fresh send the new user message hasn't round-tripped yet — the latest
  // message in the list is still the PREVIOUS assistant turn, which has
  // renderable content, so without the optimistic check the dots would only
  // appear 1-2s later once useUIMessages catches up.
  const lastMsg = messages[messages.length - 1];
  const waitingForFirstDelta =
    !!optimisticMsg ||
    !lastMsg ||
    lastMsg.role !== "assistant" ||
    !(lastMsg.parts ?? []).some(isRenderablePart);
  const showTypingIndicator = (isLoading || !!optimisticMsg) && waitingForFirstDelta;

  const lastAssistantIndex = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i]?.role === "assistant") return i;
    }
    return -1;
  })();

  return (
    <div className="relative min-h-0 flex-1">
      <ScrollArea
        viewportRef={scrollRef as React.Ref<HTMLDivElement>}
        className="absolute inset-0"
        maskHeight={20}
      >
        <div
          ref={contentRef as React.RefObject<HTMLDivElement>}
          className="flex w-full flex-col gap-4 p-4"
        >
          {isEmpty ? (
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
                    onClick={() => onSuggestionClick(s)}
                    className="text-xs"
                  >
                    {s}
                  </PromptSuggestion>
                ))}
              </div>
            </div>
          ) : null}

          {messages.map((msg, index) => {
            const key = msg.key ?? msg.id ?? `msg-${index}`;
            const forceActions = index === lastAssistantIndex;
            return (
              <AdvisorMessageItem key={key} message={msg} forceActionsVisible={forceActions} />
            );
          })}

          {optimisticMsg ? (
            <div className="group flex animate-in fade-in slide-in-from-bottom-1 flex-col items-end gap-1 duration-200">
              <div className="bg-primary text-primary-foreground max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed break-words whitespace-pre-wrap">
                {optimisticMsg}
              </div>
            </div>
          ) : null}

          {showTypingIndicator ? (
            <div className="py-1">
              <Loader variant="typing" size="sm" />
            </div>
          ) : null}
        </div>
      </ScrollArea>

      <Button
        variant="raised"
        size="icon"
        onClick={() => scrollToBottom()}
        className={cn(
          "absolute right-6 bottom-3 z-20 size-7 transition-opacity duration-150",
          isAtBottom ? "pointer-events-none opacity-0" : "opacity-100",
        )}
        aria-label="Scroll to bottom"
      >
        <ChevronDown className="size-3.5" />
      </Button>
    </div>
  );
}
