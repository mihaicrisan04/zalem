"use client";

import { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";
import { useUIMessages, type UIMessagesQuery } from "@convex-dev/agent/react";
import { api } from "@zalem/backend/convex/_generated/api";
import { Button } from "@zalem/ui/components/optics/button";
import { cn } from "@zalem/ui/lib/utils";
import { useAdvisor } from "@/hooks/use-advisor";
import { AdvisorComposer } from "./advisor/advisor-composer";
import { AdvisorMessageList } from "./advisor/advisor-message-list";

type AdvisorMessage =
  typeof api.ai.queries.listThreadMessages extends UIMessagesQuery<unknown, infer M> ? M : never;

const MIN_WIDTH_PX = 340;
const DEFAULT_WIDTH_PX = 400;
const DISMISS_THRESHOLD_PX = 200;

export function AdvisorSidebar() {
  const {
    isOpen,
    close,
    newChat,
    threadId,
    isLoading,
    sendMessage,
    stopGeneration,
    pendingQuestion,
  } = useAdvisor();
  const [optimisticMsg, setOptimisticMsg] = useState<string | null>(null);
  const [width, setWidth] = useState(DEFAULT_WIDTH_PX);
  const [isResizing, setIsResizing] = useState(false);

  const messagesResult = useUIMessages(
    api.ai.queries.listThreadMessages,
    threadId ? { threadId } : "skip",
    { initialNumItems: 50, stream: true },
  );

  const messages: AdvisorMessage[] = messagesResult?.results ?? [];

  // clear optimistic message once the matching real user message shows up
  useEffect(() => {
    if (!optimisticMsg) return;
    const found = messages.some(
      (m) =>
        m.role === "user" &&
        m.parts?.some(
          (p) => p.type === "text" && "text" in p && (p.text ?? "").trim() === optimisticMsg.trim(),
        ),
    );
    if (found) setOptimisticMsg(null);
  }, [messages, optimisticMsg]);

  // fire pending question on open
  useEffect(() => {
    if (pendingQuestion && isOpen && !isLoading) {
      setOptimisticMsg(pendingQuestion);
      sendMessage(pendingQuestion);
    }
  }, [pendingQuestion, isOpen]);

  const handleSend = useCallback(
    (question: string) => {
      setOptimisticMsg(question);
      sendMessage(question);
    },
    [sendMessage],
  );

  const getMaxWidth = useCallback(() => {
    return Math.floor(window.innerWidth / 3);
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsResizing(true);

      const startX = e.clientX;
      const startWidth = width;

      const handleMouseMove = (ev: MouseEvent) => {
        const delta = startX - ev.clientX;
        const newWidth = startWidth + delta;
        const maxWidth = getMaxWidth();

        if (newWidth < DISMISS_THRESHOLD_PX) {
          setWidth(Math.max(0, newWidth));
        } else {
          setWidth(Math.max(MIN_WIDTH_PX, Math.min(maxWidth, newWidth)));
        }
      };

      const handleMouseUp = () => {
        setIsResizing(false);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";

        const sidebar = document.querySelector("[data-advisor-sidebar]");
        if (sidebar && sidebar.clientWidth < DISMISS_THRESHOLD_PX) {
          close();
          setWidth(DEFAULT_WIDTH_PX);
        }
      };

      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [width, getMaxWidth, close],
  );

  return (
    <aside
      data-advisor-sidebar
      className={cn(
        "bg-background group/sidebar relative flex h-full shrink-0 flex-col overflow-hidden border-l",
        !isResizing && "transition-[width,opacity] duration-300 ease-out",
        isOpen ? "" : "w-0 opacity-0",
      )}
      style={isOpen ? { width: `${width}px` } : undefined}
    >
      {/* resize handle */}
      <div
        onMouseDown={handleMouseDown}
        className="absolute top-0 -left-1 z-10 h-full w-2 cursor-col-resize"
      />

      {/* close button — visible on sidebar hover */}
      <Button
        variant="raised"
        size="icon"
        className="absolute top-2.5 right-5 z-20 size-7 opacity-0 transition-opacity group-hover/sidebar:opacity-100"
        onClick={close}
      >
        <X className="size-3.5" />
      </Button>

      <AdvisorMessageList
        messages={messages}
        isLoading={isLoading}
        optimisticMsg={optimisticMsg}
        onSuggestionClick={handleSend}
      />

      <AdvisorComposer
        isLoading={isLoading}
        canNewChat={!!threadId}
        onSubmit={handleSend}
        onNewChat={newChat}
        onStop={stopGeneration}
      />
    </aside>
  );
}
