"use client";

import { cn } from "@zalem/ui/lib/utils";
import { memo } from "react";
import { Streamdown, type Components } from "streamdown";

export type MarkdownProps = {
  children: string;
  id?: string;
  className?: string;
  components?: Components;
};

const INITIAL_COMPONENTS: Components = {
  code: function CodeComponent({ className, children, ...props }: any) {
    const isInline = !className?.includes("language-");
    if (isInline) {
      return (
        <code
          className={cn(
            "bg-muted text-foreground rounded-sm border px-1 py-0.5 font-mono text-[0.85em]",
            className,
          )}
          {...props}
        >
          {children}
        </code>
      );
    }
    return (
      <code className={cn("font-mono text-sm", className)} {...props}>
        {children}
      </code>
    );
  },
  pre: function PreComponent({ children }: any) {
    return (
      <pre className="bg-muted my-2 overflow-x-auto rounded-lg border p-3 text-sm">{children}</pre>
    );
  },
  a: function AComponent({ children, href, ...props }: any) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-foreground underline decoration-muted-foreground/40 underline-offset-4 transition-colors hover:decoration-foreground"
        {...props}
      >
        {children}
      </a>
    );
  },
  blockquote: function BlockquoteComponent({ children }: any) {
    return (
      <blockquote className="border-muted-foreground/30 text-muted-foreground my-2 border-l-2 pl-4 italic">
        {children}
      </blockquote>
    );
  },
  table: function TableComponent({ children }: any) {
    return (
      <div className="my-2 overflow-x-auto">
        <table className="w-full border-collapse text-sm">{children}</table>
      </div>
    );
  },
  th: function ThComponent({ children }: any) {
    return <th className="border-border border-b px-2 py-1 text-left font-medium">{children}</th>;
  },
  td: function TdComponent({ children }: any) {
    return <td className="border-border border-b px-2 py-1">{children}</td>;
  },
  h1: function H1Component({ children }: any) {
    return <h1 className="text-foreground mt-2 mb-1 text-lg font-semibold">{children}</h1>;
  },
  h2: function H2Component({ children }: any) {
    return <h2 className="text-foreground mt-2 mb-1 text-base font-semibold">{children}</h2>;
  },
  h3: function H3Component({ children }: any) {
    return <h3 className="text-foreground mt-2 mb-1 text-sm font-semibold">{children}</h3>;
  },
  ul: function UlComponent({ children }: any) {
    return <ul className="my-1 list-disc space-y-0.5 pl-5">{children}</ul>;
  },
  ol: function OlComponent({ children }: any) {
    return <ol className="my-1 list-decimal space-y-0.5 pl-5">{children}</ol>;
  },
  li: function LiComponent({ children }: any) {
    return <li className="leading-relaxed">{children}</li>;
  },
  p: function PComponent({ children }: any) {
    return <p className="leading-relaxed">{children}</p>;
  },
  hr: function HrComponent() {
    return <hr className="border-border my-3" />;
  },
};

function MarkdownComponent({
  children,
  className,
  components = INITIAL_COMPONENTS,
}: MarkdownProps) {
  return (
    <Streamdown className={cn("flex flex-col gap-2", className)} components={components}>
      {children}
    </Streamdown>
  );
}

const Markdown = memo(MarkdownComponent);
Markdown.displayName = "Markdown";

export { Markdown };
