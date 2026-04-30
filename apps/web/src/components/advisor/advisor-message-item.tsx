"use client";

import { cn } from "@zalem/ui/lib/utils";
import { Markdown, MessageActionsBar, Tool, type ToolPart } from "@zalem/ui/components/prompt-kit";
import { ThinkingBlock } from "@zalem/ui/components/prompt-kit/thinking-block";
import { memo, useMemo, useRef } from "react";
import { extractToolName, getToolLabel } from "./tool-labels";
import { AssistantMessageGroups } from "./assistant-message-groups";

type MessagePart = {
  type?: string;
  text?: string;
  state?: string;
  toolName?: string;
  toolCallId?: string;
  input?: unknown;
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
  isStreaming: boolean;
  forceActionsVisible?: boolean;
};

// ---------------------------------------------------------------------------
// Grouping logic — mirrors open-agents: consecutive reasoning parts are
// grouped together, everything else is an individual group.
// ---------------------------------------------------------------------------

type ReasoningPart = MessagePart & { type: "reasoning" };

type RenderGroup =
  | { type: "reasoning-group"; parts: ReasoningPart[]; startIndex: number }
  | { type: "part"; part: MessagePart; index: number };

function buildGroups(parts: MessagePart[]): RenderGroup[] {
  const groups: RenderGroup[] = [];
  let currentReasoningGroup: ReasoningPart[] = [];
  let reasoningGroupStartIndex = 0;

  const flushReasoningGroup = () => {
    if (currentReasoningGroup.length === 0) return;
    groups.push({
      type: "reasoning-group",
      parts: currentReasoningGroup,
      startIndex: reasoningGroupStartIndex,
    });
    currentReasoningGroup = [];
  };

  parts.forEach((part, index) => {
    if (part.type === "reasoning") {
      if (currentReasoningGroup.length === 0) {
        reasoningGroupStartIndex = index;
      }
      currentReasoningGroup.push(part as ReasoningPart);
      return;
    }
    flushReasoningGroup();
    groups.push({ type: "part", part, index });
  });

  flushReasoningGroup();
  return groups;
}

function isCollapsiblePart(part: MessagePart): boolean {
  if (part.type === "reasoning") return true;
  return extractToolName(part) !== null;
}

function hasRenderableAssistantPart(part: MessagePart): boolean {
  if (part.type === "text") return (part.text ?? "").length > 0;
  if (part.type === "reasoning") return (part.text ?? "").length > 0 || part.state === "streaming";
  if (extractToolName(part) !== null) return true;
  return false;
}

function getReasoningGroupText(parts: ReasoningPart[]): string {
  return parts.map((p) => p.text ?? "").join("\n\n");
}

function shouldKeepReasoningStreaming(opts: {
  isMessageStreaming: boolean;
  hasStreamingPart: boolean;
  hasRenderableContentAfter: boolean;
}): boolean {
  if (!opts.isMessageStreaming) return false;
  if (opts.hasStreamingPart) return true;
  return !opts.hasRenderableContentAfter;
}

function partToToolPart(part: MessagePart): ToolPart | null {
  const toolName = extractToolName(part);
  if (!toolName) return null;
  return {
    toolName,
    state: part.state ?? "call",
    input: part.input as Record<string, unknown> | undefined,
    output: part.output,
    toolCallId: part.toolCallId,
    errorText: part.errorText,
  };
}

// ---------------------------------------------------------------------------
// Signature functions for memo comparison
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function AdvisorMessageItemComponent({
  message,
  isStreaming: isMessageStreaming,
  forceActionsVisible,
}: AdvisorMessageItemProps) {
  const isUser = message.role === "user";
  const text = textFromMessage(message);
  const timestamp = message._creationTime;
  const sendTimestampRef = useRef<number | null>(isMessageStreaming ? Date.now() : null);

  // User message
  if (isUser) {
    if (!text) return null;
    return (
      <div className="flex justify-end py-2">
        <div className="group relative w-fit min-w-0 max-w-[80%]">
          <div className="bg-secondary rounded-3xl px-4 py-2">
            <p className="break-words whitespace-pre-wrap">{text}</p>
          </div>
        </div>
      </div>
    );
  }

  // Assistant message
  const parts = message.parts ?? [];
  const hasRenderable = parts.some(hasRenderableAssistantPart);
  if (!hasRenderable) return null;

  const groups = buildGroups(parts);

  const renderGroups = (isToolCallsExpanded: boolean) =>
    groups.map((group, gi) => {
      // --- Reasoning group ---
      if (group.type === "reasoning-group") {
        if (!isToolCallsExpanded) return null;
        const hasContentAfter = parts
          .slice(group.startIndex + group.parts.length)
          .some(hasRenderableAssistantPart);

        return (
          <div key={`reasoning-${gi}`} className="max-w-full pl-[22px]">
            <ThinkingBlock
              text={getReasoningGroupText(group.parts)}
              isStreaming={shouldKeepReasoningStreaming({
                isMessageStreaming,
                hasStreamingPart: group.parts.some((p) => p.state === "streaming"),
                hasRenderableContentAfter: hasContentAfter,
              })}
              partCount={group.parts.length}
            />
          </div>
        );
      }

      // --- Individual part ---
      const p = group.part;

      // Standalone reasoning part (shouldn't happen after grouping, but safety)
      if (p.type === "reasoning") {
        if (!isToolCallsExpanded) return null;
        const hasContentAfter = parts.slice(group.index + 1).some(hasRenderableAssistantPart);
        return (
          <div key={`reasoning-${gi}`} className="max-w-full pl-[22px]">
            <ThinkingBlock
              text={p.text ?? ""}
              isStreaming={shouldKeepReasoningStreaming({
                isMessageStreaming,
                hasStreamingPart: p.state === "streaming",
                hasRenderableContentAfter: hasContentAfter,
              })}
            />
          </div>
        );
      }

      // Text part
      if (p.type === "text") {
        if ((p.text ?? "").length === 0) return null;

        const isFinalTextPart = !parts.slice(group.index + 1).some((mp) => mp.type === "text");

        // When collapsed, hide every text part except the final one
        if (!isToolCallsExpanded && !isFinalTextPart) return null;

        return (
          <div
            key={`text-${gi}`}
            className={cn(
              "flex min-w-0 py-2",
              // Breathing room above final text after tool calls
              isFinalTextPart && group.index > 0 && "mt-2",
              // Indent non-final text parts
              !isFinalTextPart && "pl-[22px]",
            )}
          >
            <div className="group min-w-0 w-full overflow-hidden">
              <div className="text-foreground text-sm leading-relaxed">
                <Markdown>{p.text ?? ""}</Markdown>
              </div>
              {isFinalTextPart && !isMessageStreaming && (p.text ?? "").trim().length > 0 && (
                <MessageActionsBar
                  text={text}
                  align="start"
                  timestamp={timestamp}
                  forceVisible={forceActionsVisible}
                />
              )}
            </div>
          </div>
        );
      }

      // Tool call
      const tp = partToToolPart(p);
      if (tp) {
        if (!isToolCallsExpanded) return null;
        const label = getToolLabel(tp.toolName);
        return (
          <div key={`tool-${tp.toolCallId ?? gi}`} className="max-w-full pl-[22px]">
            <Tool toolPart={tp} label={label} />
          </div>
        );
      }

      return null;
    });

  return (
    <AssistantMessageGroups
      message={message}
      isStreaming={isMessageStreaming}
      durationMs={null}
      startedAt={sendTimestampRef.current}
    >
      {renderGroups}
    </AssistantMessageGroups>
  );
}

function areEqual(prev: AdvisorMessageItemProps, next: AdvisorMessageItemProps): boolean {
  if (prev.forceActionsVisible !== next.forceActionsVisible) return false;
  if (prev.isStreaming !== next.isStreaming) return false;
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
