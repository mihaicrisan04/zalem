"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { cn } from "@zalem/ui/lib/utils";
import { Markdown } from "@zalem/ui/components/prompt-kit";

const MS_PER_WORD = 140;

export function StreamingText({
  text,
  isStreaming,
  className,
}: {
  text: string;
  isStreaming: boolean;
  className?: string;
}) {
  const [displayedText, setDisplayedText] = useState("");
  const displayedLenRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const revealNextWord = useCallback(() => {
    timerRef.current = setTimeout(() => {
      const current = displayedLenRef.current;
      const fullText = textRef.current;

      if (current >= fullText.length) {
        // caught up, check again soon in case more text arrives
        if (streamingRef.current) {
          timerRef.current = setTimeout(() => revealNextWord(), MS_PER_WORD);
        }
        return;
      }

      // find next word boundary
      let end = current + 1;
      while (end < fullText.length && fullText[end] !== " " && fullText[end] !== "\n") {
        end++;
      }
      // include trailing space/newline
      while (end < fullText.length && (fullText[end] === " " || fullText[end] === "\n")) {
        end++;
      }

      displayedLenRef.current = end;
      setDisplayedText(fullText.slice(0, end));
      revealNextWord();
    }, MS_PER_WORD);
  }, []);

  // refs to avoid stale closures
  const textRef = useRef(text);
  const streamingRef = useRef(isStreaming);
  textRef.current = text;
  streamingRef.current = isStreaming;

  // start revealing when streaming begins
  useEffect(() => {
    if (isStreaming && !timerRef.current) {
      revealNextWord();
    }
  }, [isStreaming, text, revealNextWord]);

  // flush when streaming ends
  useEffect(() => {
    if (!isStreaming) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      displayedLenRef.current = text.length;
      setDisplayedText(text);
    }
  }, [isStreaming, text]);

  // cleanup
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const content = isStreaming ? displayedText : text;

  return (
    <div
      className={cn(
        "prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed",
        className,
      )}
    >
      <Markdown>{content || " "}</Markdown>
    </div>
  );
}
