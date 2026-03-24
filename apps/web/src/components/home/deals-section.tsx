"use client";

import { useQuery } from "convex/react";
import { api } from "@zalem/backend/convex/_generated/api";
import { ProductGrid } from "@/components/product-grid";
import { ProductGridSkeleton } from "@/components/product-card-skeleton";
import { useFavoritedIds } from "@/hooks/use-favorited-ids";

export function DealsSection() {
  const deals = useQuery(api.products.listDeals);
  const favoritedIds = useFavoritedIds(deals?.map((d) => d._id) ?? []);

  return (
    <section>
      <div className="mb-4 flex items-center gap-3">
        <h2 className="text-xl font-bold">Deals of the day</h2>
        <span className="bg-destructive text-destructive-foreground rounded-md px-2 py-0.5 text-xs font-medium">
          Limited time
        </span>
      </div>
      {deals === undefined ? (
        <ProductGridSkeleton count={6} />
      ) : (
        <ProductGrid products={deals} favoritedIds={favoritedIds} />
      )}
    </section>
  );
}
