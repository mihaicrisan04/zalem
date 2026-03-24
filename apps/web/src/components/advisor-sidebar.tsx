"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Sparkles, X } from "lucide-react";
import { useUIMessages } from "@convex-dev/agent/react";
import { api } from "@zalem/backend/convex/_generated/api";
import { Button } from "@zalem/ui/components/optics/button";
import { Spinner } from "@zalem/ui/components/optics/spinner";
import { cn } from "@zalem/ui/lib/utils";
import { useAdvisor } from "@/hooks/use-advisor";

function MessageBubble({ role, text }: { role: "user" | "assistant"; text: string }) {
  return (
    <div
      className={cn(
        "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
        role === "user" ? "bg-primary text-primary-foreground self-end" : "bg-muted self-start",
      )}
    >
      {text}
    </div>
  );
}

export function AdvisorSidebar() {
  const { isOpen, close, threadId, isLoading, sendMessage, pendingQuestion } = useAdvisor();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // subscribe to thread messages when we have a threadId
  const messagesResult = useUIMessages(
    api.ai.queries.listThreadMessages,
    threadId ? { threadId } : "skip",
    { initialNumItems: 50, stream: true },
  );

  const messages = messagesResult?.results ?? [];

  // auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isLoading]);

  // focus input when sidebar opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // auto-send pending question from chip click
  useEffect(() => {
    if (pendingQuestion && isOpen && !isLoading) {
      sendMessage(pendingQuestion);
    }
  }, [pendingQuestion, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    setInput("");
    sendMessage(trimmed);
  };

  return (
    <>
      {/* backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm transition-opacity"
          onClick={close}
        />
      )}

      {/* sidebar panel */}
      <div
        className={cn(
          "bg-background fixed top-0 right-0 z-50 flex h-full w-full flex-col border-l shadow-2xl transition-transform duration-300 ease-out sm:w-[400px]",
          isOpen ? "translate-x-0" : "translate-x-full",
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
            className="text-muted-foreground hover:text-foreground rounded-md p-1 transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* messages area */}
        <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
          {messages.length === 0 && !isLoading && (
            <div className="text-muted-foreground flex flex-1 flex-col items-center justify-center gap-3 text-center">
              <Sparkles className="size-8 opacity-30" />
              <div>
                <p className="text-sm font-medium">How can I help?</p>
                <p className="mt-1 text-xs">Ask about products, comparisons, or recommendations.</p>
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
            return (
              <MessageBubble key={msg.id} role={msg.role as "user" | "assistant"} text={text} />
            );
          })}

          {isLoading && (
            <div className="self-start flex items-center gap-2 rounded-2xl bg-muted px-4 py-2.5">
              <Spinner size="sm" />
              <span className="text-muted-foreground text-xs">Thinking...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* input */}
        <form onSubmit={handleSubmit} className="border-t p-3">
          <div className="bg-muted flex items-center gap-2 rounded-xl px-3 py-1">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything..."
              className="flex-1 bg-transparent py-2 text-sm outline-none"
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="icon"
              variant="ghost"
              className="size-8 shrink-0"
              disabled={isLoading || !input.trim()}
            >
              <Send className="size-4" />
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
