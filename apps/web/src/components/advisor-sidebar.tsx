"use client";

import { useEffect, useState } from "react";
import { Send, Sparkles, User, X } from "lucide-react";
import { useUIMessages } from "@convex-dev/agent/react";
import { api } from "@zalem/backend/convex/_generated/api";
import { Button } from "@zalem/ui/components/optics/button";
import { cn } from "@zalem/ui/lib/utils";
import {
  Message,
  MessageAvatar,
  MessageContent,
  ChatContainerRoot,
  ChatContainerContent,
  ChatContainerScrollAnchor,
  PromptInput,
  PromptInputTextarea,
  PromptInputActions,
  PromptSuggestion,
  Loader,
  ScrollButton,
} from "@zalem/ui/components/prompt-kit";
import { useAdvisor } from "@/hooks/use-advisor";

const SUGGESTIONS = [
  "What laptop should I get for coding?",
  "Compare the top-rated phones",
  "What are the best deals right now?",
];

export function AdvisorSidebar() {
  const { isOpen, close, threadId, isLoading, sendMessage, pendingQuestion } = useAdvisor();
  const [input, setInput] = useState("");

  const messagesResult = useUIMessages(
    api.ai.queries.listThreadMessages,
    threadId ? { threadId } : "skip",
    { initialNumItems: 50, stream: true },
  );

  const messages = messagesResult?.results ?? [];

  // auto-send pending question from chip click
  useEffect(() => {
    if (pendingQuestion && isOpen && !isLoading) {
      sendMessage(pendingQuestion);
    }
  }, [pendingQuestion, isOpen]);

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    setInput("");
    sendMessage(trimmed);
  };

  return (
    <aside
      className={cn(
        "bg-background flex h-full shrink-0 flex-col border-l transition-[width,opacity] duration-300 ease-out",
        isOpen ? "w-full sm:w-[400px]" : "w-0 overflow-hidden opacity-0",
      )}
    >
      {/* header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <Sparkles className="text-primary size-4" />
          <span className="text-sm font-semibold">Shopping Advisor</span>
        </div>
        <button
          onClick={close}
          className="text-muted-foreground hover:text-foreground cursor-pointer rounded-md p-1 transition-colors"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* messages */}
      <ChatContainerRoot className="flex-1">
        <ChatContainerContent className="gap-4 p-4">
          {messages.length === 0 && !isLoading && (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 py-12">
              <div className="text-muted-foreground text-center">
                <Sparkles className="mx-auto mb-3 size-8 opacity-30" />
                <p className="text-sm font-medium">How can I help?</p>
                <p className="mt-1 text-xs">Ask about products, comparisons, or recommendations.</p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
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
            const text =
              msg.parts
                ?.filter((p: any) => p.type === "text")
                .map((p: any) => p.text)
                .join("") ?? "";
            if (!text) return null;

            const isUser = msg.role === "user";

            return (
              <Message key={msg.id} className={cn(isUser && "flex-row-reverse")}>
                <MessageAvatar
                  className={cn(isUser ? "bg-primary text-primary-foreground" : "bg-muted")}
                >
                  {isUser ? <User className="size-4" /> : <Sparkles className="size-4" />}
                </MessageAvatar>
                <MessageContent
                  markdown={!isUser}
                  className={cn(isUser ? "bg-primary text-primary-foreground" : "bg-muted")}
                >
                  {text}
                </MessageContent>
              </Message>
            );
          })}

          {isLoading && (
            <Message>
              <MessageAvatar className="bg-muted">
                <Sparkles className="size-4" />
              </MessageAvatar>
              <div className="flex items-center gap-2 rounded-2xl bg-muted px-4 py-3">
                <Loader variant="typing" size="sm" />
              </div>
            </Message>
          )}

          <ChatContainerScrollAnchor />
        </ChatContainerContent>

        {/* scroll to bottom */}
        <div className="pointer-events-none absolute inset-x-0 bottom-16 flex justify-center">
          <div className="pointer-events-auto">
            <ScrollButton />
          </div>
        </div>
      </ChatContainerRoot>

      {/* input */}
      <div className="border-t p-3">
        <PromptInput
          value={input}
          onValueChange={setInput}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          className="border-input"
        >
          <PromptInputTextarea placeholder="Ask anything..." />
          <PromptInputActions className="justify-end">
            <Button
              size="icon"
              variant="ghost"
              className="size-8 shrink-0"
              disabled={isLoading || !input.trim()}
              onClick={handleSubmit}
            >
              <Send className="size-4" />
            </Button>
          </PromptInputActions>
        </PromptInput>
      </div>
    </aside>
  );
}
