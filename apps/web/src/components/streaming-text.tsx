"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@zalem/ui/lib/utils";
import { Markdown } from "@zalem/ui/components/prompt-kit";

// reveal speed: ms per word. higher = slower, smoother
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
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queueRef = useRef<string[]>([]);
  const processingRef = useRef(false);

  // when new text arrives, queue the new words
  useEffect(() => {
    const currentLen = queueRef.current.join("").length + displayedText.length;
    const newContent = text.slice(currentLen);
    if (!newContent) return;

    // split new content into words (preserving spaces/newlines)
    const words = newContent.match(/\S+\s*|\s+/g) ?? [newContent];
    queueRef.current.push(...words);

    // start draining if not already
    if (!processingRef.current) {
      processingRef.current = true;
      drainQueue();
    }
  }, [text]);

  // when streaming ends, flush everything
  useEffect(() => {
    if (!isStreaming) {
      if (timerRef.current) clearTimeout(timerRef.current);
      processingRef.current = false;
      queueRef.current = [];
      setDisplayedText(text);
    }
  }, [isStreaming, text]);

  function drainQueue() {
    timerRef.current = setTimeout(() => {
      const next = queueRef.current.shift();
      if (next) {
        setDisplayedText((prev) => prev + next);
        drainQueue();
      } else {
        processingRef.current = false;
      }
    }, MS_PER_WORD);
  }

  // cleanup
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // static render when done
  if (!isStreaming && displayedText === text) {
    return (
      <div
        className={cn(
          "prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed",
          className,
        )}
      >
        <Markdown>{text}</Markdown>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed",
        className,
      )}
    >
      <Markdown>{displayedText}</Markdown>
    </div>
  );
}
