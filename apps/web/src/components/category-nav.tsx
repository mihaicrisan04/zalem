"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@zalem/backend/convex/_generated/api";
import { ScrollArea } from "@zalem/ui/components/optics/scroll-area";

export function CategoryNav() {
  const categories = useQuery(api.categories.list);

  if (!categories) return null;

  const topLevel = categories.filter((c: (typeof categories)[number]) => !c.parentId);

  return (
    <nav className="border-b">
      <div className="container mx-auto px-4">
        <ScrollArea viewportClassName="overflow-y-hidden" maskHeight={20}>
          <div className="flex items-center gap-1 py-1">
            {topLevel.map((category: (typeof categories)[number]) => {
              const children = categories.filter(
                (c: (typeof categories)[number]) => c.parentId === category._id,
              );

              return (
                <div key={category._id} className="group relative">
                  <Link
                    href={`/categories/${category.slug}` as any}
                    className="text-muted-foreground hover:text-foreground hover:bg-accent inline-flex h-9 items-center rounded-md px-3 text-sm font-medium whitespace-nowrap transition-colors"
                  >
                    {category.name}
                  </Link>

                  {children.length > 0 && (
                    <div className="bg-popover invisible absolute top-full left-0 z-50 min-w-48 rounded-md border p-2 opacity-0 shadow-md transition-all group-hover:visible group-hover:opacity-100">
                      {children.map((child: (typeof categories)[number]) => (
                        <Link
                          key={child._id}
                          href={`/categories/${child.slug}` as any}
                          className="hover:bg-accent block rounded-sm px-3 py-1.5 text-sm"
                        >
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    </nav>
  );
}
