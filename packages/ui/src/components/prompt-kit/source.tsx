"use client";

import { cn } from "@zalem/ui/lib/utils";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@zalem/ui/components/optics/hover-card";
import { createContext, useContext } from "react";

const SourceContext = createContext<{ href: string; domain: string } | null>(null);

function useSourceContext() {
  const ctx = useContext(SourceContext);
  if (!ctx) throw new Error("Source.* must be used inside <Source>");
  return ctx;
}

export type SourceProps = {
  href: string;
  children: React.ReactNode;
};

function Source({ href, children }: SourceProps) {
  let domain = "";
  try {
    domain = new URL(href).hostname;
  } catch {
    domain = href.split("/").pop() || href;
  }

  return (
    <SourceContext value={{ href, domain }}>
      <HoverCard openDelay={150} closeDelay={0}>
        {children}
      </HoverCard>
    </SourceContext>
  );
}

export type SourceTriggerProps = {
  label?: string | number;
  className?: string;
};

function SourceTrigger({ label, className }: SourceTriggerProps) {
  const { href, domain } = useSourceContext();
  const labelToShow = label ?? domain.replace("www.", "");

  return (
    <HoverCardTrigger
      render={
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "bg-muted text-muted-foreground hover:bg-muted-foreground/30 hover:text-primary inline-flex h-5 max-w-32 items-center gap-1 overflow-hidden rounded-full px-1 py-0 text-xs no-underline transition-colors duration-150",
            className,
          )}
        >
          <span className="truncate text-center font-normal tabular-nums">{labelToShow}</span>
        </a>
      }
    />
  );
}

export type SourceContentProps = {
  title: string;
  description: string;
  className?: string;
};

function SourceContent({ title, description, className }: SourceContentProps) {
  const { href, domain } = useSourceContext();

  return (
    <HoverCardContent className={cn("w-80 p-0 shadow-xs", className)}>
      <a href={href} target="_blank" rel="noopener noreferrer" className="flex flex-col gap-2 p-3">
        <div className="text-primary truncate text-sm">{domain.replace("www.", "")}</div>
        <div className="line-clamp-2 text-sm font-medium">{title}</div>
        <div className="text-muted-foreground line-clamp-2 text-sm">{description}</div>
      </a>
    </HoverCardContent>
  );
}

Source.displayName = "Source";
SourceTrigger.displayName = "SourceTrigger";
SourceContent.displayName = "SourceContent";

export { Source, SourceTrigger, SourceContent };
