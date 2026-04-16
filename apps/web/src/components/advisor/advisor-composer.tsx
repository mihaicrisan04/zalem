"use client";

import { ArrowUp, MessageSquarePlus, Square } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { Button } from "@zalem/ui/components/optics/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@zalem/ui/components/optics/tooltip";

export type AdvisorComposerProps = {
  isLoading: boolean;
  canNewChat: boolean;
  onSubmit: (value: string) => void;
  onNewChat: () => void;
  onStop?: () => void;
};

export function AdvisorComposer({
  isLoading,
  canNewChat,
  onSubmit,
  onNewChat,
  onStop,
}: AdvisorComposerProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || isLoading) return;
    setValue("");
    onSubmit(trimmed);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [value, isLoading, onSubmit]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey && !isLoading) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [isLoading, handleSubmit],
  );

  // Auto-resize textarea
  const handleInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, []);

  const hasContent = value.trim().length > 0;

  return (
    <div className="shrink-0 p-3 pb-2">
      <div className="bg-muted overflow-hidden rounded-2xl">
        {/* Textarea */}
        <div className="px-4 pt-3 pb-2">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything..."
            rows={1}
            disabled={isLoading}
            className="placeholder:text-muted-foreground text-foreground w-full resize-none overflow-y-auto bg-transparent text-sm focus:outline-none"
            style={{ minHeight: "24px", maxHeight: "120px" }}
          />
        </div>

        {/* Bottom toolbar */}
        <div className="flex items-center justify-between gap-2 px-3 pb-2">
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-muted-foreground hover:text-foreground size-8 rounded-full"
                    onClick={onNewChat}
                    disabled={isLoading || !canNewChat}
                  >
                    <MessageSquarePlus className="size-4" />
                  </Button>
                }
              />
              <TooltipContent side="top">New chat</TooltipContent>
            </Tooltip>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            {isLoading ? (
              <Button
                size="icon"
                onClick={onStop}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 size-8 rounded-full"
              >
                <Square className="size-3 fill-current" />
              </Button>
            ) : (
              <Button
                size="icon"
                onClick={handleSubmit}
                disabled={!hasContent}
                className="bg-primary text-primary-foreground hover:bg-primary/90 size-8 rounded-full disabled:opacity-30"
              >
                <ArrowUp className="size-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
