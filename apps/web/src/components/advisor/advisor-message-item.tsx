"use client";

import { cn } from "@zalem/ui/lib/utils";
import {
  Markdown,
  MessageActionsBar,
  Thinking,
  Tool,
  type ToolPart,
} from "@zalem/ui/components/prompt-kit";
import { memo } from "react";
import { extractToolName, getToolLabel } from "./tool-labels";

type MessagePart = {
  type?: string;
  text?: string;
  state?: string;
  toolName?: string;
  toolCallId?: string;
  input?: Record<string, unknown>;
  output?: unknown;
  errorText?: string;
};

type UIMessage = {
  id?: string;
  key?: string;
  role?: string;
  parts?: MessagePart[];
  status?: string;
  _creationTime?: number;
};

export type AdvisorMessageItemProps = {
  message: UIMessage;
  forceActionsVisible?: boolean;
};

function textFromMessage(msg: UIMessage): string {
  return (
    msg.parts
      ?.filter((p) => p.type === "text")
      .map((p) => p.text ?? "")
      .join("") ?? ""
  );
}

function reasoningSignature(msg: UIMessage): string {
  if (!msg.parts) return "";
  return msg.parts
    .filter((p) => p.type === "reasoning")
    .map((p) => `${p.state ?? ""}|${(p.text ?? "").length}`)
    .join("||");
}

function toolPartsSignature(msg: UIMessage): string {
  if (!msg.parts) return "";
  return msg.parts
    .filter((p) => extractToolName(p) !== null)
    .map((p) => {
      const name = extractToolName(p) ?? "";
      const id = p.toolCallId ?? "";
      const state = p.state ?? "";
      const input = p.input ? JSON.stringify(p.input) : "";
      const output = p.output !== undefined ? JSON.stringify(p.output) : "";
      return `${id}|${name}|${state}|${input}|${output}`;
    })
    .join("||");
}

function partToToolPart(part: MessagePart): ToolPart | null {
  const toolName = extractToolName(part);
  if (!toolName) return null;
  return {
    toolName,
    state: part.state ?? "call",
    input: part.input,
    output: part.output,
    toolCallId: part.toolCallId,
    errorText: part.errorText,
  };
}

function renderAssistantPart(part: MessagePart, index: number): React.ReactNode {
  if (part.type === "reasoning") {
    const text = part.text ?? "";
    if (!text && part.state !== "streaming") return null;
    return (
      <div key={`reasoning-${index}`} className="py-0.5">
        <Thinking text={text} isStreaming={part.state === "streaming"} />
      </div>
    );
  }

  if (part.type === "text") {
    const text = part.text ?? "";
    if (!text.trim()) return null;
    return (
      <div key={`text-${index}`} className="text-foreground text-sm leading-relaxed">
        <Markdown>{text}</Markdown>
      </div>
    );
  }

  const toolPart = partToToolPart(part);
  if (toolPart) {
    const label = getToolLabel(toolPart.toolName);
    return (
      <div key={`tool-${toolPart.toolCallId ?? index}`} className="py-0.5">
        <Tool toolPart={toolPart} label={label} />
      </div>
    );
  }

  return null;
}

function AdvisorMessageItemComponent({ message, forceActionsVisible }: AdvisorMessageItemProps) {
  const isUser = message.role === "user";
  const text = textFromMessage(message);
  const timestamp = message._creationTime;

  if (isUser) {
    if (!text) return null;
    return (
      <div className="group flex flex-col items-end gap-1">
        <div className="bg-primary text-primary-foreground max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed break-words whitespace-pre-wrap">
          {text}
        </div>
        <MessageActionsBar
          text={text}
          align="end"
          timestamp={timestamp}
          forceVisible={forceActionsVisible}
        />
      </div>
    );
  }

  const parts = message.parts ?? [];
  const hasRenderable = parts.some(
    (p) =>
      (p.type === "text" && (p.text ?? "").trim()) ||
      p.type === "reasoning" ||
      extractToolName(p) !== null,
  );
  if (!hasRenderable) return null;

  return (
    <div className={cn("group flex flex-col items-start gap-1")}>
      <div className="w-full space-y-1">{parts.map(renderAssistantPart)}</div>
      {text ? (
        <MessageActionsBar
          text={text}
          align="start"
          timestamp={timestamp}
          forceVisible={forceActionsVisible}
        />
      ) : null}
    </div>
  );
}

function areEqual(prev: AdvisorMessageItemProps, next: AdvisorMessageItemProps): boolean {
  if (prev.forceActionsVisible !== next.forceActionsVisible) return false;
  const a = prev.message;
  const b = next.message;
  if ((a.role ?? "") !== (b.role ?? "")) return false;
  if ((a.status ?? "") !== (b.status ?? "")) return false;
  if (textFromMessage(a) !== textFromMessage(b)) return false;
  if (reasoningSignature(a) !== reasoningSignature(b)) return false;
  if (toolPartsSignature(a) !== toolPartsSignature(b)) return false;
  if ((a._creationTime ?? 0) !== (b._creationTime ?? 0)) return false;
  return true;
}

export const AdvisorMessageItem = memo(AdvisorMessageItemComponent, areEqual);
AdvisorMessageItem.displayName = "AdvisorMessageItem";
