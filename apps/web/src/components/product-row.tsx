"use client";

import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ScrollArea } from "@zalem/ui/components/optics/scroll-area";
import { ProductCard, type ProductData } from "./product-card";
import { ProductCardSkeleton } from "./product-card-skeleton";

export function ProductRow({
  title,
  products,
  seeAllHref,
  favoritedIds = [],
  isLoading = false,
}: {
  title: string;
  products?: ProductData[];
  seeAllHref?: string;
  favoritedIds?: string[];
  isLoading?: boolean;
}) {
  const favSet = new Set(favoritedIds);
  const containerRef = useRef<HTMLDivElement>(null);
  const [inset, setInset] = useState(16);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      const rect = el.getBoundingClientRect();
      const padding = parseFloat(getComputedStyle(el).paddingLeft);
      setInset(rect.left + padding);
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(document.documentElement);
    return () => observer.disconnect();
  }, []);

  return (
    <section>
      <div ref={containerRef} className="container mx-auto mb-3 flex items-center justify-between px-4">
        <h2 className="text-xl font-bold">{title}</h2>
        {seeAllHref && (
          <Link
            href={seeAllHref as any}
            className="text-primary flex items-center gap-1 text-sm font-medium hover:underline"
          >
            See all
            <ChevronRight className="size-4" />
          </Link>
        )}
      </div>

      <ScrollArea maskHeight={40} hideScrollbar>
        <div className="flex gap-4 pb-2">
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={`skeleton-${i}`}
                  className="w-56 shrink-0"
                  style={i === 0 ? { marginLeft: inset } : undefined}
                >
                  <ProductCardSkeleton />
                </div>
              ))
            : products?.map((product, i) => (
                <div
                  key={product._id}
                  className="w-56 shrink-0"
                  style={i === 0 ? { marginLeft: inset } : undefined}
                >
                  <ProductCard product={product} isFavorited={favSet.has(product._id)} />
                </div>
              ))}
          <div className="shrink-0" style={{ width: inset - 16 }} aria-hidden />
        </div>
      </ScrollArea>
    </section>
  );
}
