"use client";

import { use } from "react";
import { usePaginatedQuery, useQuery } from "convex/react";
import { api } from "@zalem/backend/convex/_generated/api";
import { ProductGrid } from "@/components/product-grid";
import { ProductGridSkeleton } from "@/components/product-card-skeleton";
import { Button } from "@zalem/ui/components/optics/button";

export default function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = use(searchParams);
  const query = typeof params.q === "string" ? params.q : "";

  const { results, status, loadMore } = usePaginatedQuery(
    api.products.search,
    query.length >= 2 ? { query } : "skip",
    { initialNumItems: 24 },
  );

  const favoritedIds = useQuery(
    api.favorites.batchCheck,
    results.length > 0 ? { productIds: results.map((p) => p._id) } : "skip",
  );

  if (!query || query.length < 2) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground">Enter at least 2 characters to search.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="mb-6 text-2xl font-bold">Results for &ldquo;{query}&rdquo;</h1>

      {results.length === 0 && status === "Exhausted" ? (
        <div className="text-muted-foreground py-16 text-center">
          <p className="text-lg font-medium">No products found</p>
          <p className="text-sm">Try a different search term.</p>
        </div>
      ) : results.length === 0 ? (
        <ProductGridSkeleton count={12} />
      ) : (
        <>
          <ProductGrid products={results} favoritedIds={(favoritedIds as string[]) ?? []} />
          {status === "CanLoadMore" && (
            <div className="mt-8 flex justify-center">
              <Button variant="outline" onClick={() => loadMore(24)}>
                Load more
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
