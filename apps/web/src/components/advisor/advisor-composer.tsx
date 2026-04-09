"use client";

import { MessageSquarePlus, Send } from "lucide-react";
import { useState } from "react";
import {
  PromptInput,
  PromptInputActions,
  PromptInputTextarea,
} from "@zalem/ui/components/prompt-kit";
import { Button } from "@zalem/ui/components/optics/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@zalem/ui/components/optics/tooltip";

export type AdvisorComposerProps = {
  isLoading: boolean;
  canNewChat: boolean;
  onSubmit: (value: string) => void;
  onNewChat: () => void;
};

export function AdvisorComposer({
  isLoading,
  canNewChat,
  onSubmit,
  onNewChat,
}: AdvisorComposerProps) {
  const [value, setValue] = useState("");

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed || isLoading) return;
    setValue("");
    onSubmit(trimmed);
  };

  return (
    <div className="shrink-0 px-3 pb-3">
      <PromptInput
        value={value}
        onValueChange={setValue}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        maxHeight={120}
        className="p-2"
      >
        <PromptInputTextarea
          placeholder="Ask anything..."
          className="h-auto min-h-[28px] px-2 py-1"
        />
        <PromptInputActions className="justify-between px-1 pb-0">
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-muted-foreground size-7 shrink-0"
                  onClick={onNewChat}
                  disabled={isLoading || !canNewChat}
                >
                  <MessageSquarePlus className="size-3.5" />
                </Button>
              }
            />
            <TooltipContent side="top">New chat</TooltipContent>
          </Tooltip>
          <Button
            size="icon"
            variant={value.trim() ? "default" : "ghost"}
            className="size-7 shrink-0"
            disabled={isLoading || !value.trim()}
            onClick={handleSubmit}
          >
            <Send className="size-3.5" />
          </Button>
        </PromptInputActions>
      </PromptInput>
    </div>
  );
}
