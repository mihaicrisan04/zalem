"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@zalem/ui/lib/utils";
import { Markdown } from "@zalem/ui/components/prompt-kit";

/**
 * StreamingText — renders streamed markdown with word-by-word fade-in.
 *
 * How it works:
 * - receives the full text so far from the streaming part
 * - tracks which portion has been "revealed" vs. what's newly arrived
 * - newly arrived words get a CSS fade-in + blur-to-sharp animation
 * - once streaming is done, renders everything statically (no animation overhead)
 */
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
  const rafRef = useRef<number>(0);
  const targetLengthRef = useRef(0);

  // update target length as text streams in
  useEffect(() => {
    targetLengthRef.current = text.length;
  }, [text]);

  // animate: catch up to target length at ~1 word per frame
  useEffect(() => {
    if (!isStreaming) {
      setDisplayedLength(text.length);
      return;
    }

    const step = () => {
      setDisplayedLength((prev) => {
        const target = targetLengthRef.current;
        if (prev >= target) return prev;

        // find next word boundary to jump to
        const nextSpace = text.indexOf(" ", prev + 1);
        const nextNewline = text.indexOf("\n", prev + 1);
        let nextBoundary = target;

        if (nextSpace !== -1 && nextSpace < nextBoundary) nextBoundary = nextSpace + 1;
        if (nextNewline !== -1 && nextNewline < nextBoundary) nextBoundary = nextNewline + 1;

        return Math.min(nextBoundary, target);
      });
      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isStreaming, text]);

  // once streaming is done, render everything normally
  if (!isStreaming) {
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

  // while streaming: split into revealed (static) + new (animated)
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
      {fresh && <span className="animate-[fadeBlurIn_300ms_ease-out_forwards]">{fresh}</span>}
      <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-current align-text-bottom opacity-50" />
      <style>{`
        @keyframes fadeBlurIn {
          from { opacity: 0; filter: blur(2px); }
          to { opacity: 1; filter: blur(0); }
        }
      `}</style>
    </div>
  );
}
