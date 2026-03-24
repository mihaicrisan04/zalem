"use client";

import { cn } from "@zalem/ui/lib/utils";
import { Markdown } from "./markdown";

export type MessageProps = {
  children: React.ReactNode;
  className?: string;
} & React.HTMLProps<HTMLDivElement>;

function Message({ children, className, ...props }: MessageProps) {
  return (
    <div className={cn("flex gap-3", className)} {...props}>
      {children}
    </div>
  );
}

export type MessageAvatarProps = {
  children: React.ReactNode;
  className?: string;
};

function MessageAvatar({ children, className }: MessageAvatarProps) {
  return (
    <div
      className={cn(
        "bg-muted flex size-8 shrink-0 items-center justify-center rounded-full",
        className,
      )}
    >
      {children}
    </div>
  );
}

export type MessageContentProps = {
  children: React.ReactNode;
  markdown?: boolean;
  className?: string;
};

function MessageContent({ children, markdown = false, className, ...props }: MessageContentProps) {
  const classNames = cn(
    "prose prose-sm dark:prose-invert max-w-none break-words rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
    className,
  );

  return markdown ? (
    <Markdown className={classNames}>{children as string}</Markdown>
  ) : (
    <div className={classNames} {...props}>
      {children}
    </div>
  );
}

export type MessageActionsProps = {
  children: React.ReactNode;
  className?: string;
} & React.HTMLProps<HTMLDivElement>;

function MessageActions({ children, className, ...props }: MessageActionsProps) {
  return (
    <div className={cn("text-muted-foreground flex items-center gap-2", className)} {...props}>
      {children}
    </div>
  );
}

Message.displayName = "Message";
MessageAvatar.displayName = "MessageAvatar";
MessageContent.displayName = "MessageContent";
MessageActions.displayName = "MessageActions";

export { Message, MessageAvatar, MessageContent, MessageActions };
