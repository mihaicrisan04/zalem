"use client";

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

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
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

      <ScrollArea className="-mx-4" viewportClassName="px-4" maskHeight={40} hideScrollbar>
        <div className="flex gap-4 pb-2">
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div key={`skeleton-${i}`} className="w-56 shrink-0">
                  <ProductCardSkeleton />
                </div>
              ))
            : products?.map((product) => (
                <div key={product._id} className="w-56 shrink-0">
                  <ProductCard product={product} isFavorited={favSet.has(product._id)} />
                </div>
              ))}
        </div>
      </ScrollArea>
    </section>
  );
}
