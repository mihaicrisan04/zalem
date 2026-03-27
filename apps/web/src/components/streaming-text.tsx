"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@zalem/ui/lib/utils";
import { Markdown } from "@zalem/ui/components/prompt-kit";

// reveal speed: ms per word. higher = slower, smoother
const MS_PER_WORD = 90;

export function StreamingText({
  text,
  isStreaming,
  className,
}: {
  text: string;
  isStreaming: boolean;
  className?: string;
}) {
  const [displayedLength, setDisplayedLength] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const targetLengthRef = useRef(0);

  useEffect(() => {
    targetLengthRef.current = text.length;
  }, [text]);

  // throttled word-by-word reveal
  useEffect(() => {
    if (!isStreaming) {
      setDisplayedLength(text.length);
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    const tick = () => {
      setDisplayedLength((prev) => {
        const target = targetLengthRef.current;
        if (prev >= target) {
          // caught up — wait and check again
          timerRef.current = setTimeout(tick, MS_PER_WORD);
          return prev;
        }

        // advance to next word boundary
        const nextSpace = text.indexOf(" ", prev + 1);
        const nextNewline = text.indexOf("\n", prev + 1);
        let nextBoundary = target;

        if (nextSpace !== -1 && nextSpace < nextBoundary) nextBoundary = nextSpace + 1;
        if (nextNewline !== -1 && nextNewline < nextBoundary) nextBoundary = nextNewline + 1;

        timerRef.current = setTimeout(tick, MS_PER_WORD);
        return Math.min(nextBoundary, target);
      });
    };

    timerRef.current = setTimeout(tick, MS_PER_WORD);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isStreaming, text]);

  // streaming done — static render
  if (!isStreaming && displayedLength >= text.length) {
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

  // streaming: revealed text + fresh text with animation + cursor
  const revealed = text.slice(0, displayedLength);
  const fresh = text.slice(displayedLength);

  return (
    <div
      className={cn(
        "prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed",
        className,
      )}
    >
      <Markdown>{revealed}</Markdown>
      {fresh && <span className="streaming-fresh">{fresh}</span>}
      <span className="streaming-cursor" />
      <style>{`
        .streaming-fresh {
          animation: fadeBlurIn 500ms ease-out forwards;
        }
        .streaming-cursor {
          display: inline-block;
          width: 2px;
          height: 1em;
          margin-left: 1px;
          background: currentColor;
          opacity: 0.4;
          vertical-align: text-bottom;
          animation: cursorBlink 1s step-end infinite;
        }
        @keyframes fadeBlurIn {
          0% { opacity: 0; filter: blur(3px); }
          100% { opacity: 1; filter: blur(0); }
        }
        @keyframes cursorBlink {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
