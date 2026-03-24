"use client";

import { cn } from "@zalem/ui/lib/utils";

export type LoaderProps = {
  variant?: "dots" | "typing" | "text-shimmer" | "loading-dots";
  size?: "sm" | "md" | "lg";
  text?: string;
  className?: string;
};

function DotsLoader({ className, size = "md" }: { className?: string; size?: "sm" | "md" | "lg" }) {
  const dotSizes = { sm: "size-1.5", md: "size-2", lg: "size-2.5" };
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            "bg-primary animate-[bounce-dots_1.4s_ease-in-out_infinite] rounded-full",
            dotSizes[size],
          )}
          style={{ animationDelay: `${i * 160}ms` }}
        />
      ))}
      <span className="sr-only">Loading</span>
      <style>{`
        @keyframes bounce-dots {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

function TypingLoader({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const dotSizes = { sm: "size-1", md: "size-1.5", lg: "size-2" };
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn("bg-primary animate-[typing_1s_infinite] rounded-full", dotSizes[size])}
          style={{ animationDelay: `${i * 250}ms` }}
        />
      ))}
      <span className="sr-only">Loading</span>
      <style>{`
        @keyframes typing {
          0%, 60%, 100% { opacity: 0.3; transform: scale(0.8); }
          30% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

function TextShimmerLoader({
  text = "Thinking",
  className,
  size = "md",
}: {
  text?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const textSizes = { sm: "text-xs", md: "text-sm", lg: "text-base" };
  return (
    <>
      <div
        className={cn(
          "bg-[linear-gradient(to_right,var(--muted-foreground)_40%,var(--foreground)_60%,var(--muted-foreground)_80%)] bg-[length:200%_auto] bg-clip-text font-medium text-transparent animate-[shimmer_4s_infinite_linear]",
          textSizes[size],
          className,
        )}
      >
        {text}
      </div>
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
      `}</style>
    </>
  );
}

function TextDotsLoader({
  className,
  text = "Thinking",
  size = "md",
}: {
  className?: string;
  text?: string;
  size?: "sm" | "md" | "lg";
}) {
  const textSizes = { sm: "text-xs", md: "text-sm", lg: "text-base" };
  return (
    <>
      <div className={cn("inline-flex items-center", className)}>
        <span className={cn("text-primary font-medium", textSizes[size])}>{text}</span>
        <span className="inline-flex">
          {[0.2, 0.4, 0.6].map((delay) => (
            <span
              key={delay}
              className="text-primary animate-[loading-dots_1.4s_infinite]"
              style={{ animationDelay: `${delay}s` }}
            >
              .
            </span>
          ))}
        </span>
      </div>
      <style>{`
        @keyframes loading-dots {
          0%, 80%, 100% { opacity: 0; }
          40% { opacity: 1; }
        }
      `}</style>
    </>
  );
}

function Loader({ variant = "dots", size = "md", text, className }: LoaderProps) {
  switch (variant) {
    case "dots":
      return <DotsLoader size={size} className={className} />;
    case "typing":
      return <TypingLoader size={size} className={className} />;
    case "text-shimmer":
      return <TextShimmerLoader text={text} size={size} className={className} />;
    case "loading-dots":
      return <TextDotsLoader text={text} size={size} className={className} />;
    default:
      return <DotsLoader size={size} className={className} />;
  }
}

Loader.displayName = "Loader";

export { Loader, DotsLoader, TypingLoader, TextShimmerLoader, TextDotsLoader };
