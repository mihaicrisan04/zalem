"use client";

import { useRouter } from "next/navigation";
import { Button } from "@zalem/ui/components/optics/button";
import { Separator } from "@zalem/ui/components/optics/separator";
import { StarRating } from "@zalem/ui/components/optics/star-rating";

const PRICE_RANGES = [
  { label: "Under 50 lei", max: 50 },
  { label: "50 - 100 lei", min: 50, max: 100 },
  { label: "100 - 300 lei", min: 100, max: 300 },
  { label: "300 - 500 lei", min: 300, max: 500 },
  { label: "Over 500 lei", min: 500 },
];

const RATING_OPTIONS = [4, 3, 2, 1];

export function ProductFilters({
  slug,
  searchParams,
}: {
  slug: string;
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const router = useRouter();

  const currentMinPrice = searchParams.minPrice ? Number(searchParams.minPrice) : undefined;
  const currentMaxPrice = searchParams.maxPrice ? Number(searchParams.maxPrice) : undefined;
  const currentMinRating = searchParams.minRating ? Number(searchParams.minRating) : undefined;
  const currentInStock = searchParams.inStock === "true";

  const updateParams = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (value && !updates.hasOwnProperty(key)) {
        params.set(key, String(value));
      }
    }
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    }
    const qs = params.toString();
    router.push(`/categories/${slug}${qs ? `?${qs}` : ""}` as any);
  };

  const clearAll = () => {
    const sort = searchParams.sort;
    if (sort) {
      router.push(`/categories/${slug}?sort=${sort}` as any);
    } else {
      router.push(`/categories/${slug}` as any);
    }
  };

  const hasFilters =
    currentMinPrice !== undefined ||
    currentMaxPrice !== undefined ||
    currentMinRating !== undefined ||
    currentInStock;

  return (
    <div className="space-y-5">
      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearAll} className="w-full">
          Clear all filters
        </Button>
      )}

      {/* price range */}
      <div>
        <h3 className="mb-2 text-sm font-semibold">Price</h3>
        <div className="space-y-1">
          {PRICE_RANGES.map((range) => {
            const isActive = currentMinPrice === range.min && currentMaxPrice === range.max;
            return (
              <button
                key={range.label}
                onClick={() =>
                  updateParams({
                    minPrice: range.min?.toString(),
                    maxPrice: range.max?.toString(),
                  })
                }
                className={`hover:bg-accent w-full rounded px-2 py-1 text-left text-sm ${
                  isActive ? "bg-accent font-medium" : ""
                }`}
              >
                {range.label}
              </button>
            );
          })}
        </div>
      </div>

      <Separator />

      {/* rating */}
      <div>
        <h3 className="mb-2 text-sm font-semibold">Minimum rating</h3>
        <div className="space-y-1">
          {RATING_OPTIONS.map((rating) => (
            <button
              key={rating}
              onClick={() =>
                updateParams({
                  minRating: currentMinRating === rating ? undefined : rating.toString(),
                })
              }
              className={`hover:bg-accent flex w-full items-center gap-2 rounded px-2 py-1 text-sm ${
                currentMinRating === rating ? "bg-accent font-medium" : ""
              }`}
            >
              <StarRating defaultValue={rating} size="sm" disabled />
              <span>& up</span>
            </button>
          ))}
        </div>
      </div>

      <Separator />

      {/* in stock */}
      <div>
        <button
          onClick={() => updateParams({ inStock: currentInStock ? undefined : "true" })}
          className={`hover:bg-accent flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm ${
            currentInStock ? "bg-accent font-medium" : ""
          }`}
        >
          <div
            className={`size-4 rounded border ${currentInStock ? "bg-primary border-primary" : "border-input"}`}
          >
            {currentInStock && (
              <span className="text-primary-foreground flex items-center justify-center text-xs">
                ✓
              </span>
            )}
          </div>
          In stock only
        </button>
      </div>
    </div>
  );
}
