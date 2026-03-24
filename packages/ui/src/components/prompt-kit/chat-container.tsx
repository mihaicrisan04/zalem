"use client";

import { cn } from "@zalem/ui/lib/utils";
import { StickToBottom } from "use-stick-to-bottom";

export type ChatContainerRootProps = {
  children: React.ReactNode;
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>;

export type ChatContainerContentProps = {
  children: React.ReactNode;
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>;

export type ChatContainerScrollAnchorProps = {
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>;

function ChatContainerRoot({ children, className, ...props }: ChatContainerRootProps) {
  return (
    <StickToBottom
      className={cn("flex overflow-y-auto", className)}
      resize="smooth"
      initial="instant"
      role="log"
      {...props}
    >
      {children}
    </StickToBottom>
  );
}

function ChatContainerContent({ children, className, ...props }: ChatContainerContentProps) {
  return (
    <StickToBottom.Content className={cn("flex w-full flex-col", className)} {...props}>
      {children}
    </StickToBottom.Content>
  );
}

function ChatContainerScrollAnchor({ className, ...props }: ChatContainerScrollAnchorProps) {
  return (
    <div
      className={cn("h-px w-full shrink-0 scroll-mt-4", className)}
      aria-hidden="true"
      {...props}
    />
  );
}

ChatContainerRoot.displayName = "ChatContainerRoot";
ChatContainerContent.displayName = "ChatContainerContent";
ChatContainerScrollAnchor.displayName = "ChatContainerScrollAnchor";

export { ChatContainerRoot, ChatContainerContent, ChatContainerScrollAnchor };
