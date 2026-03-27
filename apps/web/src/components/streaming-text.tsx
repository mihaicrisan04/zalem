"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { cn } from "@zalem/ui/lib/utils";
import { Markdown } from "@zalem/ui/components/prompt-kit";

const MS_PER_WORD = 100;

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
  const textRef = useRef(text);
  const streamingRef = useRef(isStreaming);

  // keep refs in sync
  textRef.current = text;
  streamingRef.current = isStreaming;

  const revealNextWord = useCallback(() => {
    const current = displayedLenRef.current;
    const fullText = textRef.current;

    if (current >= fullText.length) {
      // caught up — if still streaming, poll for more text
      if (streamingRef.current) {
        timerRef.current = setTimeout(revealNextWord, MS_PER_WORD);
      } else {
        // streaming done and fully caught up
        timerRef.current = null;
      }
      return;
    }

    // find next word boundary
    let end = current + 1;
    while (end < fullText.length && fullText[end] !== " " && fullText[end] !== "\n") {
      end++;
    }
    // include trailing whitespace
    while (end < fullText.length && (fullText[end] === " " || fullText[end] === "\n")) {
      end++;
    }

    displayedLenRef.current = end;
    setDisplayedText(fullText.slice(0, end));
    timerRef.current = setTimeout(revealNextWord, MS_PER_WORD);
  }, []);

  // start the reveal loop once
  useEffect(() => {
    if (!timerRef.current) {
      revealNextWord();
    }
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [revealNextWord]);

  // when streaming ends, kick the loop if it stopped (so it finishes revealing)
  useEffect(() => {
    if (!isStreaming && displayedLenRef.current < text.length && !timerRef.current) {
      revealNextWord();
    }
  }, [isStreaming, text, revealNextWord]);

  const content = displayedText || " ";

  return (
    <div
      className={cn(
        "prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed",
        className,
      )}
    >
      <Markdown>{content}</Markdown>
    </div>
  );
}
