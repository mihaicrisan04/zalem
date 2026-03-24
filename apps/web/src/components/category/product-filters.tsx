"use client";

import { useState, useEffect } from "react";
import { useMounted } from "@/hooks/use-mounted";
import { useRouter } from "next/navigation";
import { Button } from "@zalem/ui/components/optics/button";
import { Separator } from "@zalem/ui/components/optics/separator";
import { StarRating } from "@zalem/ui/components/optics/star-rating";
import { Slider } from "@zalem/ui/components/optics/slider";

const PRICE_RANGES = [
  { label: "Under 50", max: 50 },
  { label: "50 – 100", min: 50, max: 100 },
  { label: "100 – 300", min: 100, max: 300 },
  { label: "300 – 500", min: 300, max: 500 },
  { label: "500+", min: 500 },
];

const MAX_PRICE = 1000;
const RATING_OPTIONS = [4, 3, 2, 1];

export function ProductFilters({
  slug,
  searchParams,
}: {
  slug: string;
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const router = useRouter();
  const mounted = useMounted();

  const currentMinPrice = searchParams.minPrice ? Number(searchParams.minPrice) : undefined;
  const currentMaxPrice = searchParams.maxPrice ? Number(searchParams.maxPrice) : undefined;
  const currentMinRating = searchParams.minRating ? Number(searchParams.minRating) : undefined;
  const currentInStock = searchParams.inStock === "true";

  // local slider state — synced with URL params but allows dragging without navigating on every tick
  const [sliderValue, setSliderValue] = useState<[number, number]>([
    currentMinPrice ?? 0,
    currentMaxPrice ?? MAX_PRICE,
  ]);

  // sync slider when URL params change externally
  useEffect(() => {
    setSliderValue([currentMinPrice ?? 0, currentMaxPrice ?? MAX_PRICE]);
  }, [currentMinPrice, currentMaxPrice]);

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

  const handleSliderCommit = (values: number[]) => {
    const [min, max] = values;
    updateParams({
      minPrice: min > 0 ? min.toString() : undefined,
      maxPrice: max < MAX_PRICE ? max.toString() : undefined,
    });
  };

  return (
    <div className="space-y-5">
      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearAll} className="w-full">
          Clear all filters
        </Button>
      )}

      {/* price */}
      <div>
        <h3 className="mb-3 text-sm font-semibold">Price</h3>

        {/* quick picks */}
        <div className="mb-4 flex flex-wrap gap-1.5">
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
                className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border hover:bg-accent"
                }`}
              >
                {range.label}
              </button>
            );
          })}
        </div>

        {/* range slider */}
        <div className="space-y-3 px-1">
          {mounted && (
            <Slider
              value={sliderValue}
              min={0}
              max={MAX_PRICE}
              step={10}
              minStepsBetweenValues={1}
              onValueChange={(values: number[]) => setSliderValue(values as [number, number])}
              onValueCommitted={handleSliderCommit}
            />
          )}
          <div className="text-muted-foreground flex items-center justify-between text-xs">
            <span className="tabular-nums">{sliderValue[0]} lei</span>
            <span className="tabular-nums">
              {sliderValue[1] >= MAX_PRICE ? `${MAX_PRICE}+` : `${sliderValue[1]}`} lei
            </span>
          </div>
        </div>
      </div>

      <Separator />

      {/* rating */}
      <div>
        <h3 className="mb-2 text-sm font-semibold">Minimum rating</h3>
        <div className="space-y-1">
          {RATING_OPTIONS.map((rating) => (
            <div
              key={rating}
              role="button"
              tabIndex={0}
              onClick={() =>
                updateParams({
                  minRating: currentMinRating === rating ? undefined : rating.toString(),
                })
              }
              onKeyDown={(e: React.KeyboardEvent) => {
                if (e.key === "Enter")
                  updateParams({
                    minRating: currentMinRating === rating ? undefined : rating.toString(),
                  });
              }}
              className={`hover:bg-accent flex w-full cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm ${
                currentMinRating === rating ? "bg-accent font-medium" : ""
              }`}
            >
              <StarRating defaultValue={rating} size="sm" disabled />
              <span>& up</span>
            </div>
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
