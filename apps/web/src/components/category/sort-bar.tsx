"use client";

import { useRouter } from "next/navigation";

const SORT_OPTIONS = [
  { value: "popular", label: "Most popular" },
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "reviews", label: "Most reviews" },
  { value: "discount", label: "Biggest discount" },
] as const;

export function SortBar({
  sort,
  slug,
  searchParams,
  totalResults,
}: {
  sort: string;
  slug: string;
  searchParams: Record<string, string | string[] | undefined>;
  totalResults: number;
}) {
  const router = useRouter();

  const handleSortChange = (newSort: string) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (key !== "sort" && value) {
        params.set(key, String(value));
      }
    }
    if (newSort !== "popular") params.set("sort", newSort);
    const qs = params.toString();
    router.push(`/categories/${slug}${qs ? `?${qs}` : ""}` as any);
  };

  return (
    <div className="flex items-center justify-between">
      <p className="text-muted-foreground text-sm">{totalResults} products</p>
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground text-sm">Sort by:</span>
        <select
          value={sort}
          onChange={(e) => handleSortChange(e.target.value)}
          className="bg-background rounded-md border px-2 py-1 text-sm"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
