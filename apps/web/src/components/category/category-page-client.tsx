"use client";

import { useQuery } from "convex/react";
import { usePaginatedQuery } from "convex/react";
import { api } from "@zalem/backend/convex/_generated/api";
import { ProductGrid } from "@/components/product-grid";
import { ProductGridSkeleton } from "@/components/product-card-skeleton";
import { SortBar } from "./sort-bar";
import { ProductFilters } from "./product-filters";
import { Button } from "@zalem/ui/components/optics/button";
import Link from "next/link";

type SortOption = "popular" | "newest" | "price_asc" | "price_desc" | "reviews" | "discount";

export function CategoryPageClient({
  slug,
  searchParams,
}: {
  slug: string;
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const category = useQuery(api.categories.getBySlug, { slug });
  const categories = useQuery(api.categories.list);

  const sort = (searchParams.sort as SortOption) ?? "popular";
  const minPrice = searchParams.minPrice ? Number(searchParams.minPrice) : undefined;
  const maxPrice = searchParams.maxPrice ? Number(searchParams.maxPrice) : undefined;
  const minRating = searchParams.minRating ? Number(searchParams.minRating) : undefined;
  const inStock = searchParams.inStock === "true";
  const brands = searchParams.brands
    ? typeof searchParams.brands === "string"
      ? searchParams.brands.split(",")
      : searchParams.brands
    : undefined;

  const categoryName = category?.name ?? slug;

  // resolve parent category for subcategory filtering
  const parentCategory =
    category?.parentId && categories
      ? categories.find((c: (typeof categories)[number]) => c._id === category.parentId)
      : null;

  const isSubcategory = !!parentCategory;
  const queryCategoryName = isSubcategory ? parentCategory.name : categoryName;
  const querySubcategory = isSubcategory ? categoryName : undefined;

  const { results, status, loadMore } = usePaginatedQuery(
    api.products.listByCategory,
    {
      category: queryCategoryName,
      subcategory: querySubcategory,
      sort,
      minPrice,
      maxPrice,
      minRating,
      inStock: inStock || undefined,
      brands: brands && brands.length > 0 ? brands : undefined,
    },
    { initialNumItems: 24 },
  );

  const favoritedIds = useQuery(
    api.favorites.batchCheck,
    results.length > 0 ? { productIds: results.map((p) => p._id) } : "skip",
  );

  return (
    <div className="container mx-auto px-4 py-6">
      {/* breadcrumb */}
      <nav className="text-muted-foreground mb-4 flex items-center gap-1 text-sm">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        <span>/</span>
        {parentCategory && (
          <>
            <Link
              href={`/categories/${parentCategory.slug}` as any}
              className="hover:text-foreground"
            >
              {parentCategory.name}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="text-foreground font-medium">{categoryName}</span>
      </nav>

      <h1 className="mb-6 text-2xl font-bold">{categoryName}</h1>

      <div className="flex gap-8">
        {/* filters sidebar */}
        <aside className="hidden w-60 shrink-0 lg:block">
          <ProductFilters slug={slug} searchParams={searchParams} />
        </aside>

        {/* main content */}
        <div className="min-w-0 flex-1">
          <SortBar
            sort={sort}
            slug={slug}
            searchParams={searchParams}
            totalResults={results.length}
          />

          <div className="mt-4">
            {results.length === 0 && status === "Exhausted" ? (
              <div className="text-muted-foreground py-16 text-center">
                <p className="text-lg font-medium">No products found</p>
                <p className="text-sm">Try adjusting your filters.</p>
              </div>
            ) : results.length === 0 ? (
              <ProductGridSkeleton count={12} />
            ) : (
              <>
                <ProductGrid products={results} favoritedIds={(favoritedIds as string[]) ?? []} />
                {status === "CanLoadMore" && (
                  <div className="mt-8 flex justify-center">
                    <Button
                      variant="outline"
                      size="lg"
                      className="text-sm"
                      onClick={() => loadMore(24)}
                    >
                      Load more products
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
