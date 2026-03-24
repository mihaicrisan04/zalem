"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Send, Sparkles, X } from "lucide-react";
import { useUIMessages } from "@convex-dev/agent/react";
import { api } from "@zalem/backend/convex/_generated/api";
import { Button } from "@zalem/ui/components/optics/button";
import { ScrollArea } from "@zalem/ui/components/optics/scroll-area";
import { cn } from "@zalem/ui/lib/utils";
import {
  MessageContent,
  PromptInput,
  PromptInputTextarea,
  PromptInputActions,
  PromptSuggestion,
  Loader,
} from "@zalem/ui/components/prompt-kit";
import { useAdvisor } from "@/hooks/use-advisor";

const MIN_WIDTH = 340;
const DEFAULT_WIDTH = 400;
const DISMISS_THRESHOLD = 200;

const SUGGESTIONS = [
  "What laptop should I get for coding?",
  "Compare the top-rated phones",
  "What are the best deals right now?",
];

export function AdvisorSidebar() {
  const { isOpen, close, threadId, isLoading, sendMessage, pendingQuestion } = useAdvisor();
  const [input, setInput] = useState("");
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  // auto-send pending question from chip click
  useEffect(() => {
    if (pendingQuestion && isOpen && !isLoading) {
      sendMessage(pendingQuestion);
    }
  }, [pendingQuestion, isOpen]);

  // max width: 1/3 of screen
  const getMaxWidth = useCallback(() => {
    return Math.floor(window.innerWidth / 3);
  }, []);

  // resize handle
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
          // will dismiss on mouse up
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

        // dismiss if dragged past threshold
        if (sidebarRef.current) {
          const currentWidth = sidebarRef.current.offsetWidth;
          if (currentWidth < DISMISS_THRESHOLD) {
            close();
            setWidth(DEFAULT_WIDTH);
          }
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
  };

  return (
    <aside
      ref={sidebarRef}
      className={cn(
        "bg-background relative flex h-full shrink-0 flex-col border-l",
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
      <ScrollArea className="flex-1" maskHeight={20}>
        <div className="flex flex-col gap-4 p-4">
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
              <div key={msg.id} className={cn("flex", isUser && "justify-end")}>
                <MessageContent
                  markdown={!isUser}
                  className={cn(
                    "max-w-[85%]",
                    isUser ? "bg-primary text-primary-foreground" : "bg-muted",
                  )}
                >
                  {text}
                </MessageContent>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex">
              <div className="bg-muted flex items-center gap-2 rounded-2xl px-4 py-3">
                <Loader variant="typing" size="sm" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* input */}
      <div className="border-t p-3">
        <PromptInput
          value={input}
          onValueChange={setInput}
          onSubmit={handleSubmit}
          isLoading={isLoading}
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
