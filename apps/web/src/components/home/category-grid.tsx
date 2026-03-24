"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@zalem/backend/convex/_generated/api";
import { Headphones, Home, Laptop, Shirt, Smartphone, Sparkles, Tablet, Bike } from "lucide-react";

const ICON_MAP: Record<string, React.ReactNode> = {
  Smartphone: <Smartphone className="size-8" />,
  Laptop: <Laptop className="size-8" />,
  Tablet: <Tablet className="size-8" />,
  Headphones: <Headphones className="size-8" />,
  Home: <Home className="size-8" />,
  Shirt: <Shirt className="size-8" />,
  Sparkles: <Sparkles className="size-8" />,
  Bike: <Bike className="size-8" />,
};

export function CategoryGrid() {
  const categories = useQuery(api.categories.list);
  if (!categories) return null;

  const topLevel = categories.filter((c: (typeof categories)[number]) => !c.parentId);

  return (
    <section>
      <h2 className="mb-4 text-xl font-bold">Browse by category</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {topLevel.map((cat: (typeof categories)[number]) => (
          <Link
            key={cat._id}
            href={`/categories/${cat.slug}` as any}
            className="bg-card hover:bg-accent flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors"
          >
            <div className="text-primary">
              {ICON_MAP[cat.icon ?? ""] ?? <Smartphone className="size-8" />}
            </div>
            <span className="text-center text-sm font-medium">{cat.name}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
